import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Snowflake, RefreshCcw, KeyRound, SlidersHorizontal } from 'lucide-react';
import cardsData from '../data/cards.json';
import { PageHeader, ProgressBar, formatMoney } from '../components/common';
import { useAuth } from '../hooks/useAuth';

function CardVisual({ card, frozen, onMove, onLeave, rotate }) {
  const gradients = {
    navy: 'from-navy-800 via-navy-900 to-navy-950',
    gold: 'from-gold-500 via-gold-600 to-[#8a6a2e]',
    slate: 'from-slate-500 via-slate-600 to-slate-800',
  };
  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ transform: rotate ? `perspective(800px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)` : undefined }}
      className={`relative w-full aspect-[1.586] rounded-2xl bg-gradient-to-br ${gradients[card.color]} text-white p-5 shadow-card transition-transform duration-150 ease-out overflow-hidden ${frozen ? 'grayscale opacity-60' : ''}`}
    >
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />
      <div className="absolute -right-2 top-10 w-20 h-20 rounded-full bg-white/5" />
      <div className="relative flex justify-between items-start">
        <span className="font-display text-sm tracking-wide">Apex exchange bank</span>
        <span className="text-xs uppercase tracking-widest opacity-80">{card.type}</span>
      </div>
      <div className="relative mt-8 w-9 h-7 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-500 opacity-90" />
      <p className="relative font-mono text-lg tracking-widest mt-4">•••• •••• •••• {card.last4}</p>
      <div className="relative flex justify-between items-end mt-4">
        <div>
          <p className="text-[10px] uppercase opacity-60">Card holder</p>
          <p className="text-sm tracking-wide">{card.name}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase opacity-60">Expires</p>
          <p className="text-sm">{card.expiry}</p>
        </div>
        <span className="italic font-display text-xl capitalize">{card.brand}</span>
      </div>
    </motion.div>
  );
}

export default function Cards() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isDefaultUser = user?.accountNumber === (import.meta.env.VITE_ACCOUNT_NUMBER || '5320130');
  const [cards, setCards] = useState(() => (isDefaultUser ? cardsData : []));
  const [rotations, setRotations] = useState({});
  const [pinModal, setPinModal] = useState(null);

  useEffect(() => {
    setCards(isDefaultUser ? cardsData : []);
  }, [isDefaultUser]);

  const handleMove = (id) => (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
    const y = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    setRotations((r) => ({ ...r, [id]: { x, y } }));
  };
  const handleLeave = (id) => () => setRotations((r) => ({ ...r, [id]: { x: 0, y: 0 } }));

  const toggleFreeze = (id) => {
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, status: c.status === 'frozen' ? 'active' : 'frozen' } : c)));
  };

  return (
    <div>
      <PageHeader title={t('cards.title')} subtitle={t('cards.subtitle')} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cards.map((c, i) => {
          const frozen = c.status === 'frozen';
          return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card p-5 sm:p-6">
              <div className="max-w-sm mx-auto lg:mx-0">
                <CardVisual card={c} frozen={frozen} onMove={handleMove(c.id)} onLeave={handleLeave(c.id)} rotate={rotations[c.id]} />
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-navy-400">{t('cards.linkedAccount')}</span>
                  <span className="text-navy-800 dark:text-white font-medium">{c.linkedAccount}</span>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-navy-400">{t('cards.spentThisMonth')}</span>
                    <span className="font-tabular text-navy-800 dark:text-white font-medium">{formatMoney(c.spentMonthly)} / {formatMoney(c.limitMonthly)}</span>
                  </div>
                  <ProgressBar value={c.spentMonthly} max={c.limitMonthly} color={c.color === 'gold' ? '#c19a4f' : '#0B1F3A'} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-navy-400">{t('cards.dailyLimit')}</span>
                  <span className="font-tabular text-navy-800 dark:text-white">{formatMoney(c.limitDaily)}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-5">
                <button
                  onClick={() => toggleFreeze(c.id)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium border transition-colors ${frozen ? 'bg-navy-900 text-white border-navy-900 dark:bg-gold-500 dark:text-navy-900 dark:border-gold-500' : 'border-navy-200 dark:border-white/15 hover:bg-navy-50 dark:hover:bg-white/5'}`}
                >
                  <Snowflake size={16} /> {frozen ? t('cards.unfreeze') : t('cards.freeze')}
                </button>
                <button className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium border border-navy-200 dark:border-white/15 hover:bg-navy-50 dark:hover:bg-white/5">
                  <RefreshCcw size={16} /> {t('cards.replace')}
                </button>
                <button onClick={() => setPinModal(c)} className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium border border-navy-200 dark:border-white/15 hover:bg-navy-50 dark:hover:bg-white/5">
                  <KeyRound size={16} /> {t('cards.pin')}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {pinModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setPinModal(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-navy-800 rounded-2xl p-6 w-full max-w-xs shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal size={16} className="text-gold-600" />
              <h3 className="font-display text-lg text-navy-900 dark:text-white">{t('cards.pin')}</h3>
            </div>
            <div className="flex gap-2 justify-center mb-5">
              {[0, 1, 2, 3].map((i) => <div key={i} className="w-10 h-12 rounded-lg bg-navy-50 dark:bg-white/5 border border-navy-200 dark:border-white/15" />)}
            </div>
            <button onClick={() => setPinModal(null)} className="w-full py-2.5 rounded-xl bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 text-sm font-semibold">
              {t('cards.changePin')}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
