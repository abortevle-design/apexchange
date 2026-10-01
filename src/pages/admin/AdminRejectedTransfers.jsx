import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { formatMoney, PageHeader } from '../../components/common';
import { XCircle, Search, HelpCircle } from 'lucide-react';
import TransactionModal from '../../components/TransactionModal';

export default function AdminRejectedTransfers() {
  const [transfers, setTransfers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);

  // Subscribe to Rejected transactions in real-time
  useEffect(() => {
    const q = query(
      collection(db, 'transactions'),
      where('status', '==', 'Rejected')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt || `${b.date}T${b.time}`).getTime() - new Date(a.createdAt || `${a.date}T${a.time}`).getTime());
      setTransfers(list);
    });

    return () => unsubscribe();
  }, []);

  const filteredTransfers = transfers.filter((tx) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (tx.senderName || '').toLowerCase().includes(searchLower) ||
      (tx.beneficiaryName || '').toLowerCase().includes(searchLower) ||
      (tx.rejectionReason || '').toLowerCase().includes(searchLower) ||
      (tx.reference || tx.referenceNumber || '').toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rejected Transfers"
        subtitle="Log of all declined/rejected outbound customer bank transfers."
      />

      <div className="card overflow-hidden">
        {/* Table Search Header */}
        <div className="p-5 border-b border-navy-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-display font-semibold text-lg text-navy-900 dark:text-white flex items-center gap-2">
            <XCircle size={20} className="text-neg" /> Rejected Transfers ({filteredTransfers.length})
          </h3>
          <div className="relative max-w-xs w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
            <input
              type="text"
              placeholder="Search sender, receiver, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring text-navy-950 dark:text-white"
            />
          </div>
        </div>

        {filteredTransfers.length === 0 ? (
          <div className="p-10 text-center text-navy-400">
            No rejected transfers recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-navy-50/50 dark:bg-white/5 text-navy-400 font-medium text-xs border-b border-navy-100 dark:border-white/10">
                  <th className="p-4">Reference</th>
                  <th className="p-4">Sender</th>
                  <th className="p-4">Recipient</th>
                  <th className="p-4">Rejection Details</th>
                  <th className="p-4">Date / Time</th>
                  <th className="p-4">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50 dark:divide-white/5 text-navy-800 dark:text-white">
                {filteredTransfers.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-navy-50/40 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <td className="p-4 font-mono font-medium text-xs">
                      {tx.reference || tx.referenceNumber}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-navy-900 dark:text-white">{tx.senderName}</p>
                      <p className="text-xs text-navy-400">DE{tx.senderAccount}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-navy-900 dark:text-white">{tx.beneficiaryName}</p>
                      <p className="text-xs text-navy-400">{tx.beneficiaryBank}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-start gap-1.5 max-w-[250px]">
                        <HelpCircle size={13} className="text-neg shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-navy-800 dark:text-navy-100 text-xs line-clamp-2">
                            {tx.rejectionReason || 'Declined by Administrator'}
                          </p>
                          <p className="text-[10px] text-navy-400">By: {tx.approvedBy || 'Admin'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-navy-800 dark:text-navy-100">{tx.approvedAt ? new Date(tx.approvedAt).toLocaleDateString() : tx.date}</p>
                      <p className="text-xs text-navy-400">{tx.approvedAt ? new Date(tx.approvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : tx.time}</p>
                    </td>
                    <td className="p-4 font-semibold font-tabular text-neg">
                      {formatMoney(Math.abs(tx.amount), tx.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <TransactionModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
}
