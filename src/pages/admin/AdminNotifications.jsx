import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { PageHeader, formatDate } from '../../components/common';
import { CheckCircle, XCircle, Info, UserPlus, Bell } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminNotifications() {
  const [logs, setLogs] = useState([]);

  // Subscribe to transactions & users to construct admin event logs
  useEffect(() => {
    const qTx = query(collection(db, 'transactions'));
    const qCust = query(collection(db, 'users'));

    let txs = [];
    let custs = [];

    const handleLogsSync = () => {
      const list = [];

      // Add customer registration logs
      custs.forEach((c) => {
        list.push({
          id: `cust-${c.uid}`,
          type: 'customer',
          title: 'New Customer Registered',
          body: `${c.firstName} ${c.lastName} registered account DE${c.accountNumber} successfully.`,
          timestamp: c.createdAt || new Date().toISOString()
        });
      });

      // Add transfer approvals/rejections
      txs.forEach((t) => {
        if (t.status === 'Successful' && t.approvedAt) {
          list.push({
            id: `app-${t.id}`,
            type: 'approve',
            title: 'Transfer Approved',
            body: `Admin approved $${Math.abs(t.amount).toLocaleString()} transfer from ${t.senderName} to ${t.beneficiaryName}.`,
            timestamp: t.approvedAt
          });
        } else if (t.status === 'Rejected' && t.approvedAt) {
          list.push({
            id: `rej-${t.id}`,
            type: 'reject',
            title: 'Transfer Rejected',
            body: `Admin rejected $${Math.abs(t.amount).toLocaleString()} transfer from ${t.senderName} to ${t.beneficiaryName}. Reason: ${t.rejectionReason || 'None'}`,
            timestamp: t.approvedAt
          });
        } else if (t.status === 'Pending') {
          list.push({
            id: `pend-${t.id}`,
            type: 'pending',
            title: 'New Transfer Submitted',
            body: `Customer ${t.senderName} submitted a pending transfer of $${Math.abs(t.amount).toLocaleString()} to ${t.beneficiaryName}.`,
            timestamp: t.createdAt || `${t.date}T${t.time}`
          });
        }
      });

      // Sort newest logs first
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLogs(list.slice(0, 50)); // Limit to recent 50 logs
    };

    const unsubTx = onSnapshot(qTx, (snap) => {
      txs = snap.docs.map((d) => d.data());
      handleLogsSync();
    });

    const unsubCust = onSnapshot(qCust, (snap) => {
      custs = snap.docs.map((d) => d.data());
      handleLogsSync();
    });

    return () => {
      unsubTx();
      unsubCust();
    };
  }, []);

  const getLogIcon = (type) => {
    switch (type) {
      case 'approve':
        return <CheckCircle size={17} className="text-pos" />;
      case 'reject':
        return <XCircle size={17} className="text-neg" />;
      case 'customer':
        return <UserPlus size={17} className="text-blue-500" />;
      default:
        return <Info size={17} className="text-gold-600" />;
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'approve':
        return 'bg-pos/10';
      case 'reject':
        return 'bg-neg/10';
      case 'customer':
        return 'bg-blue-500/10';
      default:
        return 'bg-gold-500/10';
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Admin Notifications"
        subtitle="Chronological audit logs of recent system activities and events."
      />

      <div className="card divide-y divide-navy-50 dark:divide-white/5 overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-navy-400">
            No system notifications available.
          </div>
        ) : (
          logs.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-3 p-4 sm:p-5 hover:bg-navy-50/60 dark:hover:bg-white/5 transition-colors"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getLogColor(log.type)}`}>
                {getLogIcon(log.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-navy-800 dark:text-white">
                    {log.title}
                  </p>
                  <p className="text-[10px] text-navy-400 font-tabular">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <p className="text-sm text-navy-500 dark:text-navy-300 mt-0.5 leading-relaxed">
                  {log.body}
                </p>
                <p className="text-[10px] text-navy-400 mt-1 font-medium">
                  {formatDate(log.timestamp)}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
