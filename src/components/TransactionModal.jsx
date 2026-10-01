import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatMoney, formatDate, StatusPill } from './common';
import { printReceipt } from '../utils/receipt';

export default function TransactionModal({ transaction, onClose }) {
  const { t } = useTranslation();
  if (!transaction) return null;
  const tx = transaction;

  const cleanBankName = (val) => {
    if (!val || typeof val !== 'string') return val;
    return val
      .replace(/\bNova\s*Bank\b/gi, 'Apex exchange bank')
      .replace(/\bNova\b/gi, 'Apex exchange bank');
  };

  const rows = [
    [t('transactions.transactionId'), tx.transactionId || tx.id],
    [t('transactions.date'), `${formatDate(tx.date)}`],
    [t('transactions.time'), tx.time],
    [t('transactions.merchant'), cleanBankName(tx.merchant || tx.beneficiaryBank || '')],
    [t('transactions.sender'), cleanBankName(tx.senderName || tx.sender)],
  ];

  if (tx.senderAccount) {
    rows.push(['Sender Account', `DE${tx.senderAccount}`]);
  }

  rows.push([t('transactions.receiver'), cleanBankName(tx.beneficiaryName || tx.receiver)]);

  if (tx.beneficiaryAccount) {
    rows.push(['Beneficiary Account', tx.beneficiaryAccount]);
  }

  rows.push(
    [t('transactions.reference'), tx.reference || tx.referenceNumber],
    [t('transactions.category'), tx.category],
    [t('transactions.paymentMethod'), tx.paymentMethod || 'Bank Transfer'],
    [t('transactions.location'), tx.location || 'Online']
  );

  if (tx.transferFee !== undefined || tx.fee !== undefined) {
    rows.push(['Transfer Fee', formatMoney(tx.transferFee !== undefined ? tx.transferFee : tx.fee, tx.currency)]);
  }

  rows.push([t('transactions.balance'), formatMoney(tx.balanceAfter, tx.currency)]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-navy-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-card"
        >
          <div className="p-5 sm:p-6 border-b border-navy-100 dark:border-white/10 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center ${tx.type === 'credit' ? 'bg-pos/10 text-pos' : 'bg-navy-100 dark:bg-white/10 text-navy-500 dark:text-navy-200'}`}>
                {tx.type === 'credit' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
              </div>
              <div>
                <p className="font-display text-lg text-navy-900 dark:text-white">{tx.description}</p>
                <p className={`font-tabular font-semibold ${tx.type === 'credit' ? 'text-pos' : 'text-navy-800 dark:text-white'}`}>
                  {tx.type === 'credit' ? '+' : '−'}{formatMoney(tx.amount, tx.currency)}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-navy-50 dark:hover:bg-white/10 focus-ring">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-navy-400">{t('transactions.status')}</span>
              <StatusPill status={tx.status} />
            </div>
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 text-sm py-1.5 border-b border-navy-50 dark:border-white/5 last:border-0">
                <span className="text-navy-400 shrink-0">{label}</span>
                <span className="text-navy-800 dark:text-white text-right font-medium break-all">{value}</span>
              </div>
            ))}
          </div>

          <div className="p-5 sm:p-6 pt-0 flex gap-3">
            {(tx.category === 'Bank Transfer' || tx.type === 'Transfer' || tx.type === 'debit' || tx.type === 'credit') && (
              <button
                onClick={() => printReceipt(tx)}
                className="flex-1 py-3 rounded-xl bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 text-sm font-semibold hover:brightness-110 transition"
              >
                View Receipt
              </button>
            )}
            <button
              onClick={onClose}
              className={`py-3 rounded-xl text-sm font-semibold hover:brightness-110 transition ${
                tx.status === 'Successful' && (tx.category === 'Bank Transfer' || tx.type === 'Transfer' || tx.type === 'debit')
                  ? 'flex-1 border border-navy-200 dark:border-white/15 text-navy-800 dark:text-white bg-transparent'
                  : 'w-full bg-navy-900 dark:bg-white/10 text-white'
              }`}
            >
              {t('transactions.close')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
