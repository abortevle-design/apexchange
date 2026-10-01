import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useBanking } from '../context/BankingContext';
import { PageHeader, ProgressBar, formatMoney } from '../components/common';

const budgets = {
  Groceries: 500, Shopping: 350, Dining: 250, Utilities: 300,
  Transport: 200, Leisure: 200, Subscriptions: 80, Health: 150,
};

export default function Budget() {
  const { t } = useTranslation();
  const { transactions } = useBanking();

  const spentByCategory = useMemo(() => {
    const now = new Date();
    const map = {};
    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      if ((tx.type === 'debit' || tx.type === 'Transfer') && d.getMonth() === now.getMonth() - 1) {
        map[tx.category] = (map[tx.category] || 0) + Math.abs(tx.amount);
      }
    });
    return map;
  }, [transactions]);

  const totalBudget = Object.values(budgets).reduce((a, b) => a + b, 0);
  const totalSpent = Object.keys(budgets).reduce((sum, c) => sum + (spentByCategory[c] || 0), 0);

  return (
    <div>
      <PageHeader title={t('budget.title')} subtitle={t('budget.subtitle')} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <p className="text-xs font-medium text-navy-400 uppercase tracking-wide mb-2">{t('budget.monthlyBudget')}</p>
          <p className="font-display text-2xl font-tabular text-navy-900 dark:text-white">{formatMoney(totalBudget)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-navy-400 uppercase tracking-wide mb-2">{t('budget.spent')}</p>
          <p className="font-display text-2xl font-tabular text-neg">{formatMoney(totalSpent)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-navy-400 uppercase tracking-wide mb-2">{t('budget.remaining')}</p>
          <p className="font-display text-2xl font-tabular text-pos">{formatMoney(Math.max(0, totalBudget - totalSpent))}</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="space-y-5">
          {Object.entries(budgets).map(([cat, limit], i) => {
            const spent = spentByCategory[cat] || 0;
            const over = spent > limit;
            return (
              <motion.div key={cat} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-navy-700 dark:text-navy-100">{cat}</span>
                  <span className={`font-tabular ${over ? 'text-neg' : 'text-navy-400'}`}>{formatMoney(spent)} / {formatMoney(limit)}</span>
                </div>
                <ProgressBar value={spent} max={limit} color={over ? '#c23b3b' : '#0B1F3A'} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
