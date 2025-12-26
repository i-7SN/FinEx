
import React from 'react';
import { AuditLogEntry, Locale, JournalEntry, Partner, Well, InventoryItem } from '../types';
import { TRANSLATIONS, WELL_STATUS_MAP } from '../constants';

interface AuditLogProps {
  logs: AuditLogEntry[];
  locale: Locale;
}

const EntryPreview = ({ entry, locale, title, colorClass }: { entry: JournalEntry, locale: Locale, title: string, colorClass: string }) => {
  const t = TRANSLATIONS[locale];
  return (
    <div className={`p-4 rounded-xl border border-slate-800 bg-slate-950/50 ${colorClass}`}>
      <h5 className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">{title}</h5>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">{t.date}:</span>
          <span className="text-white font-mono">{entry.date}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">{t.description}:</span>
          <span className="text-white">{entry.description || '-'}</span>
        </div>
      </div>
    </div>
  );
};

const PartnerPreview = ({ partner, locale, title, colorClass }: { partner: Partner, locale: Locale, title: string, colorClass: string }) => {
  const t = TRANSLATIONS[locale];
  return (
    <div className={`p-4 rounded-xl border border-slate-800 bg-slate-950/50 ${colorClass}`}>
      <h5 className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">{title}</h5>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">{t.partnerName}:</span>
          <span className="text-white font-bold">{partner.name}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">{t.sharePercent}:</span>
          <span className="text-[#00AEEF] font-black">{partner.sharePercent}%</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">{t.creditLimit}:</span>
          <span className="text-white font-bold">${partner.creditLimit.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

const WellPreview = ({ well, locale, title, colorClass }: { well: Well, locale: Locale, title: string, colorClass: string }) => {
  const t = TRANSLATIONS[locale];
  return (
    <div className={`p-4 rounded-xl border border-slate-800 bg-slate-950/50 ${colorClass}`}>
      <h5 className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">{title}</h5>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">{t.wellName}:</span>
          <span className="text-white font-bold">{well.name}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">{t.status}:</span>
          <span className={`${WELL_STATUS_MAP[well.status].color} font-bold`}>{WELL_STATUS_MAP[well.status][locale]}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">{t.yield}:</span>
          <span className="text-white font-mono">{well.dailyYield} BBL</span>
        </div>
      </div>
    </div>
  );
};

const InventoryPreview = ({ item, locale, title, colorClass, isDeleted }: { item: InventoryItem, locale: Locale, title: string, colorClass: string, isDeleted?: boolean }) => {
  const t = TRANSLATIONS[locale];
  return (
    <div className={`p-4 rounded-xl border border-slate-800 bg-slate-950/50 ${colorClass}`}>
      <h5 className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">{title}</h5>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">{t.materialName}:</span>
          <span className="text-white font-bold">{item.name}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className={isDeleted ? 'text-red-400' : 'text-slate-400'}>{isDeleted ? t.quantityRemoved : t.quantity}:</span>
          <span className={`font-mono font-bold ${isDeleted ? 'text-red-500' : 'text-white'}`}>{item.quantity}</span>
        </div>
        <div className="flex justify-between text-xs border-t border-slate-800 pt-2 mt-2">
          <span className={isDeleted ? 'text-red-400 font-bold' : 'text-slate-400'}>{isDeleted ? t.valueLost : t.totalPrice}:</span>
          <span className={`font-mono font-black ${isDeleted ? 'text-red-500' : 'text-[#00AEEF]'}`}>${(item.totalPrice || 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

const AuditLog: React.FC<AuditLogProps> = ({ logs, locale }) => {
  const t = TRANSLATIONS[locale];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-[#1e293b] rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 className="text-[#00AEEF] font-bold tracking-wide uppercase text-sm">{t.auditLog}</h3>
          <span className="text-[10px] text-slate-500 font-black tracking-widest">{logs.length} ACTIONS LOGGED</span>
        </div>
        
        <div className="p-8 space-y-8 h-[calc(100vh-350px)] overflow-y-auto custom-scrollbar">
          {logs.map((log) => (
            <div key={log.id} className="relative pl-8 border-l-2 border-slate-800 pb-8 last:pb-0">
              <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-slate-950 ${log.type === 'DELETE' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter ${log.type === 'DELETE' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                    {log.type === 'DELETE' ? t.delete : t.update} ({log.entityType})
                  </span>
                  <div className="flex items-center gap-2 bg-slate-950/50 px-3 py-1 rounded-full border border-slate-800">
                    <span className="text-[9px] text-slate-500 font-black uppercase">{t.performedBy}:</span>
                    <span className="text-[9px] text-[#00AEEF] font-black uppercase tracking-tight">{log.performedBy.name}</span>
                    <span className="text-[8px] text-slate-600 font-medium">({log.performedBy.title})</span>
                  </div>
                </div>
                <span className="text-slate-500 text-[10px] font-mono">{log.timestamp}</span>
              </div>

              <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/50">
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-[#00AEEF] mb-2 uppercase tracking-wide">{t.actionReason}</h4>
                  <p className="text-sm text-white italic bg-slate-950/50 p-3 rounded-lg border border-slate-800 shadow-inner">
                    "{log.reason}"
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {log.entityType === 'ENTRY' && <EntryPreview entry={log.originalData} locale={locale} title={t.beforeEdit} colorClass="" />}
                  {log.entityType === 'PARTNER' && <PartnerPreview partner={log.originalData} locale={locale} title={t.beforeEdit} colorClass="" />}
                  {log.entityType === 'WELL' && <WellPreview well={log.originalData} locale={locale} title={t.beforeEdit} colorClass="" />}
                  {log.entityType === 'INVENTORY' && <InventoryPreview item={log.originalData} locale={locale} title={log.type === 'DELETE' ? t.deletedEntry : t.beforeEdit} colorClass={log.type === 'DELETE' ? 'border-red-500/30' : ''} isDeleted={log.type === 'DELETE'} />}

                  {log.type === 'UPDATE' && log.updatedData && (
                    <>
                      {log.entityType === 'ENTRY' && <EntryPreview entry={log.updatedData} locale={locale} title={t.afterEdit} colorClass="border-green-500/20" />}
                      {log.entityType === 'PARTNER' && <PartnerPreview partner={log.updatedData} locale={locale} title={t.afterEdit} colorClass="border-green-500/20" />}
                      {log.entityType === 'WELL' && <WellPreview well={log.updatedData} locale={locale} title={t.afterEdit} colorClass="border-green-500/20" />}
                      {log.entityType === 'INVENTORY' && <InventoryPreview item={log.updatedData} locale={locale} title={t.afterEdit} colorClass="border-green-500/20" />}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="py-20 text-center text-slate-600 italic">No audit records found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
