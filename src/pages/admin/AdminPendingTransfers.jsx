import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc, runTransaction, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ShieldAlert, Clock, AlertTriangle } from 'lucide-react';
import { db } from '../../firebase/firebase';
import { formatMoney, PageHeader, StatusPill } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../../components/Modal';

export default function AdminPendingTransfers() {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Subscribe to Pending transactions in real-time
  useEffect(() => {
    const q = query(
      collection(db, 'transactions'),
      where('status', '==', 'Pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      // Sort oldest first (so they are processed in order)
      list.sort((a, b) => new Date(a.createdAt || `${a.date}T${a.time}`).getTime() - new Date(b.createdAt || `${b.date}T${b.time}`).getTime());
      setTransfers(list);
    });

    return () => unsubscribe();
  }, []);

  const openActionModal = (tx, type) => {
    setSelectedTx(tx);
    setActionType(type);
    setRejectReason('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const closeActionModal = () => {
    if (isProcessing) return;
    setSelectedTx(null);
    setActionType('');
    setRejectReason('');
    setErrorMsg('');
  };

  const handleProcessAction = async () => {
    if (!selectedTx || !user) return;
    setIsProcessing(true);
    setErrorMsg('');
    setSuccessMsg('');

    const userRef = doc(db, 'users', selectedTx.userId);
    const txRef = doc(db, 'transactions', selectedTx.id);

    try {
      if (actionType === 'approve') {
        let customerEmail = '';
        // 1. Run Firestore Transaction
        await runTransaction(db, async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists()) {
            throw new Error('Customer account details not found.');
          }

          customerEmail = userDoc.data().email;

          // The pending transfer amount has already been deducted from the customer's account.
          transaction.update(txRef, {
            status: 'Successful',
            approvedBy: user.email,
            approvedAt: new Date().toISOString()
          });
        });

        // 2. Create customer notification
        const notifRef = doc(collection(db, `users/${selectedTx.userId}/notifications`));
        await setDoc(notifRef, {
          id: `notif-${Date.now()}`,
          type: 'transfer',
          title: 'Transfer Approved',
          body: `Your transfer of ${selectedTx.currency === 'USD' ? '$' : selectedTx.currency}${Math.abs(selectedTx.amount).toLocaleString()} to ${selectedTx.beneficiaryName} has been approved and completed.`,
          date: new Date().toISOString(),
          read: false,
          createdAt: new Date().toISOString()
        });

        // 3. Email notification is handled by onTransactionUpdated Cloud Function trigger.

        setSuccessMsg('Transfer approved successfully.');
      } else if (actionType === 'reject') {
        let customerEmail = '';
        // 1. Run Rejection logic and refund pending amount
        await runTransaction(db, async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists()) {
            throw new Error('Customer account details not found.');
          }

          const userData = userDoc.data();
          customerEmail = userData.email;
          const totalAmount = Number(selectedTx.totalAmount || (Math.abs(selectedTx.amount) + (selectedTx.fee || 0)));
          const nextAvailable = Number(((Number(userData.availableBalance ?? 0) + totalAmount)).toFixed(2));
          const nextChecking = Number(((Number(userData.checkingBalance ?? 0) + totalAmount)).toFixed(2));

          transaction.update(userRef, {
            availableBalance: nextAvailable,
            checkingBalance: nextChecking
          });

          transaction.update(txRef, {
            status: 'Rejected',
            rejectedBy: user.email,
            rejectedAt: new Date().toISOString(),
            rejectionReason: rejectReason.trim() || 'Declined by Administrator',
            balanceAfter: nextChecking
          });
        });

        // 2. Create customer notification
        const notifRef = doc(collection(db, `users/${selectedTx.userId}/notifications`));
        await setDoc(notifRef, {
          id: `notif-${Date.now()}`,
          type: 'security',
          title: 'Transfer Rejected',
          body: `Unfortunately, your transfer of ${selectedTx.currency === 'USD' ? '$' : selectedTx.currency}${Math.abs(selectedTx.amount).toLocaleString()} to ${selectedTx.beneficiaryName} was rejected. ${rejectReason.trim() ? `Reason: ${rejectReason.trim()}` : ''}`,
          date: new Date().toISOString(),
          read: false,
          createdAt: new Date().toISOString()
        });

        // 3. Email notification is handled by onTransactionUpdated Cloud Function trigger.

        setSuccessMsg('Transfer rejected successfully.');
      }

      // Close modal after brief delay
      setTimeout(() => {
        closeActionModal();
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to complete transaction.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending Transfers"
        subtitle="Review and authorize outgoing customer bank transfers."
      />

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-navy-100 dark:border-white/10 flex items-center justify-between">
          <h3 className="font-display font-semibold text-lg text-navy-900 dark:text-white">
            Authorization Queue ({transfers.length})
          </h3>
        </div>

        {transfers.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-navy-50 dark:bg-white/5 flex items-center justify-center text-navy-300 dark:text-navy-500 mb-3">
              <Clock size={20} />
            </div>
            <p className="text-sm font-medium text-navy-400">All pending transfers have been processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-navy-50/50 dark:bg-white/5 text-navy-400 font-medium text-xs border-b border-navy-100 dark:border-white/10">
                  <th className="p-4">Sender</th>
                  <th className="p-4">Recipient</th>
                  <th className="p-4">Bank & IBAN</th>
                  <th className="p-4">Date / Time</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50 dark:divide-white/5 text-navy-800 dark:text-white">
                {transfers.map((tx) => (
                  <tr key={tx.id} className="hover:bg-navy-50/40 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-navy-900 dark:text-white">{tx.senderName}</p>
                      <p className="text-xs text-navy-400">Acc: DE{tx.senderAccount}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-navy-900 dark:text-white">{tx.beneficiaryName}</p>
                      <p className="text-xs text-navy-400">Ref: {tx.reference || tx.referenceNumber}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-navy-850 dark:text-navy-100 truncate max-w-[200px]">{tx.beneficiaryBank}</p>
                      <p className="text-xs text-navy-400 truncate max-w-[200px] font-mono">
                        {tx.accountNumber ? `Acc: ${tx.accountNumber}` : (tx.beneficiaryAccount ? `Acc: ${tx.beneficiaryAccount}` : '')}
                        {tx.routingNumber ? ` · RTN: ${tx.routingNumber}` : ''}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-navy-800 dark:text-navy-100">{tx.date}</p>
                      <p className="text-xs text-navy-400">{tx.time}</p>
                    </td>
                    <td className="p-4 font-semibold font-tabular text-navy-900 dark:text-white">
                      {formatMoney(Math.abs(tx.amount), tx.currency)}
                    </td>
                    <td className="p-4">
                      <StatusPill status={tx.status} />
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openActionModal(tx, 'approve')}
                          className="p-2 rounded-lg bg-pos/10 hover:bg-pos/20 text-pos transition-colors"
                          title="Approve Transfer"
                        >
                          <Check size={16} strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => openActionModal(tx, 'reject')}
                          className="p-2 rounded-lg bg-neg/10 hover:bg-neg/20 text-neg transition-colors"
                          title="Reject Transfer"
                        >
                          <X size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve / Reject Modal Dialog */}
      <AnimatePresence>
        {selectedTx && (
          <Modal
            open={!!selectedTx}
            title={actionType === 'approve' ? 'Approve Transfer Request' : 'Reject Transfer Request'}
            subtitle={`Confirm decision for reference ${selectedTx.reference || selectedTx.referenceNumber}`}
            onClose={closeActionModal}
          >
            <div className="space-y-4 mb-6">
              <div className="rounded-2xl border border-navy-150 dark:border-white/10 bg-navy-50/50 dark:bg-white/5 p-4 text-sm space-y-2">
                <div className="flex justify-between"><span className="text-navy-400">Sender</span><span className="font-semibold text-navy-800 dark:text-white">{selectedTx.senderName}</span></div>
                <div className="flex justify-between"><span className="text-navy-400">Recipient</span><span className="font-semibold text-navy-800 dark:text-white">{selectedTx.beneficiaryName}</span></div>
                {selectedTx.accountNumber && (
                  <div className="flex justify-between"><span className="text-navy-400">Account Number</span><span className="font-semibold text-navy-800 dark:text-white font-mono">{selectedTx.accountNumber}</span></div>
                )}
                {selectedTx.routingNumber && (
                  <div className="flex justify-between"><span className="text-navy-400">Routing Number</span><span className="font-semibold text-navy-800 dark:text-white font-mono">{selectedTx.routingNumber}</span></div>
                )}
                {selectedTx.beneficiaryBank && (
                  <div className="flex justify-between"><span className="text-navy-400">Bank</span><span className="font-semibold text-navy-800 dark:text-white">{selectedTx.beneficiaryBank}</span></div>
                )}
                <div className="flex justify-between"><span className="text-navy-400">Amount</span><span className="font-bold text-navy-900 dark:text-white">{formatMoney(Math.abs(selectedTx.amount), selectedTx.currency)}</span></div>
                <div className="flex justify-between"><span className="text-navy-400">Fee (1%)</span><span className="font-medium text-navy-800 dark:text-white">{formatMoney(selectedTx.transferFee || selectedTx.fee || 0, selectedTx.currency)}</span></div>
                <div className="flex justify-between border-t border-navy-100 dark:border-white/10 pt-2"><span className="text-navy-400 font-semibold">Total Debit</span><span className="font-bold text-gold-600">{formatMoney(selectedTx.totalAmount || (Math.abs(selectedTx.amount) + (selectedTx.fee || 0)), selectedTx.currency)}</span></div>
              </div>

              {actionType === 'reject' && (
                <div>
                  <label className="block text-xs font-semibold text-navy-200 mb-1.5 uppercase tracking-wider">
                    Rejection Reason (Optional)
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide a reason for the transfer rejection..."
                    className="w-full px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring text-navy-950 dark:text-white"
                    rows={3}
                  />
                </div>
              )}

              {errorMsg && (
                <div className="flex gap-2 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-200 items-start">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl border border-green-500/30 bg-green-500/10 text-xs text-green-200 text-center font-semibold">
                  {successMsg}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeActionModal}
                disabled={isProcessing}
                className="flex-1 py-3 rounded-xl border border-navy-200 dark:border-white/15 text-sm font-medium hover:bg-navy-50 dark:hover:bg-white/5 disabled:opacity-50"
              >
                Leave Pending
              </button>
              <button
                onClick={handleProcessAction}
                disabled={isProcessing || !!successMsg}
                className={`flex-1 py-3 rounded-xl text-white font-semibold text-sm hover:brightness-110 disabled:opacity-50 ${
                  actionType === 'approve' ? 'bg-pos' : 'bg-neg'
                }`}
              >
                {isProcessing ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
