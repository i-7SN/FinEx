
import React, { useState, useMemo } from 'react';
import { InventoryItem, Locale, Well, InventoryLogEntry } from '../types';
import { TRANSLATIONS } from '../constants';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  inventoryLogs: InventoryLogEntry[];
  wells: Well[];
  locale: Locale;
  onAddMaterial: (item: Omit<InventoryItem, 'id'>) => void;
  onAddStock: (itemId: string, data: { quantity: number, date: string, memo: string }) => void;
  onUpdate: (id: string, data: Partial<InventoryItem>) => void;
  onDelete: (id: string) => void;
  onIssue: (itemId: string, data: { wellId: string, quantity: number, date: string, memo: string }) => void;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ inventory, inventoryLogs, wells, locale, onAddMaterial, onAddStock, onUpdate, onDelete, onIssue }) => {
  const t = TRANSLATIONS[locale];
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [issueTarget, setIssueTarget] = useState<InventoryItem | null>(null);
  const [addStockTarget, setAddStockTarget] = useState<InventoryItem | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    quantity: 0,
    unitPrice: 0,
    entryDate: new Date().toISOString().split('T')[0]
  });

  const [addStockForm, setAddStockForm] = useState({
    quantity: 0,
    date: new Date().toISOString().split('T')[0],
    memo: ''
  });

  const [issueForm, setIssueForm] = useState({
    wellId: '',
    quantity: 0,
    date: new Date().toISOString().split('T')[0],
    memo: ''
  });

  const totalStockValue = useMemo(() => (inventory || []).reduce((sum, item) => sum + (item.totalPrice || 0), 0), [inventory]);

  const handleCreateSubmit = () => {
    if (!createForm.name || createForm.quantity <= 0) return;
    onAddMaterial({ ...createForm, totalPrice: createForm.quantity * createForm.unitPrice });
    setIsCreateModalOpen(false);
    setCreateForm({ name: '', quantity: 0, unitPrice: 0, entryDate: new Date().toISOString().split('T')[0] });
  };

  const handleAddStockSubmit = () => {
    if (!addStockTarget || addStockForm.quantity <= 0) return;
    onAddStock(addStockTarget.id, addStockForm);
    setAddStockTarget(null);
    setAddStockForm({ quantity: 0, date: new Date().toISOString().split('T')[0], memo: '' });
  };

  const handleIssueSubmit = () => {
    if (!issueTarget || !issueForm.wellId || issueForm.quantity <= 0) return;
    if (issueForm.quantity > issueTarget.quantity) return alert(t.insufficientQuantity);
    onIssue(issueTarget.id, issueForm);
    setIssueTarget(null);
    setIssueForm({ wellId: '', quantity: 0, date: new Date().toISOString().split('T')[0], memo: '' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <button 
            id="inv-btn-add-new"
            onClick={() => setIsCreateModalOpen(true)} 
            className="bg-[#00AEEF] hover:bg-[#0092c7] text-white px-8 py-3 rounded-2xl font-bold shadow-xl transition-all"
          >
            {t.addMaterial}
          </button>
          <button 
            id="inv-btn-view-logs"
            onClick={() => setIsLogModalOpen(true)} 
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-2xl font-bold border border-slate-700 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {t.movementLog}
          </button>
        </div>
        <div className="text-right">
           <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest block">{t.totalStockValue}</span>
           <span className="text-white font-black text-2xl">${totalStockValue.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-[#1e293b] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-900/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="px-8 py-5">{t.materialName}</th>
              <th className="px-8 py-5 text-center">{t.quantity}</th>
              <th className="px-8 py-5 text-center">{t.unitPrice}</th>
              <th className="px-8 py-5 text-center">{t.totalPrice}</th>
              <th className="px-8 py-5 text-center">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {(inventory || []).map(item => (
              <tr key={item.id} className="hover:bg-slate-800/30 transition-all group">
                <td className="px-8 py-6 text-white font-bold">{item.name}</td>
                <td className="px-8 py-6 text-center">
                   <div className="flex items-center justify-center gap-2">
                      <span className="font-mono text-[#00AEEF] text-lg font-black">{item.quantity}</span>
                   </div>
                </td>
                <td className="px-8 py-6 text-center font-mono text-slate-400">${item.unitPrice.toLocaleString()}</td>
                <td className="px-8 py-6 text-center font-mono text-green-500 font-black">${item.totalPrice.toLocaleString()}</td>
                <td className="px-8 py-6 text-center">
                  <div className="flex justify-center gap-2">
                    <button 
                      onClick={() => setAddStockTarget(item)}
                      className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-all"
                      title={t.addStock}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    </button>
                    <button 
                      onClick={() => { setIssueTarget(item); }}
                      className="bg-[#00AEEF]/10 text-[#00AEEF] px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-[#00AEEF] hover:text-white transition-all"
                    >
                      {t.issueToWell}
                    </button>
                    <button onClick={() => onDelete(item.id)} className="p-2 text-slate-700 hover:text-red-500 transition-all">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(!inventory || inventory.length === 0) && (
              <tr><td colSpan={5} className="p-20 text-center text-slate-600 italic">No inventory available.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE NEW MATERIAL MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1e293b] w-full max-w-xl rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-white font-black text-xl uppercase">{t.addMaterial}</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-500 hover:text-white"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                   <label className="block text-[10px] text-slate-500 uppercase font-black mb-2">{t.materialName}</label>
                   <input type="text" value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-[#00AEEF]" />
                </div>
                <div>
                   <label className="block text-[10px] text-slate-500 uppercase font-black mb-2">{t.quantity}</label>
                   <input type="number" value={createForm.quantity || ''} onChange={e => setCreateForm({...createForm, quantity: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-[#00AEEF]" />
                </div>
                <div>
                   <label className="block text-[10px] text-slate-500 uppercase font-black mb-2">{t.unitPrice}</label>
                   <input type="number" value={createForm.unitPrice || ''} onChange={e => setCreateForm({...createForm, unitPrice: parseFloat(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-[#00AEEF]" />
                </div>
              </div>
              <button onClick={handleCreateSubmit} className="w-full bg-[#00AEEF] text-white font-black py-4 rounded-2xl shadow-xl">{t.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD STOCK MODAL (+) */}
      {addStockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-[#1e293b] w-full max-w-md rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                 <h3 className="text-white font-black text-lg uppercase">{t.addStock}: {addStockTarget.name}</h3>
                 <button onClick={() => setAddStockTarget(null)} className="text-slate-500 hover:text-white"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="p-8 space-y-6">
                 <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-black mb-2">{t.date}</label>
                    <input type="date" value={addStockForm.date} onChange={e => setAddStockForm({...addStockForm, date: e.target.value})} className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white outline-none" />
                 </div>
                 <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-black mb-2">{t.quantity}</label>
                    <input type="number" value={addStockForm.quantity || ''} onChange={e => setAddStockForm({...addStockForm, quantity: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white outline-none" />
                 </div>
                 <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-black mb-2">{t.memo} (إلزامي)</label>
                    <textarea 
                      required
                      value={addStockForm.memo} 
                      onChange={e => setAddStockForm({...addStockForm, memo: e.target.value})} 
                      className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white outline-none h-24 resize-none"
                    />
                 </div>
                 <button 
                  onClick={handleAddStockSubmit} 
                  disabled={!addStockForm.memo || addStockForm.quantity <= 0}
                  className="w-full bg-[#00AEEF] disabled:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-xl transition-all"
                >
                  {t.confirm}
                </button>
              </div>
           </div>
        </div>
      )}

      {/* ISSUE TO WELL MODAL */}
      {issueTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-[#1e293b] w-full max-w-lg rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                 <h3 className="text-white font-black text-xl uppercase">{t.issueToWell}: {issueTarget.name}</h3>
                 <button onClick={() => setIssueTarget(null)} className="text-slate-500 hover:text-white"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{t.selectWell}</label>
                       <select 
                          required
                          value={issueForm.wellId}
                          onChange={e => setIssueForm({...issueForm, wellId: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white outline-none appearance-none"
                       >
                          <option value="">{t.selectWell}</option>
                          {(wells || []).map(well => <option key={well.id} value={well.id}>{well.name}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{t.issueAmount} (Max: {issueTarget.quantity})</label>
                       <input 
                          type="number" max={issueTarget.quantity} min="1"
                          value={issueForm.quantity || ''}
                          onChange={e => setIssueForm({...issueForm, quantity: parseInt(e.target.value) || 0})}
                          className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white outline-none"
                       />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-black mb-2">{t.date}</label>
                    <input type="date" value={issueForm.date} onChange={e => setIssueForm({...issueForm, date: e.target.value})} className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white outline-none" />
                 </div>
                 <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-black mb-2">{t.memo} (إلزامي)</label>
                    <textarea 
                      required
                      value={issueForm.memo} 
                      onChange={e => setIssueForm({...issueForm, memo: e.target.value})} 
                      className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white outline-none h-24 resize-none"
                    />
                 </div>
                 <button 
                  onClick={handleIssueSubmit} 
                  disabled={!issueForm.memo || !issueForm.wellId || issueForm.quantity <= 0}
                  className="w-full bg-[#00AEEF] disabled:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-xl transition-all"
                >
                  {t.confirm}
                </button>
              </div>
           </div>
        </div>
      )}

      {/* MOVEMENT LOG MODAL */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-[#1e293b] w-full max-w-5xl rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                 <h3 className="text-white font-black text-2xl uppercase tracking-tighter">{t.movementHistory}</h3>
                 <button onClick={() => setIsLogModalOpen(false)} className="text-slate-500 hover:text-white"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="p-0 flex-1 overflow-y-auto custom-scrollbar">
                 <table className="w-full text-right border-collapse">
                    <thead className="bg-slate-900/80 sticky top-0 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                       <tr>
                          <th className="px-6 py-4">{t.date}</th>
                          <th className="px-6 py-4">{t.materialName}</th>
                          <th className="px-6 py-4 text-center">{t.beforeQty}</th>
                          <th className="px-6 py-4 text-center">{t.changeQty}</th>
                          <th className="px-6 py-4 text-center">{t.afterQty}</th>
                          <th className="px-6 py-4">{t.wells} / {t.memo}</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                       {(inventoryLogs || []).map((log) => (
                          <tr key={log.id} className="hover:bg-slate-800/30">
                             <td className="px-6 py-4 text-slate-500 text-[10px] font-mono whitespace-nowrap">{log.date}</td>
                             <td className="px-6 py-4 text-white font-bold">{log.itemName}</td>
                             <td className="px-6 py-4 text-center text-slate-500 font-mono">{log.quantityBefore}</td>
                             <td className={`px-6 py-4 text-center font-black ${log.quantityChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                             </td>
                             <td className="px-6 py-4 text-center text-[#00AEEF] font-black font-mono">{log.quantityAfter}</td>
                             <td className="px-6 py-4">
                                <div className="space-y-1">
                                   {log.wellName && <span className="text-[10px] bg-[#00AEEF]/10 text-[#00AEEF] px-2 py-0.5 rounded-md font-black uppercase block w-fit">{log.wellName}</span>}
                                   <p className="text-xs text-slate-400 italic">"{log.memo}"</p>
                                </div>
                             </td>
                          </tr>
                       ))}
                       {(!inventoryLogs || inventoryLogs.length === 0) && (
                          <tr><td colSpan={6} className="p-20 text-center text-slate-600 italic">No movement history found.</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
