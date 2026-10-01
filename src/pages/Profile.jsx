import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Calendar, MapPin, Phone, Globe, Save, X } from 'lucide-react';
import { PageHeader } from '../components/common';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { t } = useTranslation();
  const { user, updateProfile, updateProfilePicture, deleteProfilePicture } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [isSaving, setIsSaving] = useState(false);
  const [isPicLoading, setIsPicLoading] = useState(false);

  const fileInputRef = useRef(null);

  // Sync state with user profile
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setDob(user.dob || '');
      setAddress(user.address || '');
      setPhoneNumber(user.phoneNumber || user.phone || '');
      setCountry(user.country || '');
      setPreferredLanguage(user.preferredLanguage || 'en');
    }
  }, [user]);

  const fullName = user ? `${user.firstName} ${user.lastName}` : '';
  const initials = user ? `${user.firstName[0] || ''}${user.lastName[0] || ''}`.toUpperCase() : '';

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        firstName,
        lastName,
        dob,
        address,
        phoneNumber,
        country,
        preferredLanguage
      });
      setIsEditing(false);
      alert('Profile updated successfully.');
    } catch (err) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
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

  const fields = [
    [t('profile.fullName'), fullName],
    [t('profile.dob'), user?.dob || ''],
    [t('profile.address'), user?.address || ''],
    [t('profile.phone'), user?.phoneNumber || user?.phone || ''],
    [t('profile.nationality'), user?.country || ''],
    [t('profile.occupation'), 'Private Customer'],
    [t('profile.language'), user?.preferredLanguage === 'de' ? 'Deutsch' : user?.preferredLanguage === 'fr' ? 'Français' : user?.preferredLanguage === 'nl' ? 'Nederlands' : user?.preferredLanguage === 'pt' ? 'Português' : user?.preferredLanguage === 'es' ? 'Español' : 'English'],
    [t('profile.customerSince'), user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : ''],
  ];

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={t('profile.title')}
        subtitle={t('profile.subtitle')}
        action={
          isEditing ? (
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-navy-200 dark:border-white/15 text-sm font-medium hover:bg-navy-50 dark:hover:bg-white/5 transition"
            >
              <X size={14} /> {t('common.cancel')}
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-navy-200 dark:border-white/15 text-sm font-medium hover:bg-navy-50 dark:hover:bg-white/5 transition"
            >
              <Pencil size={14} /> {t('profile.edit')}
            </button>
          )
        }
      />

      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative shrink-0">
            {user?.profilePictureUrl ? (
              <img src={user.profilePictureUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-navy-200 dark:border-white/10" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-navy-600 to-navy-900 flex items-center justify-center text-white text-2xl font-semibold">
                {initials}
              </div>
            )}
            {isPicLoading && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white text-[10px]">
                Loading...
              </div>
            )}
            {isEditing && (
              <div className="absolute -bottom-1 -right-1 flex gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-full bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 hover:brightness-110 shadow-lg transition"
                  title="Upload Photo"
                >
                  <Pencil size={12} />
                </button>
                {user?.profilePictureUrl && (
                  <button
                    type="button"
                    onClick={handlePicDelete}
                    className="p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-lg transition"
                    title="Delete Photo"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePicUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div>
            <p className="font-display text-xl text-navy-900 dark:text-white">{fullName}</p>
            <p className="text-sm text-navy-400">{t('topbar.profileSub')} · #{user?.customerId || ''}</p>
          </div>
        </div>

        <h3 className="font-display text-lg text-navy-900 dark:text-white mb-4">
          {isEditing ? 'Edit Personal Details' : t('profile.personalDetails')}
        </h3>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-navy-400 mb-1.5">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring text-navy-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-400 mb-1.5">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring text-navy-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-navy-400 mb-1.5">{t('profile.dob')}</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring text-navy-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-navy-400 mb-1.5">{t('profile.address')}</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring text-navy-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-navy-400 mb-1.5">{t('profile.phone')}</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring text-navy-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-navy-400 mb-1.5">{t('profile.nationality')}</label>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring text-navy-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-navy-400 mb-1.5">{t('profile.language')}</label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring text-navy-900 dark:text-white"
              >
                <option value="en">🇬🇧 English</option>
                <option value="de">🇩🇪 Deutsch</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="nl">🇳🇱 Nederlands</option>
                <option value="pt">🇵🇹 Português</option>
                <option value="es">🇪🇸 Español</option>
              </select>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 text-sm font-semibold hover:brightness-110 disabled:opacity-50 transition"
              >
                <Save size={15} /> {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 rounded-xl border border-navy-200 dark:border-white/15 text-navy-800 dark:text-white text-sm font-semibold hover:bg-navy-50 dark:hover:bg-white/5 transition"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        ) : (
          <div className="divide-y divide-navy-50 dark:divide-white/5">
            {fields.map(([label, value]) => (
              <div key={label} className="flex justify-between py-3 text-sm">
                <span className="text-navy-400">{label}</span>
                <span className="text-navy-800 dark:text-white font-medium text-right">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
