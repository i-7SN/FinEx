
import React, { useState, useMemo } from 'react';
import { Partner, Locale, Well } from '../types';
import { TRANSLATIONS } from '../constants';

interface PartnersManagerProps {
  partners: Partner[];
  wells: Well[];
  locale: Locale;
  onUpdate: (id: string, data: Partial<Partner>) => void;
  onDelete: (id: string) => void;
  onAdd: (partner: Omit<Partner, 'id'>) => void;
}

const PartnersManager: React.FC<PartnersManagerProps> = ({ partners, wells, locale, onUpdate, onDelete, onAdd }) => {
  const t = TRANSLATIONS[locale];
  const [isAdding, setIsAdding] = useState(false);
  const [editModeId, setEditModeId] = useState<string | null>(null);
  const [intelPartner, setIntelPartner] = useState<Partner | null>(null);
  
  const [formData, setFormData] = useState<Omit<Partner, 'id'>>({
    name: '',
    phone: '',
    email: '',
    sharePercent: 0,
    creditLimit: 0,
    status: 'active'
  });

  const [editData, setEditData] = useState<Partial<Partner>>({});

  const validatePhone = (phone: string) => /^\+?[0-9\s\-]{7,20}$/.test(phone);
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone(formData.phone)) return alert(t.invalidPhone);
    if (!validateEmail(formData.email)) return alert(t.invalidEmail);
    onAdd(formData);
    setIsAdding(false);
    setFormData({ name: '', phone: '', email: '', sharePercent: 0, creditLimit: 0, status: 'active' });
  };

  const handleEditSubmit = (pId: string) => {
    const p = partners.find(x => x.id === pId);
    const finalPhone = editData.phone !== undefined ? editData.phone : p?.phone || '';
    const finalEmail = editData.email !== undefined ? editData.email : p?.email || '';

    if (!validatePhone(finalPhone)) return alert(t.invalidPhone);
    if (!validateEmail(finalEmail)) return alert(t.invalidEmail);

    onUpdate(pId, editData);
    setEditModeId(null);
    setEditData({});
  };

  // Intelligence Calculation Logic
  const getPartnerIntel = (partner: Partner) => {
    const partnerWells = wells.filter(w => w.shares.some(s => s.partnerId === partner.id));
    const wellDetails = partnerWells.map(w => ({
      name: w.name,
      share: w.shares.find(s => s.partnerId === partner.id)?.percent || 0,
      dailyRevenue: (w.dailyYield * (w.shares.find(s => s.partnerId === partner.id)?.percent || 0) / 100) * 80 // Mocking $80/BBL
    }));
    
    const totalRevenue = wellDetails.reduce((sum, w) => sum + w.dailyRevenue, 0);
    return { wellDetails, totalRevenue };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-black text-white">{t.partnersManager}</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[#00AEEF] hover:bg-[#0092c7] text-white px-8 py-3 rounded-2xl font-bold shadow-xl transition-all active:scale-95"
        >
          {isAdding ? t.cancel : t.addPartner}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddSubmit} className="bg-slate-800 p-8 rounded-3xl border border-slate-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <input 
            type="text" required placeholder={t.partnerName}
            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-[#00AEEF]"
          />
          <input 
            type="text" required placeholder={t.phone}
            value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
            className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-[#00AEEF]"
          />
          <input 
            type="email" required placeholder={t.email}
            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
            className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-[#00AEEF]"
          />
          <input 
            type="number" required placeholder={t.sharePercent}
            value={formData.sharePercent || ''} onChange={e => setFormData({ ...formData, sharePercent: parseFloat(e.target.value) || 0 })}
            className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-[#00AEEF]"
          />
          <input 
            type="number" required placeholder={t.creditLimit}
            value={formData.creditLimit || ''} onChange={e => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
            className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-[#00AEEF]"
          />
          <button type="submit" className="bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl h-12">{t.confirm}</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {partners.map(p => (
          <div key={p.id} className="bg-[#1e293b] p-8 rounded-3xl border border-slate-800 hover:border-[#00AEEF] transition-all group shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-slate-900 p-3 rounded-2xl text-[#00AEEF]">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIntelPartner(p)}
                  className="p-2 bg-slate-900 hover:bg-[#00AEEF] text-slate-500 hover:text-white rounded-xl transition-all"
                  title={t.investmentData}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </button>
                <button 
                  onClick={() => { setEditModeId(p.id); setEditData(p); }}
                  className="p-2 bg-slate-900 hover:bg-[#00AEEF] text-slate-500 hover:text-white rounded-xl transition-all"
                  title={t.edit}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button 
                  onClick={() => onDelete(p.id)}
                  className="p-2 bg-slate-900 hover:bg-red-500 text-slate-500 hover:text-white rounded-xl transition-all"
                  title={t.delete}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xl font-black text-white truncate">{p.name}</h4>
              <div className="space-y-1">
                 <p className="text-xs text-slate-500">{p.email}</p>
                 <p className="text-xs text-slate-500 font-mono">{p.phone}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.sharePercent}</span>
                  <span className="text-xl font-black text-[#00AEEF]">{p.sharePercent}%</span>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.creditLimit}</span>
                  <span className="text-sm font-black text-white">${(p.creditLimit / 1000000).toFixed(1)}M</span>
                </div>
              </div>
            </div>

            {editModeId === p.id && (
              <div className="absolute inset-0 bg-slate-950/95 z-10 flex flex-col p-8 animate-in slide-in-from-bottom-full duration-300">
                <h5 className="text-[#00AEEF] font-bold mb-6">{t.edit}: {p.name}</h5>
                <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                  <label className="block">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">{t.phone}</span>
                    <input 
                      type="text" value={editData.phone ?? p.phone} 
                      onChange={e => setEditData({ ...editData, phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white" 
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">{t.email}</span>
                    <input 
                      type="email" value={editData.email ?? p.email} 
                      onChange={e => setEditData({ ...editData, email: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white" 
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">{t.sharePercent}</span>
                    <input 
                      type="number" value={editData.sharePercent ?? p.sharePercent} 
                      onChange={e => setEditData({ ...editData, sharePercent: parseFloat(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white" 
                    />
                  </label>
                </div>
                <div className="flex gap-4 pt-4 border-t border-slate-800">
                  <button 
                    onClick={() => handleEditSubmit(p.id)}
                    className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl"
                  >
                    {t.save}
                  </button>
                  <button onClick={() => setEditModeId(null)} className="px-6 bg-slate-800 text-white font-bold py-3 rounded-xl">{t.cancel}</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Partner Intelligence Modal */}
      {intelPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-[#1e293b] w-full max-w-4xl rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                 <div>
                    <h3 className="text-[#00AEEF] font-black text-2xl uppercase tracking-tighter">{t.partnerIntel}</h3>
                    <p className="text-slate-500 text-sm font-bold">{intelPartner.name}</p>
                 </div>
                 <button onClick={() => setIntelPartner(null)} className="text-slate-500 hover:text-white">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800">
                       <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">{t.totalRevenue}</h4>
                       <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black text-white font-mono">${getPartnerIntel(intelPartner).totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          <span className="text-[#00AEEF] font-black text-xs uppercase">REAL-TIME</span>
                       </div>
                    </div>
                    
                    <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800">
                       <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">{t.investmentDistribution}</h4>
                       <div className="flex items-center gap-4">
                          <div className="flex-1 h-3 bg-slate-900 rounded-full overflow-hidden flex">
                             {getPartnerIntel(intelPartner).wellDetails.map((w, i) => (
                                // Merged duplicate style attributes into a single style object.
                                <div key={i} style={{ width: `${(w.dailyRevenue / (getPartnerIntel(intelPartner).totalRevenue || 1)) * 100}%`, opacity: 1 - (i * 0.2) }} className={`h-full bg-[#00AEEF] border-r border-slate-950 last:border-0`}></div>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="bg-slate-950/50 rounded-3xl border border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-800">
                       <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">{t.wellsContributed}</h4>
                    </div>
                    <table className="w-full text-right">
                       <thead className="bg-slate-900/50 text-slate-600 text-[10px] font-black uppercase tracking-widest">
                          <tr>
                             <th className="px-8 py-4">{t.wellName}</th>
                             <th className="px-8 py-4">{t.shareInWell}</th>
                             <th className="px-8 py-4">{t.amount} (EST)</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-800">
                          {getPartnerIntel(intelPartner).wellDetails.map((w, i) => (
                             <tr key={i} className="hover:bg-slate-800/20">
                                <td className="px-8 py-4 text-white font-bold">{w.name}</td>
                                <td className="px-8 py-4 text-[#00AEEF] font-black">{w.share}%</td>
                                <td className="px-8 py-4 font-mono text-green-500 font-bold">${w.dailyRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                             </tr>
                          ))}
                          {getPartnerIntel(intelPartner).wellDetails.length === 0 && (
                            <tr><td colSpan={3} className="p-8 text-center text-slate-600 italic">No direct well participation found.</td></tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PartnersManager;
