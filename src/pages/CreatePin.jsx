import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function CreatePin() {
  const { updateProfile } = useAuth();
  const navigate = useNavigate();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (pin.length !== 6 || isNaN(Number(pin))) {
      setError('PIN must be exactly 6 digits.');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({ transferPin: pin });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to save Transfer PIN.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 p-4 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(193,154,79,0.08),transparent_60%)] pointer-events-none" />
      <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-gold-500/5 blur-3xl pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-navy-500/5 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 text-white shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gold-500/10 flex items-center justify-center mb-4 border border-gold-500/20">
            <ShieldCheck className="text-gold-500" size={32} />
          </div>
          <h2 className="text-2xl font-display font-semibold tracking-tight text-center">
            Create Transfer PIN
          </h2>
          <p className="text-sm text-navy-200 mt-2 text-center max-w-xs">
            To secure your account, choose a secure 6-digit PIN to authorize banking transactions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-navy-200 mb-1.5">
              Enter 6-Digit PIN
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300" />
              <input
                type={showPin ? 'text' : 'password'}
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ''));
                  if (error) setError('');
                }}
                placeholder="••••••"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-navy-300 focus:border-gold-500 outline-none transition-colors focus-ring text-sm tracking-widest font-semibold"
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy-300 hover:text-white"
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-navy-200 mb-1.5">
              Confirm 6-Digit PIN
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300" />
              <input
                type={showPin ? 'text' : 'password'}
                maxLength={6}
                value={confirmPin}
                onChange={(e) => {
                  setConfirmPin(e.target.value.replace(/\D/g, ''));
                  if (error) setError('');
                }}
                placeholder="••••••"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-navy-300 focus:border-gold-500 outline-none transition-colors focus-ring text-sm tracking-widest font-semibold"
                required
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900 font-semibold text-sm shadow-lg hover:brightness-105 transition focus-ring disabled:opacity-50"
          >
            {isSubmitting ? 'Saving PIN...' : 'Save & Continue'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
