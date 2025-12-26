
import React, { useState, useMemo } from 'react';
import { Account, AccountCategory, Locale } from '../types';
import { TRANSLATIONS } from '../constants';

interface ChartOfAccountsManagerProps {
  coa: Account[];
  balancesMap: Map<string, number>;
  locale: Locale;
  onAddAccount: (acc: Account) => void;
  onDeleteAccount: (id: string) => void;
}

const ChartOfAccountsManager: React.FC<ChartOfAccountsManagerProps> = ({ coa, balancesMap, locale, onAddAccount, onDeleteAccount }) => {
  const t = TRANSLATIONS[locale];
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    code: 0,
    nameAr: '',
    nameEn: '',
    category: AccountCategory.ASSETS
  });

  const groupedAccounts = useMemo(() => {
    const groups: Record<AccountCategory, Account[]> = {
      [AccountCategory.ASSETS]: [],
      [AccountCategory.LIABILITIES]: [],
      [AccountCategory.EQUITY]: [],
      [AccountCategory.REVENUE]: [],
      [AccountCategory.EXPENSES]: [],
      [AccountCategory.COSTS]: [],
      [AccountCategory.CONTROL]: [],
      [AccountCategory.OTHERS]: []
    };
    coa.forEach(acc => {
      groups[acc.category].push(acc);
    });
    // Sort each group by code
    Object.keys(groups).forEach(key => {
      groups[key as AccountCategory].sort((a,b) => a.code - b.code);
    });
    return groups;
  }, [coa]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccount.code || !newAccount.nameAr) return;
    
    const account: Account = {
      id: `acc-${newAccount.code}-${Date.now()}`,
      code: newAccount.code,
      nameAr: newAccount.nameAr,
      nameEn: newAccount.nameEn,
      displayName: `${newAccount.code} - ${newAccount.nameAr} / ${newAccount.nameEn}`,
      category: newAccount.category,
      balance: 0
    };
    onAddAccount(account);
    setIsAddModalOpen(false);
    setNewAccount({ code: 0, nameAr: '', nameEn: '', category: AccountCategory.ASSETS });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#1e293b]/50 p-8 rounded-[32px] border border-slate-800 shadow-xl">
        <div className="flex items-center gap-6">
           <div className="bg-[#00AEEF]/10 p-4 rounded-3xl border border-[#00AEEF]/20">
              <svg className="w-8 h-8 text-[#00AEEF]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
           </div>
           <div>
              <h3 className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-1">{t.totalActiveAccounts}</h3>
              <div className="flex items-baseline gap-2">
                 <span className="text-4xl font-black text-white font-tech tracking-tighter">{coa.length}</span>
                 <span className="text-[#00AEEF] text-xs font-black uppercase">{t.activeAccounts}</span>
              </div>
           </div>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#00AEEF] hover:bg-[#0092c7] text-white px-10 py-4 rounded-2xl font-black shadow-[0_15px_30px_rgba(0,174,239,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all text-sm uppercase tracking-wider"
        >
          {t.addAccount} +
        </button>
      </div>

      <div className="space-y-6">
        {(Object.entries(groupedAccounts) as [string, Account[]][]).map(([category, accounts]) => accounts.length > 0 && (
          <div key={category} className="bg-[#1e293b] rounded-3xl border border-slate-800 overflow-hidden shadow-2xl group/cat">
            <div className="p-6 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center transition-all group-hover/cat:bg-slate-900/70">
              <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] opacity-80">{category}</h4>
              <span className="text-[10px] text-[#00AEEF] font-black bg-[#00AEEF]/10 px-3 py-1 rounded-full uppercase border border-[#00AEEF]/20">{accounts.length} Accounts</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-slate-950/40 text-[9px] text-slate-500 font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4">{t.code}</th>
                    <th className="px-8 py-4">{t.account}</th>
                    <th className="px-8 py-4 text-center">{t.balance}</th>
                    <th className="px-8 py-4 text-center">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {accounts.map(acc => {
                    const bal = balancesMap.get(acc.id) || 0;
                    return (
                      <tr key={acc.id} className="hover:bg-slate-800/30 transition-all group">
                        <td className="px-8 py-5 font-mono text-slate-500 text-xs">{acc.code}</td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-white font-bold">{acc.nameAr}</span>
                            <span className="text-[10px] text-slate-500">{acc.nameEn}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                           <span className={`font-mono font-black ${bal >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                             ${bal.toLocaleString()}
                           </span>
                        </td>
                        <td className="px-8 py-5 text-center">
                           <button 
                             onClick={() => onDeleteAccount(acc.id)}
                             className="p-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-600 hover:text-red-500 hover:border-red-500/30 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                           >
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg>
                           </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#1e293b] w-full max-w-xl rounded-[40px] border border-slate-700 shadow-2xl overflow-hidden flex flex-col scale-in">
            <div className="p-10 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-white font-black text-2xl uppercase tracking-tighter">{t.addAccount}</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{t.code}</label>
                  <input 
                    type="number" required
                    value={newAccount.code || ''}
                    onChange={e => setNewAccount({...newAccount, code: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-[#00AEEF] transition-all"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{t.category}</label>
                  <div className="relative">
                    <select 
                      value={newAccount.category}
                      onChange={e => setNewAccount({...newAccount, category: e.target.value as AccountCategory})}
                      className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl text-white outline-none appearance-none cursor-pointer focus:border-[#00AEEF] transition-all"
                    >
                      {Object.values(AccountCategory).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">اسم الحساب (Arabic)</label>
                  <input 
                    type="text" required
                    value={newAccount.nameAr}
                    onChange={e => setNewAccount({...newAccount, nameAr: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-[#00AEEF] transition-all"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Account Name (English)</label>
                  <input 
                    type="text"
                    value={newAccount.nameEn}
                    onChange={e => setNewAccount({...newAccount, nameEn: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-[#00AEEF] transition-all"
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-[#00AEEF] text-white font-black py-5 rounded-[24px] shadow-[0_15px_30px_rgba(0,174,239,0.3)] hover:translate-y-[-2px] active:translate-y-[1px] transition-all uppercase tracking-widest text-sm"
              >
                {t.confirm}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccountsManager;
