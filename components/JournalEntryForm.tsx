
import React, { useState, useMemo, useEffect } from 'react';
import { TRANSLATIONS } from '../constants';
import { JournalEntry, Account, Locale, JournalLine } from '../types';

interface JournalEntryFormProps {
  onAddEntry: (entry: Omit<JournalEntry, 'id' | 'currency'>) => void;
  onUpdateEntry: (id: string, entry: Omit<JournalEntry, 'id' | 'currency'>) => void;
  editEntry: JournalEntry | null;
  onCancelEdit: () => void;
  locale: Locale;
  coa: Account[];
}

const JournalEntryForm: React.FC<JournalEntryFormProps> = ({ onAddEntry, onUpdateEntry, editEntry, onCancelEdit, locale, coa }) => {
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [debitLines, setDebitLines] = useState<JournalLine[]>([{ accountId: '', accountName: '', amount: 0 }]);
  const [creditLines, setCreditLines] = useState<JournalLine[]>([{ accountId: '', accountName: '', amount: 0 }]);

  // Autocomplete states
  const [activeInput, setActiveInput] = useState<{ type: 'debit' | 'credit', index: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const t = TRANSLATIONS[locale];

  useEffect(() => {
    if (editEntry) {
      setDate(editEntry.date);
      setDescription(editEntry.description);
      setDebitLines(editEntry.debitLines);
      setCreditLines(editEntry.creditLines);
    }
  }, [editEntry]);

  const debitTotal = useMemo(() => debitLines.reduce((sum, line) => sum + line.amount, 0), [debitLines]);
  const creditTotal = useMemo(() => creditLines.reduce((sum, line) => sum + line.amount, 0), [creditLines]);
  const isBalanced = Math.abs(debitTotal - creditTotal) < 0.01 && debitTotal > 0;

  const suggestions = useMemo(() => {
    if (!searchQuery) return [];
    const lower = searchQuery.toLowerCase();
    return (coa || []).filter(acc => 
      acc.nameAr.toLowerCase().includes(lower) || 
      acc.nameEn.toLowerCase().includes(lower) || 
      acc.code.toString().includes(lower)
    ).slice(0, 10);
  }, [searchQuery, coa]);

  const addLine = (type: 'debit' | 'credit') => {
    const newLine = { accountId: '', accountName: '', amount: 0 };
    if (type === 'debit') setDebitLines([...debitLines, newLine]);
    else setCreditLines([...creditLines, newLine]);
  };

  const removeLine = (type: 'debit' | 'credit', index: number) => {
    if (type === 'debit') {
      if (debitLines.length > 1) setDebitLines(debitLines.filter((_, i) => i !== index));
    } else {
      if (creditLines.length > 1) setCreditLines(creditLines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (type: 'debit' | 'credit', index: number, field: keyof JournalLine, value: any) => {
    if (type === 'debit') {
      const newLines = [...debitLines];
      newLines[index] = { ...newLines[index], [field]: value };
      setDebitLines(newLines);
    } else {
      const newLines = [...creditLines];
      newLines[index] = { ...newLines[index], [field]: value };
      setCreditLines(newLines);
    }
  };

  const selectAccount = (acc: Account) => {
    if (!activeInput) return;
    updateLine(activeInput.type, activeInput.index, 'accountId', acc.id);
    updateLine(activeInput.type, activeInput.index, 'accountName', acc.displayName);
    setActiveInput(null);
    setSearchQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) return;
    
    const payload = {
      date,
      description,
      debitLines,
      creditLines
    };

    if (editEntry) onUpdateEntry(editEntry.id, payload);
    else onAddEntry(payload);

    resetForm();
  };

  const resetForm = () => {
    setDescription('');
    setDebitLines([{ accountId: '', accountName: '', amount: 0 }]);
    setCreditLines([{ accountId: '', accountName: '', amount: 0 }]);
    onCancelEdit();
  };

  return (
    <div className="bg-[#1e293b] p-8 rounded-2xl border border-slate-800 shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-[#00AEEF] text-xl font-bold flex items-center gap-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {editEntry ? t.edit : t.newEntry}
        </h2>
        <div className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${isBalanced ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-red-500/10 border-red-500 text-red-400'}`}>
          {isBalanced ? t.balanced : t.unbalanced} {Math.abs(debitTotal - creditTotal) > 0 && `(${t.difference}: $${Math.abs(debitTotal - creditTotal).toLocaleString()})`}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">{t.date}</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-[#00AEEF] outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">{t.description}</label>
            <input type="text" placeholder={t.memo} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-[#00AEEF] outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Debit Section */}
          <div className="space-y-4">
            <h3 className="text-green-500 font-bold text-sm uppercase flex justify-between items-center">
              {t.debitAccount}
              <span className="text-xs text-slate-500 font-mono">${debitTotal.toLocaleString()}</span>
            </h3>
            {debitLines.map((line, idx) => (
              <div key={`db-${idx}`} className="flex gap-2 relative">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    placeholder={t.searchAccount}
                    value={activeInput?.type === 'debit' && activeInput.index === idx ? searchQuery : line.accountName}
                    onFocus={() => { setActiveInput({ type: 'debit', index: idx }); setSearchQuery(''); }}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-green-500 outline-none"
                  />
                  {activeInput?.type === 'debit' && activeInput.index === idx && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar">
                      {suggestions.map(acc => (
                        <div key={acc.id} onClick={() => selectAccount(acc)} className="p-3 hover:bg-green-500/10 hover:text-green-400 cursor-pointer text-sm border-b border-slate-800 last:border-0 transition-colors">
                          <span className="font-mono text-green-500 mr-2">{acc.code}</span> {locale === 'ar' ? acc.nameAr : acc.nameEn}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input 
                  type="number" 
                  placeholder="0.00"
                  value={line.amount || ''}
                  onChange={e => updateLine('debit', idx, 'amount', parseFloat(e.target.value) || 0)}
                  className="w-28 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-green-400 font-mono text-center outline-none focus:border-green-500"
                />
                {debitLines.length > 1 && (
                  <button type="button" onClick={() => removeLine('debit', idx)} className="p-2 text-slate-600 hover:text-red-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addLine('debit')} className="text-xs font-bold text-green-600 hover:text-green-400 transition-colors">
              {t.addLine}
            </button>
          </div>

          {/* Credit Section */}
          <div className="space-y-4">
            <h3 className="text-[#00AEEF] font-bold text-sm uppercase flex justify-between items-center">
              {t.creditAccount}
              <span className="text-xs text-slate-500 font-mono">${creditTotal.toLocaleString()}</span>
            </h3>
            {creditLines.map((line, idx) => (
              <div key={`cr-${idx}`} className="flex gap-2 relative">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    placeholder={t.searchAccount}
                    value={activeInput?.type === 'credit' && activeInput.index === idx ? searchQuery : line.accountName}
                    onFocus={() => { setActiveInput({ type: 'credit', index: idx }); setSearchQuery(''); }}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-[#00AEEF] outline-none"
                  />
                  {activeInput?.type === 'credit' && activeInput.index === idx && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar">
                      {suggestions.map(acc => (
                        <div key={acc.id} onClick={() => selectAccount(acc)} className="p-3 hover:bg-[#00AEEF]/10 hover:text-[#00AEEF] cursor-pointer text-sm border-b border-slate-800 last:border-0 transition-colors">
                          <span className="font-mono text-[#00AEEF] mr-2">{acc.code}</span> {locale === 'ar' ? acc.nameAr : acc.nameEn}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input 
                  type="number" 
                  placeholder="0.00"
                  value={line.amount || ''}
                  onChange={e => updateLine('credit', idx, 'amount', parseFloat(e.target.value) || 0)}
                  className="w-28 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-[#00AEEF] font-mono text-center outline-none focus:border-[#00AEEF]"
                />
                {creditLines.length > 1 && (
                  <button type="button" onClick={() => removeLine('credit', idx)} className="p-2 text-slate-600 hover:text-red-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addLine('credit')} className="text-xs font-bold text-[#00AEEF] hover:text-[#00CFFF] transition-colors">
              {t.addLine}
            </button>
          </div>
        </div>

        <div className="flex gap-4 pt-6 border-t border-slate-800">
          <button 
            type="submit" 
            disabled={!isBalanced}
            className="flex-1 bg-[#00AEEF] hover:bg-[#0092c7] disabled:bg-slate-800 disabled:text-slate-600 font-bold py-4 rounded-2xl transition-all shadow-xl active:scale-95"
          >
            {editEntry ? t.update : t.post}
          </button>
          {editEntry && (
            <button type="button" onClick={resetForm} className="px-8 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all">
              {t.cancel}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default JournalEntryForm;
