import { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { EmailAuthProvider, reauthenticateWithCredential, signInWithEmailAndPassword } from 'firebase/auth';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Eye, EyeOff, ShieldAlert, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../firebase/firebase';

const configuredAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'Sandrabullock@mail.com').toLowerCase();

function isAdmin(email) {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  return (
    lower === configuredAdminEmail ||
    lower === 'sandrabullock@mail.com' ||
    lower === 'marina.wishart@apexexchangebank.com'
  );
}

export default function AdminRoute() {
  const { isAuthenticated, user, loading } = useAuth();
  const [secondAuthPassed, setSecondAuthPassed] = useState(
    () => sessionStorage.getItem('isAdminSecondAuthPassed') === 'true'
  );

  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(() => {
    return user?.email || import.meta.env.VITE_ADMIN_EMAIL || 'Sandrabullock@mail.com';
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync email when user loads if not manually set
  useEffect(() => {
    if (user?.email && isAdmin(user.email)) {
      setEmail(user.email);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-navy-200">Verifying administrator credentials...</p>
        </div>
      </div>
    );
  }

  const isCurrentAdmin = Boolean(isAuthenticated && user?.email && isAdmin(user.email));

  // If already authenticated as admin and 2nd auth is passed, grant access directly
  if (isCurrentAdmin && secondAuthPassed) {
    return <Outlet />;
  }

  // Handle Admin Login or Second Auth Layer Verification
  const handleAdminAuth = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const targetEmail = (email.trim() || user?.email || '').trim();

    if (!targetEmail || !password) {
      setError('Please provide both administrator email and password.');
      setIsSubmitting(false);
      return;
    }

    if (!isAdmin(targetEmail)) {
      setError('Access denied: This email address does not have administrator privileges.');
      setIsSubmitting(false);
      return;
    }

    try {
      if (isCurrentAdmin && auth.currentUser) {
        // Re-authenticate current session
        try {
          const credential = EmailAuthProvider.credential(targetEmail, password);
          await reauthenticateWithCredential(auth.currentUser, credential);
        } catch {
          // Fallback to direct sign-in if reauthenticate credential token is stale
          await signInWithEmailAndPassword(auth, targetEmail, password);
        }
      } else {
        // Direct login to admin
        const cred = await signInWithEmailAndPassword(auth, targetEmail, password);
        if (!isAdmin(cred.user.email)) {
          throw new Error('Access denied: Authenticated user is not an administrator.');
        }
      }

      sessionStorage.setItem('isAdminSecondAuthPassed', 'true');
      setSecondAuthPassed(true);
    } catch (err) {
      console.error('Admin authentication error:', err);
      let message = 'Incorrect administrator credentials.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Invalid administrator credentials. Please check your password.';
      } else if (err.code === 'auth/user-not-found') {
        message = 'Administrator account not found in system records.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many failed login attempts. Please wait a few moments and try again.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-navy-950 flex items-center justify-center px-4 py-10 text-white">
      {/* Decorative Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(193, 154, 79, 0.08) 0%, transparent 60%)',
          }}
        />
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md bg-navy-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-glass text-center"
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20 mb-6">
          <ShieldCheck size={28} className="text-navy-950" strokeWidth={2.5} />
        </div>

        <h1 className="font-display text-2xl font-bold tracking-tight mb-2">
          {isCurrentAdmin ? 'Administrator Verification' : 'Administrator Portal Login'}
        </h1>
        <p className="text-navy-300 text-sm mb-8">
          {isCurrentAdmin
            ? 'Confirm your credentials to access the secure administrative control console.'
            : 'Enter your administrator credentials to securely log in to the management console.'}
        </p>

        <form onSubmit={handleAdminAuth} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-navy-200 mb-1.5 uppercase tracking-wider">
              Admin Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="admin@apexexchangebank.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-navy-950/50 border border-white/10 text-white placeholder:text-navy-500 focus:border-gold-500 outline-none transition-colors focus-ring text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-200 mb-1.5 uppercase tracking-wider">
              Admin Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter administrator password"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-navy-950/50 border border-white/10 text-white placeholder:text-navy-500 focus:border-gold-500 outline-none transition-colors focus-ring text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy-400 hover:text-white"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex gap-2 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-200 items-start">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:brightness-105 transition-all text-navy-950 font-bold text-sm shadow-lg shadow-gold-500/10 flex items-center justify-center gap-2 focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
                Authenticating...
              </>
            ) : isCurrentAdmin ? (
              'Verify & Access Dashboard'
            ) : (
              'Sign In to Admin Console'
            )}
          </button>

          <div className="text-center mt-4">
            <Link
              to="/dashboard"
              className="text-xs text-navy-400 hover:text-navy-200 transition-colors"
            >
              Return to Customer Banking Portal
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
