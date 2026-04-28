import React, { useState, useEffect, Component } from 'react';
import VictimMode from './components/VictimMode';
import DispatcherDashboard from './components/DispatcherDashboard';
import UserProfile from './components/UserProfile';
import IncidentHistory from './components/IncidentHistory';
import LandingPage from './components/LandingPage';
import AIAssistant from './components/AIAssistant';
import Logo from './components/Logo';
import { Menu, X, Home, ShieldAlert, UserCircle, Bot, LayoutDashboard, FileBarChart } from 'lucide-react';


class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: 'rgba(230,57,70,.1)', color: '#ff6b6b', fontFamily: 'DM Sans, sans-serif', borderRadius: '12px', margin: '2rem', border: '1px solid rgba(230,57,70,.3)' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif' }}>Something went wrong.</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', marginTop: '8px', color: '#8a90a0' }}>{this.state.error && this.state.error.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Toast Notification System (CrisisLink Style) ──
function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed top-[70px] right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none w-[310px]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex gap-3 items-start px-4 py-3.5 rounded-xl shadow-2xl border backdrop-blur-sm animate-slide-in-right ${
            toast.type === 'success' ? 'bg-card-2 border-[rgba(46,204,113,.4)]' :
            toast.type === 'error'   ? 'bg-card-2 border-[rgba(230,57,70,.45)]' :
            toast.type === 'warning' ? 'bg-card-2 border-[rgba(230,57,70,.45)]' :
            'bg-card-2 border-[var(--border)]'
          }`}
          style={{ boxShadow: '0 8px 28px rgba(0,0,0,.45)' }}
        >
          <span className="text-xl shrink-0 mt-0.5">
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : toast.type === 'warning' ? '🚨' : 'ℹ️'}
          </span>
          <div className="flex-1 min-w-0">
            <p className={`font-head text-[.83rem] font-bold leading-tight mb-0.5 ${
              toast.type === 'success' ? 'text-[var(--green)]' :
              toast.type === 'warning' ? 'text-crisis' :
              toast.type === 'error'   ? 'text-crisis' :
              'text-[var(--blue)]'
            }`}>{toast.title}</p>
            {toast.message && <p className="text-[.75rem] text-[var(--muted)] leading-snug">{toast.message}</p>}
            <div className="notif-bar mt-2">
              <div className={`notif-fill ${
                toast.type === 'success' ? 'bg-[var(--green)]' :
                toast.type === 'warning' ? 'bg-crisis' :
                'bg-[var(--blue)]'
              }`} style={{ animationDuration: '4000ms' }}></div>
            </div>
          </div>
          <button onClick={() => onDismiss(toast.id)} className="text-[var(--muted2)] hover:text-white text-sm transition-colors shrink-0">✕</button>
        </div>
      ))}
    </div>
  );
}

let audioCtx = null;
const getAudioCtx = () => {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) { console.warn('Audio not supported', e); }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// ── Web Audio API Sound Effects ──
const playSound = (type) => {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'siren') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.4);
      osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    } else if (type === 'chime') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    }
  } catch(e) { console.warn('Sound playback failed', e); }
};

function AppContent() {
  const [portalMode, setPortalMode] = useState('home'); // 'home', 'citizen', 'dispatcher'
  const [citizenTab, setCitizenTab] = useState('sos');
  const [dispatcherTab, setDispatcherTab] = useState('map'); // 'map' or 'history'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Feature II: Multi-user profile storage
  const [allProfiles, setAllProfiles] = useState(() => {
    const saved = localStorage.getItem('resqnetAllProfiles');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeProfileIdx, setActiveProfileIdx] = useState(() => {
    const saved = localStorage.getItem('resqnetActiveProfileIdx');
    return saved ? parseInt(saved) : 0;
  });
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);

  const [incidents, setIncidents] = useState(() => {
    const saved = localStorage.getItem('resqnetIncidents');
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch data from database on load
  useEffect(() => {
    // 1. Fetch Incidents
    fetch('/api/incidents')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setIncidents(data);
          localStorage.setItem('resqnetIncidents', JSON.stringify(data));
        }
      })
      .catch(err => console.error('Failed to fetch incidents:', err));

    // 2. Fetch Profiles for Cross-Device Sync
    fetch('/api/profiles')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAllProfiles(data);
          localStorage.setItem('resqnetAllProfiles', JSON.stringify(data));
          
          // Set active profile from server if local is empty
          if (!userProfile.name && data[0]) {
            setUserProfile(data[0]);
            localStorage.setItem('resqnetProfile', JSON.stringify(data[0]));
          }
        }
      })
      .catch(err => console.error('Failed to fetch profiles:', err));
  }, []);

  // Save incidents to database and localStorage
  const handleDeleteProfile = async () => {
    try {
      const res = await fetch('/api/profiles', { method: 'DELETE' });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Server failed to delete profile');
      }

      // Clear all local states and storage
      const emptyProfile = {
        name: '', age: '', bloodType: '', docType: 'Aadhar', docId: '', medicalConditions: '', preferredHospital: '', preferredDoctor: '', emergencyContactName: '', emergencyContactPhone: '', shareLiveLocation: true
      };
      setUserProfile(emptyProfile);
      localStorage.removeItem('resqnetProfile');
      localStorage.removeItem('resqnetAllProfiles');
      localStorage.removeItem('resqnetActiveProfileIdx');
      localStorage.removeItem('resqnetIncidents');
      setShowProfileModal(false);
      addToast('Profile Deleted', 'Your profile information has been removed.', 'info');
    } catch (err) {
      console.error('Delete error:', err);
      addToast('Error', err.message || 'Failed to delete profile from database.', 'error');
    }
  };

  const syncIncidentToDatabase = async (incidentData) => {
    try {
      const isExisting = incidents.some(inc => inc.id === incidentData.id);
      const url = isExisting ? `/api/incidents/${incidentData.id}` : '/api/incidents';
      const method = isExisting ? 'PUT' : 'POST';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentData)
      });
    } catch (err) {
      console.error('Failed to sync incident to DB:', err);
    }
  };

  useEffect(() => {
    localStorage.setItem('resqnetIncidents', JSON.stringify(incidents));
  }, [incidents]);
  
  const [routeData, setRouteData] = useState({ eta: null, distance: null, totalSteps: 0, currentStep: 0 });
  const [toasts, setToasts] = useState([]);

  const addToast = (title, message = '', type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  };
  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const [userProfile, setUserProfile] = useState(() => {
    const profiles = localStorage.getItem('resqnetAllProfiles');
    if (profiles) {
      const parsed = JSON.parse(profiles);
      const idx = parseInt(localStorage.getItem('resqnetActiveProfileIdx') || '0');
      return parsed[idx] || { name: '', age: '', bloodType: '', docType: 'Aadhar', docId: '', medicalConditions: '', preferredHospital: '', preferredDoctor: '', emergencyContactName: '', emergencyContactPhone: '', shareLiveLocation: true };
    }
    const saved = localStorage.getItem('resqnetProfile');
    return saved ? JSON.parse(saved) : {
      name: '', age: '', bloodType: '', docType: 'Aadhar', docId: '',
      medicalConditions: '', preferredHospital: '', preferredDoctor: '',
      emergencyContactName: '', emergencyContactPhone: '',
      shareLiveLocation: true
    };
  });

  const handleUpdateProfile = async (newProfile) => {
    setUserProfile(newProfile);
    localStorage.setItem('resqnetProfile', JSON.stringify(newProfile));
    // Save to multi-profile store
    const profiles = [...allProfiles];
    if (profiles.length === 0) {
      profiles.push(newProfile);
    } else {
      profiles[activeProfileIdx] = newProfile;
    }
    setAllProfiles(profiles);
    localStorage.setItem('resqnetAllProfiles', JSON.stringify(profiles));

    // Sync with Backend Developer Database
    try {
      // Generate a unique userId based on name and profile index
      const userId = newProfile.name 
        ? newProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + activeProfileIdx 
        : 'user-' + activeProfileIdx;
      
      await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newProfile, userId })
      });
    } catch (err) {
      console.error("Failed to sync profile to database", err);
    }
  };

  const addNewProfile = () => {
    const newP = { name: 'New User', age: '', bloodType: '', docType: 'Aadhar', docId: '', medicalConditions: '', preferredHospital: '', preferredDoctor: '', emergencyContactName: '', emergencyContactPhone: '', shareLiveLocation: true };
    const profiles = [...allProfiles, newP];
    setAllProfiles(profiles);
    setActiveProfileIdx(profiles.length - 1);
    setUserProfile(newP);
    localStorage.setItem('resqnetAllProfiles', JSON.stringify(profiles));
    localStorage.setItem('resqnetActiveProfileIdx', String(profiles.length - 1));
    setShowProfileSwitcher(false);
  };

  const switchProfile = (idx) => {
    setActiveProfileIdx(idx);
    setUserProfile(allProfiles[idx]);
    localStorage.setItem('resqnetActiveProfileIdx', String(idx));
    localStorage.setItem('resqnetProfile', JSON.stringify(allProfiles[idx]));
    setShowProfileSwitcher(false);
  };

  const handleAddIncident = (incident) => {
    const incidentWithProfile = { ...incident, userProfile, messages: [], timestamp: Date.now() };
    setIncidents(prev => [...prev, incidentWithProfile]);
    syncIncidentToDatabase(incidentWithProfile);
    addToast('SOS Signal Sent', `${incident.category} emergency reported.`, 'warning');
    if (soundEnabled) playSound('siren');
  };

  const handleUpdateIncidentStatus = (id, newStatus) => {
    setIncidents(prev => 
      prev.map(inc => {
        if (inc.id === id) {
          const updates = { status: newStatus };
          if (newStatus === 'resolved') updates.resolvedAt = Date.now();
          const updatedInc = { ...inc, ...updates };
          syncIncidentToDatabase(updatedInc);
          return updatedInc;
        }
        return inc;
      })
    );
    if (newStatus === 'dispatched') {
      addToast('Team Dispatched', 'Responders are now en route.', 'success');
      if (soundEnabled) playSound('chime');
    }
    if (newStatus === 'resolved') {
      addToast('Responders Arrived!', 'Emergency team has reached the victim. Case resolved.', 'success');
      if (soundEnabled) playSound('success');
    }
    if (newStatus === 'cancelled') addToast('Emergency Cancelled', 'SOS signal was cancelled by user.', 'info');
  };

  const handleSendMessage = (id, sender, text) => {
    setIncidents(prev => 
      prev.map(inc => {
        if (inc.id === id) {
          const updatedInc = { ...inc, messages: [...(inc.messages || []), { id: Date.now(), sender, text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }] };
          syncIncidentToDatabase(updatedInc);
          return updatedInc;
        }
        return inc;
      })
    );
    if (soundEnabled && sender === 'dispatcher') playSound('chime');
  };

  const handleRouteUpdate = (data) => {
    setRouteData(data);
  };

  const handleLandingNavigate = (portal, tab) => {
    setPortalMode(portal);
    if (tab) setCitizenTab(tab);
  };

  // Profile avatar
  const initials = userProfile.name 
    ? userProfile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) 
    : '?';

  return (
    <div className="min-h-screen flex flex-col font-body bg-night transition-colors duration-300">
      {/* ══ NAV (CrisisLink Style) ══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 bg-night/95 backdrop-blur-xl border-b border-[var(--border)]">
        <div 
          className="flex items-center gap-2.5 cursor-pointer group" 
          onClick={() => setPortalMode('home')}
        >
          <Logo size={32} showText={false} />

          <span className="font-head text-[1.2rem] font-extrabold tracking-tight text-white">
            ResQNet
          </span>
        </div>
        
        {/* Nav Tabs - Desktop */}
        <ul className="hidden md:flex gap-1 list-none">
          {[
            { id: 'home', label: 'Home', icon: <Home size={14} /> },
            { id: 'citizen-sos', label: 'SOS', icon: <ShieldAlert size={14} />, action: () => { setPortalMode('citizen'); setCitizenTab('sos'); } },
            { id: 'citizen-profile', label: 'Profile', icon: <UserCircle size={14} />, action: () => { setPortalMode('citizen'); setCitizenTab('profile'); } },
            { id: 'ai-assistant', label: 'AI Assistant', icon: <Bot size={14} />, action: () => setPortalMode('ai-assistant') },
            { id: 'dispatcher', label: 'Dispatcher', icon: <LayoutDashboard size={14} />, action: () => { setPortalMode('dispatcher'); setDispatcherTab('map'); } },
            { id: 'dispatcher-history', label: 'Reports', icon: <FileBarChart size={14} />, action: () => { setPortalMode('dispatcher'); setDispatcherTab('history'); } },
          ].map(tab => {
            const isActive = tab.id === 'home' ? portalMode === 'home' :
              tab.id === 'ai-assistant' ? portalMode === 'ai-assistant' :
              tab.id === 'dispatcher' ? (portalMode === 'dispatcher' && dispatcherTab === 'map') :
              tab.id === 'dispatcher-history' ? (portalMode === 'dispatcher' && dispatcherTab === 'history') :
              portalMode === 'citizen' && tab.id === `citizen-${citizenTab}`;
            return (
              <li key={tab.id}>
                <button
                  onClick={() => {
                    if (tab.action) tab.action();
                    else setPortalMode(tab.id);
                  }}
                  className={`text-[.82rem] px-3 py-1.5 rounded-md transition-all cursor-pointer font-body flex items-center gap-2 ${
                    isActive 
                      ? 'text-white bg-white/[.1] shadow-sm' 
                      : 'text-[var(--muted)] hover:text-white hover:bg-white/[.05]'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
        
        {/* Nav Right */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="h-[30px] px-2.5 rounded-[7px] bg-card-2 border border-[var(--border)] flex items-center justify-center text-sm text-[var(--muted)] hover:border-[var(--border-accent)] hover:text-white transition-all cursor-pointer font-body"
            title={soundEnabled ? "Mute Sounds" : "Enable Sounds"}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          
          {/* Profile Button with Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowProfileSwitcher(!showProfileSwitcher)}
              className="flex items-center gap-1.5 h-[30px] px-2.5 rounded-[7px] bg-card-2 border border-[var(--border)] text-[.78rem] text-[var(--muted)] hover:border-[var(--border-accent)] hover:text-white transition-all cursor-pointer font-body"
            >
              <div className="w-[22px] h-[22px] rounded-full bg-crisis flex items-center justify-center text-[.6rem] font-bold text-white">
                {initials}
              </div>
              <span className="hidden sm:inline">{userProfile.name ? userProfile.name.split(' ')[0] : 'Profile'}</span>
            </button>
            {showProfileSwitcher && (
              <div className="absolute right-0 top-[36px] w-[220px] bg-card-2 border border-[var(--border)] rounded-xl shadow-2xl z-[999] animate-slide-up overflow-hidden">
                <div className="px-3 py-2 text-[.7rem] text-[var(--muted)] uppercase tracking-widest font-bold border-b border-[var(--border)]">Switch Profile</div>
                {allProfiles.map((p, i) => (
                  <button key={i} onClick={() => switchProfile(i)} className={`w-full flex items-center gap-2 px-3 py-2 text-[.8rem] transition-all cursor-pointer ${i === activeProfileIdx ? 'text-white bg-crisis/10' : 'text-[var(--muted)] hover:text-white hover:bg-white/5'}`}>
                    <div className="w-5 h-5 rounded-full bg-crisis/30 flex items-center justify-center text-[.55rem] font-bold text-white shrink-0">
                      {p.name ? p.name[0]?.toUpperCase() : '?'}
                    </div>
                    <span className="truncate">{p.name || 'Unnamed'}</span>
                    {i === activeProfileIdx && <span className="ml-auto text-crisis text-xs">✓</span>}
                  </button>
                ))}
                <button onClick={addNewProfile} className="w-full px-3 py-2 text-[.8rem] text-[var(--blue)] hover:bg-white/5 transition-all border-t border-[var(--border)] cursor-pointer">
                  + Add New Profile
                </button>
                <button onClick={() => { setShowProfileSwitcher(false); setPortalMode('citizen'); setCitizenTab('profile'); }} className="w-full px-3 py-2 text-[.8rem] text-[var(--muted)] hover:text-white hover:bg-white/5 transition-all cursor-pointer">
                  ✏️ Edit Current Profile
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden h-[30px] w-[30px] rounded-[7px] bg-card-2 border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-white transition-all cursor-pointer"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-[57px] bg-night/98 backdrop-blur-2xl z-[999] animate-fade-in flex flex-col p-6">
            <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-[.2em] mb-6">Navigation Menu</p>
            <div className="flex flex-col gap-3">
              {[
                { id: 'home', label: 'Home Dashboard', icon: <Home size={20} />, action: () => setPortalMode('home') },
                { id: 'citizen-sos', label: 'Emergency SOS', icon: <ShieldAlert size={20} className="text-red-500" />, action: () => { setPortalMode('citizen'); setCitizenTab('sos'); } },
                { id: 'citizen-profile', label: 'Medical Profile', icon: <UserCircle size={20} />, action: () => { setPortalMode('citizen'); setCitizenTab('profile'); } },
                { id: 'ai-assistant', label: 'AI First-Aid Assistant', icon: <Bot size={20} className="text-blue-400" />, action: () => setPortalMode('ai-assistant') },
                { id: 'dispatcher', label: 'Dispatcher Hub', icon: <LayoutDashboard size={20} />, action: () => { setPortalMode('dispatcher'); setDispatcherTab('map'); } },
                { id: 'dispatcher-history', label: 'Incident Reports', icon: <FileBarChart size={20} />, action: () => { setPortalMode('dispatcher'); setDispatcherTab('history'); } },
              ].map(tab => {
                const isActive = tab.id === 'home' ? portalMode === 'home' :
                  tab.id === 'ai-assistant' ? portalMode === 'ai-assistant' :
                  tab.id === 'dispatcher' ? (portalMode === 'dispatcher' && dispatcherTab === 'map') :
                  tab.id === 'dispatcher-history' ? (portalMode === 'dispatcher' && dispatcherTab === 'history') :
                  portalMode === 'citizen' && tab.id === `citizen-${citizenTab}`;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      tab.action();
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all border ${
                      isActive 
                        ? 'bg-white/[.08] border-white/10 text-white shadow-lg' 
                        : 'bg-white/[.03] border-transparent text-[var(--muted)]'
                    }`}
                  >
                    <div className={`${isActive ? 'text-white' : 'text-[var(--muted2)]'}`}>
                      {tab.icon}
                    </div>
                    <span className="font-head font-bold text-base">{tab.label}</span>
                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></div>}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-auto pt-8 border-t border-white/5">
              <div className="bg-card-2 border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-crisis flex items-center justify-center text-sm font-bold text-white">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{userProfile.name || 'Emergency Guest'}</p>
                    <p className="text-[10px] text-[var(--muted)]">Active Profile</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setPortalMode('citizen'); setCitizenTab('profile'); setMobileMenuOpen(false); }}
                  className="text-[10px] font-bold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ══ MAIN CONTENT ══ */}
      <main className="flex-grow flex relative" style={{ paddingTop: '57px' }}>
        {/* Landing Page */}
        {portalMode === 'home' && (
          <LandingPage onNavigate={handleLandingNavigate} />
        )}

        {/* Citizen App */}
        {portalMode === 'citizen' && citizenTab === 'sos' && (
          <VictimMode 
            onAddIncident={handleAddIncident} 
            incidents={incidents}
            userProfile={userProfile}
            onUpdateIncidentStatus={handleUpdateIncidentStatus}
            onSendMessage={handleSendMessage}
            onNavigateToProfile={() => setCitizenTab('profile')}
            routeETA={routeData.eta}
            routeDistance={routeData.distance}
            routeTotalSteps={routeData.totalSteps}
            routeCurrentStep={routeData.currentStep}
            darkMode={true}
            addToast={addToast}
            soundEnabled={soundEnabled}
          />
        )}
        {portalMode === 'citizen' && citizenTab === 'profile' && (
          <UserProfile 
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            onCancel={() => setCitizenTab('sos')}
            onDeleteProfile={handleDeleteProfile}
          />
        )}
        {portalMode === 'ai-assistant' && (
          <AIAssistant />
        )}

        <div style={{ display: (portalMode === 'dispatcher' && dispatcherTab === 'map') ? 'flex' : 'none', width: '100%' }}>
          <DispatcherDashboard 
            incidents={incidents} 
            onUpdateIncidentStatus={handleUpdateIncidentStatus}
            onSendMessage={handleSendMessage}
            onRouteUpdate={handleRouteUpdate}
            portalMode={portalMode}
            addToast={addToast}
          />
        </div>
        {portalMode === 'dispatcher' && dispatcherTab === 'history' && (
          <IncidentHistory incidents={incidents} isDispatcherView={true} />
        )}
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
