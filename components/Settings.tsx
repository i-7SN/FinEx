
import React, { useRef, useState, useEffect } from 'react';
import { Locale, AppSettings } from '../types';
import { TRANSLATIONS } from '../constants';

interface SettingsProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, updateSettings, onExport, onImport }) => {
  const t = TRANSLATIONS[settings.locale];
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImport(file);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* General Appearance & Language */}
        <div className="bg-[#1e293b] p-10 rounded-[40px] border border-slate-800 shadow-2xl space-y-10">
          <div>
            <h3 className="text-[#00AEEF] font-black text-xl uppercase tracking-widest mb-6 flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              {t.appearance}
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                <span className="text-sm font-bold text-slate-300">{t.darkMode}</span>
                <button 
                  onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
                  className={`w-14 h-8 rounded-full relative transition-all duration-300 ${settings.theme === 'dark' ? 'bg-[#00AEEF]' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 ${settings.theme === 'dark' ? 'left-7' : 'left-1 shadow-md'}`}></div>
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{t.language}</label>
                <div className="grid grid-cols-2 gap-3">
                   <button 
                    onClick={() => updateSettings({ locale: 'ar' })}
                    className={`py-4 rounded-2xl font-bold border transition-all ${settings.locale === 'ar' ? 'bg-[#00AEEF] text-white border-[#00AEEF] shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white'}`}
                   >
                     العربية
                   </button>
                   <button 
                    onClick={() => updateSettings({ locale: 'en' })}
                    className={`py-4 rounded-2xl font-bold border transition-all ${settings.locale === 'en' ? 'bg-[#00AEEF] text-white border-[#00AEEF] shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white'}`}
                   >
                     English
                   </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[#00AEEF] font-black text-xl uppercase tracking-widest mb-6 flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {t.currencyFormat}
            </h3>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{t.mainCurrency}</label>
              <select 
                value={settings.currency}
                onChange={(e) => updateSettings({ currency: e.target.value as 'USD' | 'IQD' })}
                className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-[#00AEEF] appearance-none cursor-pointer"
              >
                <option value="USD">{t.usd}</option>
                <option value="IQD">{t.iqd}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Backup & System info */}
        <div className="bg-[#1e293b] p-10 rounded-[40px] border border-slate-800 shadow-2xl space-y-10 flex flex-col justify-between">
           <div>
            <h3 className="text-[#00AEEF] font-black text-xl uppercase tracking-widest mb-6 flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              {t.backupTitle}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <button 
                 onClick={onExport}
                 className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-3xl hover:border-[#00AEEF]/50 transition-all group"
               >
                 <div className="bg-[#00AEEF]/10 p-3 rounded-2xl text-[#00AEEF] mb-4 group-hover:scale-110 transition-transform">
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                 </div>
                 <span className="text-sm font-bold text-white uppercase tracking-tighter">{t.exportData}</span>
               </button>

               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-3xl hover:border-green-500/50 transition-all group"
               >
                 <div className="bg-green-500/10 p-3 rounded-2xl text-green-500 mb-4 group-hover:scale-110 transition-transform">
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                 </div>
                 <span className="text-sm font-bold text-white uppercase tracking-tighter">{t.importData}</span>
                 <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
               </button>
            </div>
           </div>

           <div className="space-y-6">
              {/* PWA INSTALL BUTTON */}
              {deferredPrompt && (
                <button 
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-center gap-4 p-5 bg-gradient-to-r from-[#00AEEF] to-[#00CFFF] rounded-[24px] text-white font-black shadow-xl hover:scale-[1.02] transition-all animate-bounce"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  {t.installApp}
                </button>
              )}

              <div className="bg-slate-950/50 p-8 rounded-3xl border border-slate-800">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">{t.systemInfo}</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <span className="text-slate-400 text-sm font-medium">{t.version}</span>
                      <span className="text-white font-tech font-bold text-xs uppercase tracking-widest">FineX v2.0 (PWA)</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm font-medium">{t.storageStatus}</span>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-green-500 text-xs font-black uppercase">{t.active} (Offline-Ready)</span>
                      </span>
                  </div>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
