import React from 'react';

export default function LandingPage({ onNavigate }) {
  return (
    <div className="w-full font-body">
      {/* ── HERO ── */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-32 text-center relative overflow-hidden">
        <div className="hero-glow"></div>
        <div className="hero-grid-bg"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-[6px] bg-crisis/10 border border-crisis/30 text-[#ff7b82] text-[.72rem] font-medium px-3.5 py-1 rounded-full uppercase tracking-widest mb-5">
            <span className="w-[5px] h-[5px] bg-crisis rounded-full animate-dot-pulse"></span>
            Real-Time Emergency Response
          </div>
          
          <h1 className="font-head text-[clamp(2.4rem,5vw,4.2rem)] font-extrabold leading-[1.06] tracking-tight mb-4 max-w-[760px]">
            Every Second Counts.<br/>
            <span className="text-crisis">ResQNet</span> Saves Them.
          </h1>
          
          <p className="text-[var(--muted)] text-base max-w-[520px] leading-relaxed mb-8 font-light">
            Automatic SOS, real-time dispatch coordination, Gemini AI-powered triage, 
            and live ambulance tracking — all in one platform.
          </p>
          
          <div className="flex gap-3 flex-wrap justify-center">
            <button 
              onClick={() => onNavigate('citizen', 'sos')}
              className="px-7 py-3 rounded-lg text-[.88rem] font-medium bg-crisis text-white border-none cursor-pointer transition-all hover:bg-crisis-dark inline-flex items-center gap-1.5 shadow-lg shadow-crisis/20"
            >
              🚨 Launch SOS Mode
            </button>
            <button 
              onClick={() => onNavigate('dispatcher')}
              className="px-7 py-3 rounded-lg text-[.88rem] font-medium bg-transparent text-[var(--muted)] border border-[var(--border)] cursor-pointer transition-all hover:border-white/[.18] hover:text-white inline-flex items-center gap-1.5"
            >
              💻 Dispatcher Portal
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS ROW ── */}
      <div className="flex flex-wrap border-t border-b border-[var(--border)] bg-night-2">
        {[
          { num: '30', unit: 's', label: 'Auto SOS Countdown' },
          { num: '4', unit: '', label: 'Hazard Types' },
          { num: '5+', unit: '', label: 'Services Coordinated' },
          { num: '5', unit: ' lang', label: 'AI Languages' },
          { num: '24', unit: '/7', label: 'Offline Backup' },
        ].map((s, i) => (
          <div key={i} className="flex-1 min-w-[130px] py-5 px-6 border-r border-[var(--border)] last:border-r-0 text-center">
            <div className="font-head text-3xl font-extrabold tracking-tight leading-none mb-1">
              {s.num}<span className="text-crisis">{s.unit}</span>
            </div>
            <div className="text-[.68rem] text-[var(--muted)] uppercase tracking-widest">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── FEATURES ── */}
      <section className="py-16 px-6 max-w-[1060px] mx-auto">
        <span className="text-[.68rem] font-semibold uppercase tracking-[.1em] text-crisis mb-2 block">Features</span>
        <h2 className="font-head text-[clamp(1.5rem,2.8vw,2.2rem)] font-bold tracking-tight leading-tight mb-2">Built for Every Emergency</h2>
        <p className="text-[var(--muted)] text-[.9rem] max-w-[500px] leading-relaxed font-light mb-8">
          From auto crash detection to AI-guided first aid, ResQNet handles it all.
        </p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(265px,1fr))] gap-4">
          {[
            { n: '01', ico: '📳', title: 'Auto SOS Trigger', desc: 'Detects crash via accelerometer — 30s countdown — auto-dispatches to all services simultaneously.' },
            { n: '02', ico: '🗺️', title: 'Live Map Tracking', desc: 'Real-time ambulance tracking on map with OSRM routing, ETA countdown, and shrinking polyline.' },
            { n: '03', ico: '🤖', title: 'Gemini AI Triage', desc: 'Context-aware emergency instructions from Gemini AI — multilingual, with offline fallback packs.' },
            { n: '04', ico: '💬', title: 'Live Victim-Dispatch Chat', desc: 'Two-way real-time messaging between victim and dispatcher for situation updates.' },
            { n: '05', ico: '🎯', title: 'Smart Dispatch Engine', desc: 'Nearest free ambulance, police, hospital — auto-selected and dispatched with route preview.' },
            { n: '06', ico: '📊', title: 'Analytics & Heat Map', desc: 'Response time metrics, resolved incident counter, and heat map layer for hotspot analysis.' },
          ].map((f, i) => (
            <div key={i} className="feature-card bg-card border border-[var(--border)] rounded-xl p-5">
              <div className="text-[.65rem] uppercase tracking-[.1em] text-crisis font-semibold mb-2">{f.n}</div>
              <div className="text-2xl mb-3">{f.ico}</div>
              <h3 className="font-head text-[.92rem] font-bold mb-1.5">{f.title}</h3>
              <p className="text-[.8rem] text-[var(--muted)] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HAZARD TYPES ── */}
      <div className="bg-night-2 py-14">
        <div className="max-w-[1060px] mx-auto px-6">
          <span className="text-[.68rem] font-semibold uppercase tracking-[.1em] text-crisis mb-2 block">Coverage</span>
          <h2 className="font-head text-[clamp(1.5rem,2.8vw,2.2rem)] font-bold tracking-tight leading-tight mb-6">One Platform, All Crisis Types</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
            {[
              { ico: '🚗', title: 'Road Accident', desc: 'Auto-triggered by impact. Shares blood type and profile with ER team before arrival.', bg: 'rgba(231,76,60,.08)', bc: 'rgba(231,76,60,.2)', tc: '#e74c3c' },
              { ico: '🔥', title: 'Fire Emergency', desc: 'Alerts fire station with floor details. Guides evacuation through AI instructions.', bg: 'rgba(243,156,18,.08)', bc: 'rgba(243,156,18,.2)', tc: '#f39c12' },
              { ico: '🆘', title: 'Women Safety', desc: 'Shake-gesture SOS, live streams to police, tracks location every 30 seconds.', bg: 'rgba(155,89,182,.08)', bc: 'rgba(155,89,182,.25)', tc: '#9b59b6' },
              { ico: '❤️', title: 'Health Emergency', desc: 'Cardiac / seizure response. AI guides bystanders through CPR step by step.', bg: 'rgba(46,204,113,.08)', bc: 'rgba(46,204,113,.2)', tc: '#2ecc71' },
            ].map((h, i) => (
              <div key={i} className="hazard-card" style={{ background: h.bg, borderColor: h.bc }}>
                <span className="text-3xl block mb-3">{h.ico}</span>
                <h3 className="font-head text-[.9rem] font-bold mb-1.5" style={{ color: h.tc }}>{h.title}</h3>
                <p className="text-[.78rem] text-[var(--muted)] leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="cta-glow bg-night-2 text-center py-20 px-6">
        <span className="text-[.68rem] font-semibold uppercase tracking-[.1em] text-crisis mb-2 block">Get Started</span>
        <h2 className="font-head text-[clamp(1.5rem,2.8vw,2.2rem)] font-bold tracking-tight leading-tight mb-3">Ready to Save Lives?</h2>
        <p className="text-[var(--muted)] text-[.9rem] mb-7">Set up your profile and start using ResQNet AI now.</p>
        <div className="flex gap-3 justify-center flex-wrap relative z-10">
          <button 
            onClick={() => onNavigate('citizen', 'sos')}
            className="px-7 py-3 rounded-lg text-[.88rem] font-medium bg-crisis text-white border-none cursor-pointer transition-all hover:bg-crisis-dark inline-flex items-center gap-1.5"
          >
            🚨 Launch Citizen App
          </button>
          <button 
            onClick={() => onNavigate('citizen', 'profile')}
            className="px-7 py-3 rounded-lg text-[.88rem] font-medium bg-transparent text-[var(--muted)] border border-[var(--border)] cursor-pointer transition-all hover:border-white/[.18] hover:text-white inline-flex items-center gap-1.5"
          >
            👤 Set Up Profile
          </button>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="bg-night border-t border-[var(--border)] py-6 px-6 flex items-center justify-between flex-wrap gap-3">
        <div className="font-head font-extrabold text-base">
          ResQ<span className="text-crisis">Net</span> AI
        </div>
        <p className="text-[.75rem] text-[var(--muted)]">© 2025 ResQNet AI · Smart SOS & Emergency Coordination Platform</p>
        <p className="text-[.72rem] text-[var(--muted2)]">Built for India's Urban & Rural Safety</p>
      </footer>
    </div>
  );
}
