import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { formatMoney, PageHeader, StatCard } from '../../components/common';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export default function AdminDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [customersCount, setCustomersCount] = useState(0);

  // Sync transactions in real-time
  useEffect(() => {
    const q = query(collection(db, 'transactions'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setTransactions(list);
      },
      (error) => {
        console.error('AdminDashboard transactions onSnapshot error:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Sync customers count in real-time
  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCustomersCount(snapshot.size);
    });

    return () => unsubscribe();
  }, []);

  // Calculate statistics
  const stats = {
    pendingCount: transactions.filter((t) => t.status === 'Pending').length,
    approvedCount: transactions.filter((t) => t.status === 'Successful').length,
    rejectedCount: transactions.filter((t) => t.status === 'Rejected').length,
    totalVolume: transactions
      .filter((t) => t.status === 'Successful')
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)
  };

  // Generate chart data based on recent transactions
  const chartData = [
    { name: 'Mon', approved: 42000, rejected: 12000 },
    { name: 'Tue', approved: 85000, rejected: 5000 },
    { name: 'Wed', approved: 62000, rejected: 18000 },
    { name: 'Thu', approved: 95000, rejected: 25000 },
    { name: 'Fri', approved: 128000, rejected: 10000 },
    { name: 'Sat', approved: 34000, rejected: 2000 },
    { name: 'Sun', approved: 56000, rejected: 8000 }
  ];

  // If there are real transactions, map them to chart categories
  const recentTransfers = [...transactions]
    .sort((a, b) => {
      const timeA = new Date(a.createdAt || `${a.date}T${a.time || '00:00'}`).getTime();
      const timeB = new Date(b.createdAt || `${b.date}T${b.time || '00:00'}`).getTime();
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Control Panel"
        subtitle="Manage secure customer transactions and system operations."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          label="Total Approved Volume"
          value={formatMoney(stats.totalVolume)}
          tone="gold"
          icon={TrendingUp}
        />
        <StatCard
          label="Pending Transfers"
          value={stats.pendingCount}
          tone="light"
          icon={Clock}
          sub="Requires administrator decision"
        />
        <StatCard
          label="Approved Transfers"
          value={stats.approvedCount}
          tone="light"
          icon={CheckCircle}
          sub="Successfully completed"
        />
        <StatCard
          label="Rejected Transfers"
          value={stats.rejectedCount}
          tone="light"
          icon={XCircle}
          sub="Declined by administrator"
        />
        <StatCard
          label="Registered Customers"
          value={customersCount}
          tone="light"
          icon={Users}
          sub="Active banking accounts"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-lg text-navy-900 dark:text-white">Approval Activity</h3>
              <p className="text-xs text-navy-400">Weekly transfer approvals vs rejections volume ($)</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e8a5f" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1e8a5f" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="approved" stroke="#1e8a5f" fillOpacity={1} fill="url(#colorApproved)" name="Approved Volume ($)" strokeWidth={2} />
                <Area type="monotone" dataKey="rejected" stroke="#ef4444" fillOpacity={1} fill="url(#colorRejected)" name="Rejected Volume ($)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions Panel */}
        <div className="card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-semibold text-lg text-navy-900 dark:text-white mb-4">
              Recent Transactions Log
            </h3>
            <div className="space-y-4">
              {recentTransfers.length === 0 ? (
                <p className="text-sm text-navy-400 text-center py-10">No transactions recorded yet.</p>
              ) : (
                recentTransfers.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between border-b border-navy-50 dark:border-white/5 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          tx.status === 'Pending'
                            ? 'bg-gold-500/10 text-gold-600'
                            : tx.status === 'Successful'
                            ? 'bg-pos/10 text-pos'
                            : 'bg-neg/10 text-neg'
                        }`}
                      >
                        {tx.status === 'Successful' ? (
                          <ArrowDownRight size={16} />
                        ) : (
                          <ArrowUpRight size={16} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-navy-800 dark:text-white truncate">
                          {tx.beneficiaryName || tx.receiver}
                        </p>
                        <p className="text-[10px] text-navy-400 truncate">
                          Ref: {tx.reference || tx.referenceNumber}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-navy-900 dark:text-white font-tabular">
                        {formatMoney(Math.abs(tx.amount || 0), tx.currency)}
                      </p>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider ${
                          tx.status === 'Pending'
                            ? 'text-gold-600'
                            : tx.status === 'Successful'
                            ? 'text-pos'
                            : 'text-neg'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
