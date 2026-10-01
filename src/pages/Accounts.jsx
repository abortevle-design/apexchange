import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, PiggyBank, TrendingUp, Briefcase, Download, ArrowRight, Copy } from 'lucide-react';
import accounts from '../data/accounts.json';
import { PageHeader, StatusPill, formatMoney } from '../components/common';
import { useAuth } from '../hooks/useAuth';

const icons = { checking: Wallet, savings: PiggyBank, investment: TrendingUp, business: Briefcase };
const labels = { checking: 'checking', savings: 'savingsType', investment: 'investmentType', business: 'business' };

export default function Accounts() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const accountCards = accounts.map((a) => {
    let balance = a.balance;
    if (user) {
      if (a.type === 'checking') balance = user.checkingBalance ?? 0;
      else if (a.type === 'savings') balance = user.savingsBalance ?? 0;
      else if (a.type === 'investment') balance = user.investmentBalance ?? 0;
      else if (a.type === 'business') balance = user.businessBalance ?? 0;
    }
    return { ...a, balance };
  });

  return (
    <div>
      <PageHeader title={t('accounts.title')} subtitle={t('accounts.subtitle')} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {accountCards.map((a, i) => {
          const Icon = icons[a.type];
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="card p-6"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-navy-900 dark:bg-white/10 text-white flex items-center justify-center">
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="font-display text-lg text-navy-900 dark:text-white">{a.name}</p>
                    <p className="text-xs text-navy-400">{t(`accounts.${labels[a.type]}`)}</p>
                  </div>
                </div>
                <StatusPill status="active" />
              </div>

              <p className="text-3xl font-display font-tabular text-navy-900 dark:text-white mb-4">
                {formatMoney(a.balance, a.currency)}
              </p>

              <div className="space-y-2 text-sm mb-5">
                <div className="flex justify-between items-center">
                  <span className="text-navy-400">{t('accounts.iban')}</span>
                  <span className="font-mono text-navy-700 dark:text-navy-100 flex items-center gap-1.5">
                    {a.iban} <Copy size={12} className="text-navy-300 cursor-pointer hover:text-navy-500" />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-navy-400">{t('accounts.accountNumber')}</span>
                  <span className="font-mono text-navy-700 dark:text-navy-100">{user?.accountNumber || a.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-navy-400">{t('accounts.currency')}</span>
                  <span className="text-navy-700 dark:text-navy-100">{a.currency}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link to="/transactions" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-navy-900 dark:bg-white/10 text-white text-sm font-medium hover:brightness-110 transition">
                  {t('accounts.viewTransactions')} <ArrowRight size={14} />
                </Link>
                <button className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-navy-200 dark:border-white/15 text-sm font-medium hover:bg-navy-50 dark:hover:bg-white/5">
                  <Download size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
