import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import invData from '../data/investments.json';
import { PageHeader, StatCard, formatMoney } from '../components/common';
import { useAuth } from '../hooks/useAuth';

export default function Investments() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isDefaultUser = user?.accountNumber === (import.meta.env.VITE_ACCOUNT_NUMBER || '5320130');
  const inv = isDefaultUser ? invData : {
    portfolioValue: 0.00,
    totalReturn: 0.00,
    totalReturnPct: 0.00,
    performance: [],
    allocation: [],
    holdings: []
  };

  return (
    <div>
      <PageHeader title={t('investments.title')} subtitle={t('investments.subtitle')} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard label={t('investments.portfolioValue')} value={formatMoney(inv.portfolioValue)} tone="default" icon={TrendingUp} />
        <StatCard label={t('investments.totalReturn')} value={`+${formatMoney(inv.totalReturn)}`} sub={`+${inv.totalReturnPct}%`} tone="light" icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-display text-lg text-navy-900 dark:text-white mb-4">{t('investments.performance')}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={inv.performance}>
                <defs>
                  <linearGradient id="perf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c19a4f" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#c19a4f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e6ed" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#8195b8' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Area type="monotone" dataKey="value" stroke="#c19a4f" strokeWidth={2.5} fill="url(#perf)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-display text-lg text-navy-900 dark:text-white mb-4">{t('investments.allocation')}</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={inv.allocation} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} paddingAngle={2}>
                  {inv.allocation.map((a, i) => <Cell key={i} fill={a.color} />)}
                </Pie>
                <Tooltip formatter={(v) => formatMoney(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {inv.allocation.map((a) => (
              <div key={a.name} className="flex items-center gap-2 text-sm">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: a.color }} />
                <span className="flex-1 text-navy-500 dark:text-navy-200">{a.name}</span>
                <span className="font-tabular font-medium text-navy-800 dark:text-white">{formatMoney(a.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <h3 className="font-display text-lg text-navy-900 dark:text-white px-6 pt-6 mb-2">{t('investments.holdings')}</h3>
        <div className="hidden md:grid grid-cols-[80px_1fr_100px_100px_100px_90px] gap-3 px-6 py-3 text-xs font-medium text-navy-400 uppercase tracking-wide border-b border-navy-100 dark:border-white/10 mt-2">
          <span>{t('investments.symbol')}</span>
          <span>{t('investments.type')}</span>
          <span className="text-right">{t('investments.shares')}</span>
          <span className="text-right">{t('investments.price')}</span>
          <span className="text-right">{t('investments.change')}</span>
        </div>
        {inv.holdings.map((h) => (
          <div key={h.symbol} className="grid grid-cols-2 md:grid-cols-[80px_1fr_100px_100px_100px_90px] gap-2 md:gap-3 items-center px-6 py-3.5 border-b border-navy-50 dark:border-white/5 last:border-0">
            <span className="font-mono text-sm font-semibold text-navy-900 dark:text-white">{h.symbol}</span>
            <span className="text-sm text-navy-500 dark:text-navy-300">{h.name}</span>
            <span className="hidden md:block text-sm font-tabular text-right text-navy-700 dark:text-navy-100">{h.shares}</span>
            <span className="hidden md:block text-sm font-tabular text-right text-navy-700 dark:text-navy-100">{formatMoney(h.price)}</span>
            <span className={`text-sm font-tabular text-right flex items-center justify-end gap-1 ${h.change >= 0 ? 'text-pos' : 'text-neg'}`}>
              {h.change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />} {h.change}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
