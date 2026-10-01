import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Download, FileDown, ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { PageHeader, StatusPill, formatMoney, formatDate } from '../components/common';
import TransactionModal from '../components/TransactionModal';
import { useBanking } from '../context/BankingContext';

const PAGE_SIZE = 12;

export default function Transactions() {
  const { t } = useTranslation();
  const { transactions } = useBanking();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('all');
  const [sort, setSort] = useState('newest');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categories = useMemo(() => [...new Set(transactions.map((t) => t.category).filter(Boolean))].sort(), [transactions]);

  const filtered = useMemo(() => {
    let list = transactions.filter((tx) => {
      if (query) {
        const q = query.toLowerCase();
        const desc = (tx.description || '').toLowerCase();
        const merch = (tx.merchant || tx.beneficiaryBank || '').toLowerCase();
        const ref = (tx.referenceNumber || tx.reference || '').toLowerCase();
        if (!(desc.includes(q) || merch.includes(q) || ref.includes(q))) {
          return false;
        }
      }
      if (status !== 'all' && tx.status !== status) return false;
      if (category !== 'all' && tx.category !== category) return false;
      if (type !== 'all') {
        if (type === 'debit' && tx.type !== 'debit' && tx.type !== 'Transfer') return false;
        if (type === 'credit' && tx.type !== 'credit') return false;
      }
      const absAmount = Math.abs(Number(tx.amount) || 0);
      if (minAmount && absAmount < parseFloat(minAmount)) return false;
      if (maxAmount && absAmount > parseFloat(maxAmount)) return false;
      if (dateFrom && tx.date < dateFrom) return false;
      if (dateTo && tx.date > dateTo) return false;
      return true;
    });
    list = list.sort((a, b) => {
      const timeA = new Date(a.createdAt || `${a.date}T${a.time}`).getTime();
      const timeB = new Date(b.createdAt || `${b.date}T${b.time}`).getTime();
      const diff = (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
      return sort === 'newest' ? diff : -diff;
    });
    return list;
  }, [transactions, query, status, category, type, sort, minAmount, maxAmount, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const resetFilters = () => {
    setQuery(''); setStatus('all'); setCategory('all'); setType('all');
    setMinAmount(''); setMaxAmount(''); setDateFrom(''); setDateTo(''); setPage(1);
  };

  return (
    <div>
      <PageHeader
        title={t('transactions.title')}
        subtitle={t('transactions.subtitle')}
        action={
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-navy-200 dark:border-white/15 text-sm font-medium hover:bg-navy-50 dark:hover:bg-white/5 focus-ring">
              <Download size={15} /> {t('transactions.downloadStatement')}
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 text-sm font-medium hover:brightness-110 focus-ring">
              <FileDown size={15} /> {t('transactions.exportPdf')}
            </button>
          </div>
        }
      />

      {/* Search + filter toggle */}
      <div className="card p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder={t('transactions.search')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring"
            />
          </div>
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-navy-200 dark:border-white/15 text-sm font-medium hover:bg-navy-50 dark:hover:bg-white/5 focus-ring"
          >
            <SlidersHorizontal size={15} /> {t('transactions.filterCategory')}
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring"
          >
            <option value="newest">{t('transactions.sortNewest')}</option>
            <option value="oldest">{t('transactions.sortOldest')}</option>
          </select>
        </div>

        {filtersOpen && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-navy-100 dark:border-white/10">
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg bg-navy-50 dark:bg-white/5 text-sm outline-none focus-ring">
              <option value="all">{t('transactions.allStatuses')}</option>
              <option value="Completed">{t('transactions.completed')}</option>
              <option value="Pending">{t('transactions.pending')}</option>
              <option value="Failed">{t('transactions.failed')}</option>
            </select>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg bg-navy-50 dark:bg-white/5 text-sm outline-none focus-ring">
              <option value="all">{t('transactions.allCategories')}</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg bg-navy-50 dark:bg-white/5 text-sm outline-none focus-ring">
              <option value="all">{t('transactions.allTypes')}</option>
              <option value="credit">{t('transactions.credit')}</option>
              <option value="debit">{t('transactions.debit')}</option>
            </select>
            <input type="number" placeholder={t('transactions.filterAmount') + ' min'} value={minAmount} onChange={(e) => { setMinAmount(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg bg-navy-50 dark:bg-white/5 text-sm outline-none focus-ring font-tabular" />
            <input type="number" placeholder={t('transactions.filterAmount') + ' max'} value={maxAmount} onChange={(e) => { setMaxAmount(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg bg-navy-50 dark:bg-white/5 text-sm outline-none focus-ring font-tabular" />
            <button onClick={resetFilters} className="px-3 py-2 rounded-lg border border-navy-200 dark:border-white/15 text-sm hover:bg-navy-50 dark:hover:bg-white/5">
              {t('transactions.resetFilters')}
            </button>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg bg-navy-50 dark:bg-white/5 text-sm outline-none focus-ring" />
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg bg-navy-50 dark:bg-white/5 text-sm outline-none focus-ring" />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {pageItems.length === 0 ? (
          <div className="p-12 text-center text-navy-400 text-sm">
            {t('transactions.noResults')}
            <button onClick={resetFilters} className="block mx-auto mt-3 text-gold-600 font-medium hover:text-gold-500">
              {t('transactions.resetFilters')}
            </button>
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-[100px_1fr_120px_110px_100px_130px] gap-3 px-5 py-3 text-xs font-medium text-navy-400 uppercase tracking-wide border-b border-navy-100 dark:border-white/10">
              <span>{t('transactions.date')}</span>
              <span>{t('transactions.description')}</span>
              <span>{t('transactions.category')}</span>
              <span className="text-right">{t('transactions.amount')}</span>
              <span>{t('transactions.status')}</span>
              <span className="text-right">{t('transactions.balance')}</span>
            </div>
            <div>
              {pageItems.map((tx) => (
                <button
                  key={tx.id}
                  onClick={() => setSelected(tx)}
                  className="w-full text-left grid grid-cols-[1fr_auto] md:grid-cols-[100px_1fr_120px_110px_100px_130px] gap-2 md:gap-3 items-center px-5 py-3.5 border-b border-navy-50 dark:border-white/5 last:border-0 hover:bg-navy-50/60 dark:hover:bg-white/5 transition-colors focus-ring"
                >
                  <span className="hidden md:block text-sm text-navy-500 dark:text-navy-300">{formatDate(tx.date)}</span>
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 md:hidden ${tx.type === 'credit' ? 'bg-pos/10 text-pos' : 'bg-navy-100 dark:bg-white/10 text-navy-500'}`}>
                      {tx.type === 'credit' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-navy-800 dark:text-white truncate">{tx.description}</span>
                      <span className="block text-xs text-navy-400 truncate md:hidden">{formatDate(tx.date)} · {tx.merchant}</span>
                      <span className="hidden md:block text-xs text-navy-400 truncate">{tx.merchant}</span>
                    </span>
                  </span>
                  <span className="hidden md:block text-sm text-navy-500 dark:text-navy-300">{tx.category}</span>
                  <span className={`text-sm font-tabular font-semibold text-right ${tx.type === 'credit' ? 'text-pos' : 'text-navy-800 dark:text-white'}`}>
                    {tx.type === 'credit' ? '+' : '−'}{formatMoney(Math.abs(tx.amount || 0), tx.currency)}
                  </span>
                  <span className="hidden md:block"><StatusPill status={tx.status} /></span>
                  <span className="hidden md:block text-sm font-tabular text-right text-navy-500 dark:text-navy-300">{formatMoney(tx.balanceAfter, tx.currency)}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-navy-100 dark:border-white/10">
            <p className="text-xs text-navy-400">
              {t('transactions.showing', {
                from: (pageSafe - 1) * PAGE_SIZE + 1,
                to: Math.min(pageSafe * PAGE_SIZE, filtered.length),
                total: filtered.length,
              })}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={pageSafe === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg border border-navy-200 dark:border-white/15 disabled:opacity-30 hover:bg-navy-50 dark:hover:bg-white/5 focus-ring"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-navy-500 font-medium">{t('transactions.page', { page: pageSafe, pages: totalPages })}</span>
              <button
                disabled={pageSafe === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg border border-navy-200 dark:border-white/15 disabled:opacity-30 hover:bg-navy-50 dark:hover:bg-white/5 focus-ring"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && <TransactionModal transaction={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
