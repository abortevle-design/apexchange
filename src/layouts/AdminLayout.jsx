import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Bell,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';

const adminItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/pending-transfers', icon: Clock, label: 'Pending Transfers' },
  { to: '/admin/approved-transfers', icon: CheckCircle, label: 'Approved Transfers' },
  { to: '/admin/rejected-transfers', icon: XCircle, label: 'Rejected Transfers' },
  { to: '/admin/customers', icon: Users, label: 'Customers' },
  { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' }
];

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleExitAdmin = () => {
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user ? `${user.firstName[0] || ''}${user.lastName[0] || ''}`.toUpperCase() : 'AD';

  return (
    <div className="flex min-h-screen bg-[#F5F6F8] dark:bg-[#0A1526]">
      {/* Sidebar for Mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-30 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-[260px] bg-navy-900 z-40 flex flex-col text-white"
            >
              <div className="flex items-center justify-between h-[72px] px-5 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                    <ShieldCheck size={18} className="text-navy-900" strokeWidth={2.5} />
                  </div>
                  <span className="font-display font-bold tracking-tight text-white">Apex exchange bank Admin</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {adminItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${
                        isActive ? 'bg-gold-500 text-navy-950 font-semibold' : 'text-navy-200 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={19} strokeWidth={1.8} className="shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight size={14} className="opacity-50" />
                  </NavLink>
                ))}
              </nav>

              <div className="p-3 border-t border-white/10 space-y-2">
                <button
                  onClick={handleExitAdmin}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gold-400 border border-gold-500/30 bg-gold-500/5 hover:bg-gold-500/10 hover:text-gold-300 transition-all font-medium"
                >
                  <LogOut size={18} />
                  <span>Exit Admin Portal</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-navy-200 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <LogOut size={18} />
                  <span>Log out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex fixed top-0 bottom-0 left-0 w-[260px] bg-navy-900 text-navy-100 flex-col z-20">
        <div className="flex items-center gap-3 h-[72px] px-5 border-b border-white/10 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} className="text-navy-950" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-white tracking-tight">Apex exchange bank Admin</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {adminItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  isActive ? 'bg-gold-500 text-navy-950 font-semibold' : 'text-navy-200 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon size={19} strokeWidth={1.8} className="shrink-0" />
                <span>{item.label}</span>
              </div>
              <ChevronRight size={14} className="opacity-50" />
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-2">
          <button
            onClick={handleExitAdmin}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gold-400 border border-gold-500/20 bg-gold-500/5 hover:bg-gold-500/10 hover:text-gold-300 transition-all font-medium"
          >
            <LogOut size={18} />
            <span>Exit Admin Portal</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-navy-200 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="flex-1 lg:pl-[260px] min-w-0 flex flex-col">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 h-[72px] bg-white/80 dark:bg-navy-900/80 backdrop-blur-md border-b border-navy-100 dark:border-white/10 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-navy-50 dark:hover:bg-white/5 focus-ring text-navy-800 dark:text-white"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-semibold text-gold-600 bg-gold-500/15 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Restricted Admin Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg hover:bg-navy-50 dark:hover:bg-white/5 focus-ring text-navy-800 dark:text-white"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="flex items-center gap-2 pl-2 pr-1 py-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-navy-950 text-xs font-bold shrink-0 shadow-sm">
                {initials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold leading-tight text-navy-900 dark:text-white">Admin Console</p>
                <p className="text-[10px] text-navy-400 leading-tight">System Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 p-4 lg:p-8 max-w-[1600px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
