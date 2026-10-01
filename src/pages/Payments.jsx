import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Droplet, Wifi, Flame, Shield, Landmark, Phone, Tv, GraduationCap, X, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../components/common';

const bills = [
  { key: 'electricity', icon: Zap, color: '#c19a4f' },
  { key: 'water', icon: Droplet, color: '#2c4266' },
  { key: 'internet', icon: Wifi, color: '#4f6690' },
  { key: 'gas', icon: Flame, color: '#c23b3b' },
  { key: 'insurance', icon: Shield, color: '#1e8a5f' },
  { key: 'taxes', icon: Landmark, color: '#0B1F3A' },
  { key: 'phone', icon: Phone, color: '#8195b8' },
  { key: 'tv', icon: Tv, color: '#a8823c' },
  { key: 'schoolFees', icon: GraduationCap, color: '#2c4266' },
];

export default function Payments() {
  const { t } = useTranslation();
  const [active, setActive] = useState(null);
  const [done, setDone] = useState(false);

  const close = () => { setActive(null); setDone(false); };

  return (
    <div>
      <PageHeader title={t('payments.title')} subtitle={t('payments.subtitle')} />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {bills.map((b, i) => {
          const Icon = b.icon;
          return (
            <motion.button
              key={b.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setActive(b)}
              className="card p-5 flex flex-col items-center gap-3 hover:-translate-y-0.5 hover:shadow-card transition-transform focus-ring"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${b.color}1a`, color: b.color }}>
                <Icon size={22} />
              </div>
              <span className="text-sm font-medium text-navy-800 dark:text-white">{t(`payments.${b.key}`)}</span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={close}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-navy-800 w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-6 shadow-card"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-lg text-navy-900 dark:text-white">{t(`payments.${active.key}`)}</h3>
                <button onClick={close} className="p-1.5 rounded-lg hover:bg-navy-50 dark:hover:bg-white/10"><X size={16} /></button>
              </div>

              {!done ? (
                <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-navy-400 mb-1.5">{t('payments.provider')}</label>
                    <input required className="w-full px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 text-sm outline-none focus-ring" placeholder={t(`payments.${active.key}`)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-400 mb-1.5">{t('payments.reference')}</label>
                    <input required className="w-full px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 text-sm outline-none focus-ring" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-400 mb-1.5">{t('payments.amount')}</label>
                    <input required type="number" className="w-full px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 text-sm outline-none focus-ring font-tabular" placeholder="0.00" />
                  </div>
                  <button type="submit" className="w-full py-3 rounded-xl bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 font-semibold text-sm hover:brightness-110">
                    {t('payments.confirm')}
                  </button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <div className="w-14 h-14 mx-auto rounded-full bg-pos/10 text-pos flex items-center justify-center mb-3">
                    <CheckCircle2 size={26} />
                  </div>
                  <p className="text-sm text-navy-500 dark:text-navy-300 mb-5">{t('payments.successBody')}</p>
                  <button onClick={close} className="px-6 py-2.5 rounded-xl bg-navy-900 dark:bg-white/10 text-white text-sm font-semibold">
                    {t('transactions.close')}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
