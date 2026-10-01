import { useTranslation } from 'react-i18next';
import { FileText, Download } from 'lucide-react';
import { PageHeader, formatDate } from '../components/common';
import { useAuth } from '../hooks/useAuth';

const months = ['2026-06-30', '2026-05-31', '2026-04-30', '2026-03-31', '2026-02-28', '2026-01-31'];

export default function Documents() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const isDefaultUser = user?.accountNumber === (import.meta.env.VITE_ACCOUNT_NUMBER || '5320130');
  const displayMonths = isDefaultUser ? months : [];

  return (
    <div className="max-w-2xl">
      <PageHeader title={t('documents.title')} subtitle={t('documents.subtitle')} />
      <div className="card divide-y divide-navy-50 dark:divide-white/5 overflow-hidden">
        {displayMonths.length === 0 ? (
          <div className="p-8 text-center text-sm text-navy-400">
            No documents available.
          </div>
        ) : (
          displayMonths.map((d) => (
            <div key={d} className="flex items-center justify-between p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-navy-100 dark:bg-white/10 text-navy-500 dark:text-white flex items-center justify-center">
                  <FileText size={17} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-800 dark:text-white">{t('documents.statement')}</p>
                  <p className="text-xs text-navy-400">{formatDate(d)}</p>
                </div>
              </div>
              <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-navy-200 dark:border-white/15 text-sm font-medium hover:bg-navy-50 dark:hover:bg-white/5">
                <Download size={14} /> {t('documents.download')}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
