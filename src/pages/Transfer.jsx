import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Send, ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import beneficiariesData from '../data/beneficiaries.json';
import { PageHeader, formatMoney } from '../components/common';
import Modal from '../components/Modal';
import { useBanking } from '../context/BankingContext';
import { calculateTotalAmount } from '../services/transferService';
import { useAuth } from '../hooks/useAuth';
import { printReceipt } from '../utils/receipt';

const empty = { recipient: '', iban: '', bank: '', country: 'Germany', amount: '', currency: 'USD', reference: '', description: '', date: '', type: 'standard' };

export default function Transfer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDefaultUser = user?.accountNumber === (import.meta.env.VITE_ACCOUNT_NUMBER || '5320130');
  const beneficiaries = isDefaultUser ? beneficiariesData : [];
  const { balance, submitTransfer } = useBanking();
  const [form, setForm] = useState(empty);
  const [step, setStep] = useState('form');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pickBeneficiary = (b) => {
    setForm((f) => ({ ...f, recipient: b.name, iban: b.iban, bank: b.bank }));
  };

  const transferFee = useMemo(() => calculateTotalAmount(form.amount || 0) - Number(form.amount || 0), [form.amount]);
  const totalAmount = useMemo(() => calculateTotalAmount(form.amount || 0), [form.amount]);

  const handleContinue = () => {
    if (!form.recipient || !form.iban || !form.amount) {
      setSubmitError('Please complete the transfer form first.');
      return;
    }
    setSubmitError('');
    setStep('pin');
  };

  const handleConfirmTransfer = async () => {
    if (isSubmitting) return;
    const expectedPin = user?.transferPin || '';
    if (String(pin) !== String(expectedPin)) {
      setPinError('Incorrect Transfer PIN.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitTransfer({
        recipient: form.recipient,
        iban: form.iban,
        bank: form.bank || 'Apex exchange bank',
        amount: form.amount,
        reference: form.reference,
        description: form.description,
        currency: form.currency,
        transferPin: pin,
      });

      setSuccessData({
        recipient: form.recipient,
        bank: form.bank || 'Apex exchange bank',
        amount: Number(form.amount),
        referenceNumber: result.referenceNumber,
        balance: result.nextBalance,
        transactionId: result.transactionId,
        date: result.date,
        time: result.time,
        fee: result.fee,
        totalAmount: result.totalAmount,
        iban: form.iban,
        senderAccount: user?.accountNumber,
        senderName: `${user?.firstName} ${user?.lastName}`,
        currency: form.currency || 'USD'
      });
      setStep('success');
      setPin('');
      setPinError('');
      setForm(empty);
    } catch (e) {
      setPinError(e.message || 'Transfer failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm(empty);
    setStep('form');
    setPin('');
    setPinError('');
    setShowPin(false);
    setSuccessData(null);
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title={t('transfer.title')} subtitle={t('transfer.subtitle')} />

      <div className="card p-5 sm:p-7">
        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-xs font-medium text-navy-400 uppercase tracking-wide mb-2">{t('transfer.recentBeneficiaries')}</p>
              <div className="flex gap-2 overflow-x-auto pb-4 mb-4 border-b border-navy-100 dark:border-white/10">
                {beneficiaries.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => pickBeneficiary(b)}
                    className="shrink-0 flex flex-col items-center gap-1.5 px-1"
                  >
                    <div className="w-11 h-11 rounded-full bg-navy-100 dark:bg-white/10 text-navy-600 dark:text-white flex items-center justify-center text-sm font-semibold">
                      {b.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <span className="text-[11px] text-navy-500 dark:text-navy-300 max-w-[64px] truncate">{b.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => { e.preventDefault(); setStep('preview'); }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <Field label={t('transfer.recipient')} value={form.recipient} onChange={update('recipient')} required span2 />
                <Field label={t('transfer.iban')} value={form.iban} onChange={update('iban')} required mono />
                <Field label={t('transfer.bank')} value={form.bank} onChange={update('bank')} />
                <Field label={t('transfer.country')} value={form.country} onChange={update('country')} />
                <Field label={t('transfer.amount')} value={form.amount} onChange={update('amount')} type="number" required mono />
                <div>
                  <label className="block text-xs font-medium text-navy-400 mb-1.5">{t('transfer.transferType')}</label>
                  <select value={form.type} onChange={update('type')} className="w-full px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 text-sm outline-none focus-ring">
                    <option value="standard">{t('transfer.standard')}</option>
                    <option value="instant">{t('transfer.instant')}</option>
                    <option value="scheduled">{t('transfer.scheduled')}</option>
                  </select>
                </div>
                <Field label={t('transfer.reference')} value={form.reference} onChange={update('reference')} span2 />
                <Field label={t('transfer.description')} value={form.description} onChange={update('description')} span2 />
                <Field label={t('transfer.transferDate')} value={form.date} onChange={update('date')} type="date" />

                <div className="sm:col-span-2 pt-2">
                  <button type="submit" className="w-full py-3.5 rounded-xl bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-110 transition">
                    <Send size={16} /> {t('transfer.preview')}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 'preview' && (
            <Modal open={step === 'preview'} title="Confirm Transfer" subtitle="Review the details before you continue." onClose={() => setStep('form')}>
              <div className="space-y-1 mb-6">
                {[
                  [t('transfer.recipient'), form.recipient],
                  [t('transfer.iban'), form.iban],
                  [t('transfer.bank'), form.bank || '—'],
                  ['Amount', formatMoney(Number(form.amount || 0), form.currency)],
                  ['Transfer Fee', formatMoney(transferFee, form.currency)],
                  ['Total Amount', formatMoney(totalAmount, form.currency)],
                  [t('transfer.reference'), form.reference || '—'],
                  [t('transfer.transferType'), t(`transfer.${form.type}`)],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between py-2.5 border-b border-navy-50 dark:border-white/5 text-sm">
                    <span className="text-navy-400">{l}</span>
                    <span className="text-navy-800 dark:text-white font-medium">{v}</span>
                  </div>
                ))}
              </div>
              {submitError && <p className="mb-4 text-sm text-neg">{submitError}</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep('form')} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-navy-200 dark:border-white/15 text-sm font-medium hover:bg-navy-50 dark:hover:bg-white/5">
                  <ArrowLeft size={15} /> {t('transfer.back')}
                </button>
                <button onClick={handleContinue} className="flex-1 py-3 rounded-xl bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 font-semibold text-sm hover:brightness-110">
                  Continue
                </button>
              </div>
            </Modal>
          )}

          {step === 'pin' && (
            <Modal open={step === 'pin'} title="Enter Transfer PIN" subtitle="Authorize this payment securely." onClose={() => setStep('preview')}>
              <div className="rounded-2xl border border-navy-100 dark:border-white/10 bg-navy-50/70 dark:bg-white/5 p-4 mb-6">
                <div className="flex items-center gap-2 text-gold-600 mb-2"><ShieldCheck size={16} /> <span className="text-xs font-semibold uppercase tracking-wide">Secure transfer</span></div>
                <p className="text-sm text-navy-500 dark:text-navy-300">Enter your transfer PIN to authorise this payment.</p>
              </div>
              <label className="block text-xs font-medium text-navy-400 mb-2">Enter Transfer PIN</label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => { setPin(e.target.value); setPinError(''); }}
                  inputMode="numeric"
                  className="w-full pr-12 px-3 py-3 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring font-tabular text-navy-900 dark:text-white"
                  placeholder="••••••"
                />
                <button type="button" onClick={() => setShowPin((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400">
                  {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {pinError && <p className="mt-3 text-sm text-neg">{pinError}</p>}
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep('preview')} disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-navy-200 dark:border-white/15 text-sm font-medium hover:bg-navy-50 dark:hover:bg-white/5 disabled:opacity-50">
                  <ArrowLeft size={15} /> Cancel
                </button>
                <button onClick={handleConfirmTransfer} disabled={isSubmitting} className="flex-1 py-3 rounded-xl bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 font-semibold text-sm hover:brightness-110 disabled:opacity-50">
                  {isSubmitting ? 'Processing...' : 'Confirm Transfer'}
                </button>
              </div>
            </Modal>
          )}

          {step === 'success' && (
            <Modal open={step === 'success'} title="Transfer Submitted" subtitle="Your payment request has been received securely." onClose={resetForm}>
              <div className="text-center py-2">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }} className="w-16 h-16 mx-auto rounded-full bg-gold-500/10 text-gold-600 flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} />
                </motion.div>
                <p className="text-sm text-navy-400 mb-6 max-w-sm mx-auto">
                  Your transfer of {formatMoney(Number(successData?.amount || 0), successData?.currency || 'USD')} has been submitted and is currently pending.
                </p>
                <div className="rounded-2xl border border-gold-500/20 bg-gold-500/5 p-4 text-left space-y-2 mb-6 text-sm">
                  <div className="flex justify-between"><span className="text-navy-500">Reference Number</span><span className="font-medium text-navy-900 dark:text-white">{successData?.referenceNumber}</span></div>
                  <div className="flex justify-between"><span className="text-navy-500">Recipient</span><span className="font-medium text-navy-900 dark:text-white">{successData?.recipient}</span></div>
                  <div className="flex justify-between"><span className="text-navy-500">Bank</span><span className="font-medium text-navy-900 dark:text-white">{successData?.bank}</span></div>
                  <div className="flex justify-between"><span className="text-navy-500">Status</span><span className="font-semibold text-gold-600">Pending</span></div>
                </div>
                <div className="flex flex-wrap gap-2.5 justify-center">
                  <button onClick={resetForm} className="px-5 py-3 rounded-xl bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 font-semibold text-sm hover:brightness-110">Done</button>
                  <button onClick={() => { resetForm(); navigate('/transactions'); }} className="px-5 py-3 rounded-xl border border-navy-200 dark:border-white/15 text-sm font-medium hover:bg-navy-50 dark:hover:bg-white/5">View Transaction</button>
                </div>
              </div>
            </Modal>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Field({ label, span2, mono, ...props }) {
  return (
    <div className={span2 ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-medium text-navy-400 mb-1.5">{label}</label>
      <input
        {...props}
        className={`w-full px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring text-navy-900 dark:text-white ${mono ? 'font-tabular' : ''}`}
      />
    </div>
  );
}
