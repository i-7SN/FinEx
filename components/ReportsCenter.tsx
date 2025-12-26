
import React, { useState } from 'react';
import { Locale, InventoryItem, Well, Partner, JournalEntry, InventoryLogEntry } from '../types';
import { TRANSLATIONS, WELL_STATUS_MAP } from '../constants';
import { GoogleGenAI } from "@google/genai";

interface ReportsCenterProps {
  locale: Locale;
  data: {
    inventory: InventoryItem[];
    inventoryLogs: InventoryLogEntry[];
    wells: Well[];
    partners: Partner[];
    entries: JournalEntry[];
  };
}

const ReportsCenter: React.FC<ReportsCenterProps> = ({ locale, data }) => {
  const t = TRANSLATIONS[locale];
  const [previewingCategory, setPreviewingCategory] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const categories = [
    { id: 'financial', title: t.financialReport, icon: '💰', raw: data.entries },
    { id: 'inventory', title: t.inventoryReportFull, icon: '📦', raw: data.inventoryLogs },
    { id: 'operational', title: t.operationalReport, icon: '🛢️', raw: data.wells },
    { id: 'partners', title: t.partnersReport, icon: '🤝', raw: data.partners }
  ];

  const handleDownloadRaw = (category: string) => {
    const reportData = categories.find(c => c.id === category)?.raw;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finex_${category}_raw_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleGenerateAiAnalysis = async (category: string) => {
    setIsAnalyzing(true);
    setAiAnalysis('');
    const targetData = categories.find(c => c.id === category)?.raw;
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `You are a high-level Energy Sector Auditor and Data Scientist for FinEx.
      Analyze this ${category} data with extreme precision:
      - Detect anomalies or inconsistencies.
      - Calculate performance efficiency.
      - Suggest critical optimizations for the next fiscal period.
      Format: Executive Summary with clear bullet points.
      Language: ${locale === 'ar' ? 'Arabic (Modern Standard)' : 'English'}.
      Data: ${JSON.stringify(targetData)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAiAnalysis(response.text || 'Analysis failed.');
    } catch (error) {
      console.error(error);
      setAiAnalysis('Analysis service unavailable.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadAiReport = () => {
    const blob = new Blob([aiAnalysis], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finex_ai_executive_analysis_${new Date().getTime()}.txt`;
    a.click();
  };

  const renderDetailedTable = (id: string) => {
    switch (id) {
      case 'financial':
        return (
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-500 uppercase font-black tracking-widest sticky top-0">
              <tr><th className="p-3">Date</th><th className="p-3">Description</th><th className="p-3">Lines</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.entries.map(e => (
                <tr key={e.id} className="hover:bg-slate-800/30">
                  <td className="p-3 font-mono text-slate-400">{e.date}</td>
                  <td className="p-3 text-white font-bold">{e.description}</td>
                  <td className="p-3 text-[#00AEEF]">{e.debitLines.length + e.creditLines.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'inventory':
        return (
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-500 uppercase font-black tracking-widest sticky top-0">
              <tr><th className="p-3">Item</th><th className="p-3">Type</th><th className="p-3">Before</th><th className="p-3">After</th><th className="p-3">Target</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.inventoryLogs.map(l => (
                <tr key={l.id} className="hover:bg-slate-800/30">
                  <td className="p-3 text-white font-bold">{l.itemName}</td>
                  <td className="p-3 font-black text-[#00AEEF]">{l.type}</td>
                  <td className="p-3 text-slate-500">{l.quantityBefore}</td>
                  <td className="p-3 text-green-500 font-bold">{l.quantityAfter}</td>
                  <td className="p-3 text-xs opacity-60">{l.wellName || 'Storage'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'operational':
        return (
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-500 uppercase font-black tracking-widest sticky top-0">
              <tr><th className="p-3">Well</th><th className="p-3">Status</th><th className="p-3">Yield</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.wells.map(w => (
                <tr key={w.id} className="hover:bg-slate-800/30">
                  <td className="p-3 text-white font-bold">{w.name}</td>
                  <td className="p-3"><span className={`${WELL_STATUS_MAP[w.status].color} font-black`}>{WELL_STATUS_MAP[w.status][locale]}</span></td>
                  <td className="p-3 font-mono text-[#00AEEF]">{w.dailyYield} BBL</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'partners':
        return (
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-500 uppercase font-black tracking-widest sticky top-0">
              <tr><th className="p-3">Partner</th><th className="p-3">Share</th><th className="p-3">Credit</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.partners.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/30">
                  <td className="p-3 text-white font-bold">{p.name}</td>
                  <td className="p-3 text-[#00AEEF] font-black">{p.sharePercent}%</td>
                  <td className="p-3 font-mono text-green-500">${p.creditLimit.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-[#1e293b] p-8 rounded-3xl border border-slate-800 shadow-xl group hover:border-[#00AEEF] transition-all relative overflow-hidden">
             <div className="flex justify-between items-start mb-6">
                <span className="text-4xl">{cat.icon}</span>
                <div className="flex gap-2">
                   <button 
                     onClick={() => setPreviewingCategory(cat.id)}
                     className="p-2.5 bg-slate-900 rounded-xl text-[#00AEEF] hover:bg-[#00AEEF] hover:text-white transition-all shadow-lg"
                     title={t.preview}
                   >
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                   </button>
                   <button 
                     onClick={() => handleDownloadRaw(cat.id)}
                     className="p-2.5 bg-slate-900 rounded-xl text-slate-400 hover:bg-[#00AEEF] hover:text-white transition-all shadow-lg"
                     title={t.download}
                   >
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                   </button>
                </div>
             </div>
             <h4 className="text-white font-black text-lg mb-1">{cat.title}</h4>
             <div className="w-10 h-1 bg-[#00AEEF] rounded-full mt-2"></div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewingCategory && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#1e293b] w-full max-w-6xl h-[90vh] rounded-[40px] border border-slate-700 shadow-2xl overflow-hidden flex flex-col scale-in">
            <div className="p-10 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <div>
                 <h3 className="text-white font-black text-3xl uppercase tracking-tighter">
                   {categories.find(c => c.id === previewingCategory)?.title}
                 </h3>
                 <p className="text-[#00AEEF] text-xs font-black uppercase tracking-widest mt-1">{t.precisionReportTitle}</p>
              </div>
              <button onClick={() => { setPreviewingCategory(null); setAiAnalysis(''); }} className="bg-slate-800 p-3 rounded-2xl text-slate-400 hover:text-white transition-colors">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Detailed Table Section */}
              <div className="w-3/5 p-10 overflow-y-auto border-r border-slate-800 custom-scrollbar bg-slate-900/10">
                 <h5 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6">LIVE AUDIT FEED</h5>
                 <div className="bg-slate-950/40 rounded-3xl border border-slate-800 overflow-hidden shadow-inner">
                   {renderDetailedTable(previewingCategory)}
                 </div>
              </div>

              {/* AI Analysis Section */}
              <div className="w-2/5 p-10 flex flex-col bg-slate-900/60 relative">
                <div className="flex justify-between items-center mb-6">
                   <h5 className="text-[#00AEEF] text-xs font-black uppercase tracking-widest flex items-center gap-3">
                     <span className="w-3 h-3 bg-[#00AEEF] rounded-full animate-pulse shadow-[0_0_10px_#00AEEF]"></span>
                     {t.aiAnalysis}
                   </h5>
                   {aiAnalysis && (
                     <button 
                       onClick={downloadAiReport}
                       className="bg-[#00AEEF]/10 hover:bg-[#00AEEF] text-[#00AEEF] hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-[#00AEEF]/30 shadow-lg"
                     >
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                       {t.downloadAiReport}
                     </button>
                   )}
                </div>

                <div className="flex-1 bg-slate-950/80 rounded-[32px] border border-slate-700/50 p-8 overflow-y-auto custom-scrollbar relative shadow-2xl backdrop-blur-md">
                   {isAnalyzing ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
                        <div className="w-16 h-16 border-4 border-[#00AEEF] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(0,174,239,0.3)]"></div>
                        <span className="text-xs text-[#00AEEF] font-black uppercase tracking-widest animate-pulse">{t.aiGenerating}</span>
                     </div>
                   ) : aiAnalysis ? (
                     <div className="prose prose-invert prose-sm max-w-none text-slate-100 leading-relaxed font-medium">
                        {aiAnalysis.split('\n').map((line, i) => (
                          <p key={i} className="mb-4">{line}</p>
                        ))}
                     </div>
                   ) : (
                     <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
                        <div className="bg-slate-900 w-24 h-24 flex items-center justify-center rounded-[32px] border border-slate-800 text-6xl shadow-xl">🤖</div>
                        <p className="text-slate-400 text-sm font-bold max-w-xs">{t.aiReportPlaceholder}</p>
                        <button 
                          onClick={() => handleGenerateAiAnalysis(previewingCategory)}
                          className="bg-[#00AEEF] hover:bg-[#00CFFF] text-white font-black px-12 py-5 rounded-[24px] shadow-[0_15px_30px_rgba(0,174,239,0.3)] hover:translate-y-[-2px] active:translate-y-[1px] transition-all"
                        >
                          {t.generateAiAnalysis}
                        </button>
                     </div>
                   )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsCenter;
