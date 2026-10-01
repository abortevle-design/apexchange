import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plane, Shield, Car, Home, Book, Plus } from 'lucide-react';
import goals from '../data/savingsGoals.json';
import { PageHeader, ProgressBar, formatMoney } from '../components/common';

const icons = { shield: Shield, plane: Plane, car: Car, home: Home, book: Book };

export default function Savings() {
  const { t } = useTranslation();

  return (
    <div>
      <PageHeader
        title={t('savings.title')}
        subtitle={t('savings.subtitle')}
        action={
          <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 text-sm font-medium hover:brightness-110">
            <Plus size={15} /> {t('savings.newGoal')}
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {goals.map((g, i) => {
          const Icon = icons[g.icon];
          const pct = Math.round((g.current / g.target) * 100);
          return (
            <motion.div key={g.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${g.color}1a`, color: g.color }}>
                  <Icon size={22} />
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-pos/10 text-pos">{t('savings.onTrack')}</span>
              </div>
              <p className="font-display text-lg text-navy-900 dark:text-white mb-1">{t(`savings.${g.nameKey}`)}</p>
              <p className="text-sm text-navy-400 mb-4">
                {formatMoney(g.current)} {t('savings.of')} {formatMoney(g.target)}
              </p>
              <ProgressBar value={g.current} max={g.target} color={g.color} />
              <div className="flex items-center justify-between mt-2 mb-5">
                <span className="text-xs text-navy-400">{pct}%</span>
              </div>
              <button className="w-full py-2.5 rounded-xl border border-navy-200 dark:border-white/15 text-sm font-medium hover:bg-navy-50 dark:hover:bg-white/5">
                {t('savings.addFunds')}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
