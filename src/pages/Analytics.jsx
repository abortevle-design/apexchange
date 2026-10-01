import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useBanking } from '../context/BankingContext';
import { PageHeader, formatMoney } from '../components/common';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Analytics() {
  const { t } = useTranslation();
  const { transactions } = useBanking();

  const monthly = useMemo(() => {
    const map = {};
    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map[key]) map[key] = { key, month: monthNames[d.getMonth()], income: 0, expenses: 0 };
      if (tx.type === 'credit') {
        map[key].income += Math.abs(tx.amount);
      } else {
        map[key].expenses += Math.abs(tx.amount);
      }
    });
    return Object.values(map).sort((a, b) => a.key.localeCompare(b.key)).slice(-6)
      .map((m) => ({ ...m, income: +m.income.toFixed(2), expenses: +m.expenses.toFixed(2), flow: +(m.income - m.expenses).toFixed(2) }));
  }, [transactions]);

  const byCategory = useMemo(() => {
    const map = {};
    transactions.filter((t) => t.type === 'debit' || t.type === 'Transfer').forEach((tx) => {
      map[tx.category] = (map[tx.category] || 0) + Math.abs(tx.amount);
    });
    const colors = ['#0B1F3A', '#2c4266', '#c19a4f', '#8195b8', '#c23b3b', '#1e8a5f', '#4f6690', '#a8823c'];
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value], i) => ({ name, value: +value.toFixed(2), color: colors[i % colors.length] }));
  }, [transactions]);

  return (
    <div>
      <PageHeader title={t('analytics.title')} subtitle={t('analytics.subtitle')} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-6">
          <h3 className="font-display text-lg text-navy-900 dark:text-white mb-4">{t('analytics.incomeVsExpenses')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e6ed" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#8195b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8195b8' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income" fill="#1e8a5f" radius={[4, 4, 0, 0]} name={t('dashboard.monthlyIncome')} />
                <Bar dataKey="expenses" fill="#c23b3b" radius={[4, 4, 0, 0]} name={t('dashboard.monthlyExpenses')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-display text-lg text-navy-900 dark:text-white mb-4">{t('analytics.cashFlow')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e6ed" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#8195b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8195b8' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Line type="monotone" dataKey="flow" stroke="#c19a4f" strokeWidth={2.5} dot={{ r: 4 }} name={t('dashboard.cashFlow')} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-display text-lg text-navy-900 dark:text-white mb-4">{t('analytics.byCategory')}</h3>
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="w-56 h-56 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                  {byCategory.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip formatter={(v) => formatMoney(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
            {byCategory.map((c) => (
              <div key={c.name} className="flex items-center gap-2 text-sm">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-navy-500 dark:text-navy-200 truncate flex-1">{c.name}</span>
                <span className="font-tabular font-medium text-navy-800 dark:text-white">{formatMoney(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
