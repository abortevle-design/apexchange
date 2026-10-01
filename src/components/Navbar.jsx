import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Sun, Moon, Menu, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function Navbar({ onMenuClick }) {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [langOpen, setLangOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync unread notifications count in real-time
  useEffect(() => {
    if (!user?.uid) {
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, `users/${user.uid}/notifications`),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const changeLang = (lng) => {
    i18n.changeLanguage(lng);
    setLangOpen(false);
  };

  const fullName = user ? `${user.firstName} ${user.lastName}` : '';
  const initials = user ? `${user.firstName[0] || ''}${user.lastName[0] || ''}`.toUpperCase() : 'MW';

  return (
    <header className="sticky top-0 z-20 h-[72px] bg-white/80 dark:bg-navy-900/80 backdrop-blur-md border-b border-navy-100 dark:border-white/10 flex items-center gap-3 px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-navy-50 dark:hover:bg-white/5 focus-ring"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 max-w-md relative hidden sm:block">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300" />
        <input
          type="text"
          placeholder={t('topbar.search')}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 focus:bg-white dark:focus:bg-navy-800 text-sm placeholder:text-navy-300 outline-none transition-colors focus-ring"
        />
      </div>

      <div className="flex-1 sm:hidden" />

      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="relative">
          <button
            onClick={() => setLangOpen((o) => !o)}
            className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-sm font-medium hover:bg-navy-50 dark:hover:bg-white/5 focus-ring"
          >
            {i18n.language === 'de' ? '🇩🇪' : i18n.language === 'fr' ? '🇫🇷' : i18n.language === 'nl' ? '🇳🇱' : i18n.language === 'pt' ? '🇵🇹' : i18n.language === 'es' ? '🇪🇸' : '🇬🇧'}
            <span className="hidden sm:inline uppercase text-xs text-navy-400">{i18n.language}</span>
            <ChevronDown size={14} />
          </button>
          {langOpen && (
            <div className="absolute right-0 mt-2 w-36 card p-1 z-30">
              <button onClick={() => changeLang('en')} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-navy-50 dark:hover:bg-white/5 flex items-center gap-2">
                🇬🇧 English
              </button>
              <button onClick={() => changeLang('de')} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-navy-50 dark:hover:bg-white/5 flex items-center gap-2">
                🇩🇪 Deutsch
              </button>
              <button onClick={() => changeLang('fr')} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-navy-50 dark:hover:bg-white/5 flex items-center gap-2">
                🇫🇷 Français
              </button>
              <button onClick={() => changeLang('nl')} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-navy-50 dark:hover:bg-white/5 flex items-center gap-2">
                🇳🇱 Nederlands
              </button>
              <button onClick={() => changeLang('pt')} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-navy-50 dark:hover:bg-white/5 flex items-center gap-2">
                🇵🇹 Português
              </button>
              <button onClick={() => changeLang('es')} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-navy-50 dark:hover:bg-white/5 flex items-center gap-2">
                🇪🇸 Español
              </button>
            </div>
          )}
        </div>

        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-lg hover:bg-navy-50 dark:hover:bg-white/5 focus-ring"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2.5 rounded-lg hover:bg-navy-50 dark:hover:bg-white/5 focus-ring"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-neg" />
          )}
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-navy-50 dark:hover:bg-white/5 focus-ring"
        >
          {user?.profilePictureUrl ? (
            <img src={user.profilePictureUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-600 to-navy-900 flex items-center justify-center text-white text-xs font-semibold">
              {initials}
            </div>
          )}
          <div className="hidden md:block text-left">
            <p className="text-xs font-medium leading-tight">{fullName || t('topbar.profile')}</p>
            <p className="text-[11px] text-navy-400 leading-tight">{user ? `Customer #${user.accountNumber}` : t('topbar.profileSub')}</p>
          </div>
        </button>
      </div>
    </header>
  );
}
