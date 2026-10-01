import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { formatMoney, PageHeader } from '../../components/common';
import { Users, Search, Mail, Phone, MapPin } from 'lucide-react';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Subscribe to all bank users in real-time
  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      // Sort newest created first
      list.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
      setCustomers(list);
    });

    return () => unsubscribe();
  }, []);

  const filteredCustomers = customers.filter((cust) => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${cust.firstName || ''} ${cust.lastName || ''}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      (cust.email || '').toLowerCase().includes(searchLower) ||
      (cust.accountNumber || '').includes(searchLower) ||
      (cust.customerId || '').includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bank Customers"
        subtitle="Manage and view register customer directories and details."
      />

      <div className="card overflow-hidden">
        {/* Table Search Header */}
        <div className="p-5 border-b border-navy-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-display font-semibold text-lg text-navy-900 dark:text-white flex items-center gap-2">
            <Users size={20} className="text-gold-600" /> Customer Registry ({filteredCustomers.length})
          </h3>
          <div className="relative max-w-xs w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
            <input
              type="text"
              placeholder="Search by name, email, acc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-navy-50 dark:bg-white/5 border border-transparent focus:border-gold-500 text-sm outline-none focus-ring text-navy-950 dark:text-white"
            />
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="p-10 text-center text-navy-400">
            No customers found matching the search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-navy-50/50 dark:bg-white/5 text-navy-400 font-medium text-xs border-b border-navy-100 dark:border-white/10">
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Account Number</th>
                  <th className="p-4">Customer ID</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4 text-right">Checking Bal</th>
                  <th className="p-4 text-right">Savings Bal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50 dark:divide-white/5 text-navy-800 dark:text-white">
                {filteredCustomers.map((cust) => {
                  const initials = `${cust.firstName[0] || ''}${cust.lastName[0] || ''}`.toUpperCase();
                  return (
                    <tr key={cust.id} className="hover:bg-navy-50/40 dark:hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {cust.profilePictureUrl ? (
                            <img
                              src={cust.profilePictureUrl}
                              alt="Avatar"
                              className="w-10 h-10 rounded-full object-cover border border-navy-100 dark:border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy-600 to-navy-950 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                              {initials}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-navy-900 dark:text-white">
                              {cust.firstName} {cust.lastName}
                            </p>
                            <span className="text-[10px] text-navy-400 bg-navy-50 dark:bg-white/5 px-2 py-0.5 rounded-full uppercase font-medium">
                              {cust.country || 'Germany'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-medium text-navy-850 dark:text-navy-100">
                        DE{cust.accountNumber}
                      </td>
                      <td className="p-4 font-medium text-navy-800 dark:text-navy-100">
                        #{cust.customerId}
                      </td>
                      <td className="p-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-navy-450 dark:text-navy-300">
                          <Mail size={12} className="shrink-0" />
                          <span className="truncate max-w-[180px]">{cust.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-navy-450 dark:text-navy-300">
                          <Phone size={12} className="shrink-0" />
                          <span>{cust.phoneNumber || cust.phone || '—'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right font-semibold font-tabular text-navy-900 dark:text-white">
                        {formatMoney(cust.checkingBalance ?? 0)}
                      </td>
                      <td className="p-4 text-right font-semibold font-tabular text-gold-600">
                        {formatMoney(cust.savingsBalance ?? 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
