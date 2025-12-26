
import React, { useState } from 'react';
import { Locale } from '../types';
import { TRANSLATIONS } from '../constants';

interface ReasonModalProps {
  locale: Locale;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

const ReasonModal: React.FC<ReasonModalProps> = ({ locale, onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');
  const t = TRANSLATIONS[locale];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 3) return;
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-slate-950/80 animate-in fade-in duration-300">
      <div className="bg-[#1e293b] w-full max-w-md rounded-3xl border border-slate-700 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden scale-in duration-300">
        <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex items-center gap-4">
          <div className="bg-red-500/20 p-3 rounded-2xl">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h3 className="text-xl font-bold text-white">{t.reasonRequired}</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <p className="text-slate-400 text-sm">{t.enterReason}</p>
            <textarea 
              autoFocus
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-32 bg-slate-950 border border-slate-700 rounded-2xl p-4 text-white focus:border-[#00AEEF] outline-none transition-all placeholder:text-slate-700 resize-none"
              placeholder={t.memo}
            />
          </div>

          <div className="flex gap-4">
            <button 
              type="submit" 
              disabled={reason.trim().length < 3}
              className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-4 rounded-2xl transition-all shadow-xl active:scale-95"
            >
              {t.confirm}
            </button>
            <button 
              type="button" 
              onClick={onCancel}
              className="px-8 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all"
            >
              {t.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReasonModal;
