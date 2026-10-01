import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircle, Send, Upload, FileText, ArrowLeft } from 'lucide-react';
import { PageHeader, StatusPill } from '../components/common';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase/firebase';
import { uploadImageToCloudinary } from '../utils/cloudinary';
import { collection, doc, setDoc, updateDoc, query, where, onSnapshot, arrayUnion } from 'firebase/firestore';
import emailjs from '@emailjs/browser';

const faqKeys = ['faq1', 'faq2', 'faq3', 'faq4'];

export default function Support() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('General Query');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState(null);

  // Auto-populate form states from authenticated user data
  useEffect(() => {
    if (user) {
      setName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
      setEmail(user.email || '');
      setPhoneNumber(user.phoneNumber || '');
    }
  }, [user]);

  // Tickets lists
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  // Sync tickets real-time
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'support_tickets'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      // Sort by creation date
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTickets(list);

      // Keep selected ticket updated in real-time
      if (selectedTicket) {
        const updated = list.find((t) => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    });

    return () => unsubscribe();
  }, [user?.uid, selectedTicket?.id]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setSent(false);

    try {
      const ticketId = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;
      let attachmentUrl = '';

      // Upload attachment if any
      if (attachment) {
        attachmentUrl = await uploadImageToCloudinary(attachment);
      }

      const newTicket = {
        id: ticketId,
        userId: user.uid,
        userName: name,
        userEmail: email,
        userPhone: phoneNumber,
        subject,
        category,
        message,
        attachmentUrl,
        status: 'Open',
        createdAt: new Date().toISOString(),
        messages: [
          {
            sender: 'customer',
            senderName: name,
            message,
            timestamp: new Date().toISOString()
          }
        ]
      };

      // 1. Save in Firestore
      await setDoc(doc(db, 'support_tickets', ticketId), newTicket);

      // 2. Add System Notification for Support Request Submitted
      const notifRef = doc(collection(db, `users/${user.uid}/notifications`));
      await setDoc(notifRef, {
        id: `notif-${Date.now()}`,
        type: 'system',
        titleKey: 'notifSupportSubmittedTitle',
        body: `Your support request regarding "${subject}" was submitted successfully. Ticket ID: ${ticketId}`,
        date: new Date().toISOString(),
        read: false,
        createdAt: new Date().toISOString()
      });

      // 3. Send Email using EmailJS
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (serviceId && templateId && publicKey) {
        await emailjs.send(
          serviceId,
          templateId,
          {
            ticket_id: ticketId,
            from_name: name,
            from_email: email,
            phone_number: phoneNumber,
            subject,
            category,
            message,
            attachment_url: attachmentUrl || 'No attachment'
          },
          publicKey
        );
      }

      setSent(true);
      setSubject('');
      setMessage('');
      setAttachment(null);
    } catch (err) {
      console.error(err);
      alert('Failed to submit support request: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket || !user) return;
    setIsReplying(true);

    try {
      const ticketRef = doc(db, 'support_tickets', selectedTicket.id);
      const reply = {
        sender: 'customer',
        senderName: `${user.firstName} ${user.lastName}`,
        message: replyText,
        timestamp: new Date().toISOString()
      };

      await updateDoc(ticketRef, {
        messages: arrayUnion(reply)
      });

      setReplyText('');
    } catch (err) {
      alert('Failed to send reply: ' + err.message);
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <PageHeader title={t('support.title')} subtitle={t('support.subtitle')} />

        <AnimatePresence mode="wait">
          {selectedTicket ? (
            // Conversation History View
            <motion.div
              key="ticket-chat"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="card p-5 sm:p-6"
            >
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-navy-100 dark:border-white/10">
                <div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="flex items-center gap-1 text-xs text-gold-600 hover:text-gold-500 font-medium mb-1"
                  >
                    <ArrowLeft size={14} /> Back to Contact Form
                  </button>
                  <h3 className="font-display text-lg text-navy-900 dark:text-white">
                    {selectedTicket.subject}
                  </h3>
                  <p className="text-xs text-navy-400 mt-0.5">
                    Ticket ID: {selectedTicket.id} · Category: {selectedTicket.category}
                  </p>
                </div>
                <StatusPill status={selectedTicket.status === 'Resolved' ? 'Completed' : 'Pending'} />
              </div>

              {/* Chat bubble list */}
              <div className="h-64 overflow-y-auto mb-4 p-3 rounded-xl bg-navy-50/60 dark:bg-navy-950/40 space-y-3">
                {selectedTicket.messages?.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.sender === 'customer' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] text-navy-400 font-medium">
                        {msg.senderName} · {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.sender === 'customer'
                          ? 'bg-navy-900 text-white rounded-tr-none'
                          : 'bg-gold-500 text-navy-900 font-medium rounded-tl-none'
                        }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply form */}
              <form onSubmit={handleSendReply} className="flex gap-2">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 text-sm outline-none focus-ring"
                  required
                />
                <button
                  type="submit"
                  disabled={isReplying}
                  className="px-4 py-2.5 rounded-xl bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 font-semibold text-sm flex items-center justify-center hover:brightness-110 disabled:opacity-50"
                >
                  <Send size={15} />
                </button>
              </form>
            </motion.div>
          ) : (
            // FAQ and Submission Form
            <motion.div
              key="support-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* FAQ Section */}
              <div className="card p-5 sm:p-6">
                <h3 className="font-display text-lg text-navy-900 dark:text-white mb-3">
                  {t('support.faqTitle')}
                </h3>
                <div className="divide-y divide-navy-50 dark:divide-white/5">
                  {faqKeys.map((k) => (
                    <div key={k}>
                      <button
                        onClick={() => setOpenFaq(openFaq === k ? null : k)}
                        className="w-full flex items-center justify-between py-3.5 text-left text-sm font-medium text-navy-800 dark:text-white"
                      >
                        {t(`support.${k}q`)}
                        <ChevronDown size={16} className={`text-navy-400 transition-transform ${openFaq === k ? 'rotate-180' : ''}`} />
                      </button>
                      {openFaq === k && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-sm text-navy-400 pb-3.5">
                          {t(`support.${k}a`)}
                        </motion.p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Section */}
              <div className="card p-5 sm:p-6">
                <h3 className="font-display text-lg text-navy-900 dark:text-white mb-4">
                  {t('support.contactTitle')}
                </h3>
                {sent ? (
                  <p className="text-sm text-pos font-semibold">Your support request has been submitted successfully.</p>
                ) : (
                  <form onSubmit={handleFormSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-navy-400 mb-1.5">Full Name</label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="John Doe"
                        className="w-full px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 text-sm outline-none focus-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-navy-400 mb-1.5">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="john.doe@example.com"
                        className="w-full px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 text-sm outline-none focus-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-navy-400 mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 text-sm outline-none focus-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-navy-400 mb-1.5">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 text-sm outline-none focus-ring"
                      >
                        <option value="General Query">General Query</option>
                        <option value="Failed Transfer">Failed Transfer</option>
                        <option value="Account Security">Account Security</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-navy-400 mb-1.5">Subject</label>
                      <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                        placeholder={t('support.subject')}
                        className="w-full px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 text-sm outline-none focus-ring"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-navy-400 mb-1.5">Attachment (Optional)</label>
                      <div className="relative">
                        <Upload size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300" />
                        <input
                          type="file"
                          onChange={(e) => setAttachment(e.target.files[0])}
                          className="w-full pl-10 pr-4 py-2 text-xs text-navy-300 file:hidden cursor-pointer bg-navy-50 dark:bg-white/5 border border-transparent rounded-xl focus:border-gold-500 outline-none h-[42px] flex items-center"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-navy-400 pointer-events-none truncate max-w-[150px]">
                          {attachment ? attachment.name : 'Choose file...'}
                        </span>
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-navy-400 mb-1.5">Message</label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        placeholder={t('support.message')}
                        rows={4}
                        className="w-full px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 text-sm outline-none focus-ring resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="sm:col-span-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 font-semibold text-sm hover:brightness-110 disabled:opacity-50"
                    >
                      <Send size={15} /> {isSubmitting ? 'Sending...' : t('support.sendMessage')}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-6">
        {/* <div className="card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle size={18} className="text-gold-600" />
            <h3 className="font-display text-lg text-navy-900 dark:text-white">
              {t('support.chatTitle')}
            </h3>
          </div>
          <p className="text-sm text-navy-400 mb-4">{t('support.chatBody')}</p>
          <button className="w-full py-2.5 rounded-xl bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 text-sm font-semibold hover:brightness-110">
            {t('support.startChat')}
          </button>
        </div> */}

        {/* Dynamic Tickets List */}
        {/* <div className="card p-5 sm:p-6">
          <h3 className="font-display text-lg text-navy-900 dark:text-white mb-4">
            {t('support.ticketsTitle')}
          </h3>
          <div className="space-y-3">
            {tickets.length === 0 ? (
              <p className="text-xs text-navy-400 py-2">No tickets submitted yet.</p>
            ) : (
              tickets.map((tk) => (
                <button
                  key={tk.id}
                  onClick={() => setSelectedTicket(tk)}
                  className={`w-full flex items-center justify-between text-sm py-2 px-2.5 rounded-lg text-left hover:bg-navy-50 dark:hover:bg-white/5 transition-colors focus-ring ${
                    selectedTicket?.id === tk.id ? 'bg-navy-50 dark:bg-white/5' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-medium text-navy-800 dark:text-white truncate">{tk.subject}</p>
                    <p className="text-[10px] text-navy-400">{tk.id} · {tk.category}</p>
                  </div>
                  <StatusPill status={tk.status === 'Resolved' ? 'Completed' : 'Pending'} />
                </button>
              ))
            )}
          </div>
        </div> */}
      </div>
    </div>
  );
}
