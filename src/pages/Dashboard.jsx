import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Wallet, PiggyBank, TrendingUp, CreditCard, ArrowDownRight, ArrowUpRight,
  Send, ChevronRight, Plane, Shield, Car, Home, Book,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import accounts from '../data/accounts.json';
import cards from '../data/cards.json';
import savingsGoals from '../data/savingsGoals.json';
import investments from '../data/investments.json';
import beneficiaries from '../data/beneficiaries.json';
import { StatCard, StatusPill, ProgressBar, formatMoney, formatDate } from '../components/common';
import { useBanking } from '../context/BankingContext';
import { useAuth } from '../hooks/useAuth';

const goalIcons = { shield: Shield, plane: Plane, car: Car, home: Home, book: Book };

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { balance, transactions } = useBanking();
  const { user } = useAuth();
  const checking = accounts.find((a) => a.type === 'checking');
  const savings = accounts.find((a) => a.type === 'savings');
  const investment = accounts.find((a) => a.type === 'investment');
  const creditCard = cards.find((c) => c.type === 'Credit');

  const isDefaultUser = user?.accountNumber === (import.meta.env.VITE_ACCOUNT_NUMBER || '5320130');
  
  const defaultBeneficiaryId = isDefaultUser ? (beneficiaries[0]?.id || '') : '';
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(defaultBeneficiaryId);
  const [amount, setAmount] = useState('');

  const recent = transactions.slice(0, 6);
  const accountBalance = balance;
  const checkingCurrency = checking?.currency || 'USD';
  
  const savingsBalance = user ? (user.savingsBalance ?? 0) : 0;
  const investmentBalance = user ? (user.investmentBalance ?? 0) : 0;
  
  const upcoming = isDefaultUser ? [
    { id: 'u1', name: 'Public Broadcasting Fee', date: '2026-12-12', amount: 18.36 },
    { id: 'u2', name: 'E.ON Energy', date: '2026-12-15', amount: 84.2 },
    { id: 'u3', name: 'Allianz Insurance', date: '2026-12-18', amount: 62.5 },
  ] : [];

  const monthlyIncome = isDefaultUser ? 5240.0 : 0.0;
  const monthlyExpenses = isDefaultUser ? 3180.42 : 0.0;
  const netFlow = monthlyIncome - monthlyExpenses;

  const cashFlowData = isDefaultUser ? [
    { m: 'Feb', v: 1620 }, { m: 'Mar', v: 1890 }, { m: 'Apr', v: 1340 },
    { m: 'May', v: 2100 }, { m: 'Jun', v: 1780 }, { m: 'Jul', v: netFlow },
  ] : [];

  const spendCategories = useMemo(() => {
    const map = {};
    transactions.filter((tx) => tx.type === 'debit' || tx.type === 'Transfer').forEach((tx) => {
      map[tx.category] = (map[tx.category] || 0) + Math.abs(tx.amount);
    });
    const colors = ['#0B1F3A', '#2c4266', '#c19a4f', '#8195b8', '#c23b3b', '#1e8a5f', '#4f6690'];
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({ name, value: +value.toFixed(2), color: colors[i % colors.length] }));
  }, [transactions]);

  const greetingName = user ? user.firstName : 'Sandra';
  const greeting = t('dashboard.greeting').includes('Sandra') 
    ? t('dashboard.greeting').replace('Sandra', greetingName) 
    : `${t('dashboard.greeting')} ${greetingName}`;

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl sm:text-3xl text-navy-900 dark:text-white tracking-tight">
          {greeting}
        </h1>
        <p className="text-sm text-navy-400 mt-1">{t('dashboard.overview')}</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('dashboard.checking')} value={formatMoney(accountBalance, checkingCurrency)} icon={Wallet} tone="default" delay={0} sub={user ? `DE${user.accountNumber}` : ''} />
        <StatCard label={t('dashboard.savings')} value={formatMoney(savingsBalance)} icon={PiggyBank} tone="light" delay={0.05} />
        <StatCard label={t('dashboard.investment')} value={formatMoney(investmentBalance)} icon={TrendingUp} tone="light" delay={0.1} sub={`+${isDefaultUser ? (investments?.totalReturnPct ?? 0) : 0}%`} />
        <StatCard label={t('dashboard.creditCard')} value={formatMoney(isDefaultUser ? (creditCard?.spentMonthly ?? 0) : 0)} icon={CreditCard} tone="gold" delay={0.15} sub={`•••• ${isDefaultUser ? (creditCard?.last4 ?? '0000') : '0000'}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Income / expenses / cashflow */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="flex items-center gap-2 text-pos mb-2">
                <ArrowDownRight size={16} />
                <span className="text-xs font-medium uppercase tracking-wide text-navy-400">{t('dashboard.monthlyIncome')}</span>
              </div>
              <p className="font-display text-xl font-tabular text-navy-900 dark:text-white">{formatMoney(monthlyIncome)}</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 text-neg mb-2">
                <ArrowUpRight size={16} />
                <span className="text-xs font-medium uppercase tracking-wide text-navy-400">{t('dashboard.monthlyExpenses')}</span>
              </div>
              <p className="font-display text-xl font-tabular text-navy-900 dark:text-white">{formatMoney(monthlyExpenses)}</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wide text-navy-400">{t('dashboard.cashFlow')}</span>
              </div>
              <p className="font-display text-xl font-tabular text-pos">+{formatMoney(netFlow)}</p>
              <div className="h-8 mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData}>
                    <defs>
                      <linearGradient id="cf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1e8a5f" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#1e8a5f" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke="#1e8a5f" strokeWidth={2} fill="url(#cf)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent transactions */}
          <div className="card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-navy-900 dark:text-white">{t('dashboard.recentTransactions')}</h3>
              <Link to="/transactions" className="text-xs font-medium text-gold-600 hover:text-gold-500 flex items-center gap-0.5">
                {t('dashboard.viewAll')} <ChevronRight size={14} />
              </Link>
            </div>
            <div className="space-y-1">
              {recent.map((tx, i) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between py-2.5 border-b border-navy-50 dark:border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'credit' ? 'bg-pos/10 text-pos' : 'bg-navy-100 dark:bg-white/10 text-navy-500 dark:text-navy-200'}`}>
                      {tx.type === 'credit' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-navy-800 dark:text-white truncate">{tx.description}</p>
                      <p className="text-xs text-navy-400">{formatDate(tx.date)} · {tx.merchant}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-tabular font-semibold shrink-0 ${tx.type === 'credit' ? 'text-pos' : 'text-navy-800 dark:text-white'}`}>
                    {tx.type === 'credit' ? '+' : '−'}{formatMoney(tx.amount)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Spending analytics */}
          <div className="card p-5 sm:p-6">
            <h3 className="font-display text-lg text-navy-900 dark:text-white mb-4">{t('dashboard.spendingAnalytics')}</h3>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-40 h-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={spendCategories} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                      {spendCategories.map((c, i) => <Cell key={i} fill={c.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatMoney(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full grid grid-cols-2 gap-x-4 gap-y-2">
                {spendCategories.map((c) => (
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

        {/* Right column */}
        <div className="space-y-6">
          {/* Quick transfer */}
          <div className="card p-5 sm:p-6">
            <h3 className="font-display text-lg text-navy-900 dark:text-white mb-4 flex items-center gap-2">
              <Send size={17} className="text-gold-600" /> {t('dashboard.quickTransfer')}
            </h3>
            <label className="block text-xs font-medium text-navy-400 mb-1.5">{t('dashboard.selectBeneficiary')}</label>
            <select
              value={selectedBeneficiary}
              onChange={(e) => setSelectedBeneficiary(e.target.value)}
              className="w-full mb-3 px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring"
            >
              {(isDefaultUser ? beneficiaries : []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <label className="block text-xs font-medium text-navy-400 mb-1.5">{t('dashboard.amount')}</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full mb-4 px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring font-tabular"
            />
            <Link
              to="/transfer"
              className="block text-center w-full py-2.5 rounded-xl bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 text-sm font-semibold hover:brightness-110 transition"
            >
              {t('dashboard.send')}
            </Link>
          </div>

          {/* Cards overview */}
          <div className="card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-navy-900 dark:text-white">{t('dashboard.cardsOverview')}</h3>
              <Link to="/cards" className="text-xs font-medium text-gold-600 hover:text-gold-500">{t('dashboard.viewAll')}</Link>
            </div>
            <div className="space-y-3">
              {(isDefaultUser ? cards : []).slice(0, 2).map((c) => (
                <div key={c.id} className="rounded-xl p-4 bg-gradient-to-br from-navy-800 to-navy-950 text-white flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-navy-300">{c.brand} · {c.type}</p>
                    <p className="font-mono text-sm mt-1">•••• •••• •••• {c.last4}</p>
                  </div>
                  <StatusPill status={c.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Savings goals */}
          <div className="card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-navy-900 dark:text-white">{t('dashboard.savingsGoals')}</h3>
              <Link to="/savings" className="text-xs font-medium text-gold-600 hover:text-gold-500">{t('dashboard.viewAll')}</Link>
            </div>
            <div className="space-y-4">
              {(isDefaultUser ? savingsGoals : []).slice(0, 3).map((g) => {
                const Icon = goalIcons[g.icon];
                return (
                  <div key={g.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-navy-600 dark:text-navy-100 flex items-center gap-1.5">
                        <Icon size={14} style={{ color: g.color }} /> {t(`savings.${g.nameKey}`)}
                      </span>
                      <span className="text-xs font-tabular text-navy-400">
                        {formatMoney(g.current)} / {formatMoney(g.target)}
                      </span>
                    </div>
                    <ProgressBar value={g.current} max={g.target} color={g.color} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming payments */}
          <div className="card p-5 sm:p-6">
            <h3 className="font-display text-lg text-navy-900 dark:text-white mb-4">{t('dashboard.upcomingPayments')}</h3>
            <div className="space-y-3">
              {upcoming.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-navy-700 dark:text-navy-100 font-medium">{p.name}</p>
                    <p className="text-xs text-navy-400">{t('dashboard.due')} {formatDate(p.date)}</p>
                  </div>
                  <p className="font-tabular font-semibold text-navy-800 dark:text-white">{formatMoney(p.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
