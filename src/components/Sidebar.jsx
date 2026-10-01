import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Wallet, ArrowLeftRight, Send, Receipt, CreditCard,
  PiggyBank, TrendingUp, Landmark, PieChart, BarChart3, Bell,
  MessageSquare, FileText, LifeBuoy, Settings, User, LogOut,
  ChevronsLeft, ChevronsRight, ShieldCheck,
} from 'lucide-react';
import accounts from '../data/accounts.json';
import { formatMoney } from './common';
import { useAuth } from '../hooks/useAuth';
import { useBanking } from '../context/BankingContext';

const items = [
  { to: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { to: '/accounts', icon: Wallet, key: 'accounts' },
  { to: '/transactions', icon: ArrowLeftRight, key: 'transactions' },
  { to: '/transfer', icon: Send, key: 'transfer' },
  { to: '/payments', icon: Receipt, key: 'payments' },
  { to: '/cards', icon: CreditCard, key: 'cards' },
  { to: '/savings', icon: PiggyBank, key: 'savings' },
  { to: '/investments', icon: TrendingUp, key: 'investments' },
  { to: '/loans', icon: Landmark, key: 'loans' },
  { to: '/budget', icon: PieChart, key: 'budget' },
  { to: '/analytics', icon: BarChart3, key: 'analytics' },
  { to: '/notifications', icon: Bell, key: 'notifications' },
  { to: '/messages', icon: MessageSquare, key: 'messages' },
  { to: '/documents', icon: FileText, key: 'documents' },
  { to: '/support', icon: LifeBuoy, key: 'support' },
  { to: '/settings', icon: Settings, key: 'settings' },
  { to: '/profile', icon: User, key: 'profile' },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { balance } = useBanking();
  const checking = accounts.find((account) => account.type === 'checking');
  const checkingCurrency = checking?.currency || 'USD';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user ? `${user.firstName[0] || ''}${user.lastName[0] || ''}`.toUpperCase() : 'MW';

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'marina.wishart@apexexchangebank.com';
  const isAdmin = user && user.email === adminEmail;

  const menuItems = [...items];
  // Admin pages remain protected by route-level auth, but the primary sidebar link is hidden.

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed lg:sticky top-0 z-40 h-screen bg-navy-900 text-navy-100 flex flex-col
        transition-all duration-300 ease-out
        ${collapsed ? 'w-[76px]' : 'w-[260px]'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center gap-3 h-[72px] px-5 border-b border-white/10 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} className="text-navy-900" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <span className="font-display text-lg tracking-tight text-white truncate">
              {t('bankName')}
            </span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map(({ to, icon: Icon, key, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors focus-ring ${
                  isActive
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-navy-200 hover:bg-white/5 hover:text-white'
                }`
              }
              title={collapsed ? (label || t(`nav.${key}`)) : undefined}
            >
              <Icon size={19} strokeWidth={1.8} className="shrink-0" />
              {!collapsed && <span className="truncate">{label || t(`nav.${key}`)}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-2">
          {/* User profile section */}
          {user && (
            <div className="mb-2">
              {collapsed ? (
                <div className="flex justify-center py-1">
                  {user.profilePictureUrl ? (
                    <img src={user.profilePictureUrl} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-white/10" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-navy-600 to-navy-950 flex items-center justify-center text-white text-xs font-semibold border border-white/10">
                      {initials}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/10">
                  {user.profilePictureUrl ? (
                    <img src={user.profilePictureUrl} alt="Avatar" className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-navy-600 to-navy-950 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{user.firstName} {user.lastName}</p>
                    <p className="text-[10px] text-navy-300 truncate">ID: {user.customerId}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!collapsed && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[11px] uppercase tracking-[0.24em] text-navy-300">Available balance</p>
              <p className="mt-2 text-lg font-semibold text-white">{formatMoney(balance, checkingCurrency)}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-navy-200 hover:bg-white/5 hover:text-white transition-colors focus-ring"
          >
            <LogOut size={19} strokeWidth={1.8} />
            {!collapsed && <span>{t('nav.logout')}</span>}
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden lg:flex w-full items-center gap-3 px-3 py-2 rounded-xl text-xs text-navy-400 hover:bg-white/5 hover:text-white transition-colors focus-ring"
          >
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
