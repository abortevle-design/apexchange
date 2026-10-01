import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';
import { PageHeader } from '../components/common';

const threads = [
  { id: 1, subjectKey: 'Kontoauszug Juni verfügbar', from: 'Apex exchange bank', date: '2026-07-01', preview: 'Ihr Kontoauszug für Juni 2026 steht ab sofort in Ihrem Postfach zum Download bereit.' },
  { id: 2, subjectKey: 'Änderung der AGB', from: 'Apex exchange bank', date: '2026-06-20', preview: 'Wir informieren Sie über eine Aktualisierung unserer Allgemeinen Geschäftsbedingungen zum 1. August 2026.' },
  { id: 3, subjectKey: 'Willkommen bei Apex exchange bank', from: 'Apex exchange bank', date: '2026-05-14', preview: 'Vielen Dank, dass Sie sich für die Apex exchange bank entschieden haben. So starten Sie durch.' },
];

export default function Messages() {
  const { t } = useTranslation();
  return (
    <div className="max-w-2xl">
      <PageHeader title={t('messages.title')} subtitle={t('messages.subtitle')} />
      <div className="card divide-y divide-navy-50 dark:divide-white/5 overflow-hidden">
        {threads.map((m) => (
          <div key={m.id} className="flex items-start gap-3 p-4 sm:p-5 hover:bg-navy-50/60 dark:hover:bg-white/5 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-navy-100 dark:bg-white/10 text-navy-500 dark:text-white flex items-center justify-center shrink-0">
              <MessageSquare size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy-800 dark:text-white">{m.subjectKey}</p>
              <p className="text-sm text-navy-400 mt-0.5 truncate">{m.preview}</p>
              <p className="text-xs text-navy-300 mt-1">{m.from} · {m.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
