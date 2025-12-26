
import React, { useState, useEffect, useMemo } from 'react';
import { Logo, CHART_OF_ACCOUNTS, TRANSLATIONS } from './constants';
import { DashboardStats, JournalEntry, AccountCategory, Locale, Account, Well, WellStatus, AuditLogEntry, Partner, InventoryItem, InventoryLogEntry, User, AppSettings } from './types';
import { encryptData, decryptData, signRole, verifyRoleIntegrity, getDeviceFingerprint } from './utils/security';
import Dashboard from './components/Dashboard';
import JournalEntryForm from './components/JournalEntryForm';
import WellsManager from './components/WellsManager';
import PartnersManager from './components/PartnersManager';
import InventoryManager from './components/InventoryManager';
import ReportsCenter from './components/ReportsCenter';
import AuditLog from './components/AuditLog';
import ReasonModal from './components/ReasonModal';
import ChartOfAccountsManager from './components/ChartOfAccountsManager';
import UserManager from './components/UserManager';
import Settings from './components/Settings';
import Login from './components/Login';

const App: React.FC = () => {
  // Navigation & Authentication
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | undefined>();
  const [needsSetup, setNeedsSetup] = useState(false);
  
  // App Data
  const [users, setUsers] = useState<User[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [wells, setWells] = useState<Well[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLogEntry[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [coa, setCoa] = useState<Account[]>(CHART_OF_ACCOUNTS);
  
  // Settings
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
    currency: 'USD',
    locale: 'ar'
  });
  
  const [wtiPrice, setWtiPrice] = useState(78.45);
  const [wtiChange, setWtiChange] = useState(0.12);
  const [isSynced, setIsSynced] = useState(true);
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'UPDATE' | 'DELETE' | 'ISSUE' | 'ADD_STOCK' | 'CREATE';
    entityType: 'ENTRY' | 'PARTNER' | 'WELL' | 'INVENTORY' | 'ACCOUNT' | 'USER';
    id: string;
    newData?: any;
    meta?: any;
  } | null>(null);

  const t = TRANSLATIONS[settings.locale];

  // Initialize Data
  useEffect(() => {
    try {
      const savedUsers = localStorage.getItem('finex_users');
      let currentUsers: User[] = [];
      
      if (savedUsers) {
        currentUsers = JSON.parse(savedUsers);
        const hasAdmin = currentUsers.some(u => u.role === 'admin');
        if (!hasAdmin) setNeedsSetup(true);
      } else {
        setNeedsSetup(true);
      }
      setUsers(currentUsers);

      const savedEntries = localStorage.getItem('finex_entries');
      if (savedEntries) setEntries(JSON.parse(savedEntries) || []);
      
      const savedWells = localStorage.getItem('finex_wells');
      if (savedWells) setWells(JSON.parse(savedWells) || []);

      const savedInventory = localStorage.getItem('finex_inventory');
      if (savedInventory) setInventory(JSON.parse(savedInventory) || []);

      const savedInventoryLogs = localStorage.getItem('finex_inventory_logs');
      if (savedInventoryLogs) setInventoryLogs(JSON.parse(savedInventoryLogs) || []);

      const savedPartners = localStorage.getItem('finex_partners');
      if (savedPartners) setPartners(JSON.parse(savedPartners) || []);

      const savedLogs = localStorage.getItem('finex_audit_logs');
      if (savedLogs) setAuditLogs(JSON.parse(savedLogs) || []);

      const savedCOA = localStorage.getItem('finex_coa');
      if (savedCOA) setCoa(JSON.parse(savedCOA) || CHART_OF_ACCOUNTS);

      const savedSettings = localStorage.getItem('finex_settings');
      if (savedSettings) setSettings(JSON.parse(savedSettings));

      const savedSession = sessionStorage.getItem('finex_session');
      if (savedSession) setCurrentUser(JSON.parse(savedSession));
    } catch (e) {
      console.error("FineX Storage Error: Failed to load system state.", e);
    }
  }, []);

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('finex_users', JSON.stringify(users));
    localStorage.setItem('finex_entries', JSON.stringify(entries || []));
    localStorage.setItem('finex_wells', JSON.stringify(wells || []));
    localStorage.setItem('finex_inventory', JSON.stringify(inventory || []));
    localStorage.setItem('finex_inventory_logs', JSON.stringify(inventoryLogs || []));
    localStorage.setItem('finex_partners', JSON.stringify(partners || []));
    localStorage.setItem('finex_audit_logs', JSON.stringify(auditLogs || []));
    localStorage.setItem('finex_coa', JSON.stringify(coa || []));
    localStorage.setItem('finex_settings', JSON.stringify(settings));
    
    setIsSynced(false);
    const timer = setTimeout(() => setIsSynced(true), 800);
    return () => clearTimeout(timer);
  }, [users, entries, wells, auditLogs, partners, inventory, inventoryLogs, coa, settings]);

  useEffect(() => {
    document.documentElement.dir = settings.locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = settings.locale;
    if (settings.theme === 'light') document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');
  }, [settings.locale, settings.theme]);

  const handleSetupAdmin = (name: string, phone: string, pass: string) => {
    try {
      console.log("FineX Setup: Clearing existing conflicting data...");
      
      // مسح البيانات السابقة لضمان التأسيس النظيف
      localStorage.clear();
      sessionStorage.clear();

      const admin: User = {
        id: crypto.randomUUID(),
        fullName: name,
        jobTitle: 'مدير النظام - Admin',
        phone: phone,
        password: encryptData(pass),
        permissions: ['dashboard', 'journal', 'wells', 'partners', 'inventory', 'reports', 'chart', 'audit', 'users', 'settings'],
        status: 'active',
        role: 'admin'
      };
      
      const securedAdmin = { ...admin, _sig: signRole('admin', phone) };
      
      // حفظ البيانات فوراً
      setUsers([securedAdmin]);
      setNeedsSetup(false);
      
      localStorage.setItem('finex_users', JSON.stringify([securedAdmin]));
      
      addNotification("تم تأسيس النظام بنجاح. يرجى تسجيل الدخول.");
      console.log("FineX Setup: Administrator established successfully.");
    } catch (error) {
      console.error("FineX Setup Error: Persistence failure.", error);
      alert("عذراً، فشل حفظ بيانات المسؤول. يرجى التحقق من مساحة التخزين في المتصفح.");
    }
  };

  const handleLogin = (phone: string, pass: string, isAdmin: boolean) => {
    const user = users.find(u => u.phone === phone) as any;
    if (!user) {
      setAuthError(t.invalidLogin);
      return;
    }
    
    if (isAdmin && !verifyRoleIntegrity('admin', phone, user._sig)) {
      setAuthError("خطأ أمني: تم التلاعب بصلاحيات الحساب.");
      return;
    }

    const decryptedPass = decryptData(user.password);
    if (decryptedPass !== pass) {
      setAuthError(t.invalidLogin);
      return;
    }
    if (isAdmin && user.role !== 'admin') {
      setAuthError(t.invalidLogin);
      return;
    }
    if (user.status === 'blocked') {
      setAuthError(t.userBlocked);
      return;
    }
    setAuthError(undefined);
    setCurrentUser(user);
    sessionStorage.setItem('finex_session', JSON.stringify(user));
    setActiveTab(isAdmin ? 'dashboard' : (user.permissions[0] || 'dashboard'));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('finex_session');
  };

  const addNotification = (msg: string) => {
    setNotifications(prev => [msg, ...(prev || [])].slice(0, 10));
  };

  const updateAdminProfile = (phone: string, pass: string) => {
    if (!currentUser) return;
    
    const encryptedPassword = encryptData(pass);
    const signature = signRole(currentUser.role, phone);
    
    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        return { 
          ...u, 
          phone, 
          password: encryptedPassword, 
          _sig: signature 
        } as any;
      }
      return u;
    });

    setUsers(updatedUsers);
    
    const updatedCurrentUser = { 
      ...currentUser, 
      phone, 
      password: encryptedPassword,
      _sig: signature
    } as any;
    
    setCurrentUser(updatedCurrentUser);
    sessionStorage.setItem('finex_session', JSON.stringify(updatedCurrentUser));
    addNotification(settings.locale === 'ar' ? "تم تحديث بيانات المدير بنجاح." : "Admin profile updated successfully.");
  };

  const handleExportData = () => {
    if (!currentUser) return;
    
    const watermark = {
      exportedBy: currentUser.fullName,
      exportJobTitle: currentUser.jobTitle,
      exportPhone: currentUser.phone,
      deviceId: getDeviceFingerprint(),
      timestamp: new Date().toISOString(),
      integrityHash: btoa(`${currentUser.phone}-${getDeviceFingerprint()}-${new Date().getDate()}`)
    };

    const fullData = {
      _metadata: watermark,
      users, entries, wells, auditLogs, partners, inventory, inventoryLogs, coa, settings
    };
    
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FineX_Backup_${currentUser.fullName.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (imported.users && imported.coa) {
          if (imported._metadata) {
            console.log("Importing secured data from device:", imported._metadata.deviceId);
          }
          localStorage.setItem('finex_users', JSON.stringify(imported.users));
          localStorage.setItem('finex_entries', JSON.stringify(imported.entries));
          localStorage.setItem('finex_wells', JSON.stringify(imported.wells));
          localStorage.setItem('finex_inventory', JSON.stringify(imported.inventory));
          localStorage.setItem('finex_inventory_logs', JSON.stringify(imported.inventoryLogs));
          localStorage.setItem('finex_partners', JSON.stringify(imported.partners));
          localStorage.setItem('finex_audit_logs', JSON.stringify(imported.auditLogs));
          localStorage.setItem('finex_coa', JSON.stringify(imported.coa));
          localStorage.setItem('finex_settings', JSON.stringify(imported.settings));
          alert(t.importSuccess);
          window.location.reload();
        } else {
          alert(t.importError);
        }
      } catch (err) {
        alert(t.importError);
      }
    };
    reader.readAsText(file);
  };

  const accountBalancesMap = useMemo(() => {
    const map = new Map<string, number>();
    (entries || []).forEach(entry => {
      (entry.debitLines || []).forEach(line => {
        map.set(line.accountId, (map.get(line.accountId) || 0) + (line.amount || 0));
      });
      (entry.creditLines || []).forEach(line => {
        map.set(line.accountId, (map.get(line.accountId) || 0) - (line.amount || 0));
      });
    });
    return map;
  }, [entries]);

  const stats = useMemo<DashboardStats>(() => {
    let totalAssets = 0;
    let totalLiabilities = 0;
    (coa || []).forEach(acc => {
      const bal = accountBalancesMap.get(acc.id) || 0;
      if (acc.category === AccountCategory.ASSETS) totalAssets += bal;
      else if (acc.category === AccountCategory.LIABILITIES) totalLiabilities += Math.abs(bal);
    });
    return {
      totalAssets,
      totalLiabilities,
      productionBBL: (wells || []).reduce((sum, w) => w.status === WellStatus.PRODUCTION ? sum + (w.dailyYield || 0) : sum, 0),
      wtiPrice,
      wtiChange,
      totalPartners: (partners || []).filter(p => p.status === 'active').length
    };
  }, [entries, wells, coa, partners, wtiPrice, wtiChange, accountBalancesMap]);

  const confirmAuditAction = (reason: string) => {
    if (!pendingAction || !currentUser) return;
    const timestamp = new Date().toLocaleString();
    const performedBy = { name: currentUser.fullName, title: currentUser.jobTitle };

    const pushAudit = (type: 'UPDATE' | 'DELETE' | 'CREATE' | 'ISSUE', entityType: any, original: any, updated?: any) => {
      setAuditLogs([{ id: crypto.randomUUID(), timestamp, type, entityType, reason, originalData: original, updatedData: updated, performedBy }, ...(auditLogs || [])]);
    };

    if (pendingAction.entityType === 'ACCOUNT') {
      const original = (coa || []).find(a => a.id === pendingAction.id);
      if (pendingAction.type === 'DELETE' && original) {
        setCoa(prev => prev.filter(a => a.id !== pendingAction.id));
        pushAudit('DELETE', 'ACCOUNT', original);
        addNotification(t.accountDeleted);
      } else if (pendingAction.type === 'CREATE') {
         setCoa(prev => [...prev, pendingAction.newData].sort((a,b) => a.code - b.code));
         addNotification(t.accountAdded);
      }
    } else if (pendingAction.entityType === 'INVENTORY') {
      const original = (inventory || []).find(i => i.id === pendingAction.id);
      if (pendingAction.type === 'CREATE') {
        const newItem = pendingAction.newData;
        setInventory([...(inventory || []), newItem]);
        setInventoryLogs([{
          id: crypto.randomUUID(), itemId: newItem.id, itemName: newItem.name, type: 'CREATE', quantityChange: newItem.quantity,
          quantityBefore: 0, quantityAfter: newItem.quantity, date: newItem.entryDate, memo: reason, performedBy: currentUser.fullName
        }, ...(inventoryLogs || [])]);
        addNotification(t.materialAdded);
      } else if (original) {
        if (pendingAction.type === 'DELETE') {
          setInventory(prev => prev.filter(i => i.id !== pendingAction.id));
          pushAudit('DELETE', 'INVENTORY', original);
        } else if (pendingAction.type === 'UPDATE') {
          const updated = { ...original, ...pendingAction.newData };
          setInventory(prev => prev.map(i => i.id === pendingAction.id ? updated : i));
          pushAudit('UPDATE', 'INVENTORY', original, updated);
        } else if (pendingAction.type === 'ISSUE') {
          const { wellId, quantity, date, memo } = pendingAction.meta;
          const well = (wells || []).find(w => w.id === wellId);
          const newQty = original.quantity - quantity;
          setInventory(prev => newQty <= 0 ? prev.filter(i => i.id !== original.id) : prev.map(i => i.id === original.id ? { ...i, quantity: newQty, totalPrice: newQty * i.unitPrice } : i));
          setInventoryLogs([{
            id: crypto.randomUUID(), itemId: original.id, itemName: original.name, type: 'ISSUE', quantityChange: -quantity,
            quantityBefore: original.quantity, quantityAfter: newQty, date, memo: memo || reason, wellName: well?.name, performedBy: currentUser.fullName
          }, ...(inventoryLogs || [])]);
          addNotification(t.materialIssued);
        }
      }
    } else if (pendingAction.entityType === 'PARTNER') {
      const original = (partners || []).find(p => p.id === pendingAction.id);
      if (original) {
        if (pendingAction.type === 'DELETE') {
          setPartners(prev => prev.filter(p => p.id !== pendingAction.id));
          pushAudit('DELETE', 'PARTNER', original);
        } else {
          const updated = { ...original, ...pendingAction.newData };
          setPartners(prev => prev.map(p => p.id === pendingAction.id ? updated : p));
          pushAudit('UPDATE', 'PARTNER', original, updated);
        }
      }
    } else if (pendingAction.entityType === 'WELL') {
      const original = (wells || []).find(w => w.id === pendingAction.id);
      if (original) {
        if (pendingAction.type === 'DELETE') {
          setWells(prev => prev.filter(w => w.id !== pendingAction.id));
          pushAudit('DELETE', 'WELL', original);
        } else {
          const updated = { ...original, ...pendingAction.newData };
          setWells(prev => prev.map(w => w.id === pendingAction.id ? updated : w));
          pushAudit('UPDATE', 'WELL', original, updated);
        }
      }
    } else if (pendingAction.entityType === 'ENTRY') {
      const original = (entries || []).find(e => e.id === pendingAction.id);
      if (original) {
        if (pendingAction.type === 'DELETE') {
          setEntries(prev => prev.filter(e => e.id !== pendingAction.id));
          pushAudit('DELETE', 'ENTRY', original);
        } else {
          const updated = { ...pendingAction.newData, id: pendingAction.id, currency: 'USD', performedBy: currentUser.fullName };
          setEntries(prev => prev.map(e => e.id === pendingAction.id ? updated : e));
          pushAudit('UPDATE', 'ENTRY', original, updated);
        }
      }
    }
    setPendingAction(null);
    setShowReasonModal(false);
  };

  const navTabs = [
    { id: 'dashboard', label: t.dashboard },
    { id: 'journal', label: t.journal },
    { id: 'wells', label: t.wells },
    { id: 'partners', label: t.partners },
    { id: 'inventory', label: t.inventory },
    { id: 'reports', label: t.reports },
    { id: 'chart', label: t.chart },
    { id: 'audit', label: t.audit },
    { id: 'users', label: t.users },
    { id: 'settings', label: t.settings }
  ];

  const visibleTabs = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return navTabs;
    return navTabs.filter(tab => currentUser.permissions.includes(tab.id));
  }, [currentUser, settings.locale]);

  if (!currentUser) {
    return (
      <Login 
        locale={settings.locale} 
        setLocale={(l) => setSettings({...settings, locale: l})} 
        error={authError} 
        onLogin={handleLogin} 
        needsSetup={needsSetup}
        onSetupAdmin={handleSetupAdmin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex transition-colors duration-500">
      <aside className={`w-72 bg-slate-950 border-slate-800 flex flex-col fixed h-full z-20 transition-all ${settings.locale === 'ar' ? 'right-0 border-l' : 'left-0 border-r'}`}>
        <div className="p-10 flex items-center gap-4">
          <Logo className="w-12 h-12" />
          <div>
            <h1 className="text-[#00AEEF] font-tech font-black text-2xl leading-tight uppercase tracking-tight animate-finex-glow">{t.hassan}</h1>
            <p className="text-slate-500 text-[9px] uppercase tracking-widest font-bold mt-1">{t.petroleumSystem}</p>
          </div>
        </div>

        <nav className="flex-1 px-6 mt-4 space-y-2 overflow-y-auto custom-scrollbar">
          {visibleTabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-[#00AEEF] text-white shadow-lg shadow-[#00AEEF]/20' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}>
              <span className="font-black text-xs uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-900 mt-auto space-y-4">
          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
             <p className="text-[10px] font-black text-[#00AEEF] uppercase mb-1">{currentUser.fullName}</p>
             <p className="text-[9px] text-slate-500 uppercase">{currentUser.jobTitle}</p>
             <button onClick={handleLogout} className="mt-3 w-full text-left text-red-500 text-[10px] font-black uppercase tracking-widest hover:text-red-400 transition-colors flex items-center gap-2">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                {t.logout}
             </button>
          </div>
          <div className="flex items-center justify-center gap-2 bg-slate-900/30 p-2 rounded-xl">
            <span className={`w-1.5 h-1.5 rounded-full ${isSynced ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></span>
            <span className="text-[8px] font-black tracking-[0.2em] text-slate-600 uppercase">{isSynced ? t.synced : t.syncing}</span>
          </div>
        </div>
      </aside>

      <main className={`flex-1 p-12 min-h-screen transition-all ${settings.locale === 'ar' ? 'mr-72' : 'ml-72'} page-transition`}>
        <header className="mb-12 flex justify-between items-center">
          <h2 className="text-4xl font-black text-white">{t[activeTab as keyof typeof t] || t.dashboard}</h2>
        </header>

        <div key={activeTab} className="page-transition">
          {activeTab === 'dashboard' && <Dashboard stats={stats} locale={settings.locale} notifications={notifications} />}
          {activeTab === 'journal' && (
             <div className="space-y-8">
               <button onClick={() => { setEditingEntry(null); setIsFormVisible(!isFormVisible); }} className="bg-[#00AEEF] px-8 py-3 rounded-2xl font-bold shadow-xl">
                 {isFormVisible ? t.cancel : t.newEntry}
               </button>
               {isFormVisible && <JournalEntryForm coa={coa} locale={settings.locale} editEntry={editingEntry} onAddEntry={(e) => { const id = crypto.randomUUID(); setEntries([{ ...e, id, currency: 'USD', performedBy: currentUser.fullName }, ...entries]); setIsFormVisible(false); }} onUpdateEntry={(id, data) => { setPendingAction({ type: 'UPDATE', entityType: 'ENTRY', id, newData: data }); setShowReasonModal(true); }} onCancelEdit={() => setIsFormVisible(false)} />}
             </div>
          )}
          {activeTab === 'inventory' && (
            <InventoryManager inventory={inventory || []} inventoryLogs={inventoryLogs || []} wells={wells || []} locale={settings.locale} 
              onAddMaterial={(item) => { setPendingAction({ type: 'CREATE', entityType: 'INVENTORY', id: 'new', newData: { ...item, id: crypto.randomUUID() } }); setShowReasonModal(true); }}
              onAddStock={(id, meta) => { setPendingAction({ type: 'ADD_STOCK', entityType: 'INVENTORY', id, meta }); setShowReasonModal(true); }}
              onUpdate={(id, data) => { setPendingAction({ type: 'UPDATE', entityType: 'INVENTORY', id, newData: data }); setShowReasonModal(true); }}
              onDelete={(id) => { setPendingAction({ type: 'DELETE', entityType: 'INVENTORY', id }); setShowReasonModal(true); }}
              onIssue={(id, meta) => { setPendingAction({ type: 'ISSUE', entityType: 'INVENTORY', id, meta }); setShowReasonModal(true); }}
            />
          )}
          {activeTab === 'partners' && <PartnersManager partners={partners || []} wells={wells || []} locale={settings.locale} onUpdate={(id, data) => { setPendingAction({ type: 'UPDATE', entityType: 'PARTNER', id, newData: data }); setShowReasonModal(true); }} onDelete={(id) => { setPendingAction({ type: 'DELETE', entityType: 'PARTNER', id }); setShowReasonModal(true); }} onAdd={(p) => setPartners([...(partners || []), { ...p, id: crypto.randomUUID() }])} />}
          {activeTab === 'wells' && <WellsManager partners={partners || []} wells={wells || []} locale={settings.locale} onAdd={(w) => setWells([...(wells || []), { ...w, id: crypto.randomUUID() }])} onUpdate={(id, data) => { setPendingAction({ type: 'UPDATE', entityType: 'WELL', id, newData: data }); setShowReasonModal(true); }} onDelete={(id) => { setPendingAction({ type: 'DELETE', entityType: 'WELL', id }); setShowReasonModal(true); }} />}
          {activeTab === 'reports' && <ReportsCenter locale={settings.locale} data={{ inventory, inventoryLogs, wells, partners, entries }} />}
          {activeTab === 'audit' && <AuditLog logs={auditLogs || []} locale={settings.locale} />}
          {activeTab === 'chart' && (
            <ChartOfAccountsManager coa={coa || []} balancesMap={accountBalancesMap} locale={settings.locale}
              onAddAccount={(newAcc) => {
                 if (coa.some(a => a.code === newAcc.code)) { alert(t.accountCodeExists); return; }
                 setPendingAction({ type: 'CREATE', entityType: 'ACCOUNT', id: 'new', newData: newAcc }); setShowReasonModal(true);
              }}
              onDeleteAccount={(id) => { setPendingAction({ type: 'DELETE', entityType: 'ACCOUNT', id }); setShowReasonModal(true); }}
            />
          )}
          {activeTab === 'users' && currentUser.role === 'admin' && (
            <UserManager 
              users={users} 
              locale={settings.locale} 
              availableTabs={navTabs.filter(t=>t.id!=='users')}
              onAddUser={(u) => {
                const newUser = { ...u, password: encryptData(u.password), _sig: signRole(u.role, u.phone) };
                setUsers([...users, { ...newUser, id: crypto.randomUUID() }]);
              }}
              onToggleStatus={(id) => setUsers(users.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'blocked' : 'active' } : u))}
              onDeleteUser={(id) => setUsers(users.filter(u => u.id !== id))}
              onUpdateAdminProfile={updateAdminProfile}
              currentAdminId={currentUser.id}
            />
          )}
          {activeTab === 'settings' && (
            <Settings 
              settings={settings} 
              updateSettings={(s) => setSettings({...settings, ...s})}
              onExport={handleExportData}
              onImport={handleImportData}
            />
          )}
        </div>

        {showReasonModal && <ReasonModal locale={settings.locale} onConfirm={confirmAuditAction} onCancel={() => { setShowReasonModal(false); setPendingAction(null); }} />}
      </main>
    </div>
  );
};

export default App;
