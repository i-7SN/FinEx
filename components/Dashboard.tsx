
import React from 'react';
import { DashboardStats, Locale } from '../types';
import { TRANSLATIONS } from '../constants';

interface DashboardProps {
  stats: DashboardStats;
  locale: Locale;
  notifications?: string[];
}

const StatCard = ({ title, value, unit = "", icon, trend, isLive, locale }: { title: string, value: string | number, unit?: string, icon: React.ReactNode, trend?: number, isLive?: boolean, locale: Locale }) => (
  <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-800 hover:border-[#00AEEF] transition-all group relative overflow-hidden shadow-xl">
    <div className="flex justify-between items-start mb-6 relative z-10">
      <div className="bg-slate-900 p-3 rounded-2xl text-slate-400 group-hover:text-[#00AEEF] transition-colors">{icon}</div>
      {isLive && (
        <span className="flex items-center gap-1.5 text-[10px] font-black text-[#00AEEF] tracking-[0.2em] animate-pulse">
          <span className="w-1.5 h-1.5 bg-[#00AEEF] rounded-full"></span>
          {TRANSLATIONS[locale].realTime}
        </span>
      )}
    </div>
    <div className="relative z-10">
      <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">{title}</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-black text-white tracking-tighter">{value}</span>
        {unit && <span className="text-[#00AEEF] font-black text-sm">{unit}</span>}
      </div>
      {trend !== undefined && trend !== 0 && (
        <div className={`mt-4 text-[11px] font-bold flex items-center gap-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          <svg className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          {trend > 0 ? '+' : ''}{trend.toFixed(3)}%
        </div>
      )}
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ stats, locale, notifications = [] }) => {
  const t = TRANSLATIONS[locale];
  
  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Total Assets - Vault Icon */}
        <StatCard 
          locale={locale} 
          title={t.totalAssets} 
          value={`$${stats.totalAssets.toLocaleString()}`} 
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11a3 3 0 100 6 3 3 0 000-6zM12 14h.01" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11l-4 4-4-4" />
            </svg>
          } 
        />
        
        {/* Total Liabilities - Balance Scale/Downward Debt Icon */}
        <StatCard 
          locale={locale} 
          title={t.totalLiabilities} 
          value={`$${stats.totalLiabilities.toLocaleString()}`} 
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          } 
        />
        
        {/* Actual Production - Oil Derrick/Rig Icon */}
        <StatCard 
          locale={locale} 
          title={t.actualProduction} 
          value={stats.productionBBL.toLocaleString()} 
          unit="BBL" 
          isLive={true} 
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2L8 22M12 2l4 22M4 14h16M7 7h10M12 2v20M9 22h6" />
              <circle cx="12" cy="14" r="1.5" fill="currentColor" />
            </svg>
          } 
        />
        
        {/* WTI Price - Trading Candles Icon */}
        <StatCard 
          locale={locale} 
          title={t.wtiPrice} 
          value={`$${stats.wtiPrice.toFixed(2)}`} 
          isLive={true} 
          trend={stats.wtiChange} 
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6v12M12 4v16M17 8v8M5 10h4M10 8h4M15 12h4" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18" />
            </svg>
          } 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#1e293b] rounded-3xl border border-slate-800 p-8 shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-[#00AEEF] font-black uppercase tracking-widest text-sm">{t.surveillanceFeed}</h4>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">MONITORING ACTIVE</span>
            </span>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="text-center py-20 text-slate-600 italic">No recent surveillance alerts. System status: SECURE.</div>
            ) : (
              notifications.map((note, i) => (
                <div key={i} className="flex gap-4 p-4 bg-slate-900/50 rounded-2xl border border-slate-800 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-[#00AEEF]/10 p-3 rounded-xl text-[#00AEEF] h-fit">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white uppercase mb-1">{t.notification}</h5>
                    <p className="text-sm text-slate-400 font-medium">{note}</p>
                    <span className="text-[10px] text-slate-600 font-mono mt-2 block uppercase">{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="bg-[#1e293b] rounded-3xl border border-slate-800 p-8 shadow-2xl">
           <h4 className="text-slate-500 font-black uppercase tracking-widest text-[10px] mb-8">System Summary</h4>
           <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                 <span className="text-slate-400 text-sm font-bold">Active Partners</span>
                 <span className="text-white font-black">{stats.totalPartners}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                 <span className="text-slate-400 text-sm font-bold">Volatility</span>
                 <span className="text-amber-500 font-black uppercase tracking-tighter">Normal</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                 <span className="text-slate-400 text-sm font-bold">Latency</span>
                 <span className="text-green-500 font-black">4ms</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
