
import React, { useState, useRef } from 'react';
import { User, Locale } from '../types';
import { TRANSLATIONS, Logo } from '../constants';
import { MASTER_ACTIVATION_CODE, verifyMasterKey, decryptUserFile, getDeviceFingerprint } from '../utils/security';

interface LoginProps {
  onLogin: (phone: string, pass: string, isAdmin: boolean) => void;
  onSetupAdmin: (name: string, phone: string, pass: string) => void;
  needsSetup: boolean;
  error?: string;
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSetupAdmin, needsSetup, error, locale, setLocale }) => {
  const t = TRANSLATIONS[locale];
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  // مفتاح التحقق (Master Key)
  const [activationCode, setActivationCode] = useState('');
  
  // نظام بوابة المدير
  const [showMasterKeyChallenge, setShowMasterKeyChallenge] = useState(false);
  const [masterKeyInput, setMasterKeyInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (needsSetup) {
      if (!activationCode || !fullName || !phone || !password) {
        console.warn("FineX Setup Error: Missing required fields.");
        alert(locale === 'ar' ? 'يرجى ملء كافة الحقول المطلوبة' : 'Please fill all required fields');
        return;
      }

      if (!verifyMasterKey(activationCode)) {
        console.error("FineX Security Alert: Invalid Master Key attempt during setup.");
        alert(t.accessDenied);
        return;
      }

      console.log("FineX Setup: Initializing primary administrator...");
      onSetupAdmin(fullName, phone, password);
      
      setIsAdminMode(true);
      setActivationCode('');
    } else {
      onLogin(phone, password, isAdminMode);
    }
  };

  const handleMasterKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyMasterKey(masterKeyInput)) {
      setIsAdminMode(true);
      setShowMasterKeyChallenge(false);
      setMasterKeyInput('');
    } else {
      console.error("FineX Security Alert: Unauthorized portal access attempt.");
      alert(t.accessDenied);
      setMasterKeyInput('');
    }
  };

  const toggleAdminPortal = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
      setPhone('');
      setPassword('');
    } else {
      setShowMasterKeyChallenge(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const data = decryptUserFile(content);
      
      if (!data) {
        alert(t.invalidFile);
        return;
      }

      // 1. التحقق من ملف القفل (Kill-Switch)
      if (data.type === 'KILL_SWITCH') {
        console.error("FineX Security: KILL-SWITCH DETECTED. WIPING LOCAL STORAGE.");
        localStorage.clear();
        sessionStorage.clear();
        alert(t.killSwitchAlert);
        window.location.reload();
        return;
      }

      // 2. التحقق من ملف التنشيط (ACTIVATION)
      if (data.type === 'ACTIVATION') {
        const currentDeviceId = getDeviceFingerprint();
        if (data.deviceId && data.deviceId !== currentDeviceId) {
           alert(t.deviceMismatch);
           return;
        }

        // تحديث حالة المستخدم في التخزين المحلي
        const rawUsers = localStorage.getItem('finex_users');
        if (rawUsers) {
           let users: User[] = JSON.parse(rawUsers);
           const userIdx = users.findIndex(u => u.id === data.target);
           if (userIdx !== -1) {
              users[userIdx].status = 'active';
              localStorage.setItem('finex_users', JSON.stringify(users));
              alert(t.unlockedSuccess);
              window.location.reload();
           } else {
              alert(t.userNotFound);
           }
        }
        return;
      }

      // 3. التحقق من تاريخ الانتهاء
      if (data.expiry) {
        const expiry = new Date(data.expiry);
        if (new Date() > expiry) {
          alert(t.expiredAccess);
          return;
        }
      }

      // 4. التحقق من معرف الجهاز (Device Binding)
      if (data.deviceId) {
        const currentDeviceId = getDeviceFingerprint();
        if (data.deviceId !== currentDeviceId) {
          console.warn("FineX Security: Device ID Mismatch.");
          alert(t.deviceMismatch);
          return;
        }
      }
      
      if (data.phone && data.p) {
        console.log("FineX Access: Automated login via secure file for", data.fullName);
        onLogin(data.phone, data.p, false);
      } else {
        alert(t.invalidFile);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-6 overflow-hidden transition-all duration-500">
      <div className={`absolute top-[-10%] right-[-10%] w-[40%] h-[40%] ${needsSetup ? 'bg-green-500/10' : isAdminMode ? 'bg-amber-500/10' : 'bg-[#00AEEF]/10'} rounded-full blur-[120px] transition-all duration-700`}></div>
      
      <div className="w-full max-w-md relative z-10 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex flex-col items-center text-center space-y-4">
          <Logo className="w-20 h-20 mb-2 scale-125" />
          <h1 className="text-4xl font-black text-white font-tech tracking-tighter animate-finex-glow">
            {needsSetup ? t.adminSetupTitle : showMasterKeyChallenge ? (locale === 'ar' ? 'تأكيد الهوية' : 'Identity Verification') : isAdminMode ? (locale === 'ar' ? 'بوابة المدير' : 'Admin Portal') : t.loginTitle}
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            {needsSetup ? t.adminSetupSub : showMasterKeyChallenge ? (locale === 'ar' ? 'يرجى إدخال مفتاح النظام للمتابعة' : 'Enter System Master Key to proceed') : isAdminMode ? (locale === 'ar' ? 'دخول المسؤول' : 'Admin Access') : t.loginSub}
          </p>
        </div>

        {showMasterKeyChallenge ? (
           <form onSubmit={handleMasterKeySubmit} className="bg-[#1e293b] p-10 rounded-[40px] border border-amber-500/30 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
              <div className="bg-slate-950 p-6 rounded-3xl border border-amber-500/20">
                <div className="flex items-center gap-3 mb-4 text-amber-500">
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                   <label className="text-[10px] font-black uppercase tracking-widest">{t.masterKeyLabel}</label>
                </div>
                <input 
                  type="password" 
                  autoFocus
                  required 
                  value={masterKeyInput} 
                  onChange={e => setMasterKeyInput(e.target.value)} 
                  className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-amber-500 text-center font-mono tracking-widest text-lg" 
                  placeholder="••••••••"
                />
              </div>
              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-black py-4 rounded-2xl shadow-xl transition-all">
                  {locale === 'ar' ? 'تحقق' : 'Verify'}
                </button>
                <button type="button" onClick={() => setShowMasterKeyChallenge(false)} className="px-6 bg-slate-800 text-slate-400 font-bold rounded-2xl hover:text-white">
                  {t.cancel}
                </button>
              </div>
           </form>
        ) : (
          <form onSubmit={handleSubmit} className={`bg-[#1e293b] p-10 rounded-[40px] border transition-all duration-500 ${needsSetup ? 'border-green-500/30' : isAdminMode ? 'border-amber-500/30' : 'border-slate-800'} shadow-2xl space-y-6`}>
            {error && <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl text-red-500 text-xs font-bold text-center">{error}</div>}
            
            <div className="space-y-4">
              {needsSetup && (
                <>
                  <div className="bg-slate-900 p-6 rounded-3xl border border-green-500/20 mb-6">
                    <label className="block text-[9px] font-black text-green-500 uppercase tracking-widest mb-2 px-2">مفتاح النظام (Master Key)</label>
                    <input 
                      type="password" required
                      value={activationCode}
                      onChange={e => setActivationCode(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-green-500 text-center font-mono tracking-widest"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-2">{t.fullName}</label>
                    <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-green-500" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-2">{t.phone}</label>
                <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl text-white font-mono outline-none focus:border-[#00AEEF]" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-2">{t.password}</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-[#00AEEF]" />
              </div>
            </div>

            <button type="submit" className={`w-full text-white font-black py-5 rounded-[24px] shadow-xl ${needsSetup ? 'bg-green-600' : isAdminMode ? 'bg-amber-600' : 'bg-[#00AEEF]'}`}>
              {needsSetup ? t.setupBtn : isAdminMode ? (locale === 'ar' ? 'دخول المسؤول' : 'Admin Access') : t.loginBtn}
            </button>

            {!needsSetup && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                   <div className="flex-1 h-px bg-slate-800"></div>
                   <span className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">{locale === 'ar' ? 'أو' : 'OR'}</span>
                   <div className="flex-1 h-px bg-slate-800"></div>
                </div>
                
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  className="w-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-[#00AEEF]/50 py-4 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  {t.loginViaFile}
                </button>
                <input ref={fileInputRef} type="file" accept=".fnx" onChange={handleFileUpload} className="hidden" />

                <button type="button" onClick={toggleAdminPortal} className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest py-2">
                  {isAdminMode ? (locale === 'ar' ? 'العودة لتسجيل دخول الموظفين' : 'Back to User Login') : t.adminLogin}
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
