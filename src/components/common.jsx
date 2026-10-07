import { motion } from 'framer-motion';
import i18n from '../i18n';

export function formatMoney(value, currency = 'USD', locale) {
  const loc = locale || (i18n.language === 'de' ? 'de-DE' : 'en-US');
  return new Intl.NumberFormat(loc, { style: 'currency', currency }).format(value);
}

export function formatDate(dateStr, locale) {
  if (!dateStr) return '';
  const loc = locale || (i18n.language === 'de' ? 'de-DE' : 'en-GB');
  const d = typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ? new Date(`${dateStr}T12:00:00`)
    : new Date(dateStr);
  return new Intl.DateTimeFormat(loc, { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl text-navy-900 dark:text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-navy-400 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, tone = 'default', delay = 0, sub }) {
  const toneClasses = {
    default: 'from-navy-900 to-navy-700 text-white',
    gold: 'from-gold-500 to-gold-600 text-navy-900',
    light: 'bg-white dark:bg-navy-800 text-navy-900 dark:text-white',
  };

  if (tone === 'light') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.35 }}
        className="card p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-navy-400 uppercase tracking-wide">{label}</p>
          {Icon && <Icon size={16} className="text-navy-300" />}
        </div>
        <p className="font-display text-2xl font-tabular text-navy-900 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-navy-400 mt-1">{sub}</p>}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={`rounded-2xl p-5 bg-gradient-to-br shadow-card ${toneClasses[tone]}`}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium uppercase tracking-wide opacity-75">{label}</p>
        {Icon && <Icon size={18} className="opacity-70" />}
      </div>
      <p className="font-display text-2xl sm:text-3xl font-tabular">{value}</p>
      {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
    </motion.div>
  );
}

export function StatusPill({ status }) {
  const map = {
    Completed: 'bg-pos/10 text-pos',
    Successful: 'bg-pos/10 text-pos',
    Pending: 'bg-gold-500/15 text-gold-600',
    Rejected: 'bg-neg/10 text-neg',
    Failed: 'bg-neg/10 text-neg',
    active: 'bg-pos/10 text-pos',
    frozen: 'bg-navy-300/20 text-navy-400',
  };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${map[status] || 'bg-navy-100 text-navy-500'}`}>
      {status}
    </span>
  );
}

export function ProgressBar({ value, max, color = '#0B1F3A' }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full h-2.5 rounded-full bg-navy-100 dark:bg-white/10 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={`animate-pulse bg-navy-100 dark:bg-white/10 rounded-lg ${className}`} />;
}
