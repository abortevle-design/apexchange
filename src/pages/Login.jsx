import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, User, Eye, EyeOff, ChevronDown, ShieldAlert, Mail, Phone, MapPin, Calendar, Globe, Upload } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';

const DEFAULT_BACKGROUND_IMAGE = '/bankimage.jpg';

export default function Login() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated, login, register, sendPasswordReset } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [bgOpen, setBgOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customBg, setCustomBg] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Registration form states
  const [isRegistering, setIsRegistering] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePic, setProfilePic] = useState(null);

  const changeLang = (lng) => {
    i18n.changeLanguage(lng);
    setLangOpen(false);
  };

  const handleBgChange = (url) => {
    setCustomBg(url);
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const backgroundImage = useMemo(() => {
    if (customBg && /^https?:\/\//i.test(customBg.trim())) {
      return customBg.trim();
    }
    return DEFAULT_BACKGROUND_IMAGE;
  }, [customBg]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setResetSuccess('');

    if (isForgotPassword) {
      if (!resetEmail.trim()) {
        setError('Please enter your email address.');
        setIsSubmitting(false);
        return;
      }
      try {
        await sendPasswordReset(resetEmail.trim());
        setResetSuccess('A password reset link has been sent to your email.');
        setResetEmail('');
      } catch (e) {
        setError(e.message || 'Failed to send password reset email.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (isRegistering) {
      // Registration flow
      if (
        !firstName.trim() ||
        !lastName.trim() ||
        !email.trim() ||
        !phoneNumber.trim() ||
        !country.trim() ||
        !address.trim() ||
        !dob ||
        !regPassword ||
        !confirmPassword
      ) {
        setError('Please fill in all fields.');
        setIsSubmitting(false);
        return;
      }

      if (regPassword !== confirmPassword) {
        setError(t('login.pwMismatch', 'Passwords do not match.'));
        setIsSubmitting(false);
        return;
      }

      try {
        await register(
          {
            firstName,
            lastName,
            email,
            phoneNumber,
            country,
            address,
            dob,
            password: regPassword,
            preferredLanguage: i18n.language || 'en'
          },
          profilePic
        );
        // Successful registration will trigger onAuthStateChanged -> navigate dashboard
      } catch (e) {
        setError(e.message || 'Registration failed. Please check your inputs.');
      }
    } else {
      // Login flow
      if (!loginEmail.trim() || !password) {
        setError(t('login.invalidCredentials'));
        setIsSubmitting(false);
        return;
      }

      try {
        await login(loginEmail.trim(), password);
        navigate('/dashboard', { replace: true });
      } catch (e) {
        setError(e.message || t('login.invalidCredentials'));
      }
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-navy-900 flex items-center justify-center px-4 py-10">
      {/* Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(2, 10, 25, 0.95) 0%, rgba(10, 21, 38, 0.85) 45%, rgba(17, 35, 58, 0.78) 100%), url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <motion.div
          className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full bg-gold-500/10 blur-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -left-32 w-[420px] h-[420px] rounded-full bg-navy-400/20 blur-3xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Top bar */}
      <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
        <div className="relative">
          {bgOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-navy-800 rounded-xl shadow-card p-3 z-30 text-slate-800 dark:text-white border border-slate-100 dark:border-navy-700">
              <label className="block text-xs font-semibold mb-1.5 text-navy-900 dark:text-white">Background Image URL</label>
              <input
                type="text"
                value={customBg}
                onChange={(e) => handleBgChange(e.target.value)}
                placeholder="Paste any image URL..."
                className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-navy-400 focus:border-gold-500 outline-none"
              />
              {customBg && (
                <button
                  onClick={() => handleBgChange('')}
                  className="mt-2 w-full py-1 text-center rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors"
                >
                  Reset to Default
                </button>
              )}
            </div>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => {
              setLangOpen((o) => !o);
              setBgOpen(false);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white/90 glass focus-ring"
          >
            {i18n.language === 'de' ? '🇩🇪 DE' : i18n.language === 'fr' ? '🇫🇷 FR' : i18n.language === 'nl' ? '🇳🇱 NL' : i18n.language === 'pt' ? '🇵🇹 PT' : i18n.language === 'es' ? '🇪🇸 ES' : '🇬🇧 EN'} <ChevronDown size={14} />
          </button>
          {langOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-navy-800 rounded-xl shadow-card p-1 z-30">
              <button onClick={() => changeLang('en')} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-navy-50 dark:hover:bg-white/5">🇬🇧 English</button>
              <button onClick={() => changeLang('de')} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-navy-50 dark:hover:bg-white/5">🇩🇪 Deutsch</button>
              <button onClick={() => changeLang('fr')} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-navy-50 dark:hover:bg-white/5">🇫🇷 Français</button>
              <button onClick={() => changeLang('nl')} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-navy-50 dark:hover:bg-white/5">🇳🇱 Nederlands</button>
              <button onClick={() => changeLang('pt')} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-navy-50 dark:hover:bg-white/5">🇵🇹 Português</button>
              <button onClick={() => changeLang('es')} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-navy-50 dark:hover:bg-white/5">🇪🇸 Español</button>
            </div>
          )}
        </div>
        <button onClick={toggleTheme} className="px-3 py-2 rounded-lg text-sm text-white/90 glass focus-ring">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 gap-10 items-center">
        {/* Brand side */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:block text-white pl-4"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <ShieldCheck size={24} className="text-navy-900" strokeWidth={2.5} />
            </div>
            <span className="font-display text-2xl tracking-tight">{t('bankName')}</span>
          </div>
          <h1 className="font-display text-4xl xl:text-5xl leading-tight mb-4">
            {isRegistering ? t('login.signUpTitle', 'Create an Account') : t('login.welcome')}
          </h1>
          <p className="text-navy-200 text-lg max-w-md">{t('bankTagline')}</p>

          <div className="mt-12 flex items-center gap-8 text-navy-300 text-sm">
            <div>
              <p className="font-display text-2xl text-white">2.4M+</p>
              <p>Customers</p>
            </div>
            <div className="w-px h-10 bg-white/15" />
            <div>
              <p className="font-display text-2xl text-white">128-bit</p>
              <p>Encryption</p>
            </div>
            <div className="w-px h-10 bg-white/15" />
            <div>
              <p className="font-display text-2xl text-white">24/7</p>
              <p>Support</p>
            </div>
          </div>
        </motion.div>

        {/* Login / Register Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`glass rounded-2xl p-7 sm:p-9 w-full shadow-glass mx-auto ${isRegistering ? 'max-w-2xl' : 'max-w-md'}`}
        >
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <ShieldCheck size={18} className="text-navy-900" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl text-white">{t('bankName')}</span>
          </div>

          <h2 className="font-display text-2xl text-white mb-1">
            {isRegistering ? t('login.signUpTitle', 'Create an Account') : t('login.welcome')}
          </h2>
          <p className="text-navy-200 text-sm mb-6">
            {isRegistering ? t('login.signUpSubtitle', 'Get started with your private banking experience.') : t('login.subtitle')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isForgotPassword ? (
              // Forgot Password Fields
              <div>
                <label className="block text-xs font-medium text-navy-200 mb-1.5">{t('login.email', 'Email Address')}</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(event) => {
                      setResetEmail(event.target.value);
                      if (error) setError('');
                    }}
                    placeholder="e.g. name@domain.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-navy-300 focus:border-gold-500 outline-none transition-colors focus-ring text-sm"
                    required
                  />
                </div>
              </div>
            ) : isRegistering ? (
              // Register Fields
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-navy-200 mb-1.5">First name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Sandra"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-navy-300 focus:border-gold-500 outline-none transition-colors focus-ring text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-200 mb-1.5">Last name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Bullock"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-navy-300 focus:border-gold-500 outline-none transition-colors focus-ring text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-navy-200 mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@domain.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-navy-300 focus:border-gold-500 outline-none transition-colors focus-ring text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-navy-200 mb-1.5">Phone number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +49 155 103 41979"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-navy-300 focus:border-gold-500 outline-none transition-colors focus-ring text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-navy-200 mb-1.5">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. Germany"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-navy-300 focus:border-gold-500 outline-none transition-colors focus-ring text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-200 mb-1.5">Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Lerchenstraße 110a"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-navy-300 focus:border-gold-500 outline-none transition-colors focus-ring text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-navy-200 mb-1.5">Date of birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-navy-300 focus:border-gold-500 outline-none transition-colors focus-ring text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-navy-200 mb-1.5">Profile Picture</label>
                  <div className="relative">
                    <Upload size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProfilePic(e.target.files[0])}
                      className="w-full pl-10 pr-4 py-2 text-xs text-navy-300 file:hidden cursor-pointer bg-white/10 border border-white/15 rounded-xl focus:border-gold-500 outline-none h-[42px] flex items-center"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-navy-300 pointer-events-none truncate max-w-[150px]">
                      {profilePic ? profilePic.name : 'Choose file...'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-navy-200 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-navy-300 focus:border-gold-500 outline-none transition-colors focus-ring text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-200 mb-1.5">Confirm password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-navy-300 focus:border-gold-500 outline-none transition-colors focus-ring text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Login Fields
              <>
                <div>
                  <label className="block text-xs font-medium text-navy-200 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(event) => {
                        setLoginEmail(event.target.value);
                        if (error) setError('');
                      }}
                      placeholder="e.g. name@domain.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-navy-300 focus:border-gold-500 outline-none transition-colors focus-ring text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-navy-200 mb-1.5">{t('login.password')}</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        if (error) setError('');
                      }}
                      placeholder={t('login.passwordPlaceholder')}
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-navy-300 focus:border-gold-500 outline-none transition-colors focus-ring text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy-300 hover:text-white"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {!isRegistering && !isForgotPassword && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-navy-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="rounded border-white/30 bg-white/10 accent-gold-500"
                  />
                  {t('login.rememberMe')}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError('');
                    setResetSuccess('');
                  }}
                  className="text-gold-400 hover:text-gold-300"
                >
                  {t('login.forgotPassword')}
                </button>
              </div>
            )}

            {resetSuccess ? (
              <div className="rounded-xl border border-green-400/40 bg-green-500/10 px-3 py-2 text-sm text-green-200">
                {resetSuccess}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900 font-semibold text-sm shadow-lg hover:brightness-105 transition focus-ring disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting
                ? (isForgotPassword ? t('login.resetting', 'Sending...') : isRegistering ? t('login.registering', 'Registering...') : t('login.loggingIn'))
                : (isForgotPassword ? t('login.resetBtn', 'Reset Password') : isRegistering ? t('login.registerBtn', 'Register securely') : t('login.loginButton'))}
            </motion.button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  if (isForgotPassword) {
                    setIsForgotPassword(false);
                  } else {
                    setIsRegistering(!isRegistering);
                  }
                  setError('');
                  setResetSuccess('');
                }}
                className="text-xs text-gold-400 hover:text-gold-300 font-medium transition"
              >
                {isForgotPassword
                  ? t('login.backToLogin', 'Back to login')
                  : isRegistering
                  ? t('login.alreadyHaveAccount', 'Already have an account? Sign in')
                  : t('login.dontHaveAccount', "Don't have an account? Sign up")}
              </button>
            </div>

            <p className="text-center text-xs text-navy-300">
              {t('login.contactSupport')}
            </p>
          </form>

          <div className="mt-6 flex gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10">
            <ShieldAlert size={16} className="text-gold-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-white">{t('login.securityTitle')}</p>
              <p className="text-xs text-navy-300 mt-0.5">{t('login.securityTip')}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <footer className="absolute bottom-4 left-0 right-0 text-center text-navy-400 text-xs flex flex-wrap justify-center gap-x-4 gap-y-1 px-4">
        <span>{t('login.footerRights')}</span>
        <button className="hover:text-white">{t('login.footerImprint')}</button>
        <button className="hover:text-white">{t('login.footerPrivacy')}</button>
        <button className="hover:text-white">{t('login.footerTerms')}</button>
      </footer>
    </div>
  );
}
