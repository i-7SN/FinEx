
import React, { useState } from 'react';
import { User, Locale } from '../types';
import { TRANSLATIONS } from '../constants';
import { encryptUserFile, decryptData, getDeviceFingerprint, generateKillSwitchFileContent, generateActivationFileContent } from '../utils/security';

interface UserManagerProps {
  users: User[];
  locale: Locale;
  onAddUser: (user: Omit<User, 'id'>) => void;
  onToggleStatus: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  availableTabs: { id: string, label: string }[];
  onUpdateAdminProfile: (phone: string, pass: string) => void;
  currentAdminId: string;
}

const UserManager: React.FC<UserManagerProps> = ({ users, locale, onAddUser, onToggleStatus, onDeleteUser, availableTabs, onUpdateAdminProfile, currentAdminId }) => {
  const t = TRANSLATIONS[locale];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);
  
  const [adminForm, setAdminForm] = useState({
    phone: users.find(u => u.id === currentAdminId)?.phone || '',
    password: ''
  });

  const [newUser, setNewUser] = useState<Omit<User, 'id'>>({
    fullName: '',
    jobTitle: '',
    phone: '',
    password: '',
    permissions: ['dashboard'],
    status: 'active',
    role: 'user'
  });

  const togglePermission = (tabId: string) => {
    setNewUser(prev => ({
      ...prev,
      permissions: prev.permissions.includes(tabId)
        ? prev.permissions.filter(p => p !== tabId)
        : [...prev.permissions, tabId]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.fullName || !newUser.phone || !newUser.password) return;
    onAddUser(newUser);
    setIsModalOpen(false);
    setNewUser({
      fullName: '',
      jobTitle: '',
      phone: '',
      password: '',
      permissions: ['dashboard'],
      status: 'active',
      role: 'user'
    });
  };

  const handleAdminUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.phone || !adminForm.password) return;
    onUpdateAdminProfile(adminForm.phone, adminForm.password);
    setIsAdminSettingsOpen(false);
    setAdminForm({ ...adminForm, password: '' });
  };

  const exportUserLoginFile = (user: User) => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    const exportPayload = {
      phone: user.phone,
      fullName: user.fullName,
      p: decryptData(user.password),
      timestamp: new Date().toISOString(),
      expiry: expiryDate.toISOString(),
      deviceId: getDeviceFingerprint()
    };
    
    const encrypted = encryptUserFile(exportPayload);
    const blob = new Blob([encrypted], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FineX_Access_${user.fullName.replace(/\s/g, '_')}.fnx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportKillSwitch = (user: User) => {
    const encrypted = generateKillSwitchFileContent(user.id);
    const blob = new Blob([encrypted], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FineX_KILL_SWITCH_${user.fullName.replace(/\s/g, '_')}.fnx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportActivationKey = (user: User) => {
    // نستخدم معرف الجهاز الحالي للمدير كمرجع (أو يفضل إدخال معرف جهاز الموظف يدوياً، 
    // ولكن للتبسيط هنا نربطه بنفس الجهاز الذي صدر منه الملف لأول مرة)
    const encrypted = generateActivationFileContent(user.id, getDeviceFingerprint());
    const blob = new Blob([encrypted], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FineX_ACTIVATE_${user.fullName.replace(/\s/g, '_')}.fnx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center bg-[#1e293b]/50 p-8 rounded-[32px] border border-slate-800 shadow-xl gap-4">
        <div>
          <h3 className="text-[#00AEEF] font-black text-xl uppercase tracking-widest">{t.users}</h3>
          <p className="text-slate-500 text-xs mt-1 uppercase font-bold tracking-tighter">Manage access and full admin control</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsAdminSettingsOpen(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-2xl font-black shadow-xl transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            تعديل بيانات المدير
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#00AEEF] hover:bg-[#0092c7] text-white px-8 py-3 rounded-2xl font-black shadow-xl transition-all"
          >
            {t.addUser}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {users.map(user => (
          <div key={user.id} className={`bg-[#1e293b] p-8 rounded-3xl border ${user.status === 'blocked' ? 'border-red-500/50 grayscale' : 'border-slate-800'} shadow-xl relative overflow-hidden group transition-all hover:scale-[1.01]`}>
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3 rounded-2xl ${user.role === 'admin' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-900 text-[#00AEEF]'}`}>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <div className="flex gap-2">
                {user.role !== 'admin' && (
                  <>
                    <button 
                      onClick={() => exportUserLoginFile(user)}
                      className="p-2 bg-slate-900 hover:bg-[#00AEEF] text-slate-500 hover:text-white rounded-xl transition-all"
                      title={t.exportUserFile}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                    {user.status === 'blocked' ? (
                       <button 
                       onClick={() => exportActivationKey(user)}
                       className="p-2 bg-slate-900 hover:bg-green-500 text-slate-500 hover:text-white rounded-xl transition-all"
                       title={t.exportActivationKey}
                     >
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                     </button>
                    ) : (
                      <button 
                        onClick={() => exportKillSwitch(user)}
                        className="p-2 bg-slate-900 hover:bg-red-500 text-slate-500 hover:text-white rounded-xl transition-all"
                        title={t.exportKillSwitch}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      </button>
                    )}
                    <button 
                      onClick={() => onToggleStatus(user.id)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${user.status === 'active' ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white'}`}
                    >
                      {user.status === 'active' ? t.block : t.unblock}
                    </button>
                    <button onClick={() => onDeleteUser(user.id)} className="p-2 text-slate-600 hover:text-red-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </>
                )}
                {user.role === 'admin' && (
                  <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Master Admin</span>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-white font-black text-xl truncate">{user.fullName}</h4>
              <p className={`${user.role === 'admin' ? 'text-amber-500' : 'text-[#00AEEF]'} text-xs font-bold uppercase tracking-widest`}>{user.jobTitle}</p>
              <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-mono">{user.phone}</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${user.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {user.status === 'active' ? t.active : t.blocked}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: ADMIN PROFILE SETTINGS */}
      {isAdminSettingsOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-[#1e293b] w-full max-w-md rounded-[40px] border border-amber-500/30 shadow-2xl overflow-hidden flex flex-col scale-in">
              <div className="p-10 border-b border-slate-800 bg-amber-600/10 flex justify-between items-center">
                 <h3 className="text-amber-500 font-black text-2xl uppercase tracking-tighter">إدارة حساب المدير</h3>
                 <button onClick={() => setIsAdminSettingsOpen(false)} className="text-slate-500 hover:text-white">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              <form onSubmit={handleAdminUpdate} className="p-10 space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-2">رقم الهاتف الجديد</label>
                    <input required type="text" value={adminForm.phone} onChange={e => setAdminForm({...adminForm, phone: e.target.value})} className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-amber-500" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-2">كلمة المرور الجديدة</label>
                    <input required type="password" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-amber-500" placeholder="••••••••" />
                 </div>
                 <button type="submit" className="w-full bg-amber-600 text-white font-black py-5 rounded-[24px] shadow-xl hover:bg-amber-500 transition-all">
                    تحديث بيانات الأمان
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* MODAL: ADD USER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#1e293b] w-full max-w-2xl rounded-[40px] border border-slate-700 shadow-2xl overflow-hidden flex flex-col scale-in">
            <div className="p-10 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-white font-black text-2xl uppercase tracking-tighter">{t.addUser}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{t.fullName}</label>
                   <input required type="text" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-[#00AEEF]" />
                </div>
                <div className="col-span-2 md:col-span-1">
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{t.jobTitle}</label>
                   <input required type="text" value={newUser.jobTitle} onChange={e => setNewUser({...newUser, jobTitle: e.target.value})} className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-[#00AEEF]" />
                </div>
                <div className="col-span-2 md:col-span-1">
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{t.phone}</label>
                   <input required type="text" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl text-white outline-none font-mono focus:border-[#00AEEF]" />
                </div>
                <div className="col-span-2 md:col-span-1">
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{t.password}</label>
                   <input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-[#00AEEF]" />
                </div>
              </div>

              <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.permissions}</h4>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableTabs.map(tab => (
                      <button 
                        key={tab.id}
                        type="button"
                        onClick={() => togglePermission(tab.id)}
                        className={`p-3 rounded-xl border text-[10px] font-black uppercase transition-all flex items-center justify-between ${newUser.permissions.includes(tab.id) ? 'bg-[#00AEEF]/10 border-[#00AEEF] text-[#00AEEF]' : 'bg-slate-900 border-slate-800 text-slate-600'}`}
                      >
                        {tab.label}
                        {newUser.permissions.includes(tab.id) && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                      </button>
                    ))}
                 </div>
              </div>

              <button type="submit" className="w-full bg-[#00AEEF] text-white font-black py-5 rounded-[24px] shadow-[0_15px_30px_rgba(0,174,239,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all">
                {t.confirm}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
