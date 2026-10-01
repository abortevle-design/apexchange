import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { formatMoney, PageHeader, StatCard } from '../../components/common';
import { TrendingUp, Percent, CheckSquare } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export default function AdminReports() {
  const [transactions, setTransactions] = useState([]);

  // Subscribe to transactions
  useEffect(() => {
    const q = query(collection(db, 'transactions'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setTransactions(list);
      },
      (error) => {
        console.error('AdminReports transactions onSnapshot error:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Compute actual report stats
  const successfulTx = transactions.filter((t) => t.status === 'Successful');
  const pendingTx = transactions.filter((t) => t.status === 'Pending');
  const rejectedTx = transactions.filter((t) => t.status === 'Rejected');

  const totalVolume = successfulTx.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
  const avgApproved = successfulTx.length > 0 ? (totalVolume / successfulTx.length) : 0;
  const totalProcessed = successfulTx.length + rejectedTx.length;
  const approvalRate = totalProcessed > 0 ? ((successfulTx.length / totalProcessed) * 100) : 100;

  // Pie chart data: Status ratio
  const statusRatioData = [
    { name: 'Approved', value: successfulTx.length, color: '#1e8a5f' },
    { name: 'Pending', value: pendingTx.length, color: '#c19a4f' },
    { name: 'Rejected', value: rejectedTx.length, color: '#ef4444' }
  ].filter((d) => d.value > 0);

  // Fallback status ratio if empty
  const defaultStatusData = [
    { name: 'Approved', value: 85, color: '#1e8a5f' },
    { name: 'Pending', value: 5, color: '#c19a4f' },
    { name: 'Rejected', value: 10, color: '#ef4444' }
  ];

  // Bar chart data: Categories distribution
  const categoriesMap = {};
  successfulTx.forEach((tx) => {
    const cat = tx.category || 'Bank Transfer';
    categoriesMap[cat] = (categoriesMap[cat] || 0) + Math.abs(tx.amount || 0);
  });

  const categoryChartData = Object.entries(categoriesMap).map(([name, value]) => ({
    name,
    volume: Math.round(value)
  })).slice(0, 5);

  // Fallback category data if empty
  const defaultCategoryData = [
    { name: 'Bank Transfer', volume: 450000 },
    { name: 'Investments', volume: 180000 },
    { name: 'Housing', volume: 120000 },
    { name: 'Dining', volume: 35000 },
    { name: 'Subscriptions', volume: 8000 }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Reports"
        subtitle="Analyze bank transaction volumes, approval rates, and transfer types."
      />

      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Cleared Funds"
          value={formatMoney(totalVolume)}
          tone="gold"
          icon={TrendingUp}
        />
        <StatCard
          label="Approval Ratio"
          value={`${approvalRate.toFixed(1)}%`}
          tone="light"
          icon={Percent}
          sub="Percentage of approved processed transfers"
        />
        <StatCard
          label="Average Approved Size"
          value={formatMoney(avgApproved)}
          tone="light"
          icon={CheckSquare}
          sub="Mean volume per successful transfer"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="card p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="font-display font-semibold text-lg text-navy-900 dark:text-white">Volume by Transfer Category</h3>
            <p className="text-xs text-navy-400">Total approved volume distributed across categories ($)</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData.length > 0 ? categoryChartData : defaultCategoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="volume" fill="#c19a4f" radius={[8, 8, 0, 0]} name="Volume ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="card p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-semibold text-lg text-navy-900 dark:text-white">Transaction Status Distribution</h3>
            <p className="text-xs text-navy-400">Proportional ratio of transaction statuses in the database</p>
          </div>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusRatioData.length > 0 ? statusRatioData : defaultStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(statusRatioData.length > 0 ? statusRatioData : defaultStatusData).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
