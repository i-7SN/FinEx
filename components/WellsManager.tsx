
import React, { useState, useMemo, useEffect } from 'react';
import { Well, WellStatus, Locale, Partner, WellPartnerShare } from '../types';
import { TRANSLATIONS, WELL_STATUS_MAP } from '../constants';

interface WellsManagerProps {
  wells: Well[];
  partners: Partner[];
  onAdd: (well: Omit<Well, 'id'>) => void;
  onUpdate: (id: string, well: Partial<Well>) => void;
  onDelete: (id: string) => void;
  locale: Locale;
}

const WellsManager: React.FC<WellsManagerProps> = ({ wells, partners, onAdd, onUpdate, onDelete, locale }) => {
  const t = TRANSLATIONS[locale];
  
  // Add Form States
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newYield, setNewYield] = useState(0);
  const [newStatus, setNewStatus] = useState<WellStatus>(WellStatus.EXPLORATION);
  const [wellShares, setWellShares] = useState<WellPartnerShare[]>([]);

  // Edit Form States
  const [editingWell, setEditingWell] = useState<Well | null>(null);
  const [editName, setEditName] = useState('');
  const [editYield, setEditYield] = useState(0);
  const [editStatus, setEditStatus] = useState<WellStatus>(WellStatus.EXPLORATION);
  const [editShares, setEditShares] = useState<WellPartnerShare[]>([]);

  const totalSharePercent = useMemo(() => wellShares.reduce((sum, s) => sum + s.percent, 0), [wellShares]);
  const totalEditSharePercent = useMemo(() => editShares.reduce((sum, s) => sum + s.percent, 0), [editShares]);

  // Initializing edit form when a well is selected for editing
  useEffect(() => {
    if (editingWell) {
      setEditName(editingWell.name);
      setEditYield(editingWell.dailyYield);
      setEditStatus(editingWell.status);
      setEditShares(editingWell.shares || []);
    }
  }, [editingWell]);

  const addPartnerToWell = (isEdit: boolean) => {
    if (partners.length === 0) return;
    const firstPartner = partners[0];
    const newShare = { partnerId: firstPartner.id, partnerName: firstPartner.name, percent: 0 };
    if (isEdit) setEditShares([...editShares, newShare]);
    else setWellShares([...wellShares, newShare]);
  };

  const removePartnerFromWell = (isEdit: boolean, idx: number) => {
    if (isEdit) setEditShares(editShares.filter((_, i) => i !== idx));
    else setWellShares(wellShares.filter((_, i) => i !== idx));
  };

  const updateWellShare = (isEdit: boolean, idx: number, field: keyof WellPartnerShare, value: any) => {
    const shares = isEdit ? [...editShares] : [...wellShares];
    if (field === 'partnerId') {
      const p = partners.find(x => x.id === value);
      shares[idx] = { ...shares[idx], partnerId: value, partnerName: p?.name || '' };
    } else {
      shares[idx] = { ...shares[idx], [field]: value };
    }
    if (isEdit) setEditShares(shares);
    else setWellShares(shares);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    if (totalSharePercent > 100) {
      alert(t.totalShareExceeded);
      return;
    }
    onAdd({ name: newName, dailyYield: newYield, status: newStatus, shares: wellShares });
    setNewName('');
    setNewYield(0);
    setWellShares([]);
    setIsAdding(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWell) return;
    if (totalEditSharePercent > 100) {
      alert(t.totalShareExceeded);
      return;
    }
    
    // Pass updated data to the parent which will trigger the reason prompt
    onUpdate(editingWell.id, {
      name: editName,
      dailyYield: editYield,
      status: editStatus,
      shares: editShares
    });
    
    setEditingWell(null);
  };

  return (
    <div className="bg-[#1e293b] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden page-transition">
      <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <h3 className="text-[#00AEEF] font-bold text-xl">{t.wellsManager}</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[#00AEEF] hover:bg-[#0092c7] text-white px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95"
        >
          {isAdding ? t.cancel : t.addWell}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddSubmit} className="p-8 bg-slate-900/30 border-b border-slate-800 space-y-8 animate-in fade-in slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{t.wellName}</label>
              <input 
                type="text" required
                placeholder={t.wellName} 
                value={newName} 
                onChange={e => setNewName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-[#00AEEF] outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{t.yield}</label>
              <input 
                type="number" required
                placeholder={t.yield} 
                value={newYield || ''} 
                onChange={e => setNewYield(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-[#00AEEF] outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{t.status}</label>
              <select 
                value={newStatus} 
                onChange={e => setNewStatus(e.target.value as WellStatus)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-[#00AEEF] outline-none appearance-none"
              >
                {Object.entries(WellStatus).map(([key, val]) => (
                  <option key={key} value={val} className="bg-slate-900">{WELL_STATUS_MAP[val][locale]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center mb-4">
               <h4 className="text-sm font-black text-white uppercase tracking-widest">{t.partnerAllocation}</h4>
               <button type="button" onClick={() => addPartnerToWell(false)} className="text-[#00AEEF] text-xs font-black hover:underline">+ {t.addPartner}</button>
            </div>
            
            <div className="space-y-4">
              {wellShares.map((share, idx) => (
                <div key={idx} className="flex gap-4 items-end animate-in fade-in duration-300">
                   <div className="flex-1">
                      <label className="block text-[10px] text-slate-600 mb-1 uppercase">{t.selectPartner}</label>
                      <select 
                        value={share.partnerId}
                        onChange={e => updateWellShare(false, idx, 'partnerId', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white text-sm"
                      >
                        {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                   </div>
                   <div className="w-48">
                      <label className="block text-[10px] text-slate-600 mb-1 uppercase">{t.shareInWell}</label>
                      <input 
                        type="number" 
                        value={share.percent || ''}
                        onChange={e => updateWellShare(false, idx, 'percent', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white text-sm"
                      />
                   </div>
                   <button type="button" onClick={() => removePartnerFromWell(false, idx)} className="p-2 text-slate-700 hover:text-red-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg>
                   </button>
                </div>
              ))}
              {wellShares.length > 0 && (
                <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                  <span className="text-xs text-slate-500">{t.totalShareExceeded}</span>
                  <span className={`font-mono font-black ${totalSharePercent > 100 ? 'text-red-500' : 'text-[#00AEEF]'}`}>
                    {totalSharePercent}% / 100%
                  </span>
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl active:scale-95">
            {t.addWellBtn}
          </button>
        </form>
      )}

      {/* Editing Well Modal */}
      {editingWell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#1e293b] w-full max-w-4xl rounded-3xl border border-slate-700 shadow-2xl overflow-hidden scale-in duration-300 max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
               <h3 className="text-white font-black text-2xl">{t.edit}: {editingWell.name}</h3>
               <button onClick={() => setEditingWell(null)} className="text-slate-500 hover:text-white">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{t.wellName}</label>
                  <input 
                    type="text" required
                    value={editName} 
                    onChange={e => setEditName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-[#00AEEF] outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{t.yield}</label>
                  <input 
                    type="number" required
                    value={editYield} 
                    onChange={e => setEditYield(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-[#00AEEF] outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{t.status}</label>
                  <select 
                    value={editStatus} 
                    onChange={e => setEditStatus(e.target.value as WellStatus)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-[#00AEEF] outline-none appearance-none"
                  >
                    {Object.entries(WellStatus).map(([key, val]) => (
                      <option key={key} value={val} className="bg-slate-900">{WELL_STATUS_MAP[val][locale]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center mb-4">
                   <h4 className="text-sm font-black text-white uppercase tracking-widest">{t.partnerAllocation}</h4>
                   <button type="button" onClick={() => addPartnerToWell(true)} className="text-[#00AEEF] text-xs font-black hover:underline">+ {t.addPartner}</button>
                </div>
                
                <div className="space-y-4">
                  {editShares.map((share, idx) => (
                    <div key={idx} className="flex gap-4 items-end">
                       <div className="flex-1">
                          <label className="block text-[10px] text-slate-600 mb-1 uppercase">{t.selectPartner}</label>
                          <select 
                            value={share.partnerId}
                            onChange={e => updateWellShare(true, idx, 'partnerId', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white text-sm"
                          >
                            {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                       </div>
                       <div className="w-48">
                          <label className="block text-[10px] text-slate-600 mb-1 uppercase">{t.shareInWell}</label>
                          <input 
                            type="number" 
                            value={share.percent || ''}
                            onChange={e => updateWellShare(true, idx, 'percent', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white text-sm"
                          />
                       </div>
                       <button type="button" onClick={() => removePartnerFromWell(true, idx)} className="p-2 text-slate-700 hover:text-red-500">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg>
                       </button>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                    <span className="text-xs text-slate-500">{t.totalShareExceeded}</span>
                    <span className={`font-mono font-black ${totalEditSharePercent > 100 ? 'text-red-500' : 'text-[#00AEEF]'}`}>
                      {totalEditSharePercent}% / 100%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                 <button type="submit" className="flex-1 bg-[#00AEEF] hover:bg-[#0092c7] text-white font-black py-4 rounded-2xl transition-all shadow-xl active:scale-95">
                    {t.save}
                 </button>
                 <button type="button" onClick={() => setEditingWell(null)} className="px-10 bg-slate-800 text-white font-bold py-4 rounded-2xl">
                    {t.cancel}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-slate-900/80 text-slate-500 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="px-8 py-5">{t.wellName}</th>
              <th className="px-8 py-5">{t.status}</th>
              <th className="px-8 py-5">{t.partnerAllocation}</th>
              <th className="px-8 py-5 text-center">{t.yield}</th>
              <th className="px-8 py-5 text-center">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {wells.map(well => (
              <tr key={well.id} className="hover:bg-slate-800/30 transition-colors group/row">
                <td className="px-8 py-6 text-white font-bold">{well.name}</td>
                <td className="px-8 py-6">
                  <span className={`font-bold text-sm ${WELL_STATUS_MAP[well.status].color}`}>
                    {WELL_STATUS_MAP[well.status][locale]}
                  </span>
                </td>
                <td className="px-8 py-6">
                   <div className="flex flex-wrap gap-2">
                      {well.shares.map((s, i) => (
                        <span key={i} className="text-[10px] bg-slate-900 px-2 py-1 rounded-md text-slate-400 border border-slate-800">
                           {s.partnerName}: <span className="text-[#00AEEF]">{s.percent}%</span>
                        </span>
                      ))}
                      {well.shares.length === 0 && <span className="text-slate-600 text-[10px] italic">No allocation</span>}
                   </div>
                </td>
                <td className="px-8 py-6 text-center font-mono text-slate-300">
                  {well.dailyYield.toLocaleString()} <span className="text-[10px] text-slate-600">BBL</span>
                </td>
                <td className="px-8 py-6 text-center">
                  <div className="flex justify-center gap-2">
                     <button 
                       onClick={() => setEditingWell(well)} 
                       className="p-2 text-slate-700 hover:text-[#00AEEF] transition-all"
                       title={t.edit}
                     >
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                     </button>
                     <button 
                       onClick={() => onDelete(well.id)} 
                       className="p-2 text-slate-700 hover:text-red-500 transition-all"
                       title={t.delete}
                     >
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg>
                     </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WellsManager;
