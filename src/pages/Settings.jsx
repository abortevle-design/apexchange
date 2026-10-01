import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Moon, Bell, ShieldCheck, Accessibility, Lock, User, Phone, Mail, MapPin, Trash2, Upload } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { PageHeader } from '../components/common';
import { useAuth } from '../hooks/useAuth';
import { updateEmail } from 'firebase/auth';
import { auth } from '../firebase/firebase';

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 focus-ring ${checked ? 'bg-navy-900 dark:bg-gold-500' : 'bg-navy-200 dark:bg-white/15'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-navy-50 dark:border-white/5 last:border-0">
      <span className="text-sm text-navy-700 dark:text-navy-100">{label}</span>
      {children}
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={17} className="text-gold-600" />
        <h3 className="font-display text-lg text-navy-900 dark:text-white">{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, updateProfile, updateProfilePicture, deleteProfilePicture, changePassword } = useAuth();

  const fileInputRef = useRef(null);

  // Profile fields state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');

  // Notifications preferences
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);

  // Security preferences
  const [twoFa, setTwoFa] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [largerText, setLargerText] = useState(false);
  const [dataSharing, setDataSharing] = useState(false);

  // Password change state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  // Transfer PIN change state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isPicLoading, setIsPicLoading] = useState(false);

  // Load initial settings
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhoneNumber(user.phoneNumber || '');
      setEmail(user.email || '');
      setAddress(user.address || '');
      setCountry(user.country || '');

      if (user.notificationPreferences) {
        setEmailNotif(user.notificationPreferences.email ?? true);
        setPushNotif(user.notificationPreferences.push ?? true);
        setSmsNotif(user.notificationPreferences.sms ?? false);
      }
    }
  }, [user]);

  const changeLang = (lng) => {
    i18n.changeLanguage(lng);
    updateProfile({ preferredLanguage: lng }).catch(console.error);
  };

  const handlePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsPicLoading(true);
    try {
      await updateProfilePicture(file);
    } catch (err) {
      alert(err.message || 'Failed to upload profile picture.');
    } finally {
      setIsPicLoading(false);
    }
  };

  const handlePicDelete = async () => {
    setIsPicLoading(true);
    try {
      await deleteProfilePicture();
    } catch (err) {
      alert(err.message || 'Failed to remove profile picture.');
    } finally {
      setIsPicLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        firstName,
        lastName,
        phoneNumber,
        email,
        address,
        country,
        notificationPreferences: {
          email: emailNotif,
          push: pushNotif,
          sms: smsNotif
        }
      });

      if (email !== user.email && auth.currentUser) {
        await updateEmail(auth.currentUser, email);
      }

      alert('Settings saved successfully.');
    } catch (err) {
      alert(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (!currentPw || !newPw) {
      setPwError('Please fill in both password fields.');
      return;
    }
    try {
      await changePassword(currentPw, newPw);
      setPwSuccess('Password changed successfully.');
      setCurrentPw('');
      setNewPw('');
    } catch (err) {
      setPwError(err.message || 'Failed to change password. Make sure current password is correct.');
    }
  };

  const handlePinChange = async (e) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');
    
    if (!currentPin || !newPin || !confirmNewPin) {
      setPinError('Please fill in all PIN fields.');
      return;
    }
    if (newPin.length !== 6 || isNaN(Number(newPin))) {
      setPinError('New PIN must be a 6-digit number.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setPinError('New PINs do not match.');
      return;
    }
    if (String(currentPin) !== String(user.transferPin)) {
      setPinError('Current Transfer PIN is incorrect.');
      return;
    }
    try {
      await updateProfile({ transferPin: newPin });
      setPinSuccess('Transfer PIN updated successfully.');
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
    } catch (err) {
      setPinError(err.message || 'Failed to update Transfer PIN.');
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      {/* Change Profile Picture */}
      <Section icon={User} title="Profile Picture">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            {user?.profilePictureUrl ? (
              <img src={user.profilePictureUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-navy-200 dark:border-white/10" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-navy-600 to-navy-900 flex items-center justify-center text-white text-3xl font-semibold border-2 border-navy-200 dark:border-white/10">
                {`${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()}
              </div>
            )}
            {isPicLoading && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white text-xs">
                Loading...
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 text-sm font-medium hover:brightness-110 transition"
            >
              <Upload size={14} /> Change Profile Picture
            </button>
            {user?.profilePictureUrl && (
              <button
                onClick={handlePicDelete}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-500/10 transition"
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePicUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>
      </Section>

      {/* Personal Details */}
      <Section icon={User} title="Personal Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <div>
            <label className="block text-xs font-medium text-navy-400 mb-1.5">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-navy-400 mb-1.5">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-navy-400 mb-1.5">Phone Number</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-navy-400 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-navy-400 mb-1.5">Residential Address</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-navy-400 mb-1.5">Country</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring"
            />
          </div>
        </div>
      </Section>

      <Section icon={Globe} title={t('settings.language')}>
        <div className="flex flex-wrap gap-2 mt-2">
          <button onClick={() => changeLang('en')} className={`px-4 py-2 rounded-xl text-sm font-medium border ${i18n.language === 'en' ? 'bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 border-transparent' : 'border-navy-200 dark:border-white/15'}`}>🇬🇧 English</button>
          <button onClick={() => changeLang('de')} className={`px-4 py-2 rounded-xl text-sm font-medium border ${i18n.language === 'de' ? 'bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 border-transparent' : 'border-navy-200 dark:border-white/15'}`}>🇩🇪 Deutsch</button>
          <button onClick={() => changeLang('fr')} className={`px-4 py-2 rounded-xl text-sm font-medium border ${i18n.language === 'fr' ? 'bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 border-transparent' : 'border-navy-200 dark:border-white/15'}`}>🇫🇷 Français</button>
          <button onClick={() => changeLang('nl')} className={`px-4 py-2 rounded-xl text-sm font-medium border ${i18n.language === 'nl' ? 'bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 border-transparent' : 'border-navy-200 dark:border-white/15'}`}>🇳🇱 Nederlands</button>
          <button onClick={() => changeLang('pt')} className={`px-4 py-2 rounded-xl text-sm font-medium border ${i18n.language === 'pt' ? 'bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 border-transparent' : 'border-navy-200 dark:border-white/15'}`}>🇵🇹 Português</button>
          <button onClick={() => changeLang('es')} className={`px-4 py-2 rounded-xl text-sm font-medium border ${i18n.language === 'es' ? 'bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 border-transparent' : 'border-navy-200 dark:border-white/15'}`}>🇪🇸 Español</button>
        </div>
      </Section>

      <Section icon={Moon} title={t('settings.theme')}>
        <div className="flex gap-2 mt-2">
          <button onClick={() => setTheme('light')} className={`px-4 py-2 rounded-xl text-sm font-medium border ${theme === 'light' ? 'bg-navy-900 text-white border-transparent' : 'border-navy-200 dark:border-white/15'}`}>{t('settings.light')}</button>
          <button onClick={() => setTheme('dark')} className={`px-4 py-2 rounded-xl text-sm font-medium border ${theme === 'dark' ? 'bg-gold-500 text-navy-900 border-transparent' : 'border-navy-200 dark:border-white/15'}`}>{t('settings.dark')}</button>
        </div>
      </Section>

      <Section icon={Bell} title={t('settings.notificationsSection')}>
        <Row label={t('settings.emailNotifications')}><Toggle checked={emailNotif} onChange={setEmailNotif} /></Row>
        <Row label={t('settings.pushNotifications')}><Toggle checked={pushNotif} onChange={setPushNotif} /></Row>
        <Row label={t('settings.smsNotifications')}><Toggle checked={smsNotif} onChange={setSmsNotif} /></Row>
      </Section>

      <Section icon={ShieldCheck} title={t('settings.security')}>
        <Row label={t('settings.twoFactor')}><Toggle checked={twoFa} onChange={setTwoFa} /></Row>
        <Row label="Change Account Password">
          <form onSubmit={handlePasswordChange} className="w-full sm:max-w-md space-y-3 mt-3">
            <input
              type="password"
              placeholder="Current Password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring"
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring"
            />
            {pwError && <p className="text-xs text-red-600">{pwError}</p>}
            {pwSuccess && <p className="text-xs text-pos">{pwSuccess}</p>}
            <button
              type="submit"
              className="flex items-center gap-1 text-sm font-medium text-gold-600 hover:text-gold-500 mt-1"
            >
              <Lock size={13} /> Update Password
            </button>
          </form>
        </Row>
        <Row label="Change Transfer PIN">
          <form onSubmit={handlePinChange} className="w-full sm:max-w-md space-y-3 mt-3">
            <input
              type="password"
              maxLength={6}
              placeholder="Current 6-digit PIN"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring font-semibold tracking-widest"
            />
            <input
              type="password"
              maxLength={6}
              placeholder="New 6-digit PIN"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring font-semibold tracking-widest"
            />
            <input
              type="password"
              maxLength={6}
              placeholder="Confirm New 6-digit PIN"
              value={confirmNewPin}
              onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring font-semibold tracking-widest"
            />
            {pinError && <p className="text-xs text-red-600">{pinError}</p>}
            {pinSuccess && <p className="text-xs text-pos">{pinSuccess}</p>}
            <button
              type="submit"
              className="flex items-center gap-1 text-sm font-medium text-gold-600 hover:text-gold-500 mt-1"
            >
              <Lock size={13} /> Update Transfer PIN
            </button>
          </form>
        </Row>
      </Section>

      <Section icon={Accessibility} title={t('settings.accessibility')}>
        <Row label={t('settings.reduceMotion')}><Toggle checked={reduceMotion} onChange={setReduceMotion} /></Row>
        <Row label={t('settings.largerText')}><Toggle checked={largerText} onChange={setLargerText} /></Row>
      </Section>

      <Section icon={ShieldCheck} title={t('settings.privacy')}>
        <Row label={t('settings.dataSharing')}><Toggle checked={dataSharing} onChange={setDataSharing} /></Row>
      </Section>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="px-6 py-3 rounded-xl bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 font-semibold text-sm hover:brightness-110 disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : t('settings.save')}
      </button>
    </div>
  );
}
