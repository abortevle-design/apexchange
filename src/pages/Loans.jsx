import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Landmark } from 'lucide-react';
import loansData from '../data/loans.json';
import { PageHeader, ProgressBar, formatMoney, formatDate } from '../components/common';
import { useAuth } from '../hooks/useAuth';

export default function Loans() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isDefaultUser = user?.accountNumber === (import.meta.env.VITE_ACCOUNT_NUMBER || '5320130');
  const loans = isDefaultUser ? loansData : [];

  return (
    <div>
      <PageHeader title={t('loans.title')} subtitle={t('loans.subtitle')} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {loans.map((l, i) => {
          const paid = l.principal - l.balance;
          return (
            <motion.div key={l.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-navy-900 dark:bg-white/10 text-white flex items-center justify-center">
                  <Landmark size={20} />
                </div>
                <p className="font-display text-lg text-navy-900 dark:text-white">{t(`loans.${l.typeKey}`)}</p>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-navy-400">{t('loans.balance')}</span>
                  <span className="font-tabular font-semibold text-navy-900 dark:text-white">{formatMoney(l.balance)}</span>
                </div>
                <ProgressBar value={paid} max={l.principal} color="#0B1F3A" />
                <p className="text-xs text-navy-400 mt-1.5">{formatMoney(paid)} {t('savings.of')} {formatMoney(l.principal)} {t('loans.principal').toLowerCase()}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-navy-100 dark:border-white/10">
                <div>
                  <p className="text-navy-400 text-xs mb-0.5">{t('loans.interestRate')}</p>
                  <p className="font-medium text-navy-800 dark:text-white">{l.interestRate}%</p>
                </div>
                <div>
                  <p className="text-navy-400 text-xs mb-0.5">{t('loans.monthlyPayment')}</p>
                  <p className="font-medium font-tabular text-navy-800 dark:text-white">{formatMoney(l.monthlyPayment)}</p>
                </div>
                <div>
                  <p className="text-navy-400 text-xs mb-0.5">{t('loans.nextPayment')}</p>
                  <p className="font-medium text-navy-800 dark:text-white">{formatDate(l.nextPaymentDate)}</p>
                </div>
                <div>
                  <p className="text-navy-400 text-xs mb-0.5">{t('loans.termEnd')}</p>
                  <p className="font-medium text-navy-800 dark:text-white">{formatDate(l.termEnd)}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
