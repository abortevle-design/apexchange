import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ShieldAlert, Send, Receipt, Info, Circle } from 'lucide-react';
import { PageHeader, formatDate } from '../components/common';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase/firebase';
import { collection, query, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';

const icons = { security: ShieldAlert, transfer: Send, payment: Receipt, system: Info };
const iconColors = { security: 'text-neg bg-neg/10', transfer: 'text-pos bg-pos/10', payment: 'text-gold-600 bg-gold-500/10', system: 'text-navy-500 bg-navy-100 dark:bg-white/10' };

export default function Notifications() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [filter, setFilter] = useState('all');

  // Real-time synchronization with Firestore
  useEffect(() => {
    if (!user?.uid) {
      setNotifs([]);
      return;
    }

    const q = query(collection(db, `users/${user.uid}/notifications`));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by date newest first
      list.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.date).getTime();
        const timeB = new Date(b.createdAt || b.date).getTime();
        return timeB - timeA;
      });

      setNotifs(list);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const list = filter === 'unread' ? notifs.filter((n) => !n.read) : notifs;

  const markAllRead = async () => {
    if (!user?.uid) return;
    const batch = writeBatch(db);
    const unread = notifs.filter((n) => !n.read);
    unread.forEach((n) => {
      const docRef = doc(db, `users/${user.uid}/notifications`, n.id);
      batch.update(docRef, { read: true });
    });
    await batch.commit();
  };

  const markSingleRead = async (id) => {
    if (!user?.uid) return;
    const docRef = doc(db, `users/${user.uid}/notifications`, id);
    await updateDoc(docRef, { read: true });
  };

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={t('notifications.title')}
        subtitle={t('notifications.subtitle')}
        action={
          <button onClick={markAllRead} className="text-sm font-medium text-gold-600 hover:text-gold-500">
            {t('notifications.markAllRead')}
          </button>
        }
      />

      <div className="flex gap-2 mb-4">
        {['all', 'unread'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f ? 'bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900' : 'bg-navy-50 dark:bg-white/5 text-navy-500 dark:text-navy-300'}`}
          >
            {t(`notifications.${f}`)}
          </button>
        ))}
      </div>

      <div className="card divide-y divide-navy-50 dark:divide-white/5 overflow-hidden">
        {list.length === 0 ? (
          <div className="p-8 text-center text-sm text-navy-400">
            No notifications available.
          </div>
        ) : (
          list.map((n, i) => {
            const Icon = icons[n.type] || Info;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => markSingleRead(n.id)}
                className={`flex items-start gap-3 p-4 sm:p-5 cursor-pointer hover:bg-navy-50/60 dark:hover:bg-white/5 transition-colors ${!n.read ? 'bg-gold-500/5' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconColors[n.type] || 'text-navy-500 bg-navy-100'}`}>
                  <Icon size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-navy-800 dark:text-white">
                      {n.title || (n.titleKey ? t(`notifications.${n.titleKey}`) : '')}
                    </p>
                    {!n.read && <Circle size={7} className="fill-gold-500 text-gold-500 shrink-0" />}
                  </div>
                  <p className="text-sm text-navy-400 mt-0.5">
                    {n.body || (n.bodyKey ? t(`notifications.${n.bodyKey}`) : '')}
                  </p>
                  <p className="text-xs text-navy-300 mt-1">{formatDate(n.date)}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
