import { PageHeader } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, ShieldAlert, LogOut, Key } from 'lucide-react';

export default function AdminSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLockConsole = () => {
    sessionStorage.removeItem('isAdminSecondAuthPassed');
    navigate('/dashboard');
  };

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Admin Settings"
        subtitle="Configure restricted settings and monitor system variables."
      />

      <div className="card p-5 sm:p-7 space-y-6">
        <h3 className="font-display font-semibold text-lg text-navy-900 dark:text-white border-b border-navy-100 dark:border-white/10 pb-3 flex items-center gap-2">
          <ShieldCheck size={20} className="text-gold-600" /> Administrator Profile
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-navy-400 mb-1.5 uppercase">Admin Email</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-navy-100 dark:border-white/10 text-sm font-medium">
              <Mail size={16} className="text-navy-400 shrink-0" />
              <span className="text-navy-800 dark:text-white truncate">
                {import.meta.env.VITE_ADMIN_EMAIL || 'marina.wishart@apexexchangebank.com'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-400 mb-1.5 uppercase">Checking Account Number</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-navy-100 dark:border-white/10 text-sm font-medium">
              <Key size={16} className="text-navy-400 shrink-0" />
              <span className="text-navy-800 dark:text-white font-mono">
                DE{import.meta.env.VITE_ACCOUNT_NUMBER || '5320130'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5 sm:p-7 space-y-6">
        <h3 className="font-display font-semibold text-lg text-navy-900 dark:text-white border-b border-navy-100 dark:border-white/10 pb-3 flex items-center gap-2">
          <ShieldAlert size={20} className="text-neg" /> Console Access Security
        </h3>

        <p className="text-sm text-navy-400 leading-relaxed">
          The administrator dashboard has a second layer of authentication. To protect the console when stepping away, lock the active session immediately. This clears the session validation.
        </p>

        <button
          onClick={handleLockConsole}
          className="px-5 py-3 rounded-xl bg-neg text-white font-semibold text-sm hover:brightness-110 flex items-center justify-center gap-2 transition"
        >
          <LogOut size={16} />
          Lock Admin Console Session
        </button>
      </div>
    </div>
  );
}
