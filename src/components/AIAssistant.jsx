import React, { useState, useRef, useEffect } from 'react';
import { Send, Wifi, WifiOff, Globe, Sparkles, AlertTriangle, Heart, Flame, Brain, Droplets, Shield, Phone, ChevronRight } from 'lucide-react';

const LANGS = ['English','Hindi','Bengali','Tamil','Telugu','Punjabi'];

const OFFLINE_PACKS = {
  'Road Accident': { icon: '🚗', color: '#ef4444', steps: [
    'Do NOT move the victim — especially neck or spine',
    'Check breathing: tilt head back gently, look for chest rise',
    'If not breathing: 30 chest compressions, 2 rescue breaths (CPR)',
    'Stop bleeding: firm direct pressure with clean cloth — do not remove',
    'Keep victim warm. No water or food. Talk to keep conscious',
    'Call 108 (Ambulance) → 100 (Police). Note vehicle numbers if hit-and-run',
  ]},
  'Cardiac Emergency': { icon: '❤️', color: '#e74c3c', steps: [
    'Call 108 immediately — say "suspected cardiac arrest"',
    'Have victim sit upright or lie down comfortably',
    'Give 325mg aspirin (chew, not swallow whole) if not allergic',
    'Loosen tight clothing around chest and neck',
    'Begin CPR if person becomes unresponsive: 30 compressions, 2 breaths',
    'Use AED if available — follow voice prompts',
  ]},
  'Fire Emergency': { icon: '🔥', color: '#f59e0b', steps: [
    'Evacuate immediately — do NOT use elevators',
    'Stay low: crawl below smoke level (cleaner air near floor)',
    'Feel doors before opening — hot door means fire behind it',
    'Cover nose and mouth with wet cloth if available',
    'If clothes catch fire: STOP, DROP, and ROLL',
    'Call 101 (Fire) once safely outside. Do not re-enter building',
  ]},
  'Seizure Protocol': { icon: '🧠', color: '#8b5cf6', steps: [
    'Clear area of sharp or hard objects',
    'Place something soft under head (jacket, pillow)',
    'Do NOT hold person down or put anything in mouth',
    'Turn person on their side after convulsions stop',
    'Time the seizure — call 108 if it lasts over 5 minutes',
    'Stay with person until fully conscious and oriented',
  ]},
  'Choking / Drowning': { icon: '🫁', color: '#06b6d4', steps: [
    'Choking: ask "Can you cough?" — if yes, encourage coughing',
    'If no cough/sound: 5 back blows between shoulder blades',
    'Then 5 abdominal thrusts (Heimlich maneuver)',
    'Drowning: remove from water, check breathing immediately',
    'If not breathing: begin CPR — 30 compressions, 2 rescue breaths',
    'Call 108. Keep victim warm to prevent hypothermia',
  ]},
  'Women Safety': { icon: '🛡️', color: '#ec4899', steps: [
    'Call 112 (Emergency) or 1091 (Women Helpline) immediately',
    'Share live location with trusted contact via WhatsApp/SMS',
    'Move to nearest public/crowded area — shops, petrol pumps',
    'Make noise: shout "FIRE" (attracts more attention than "Help")',
    'Note attacker details: face, clothing, vehicle, direction',
    'Do NOT delete messages or calls — preserve evidence for police',
  ]},
};

const SCENARIOS = [
  { label: 'Unconscious after crash', pack: 'Road Accident' },
  { label: 'Possible heart attack', pack: 'Cardiac Emergency' },
  { label: 'Severe leg bleeding', pack: 'Road Accident' },
  { label: 'Person not breathing', pack: 'Cardiac Emergency' },
  { label: 'Building fire escape', pack: 'Fire Emergency' },
  { label: 'Child choking', pack: 'Choking / Drowning' },
];

const EMERGENCY_NUMS = [
  { label: 'Ambulance', num: '108 / 102' },
  { label: 'Police', num: '100' },
  { label: 'Fire', num: '101' },
  { label: 'Women Helpline', num: '1091' },
  { label: 'Universal Emergency', num: '112' },
  { label: 'Disaster Management', num: '1078' },
];

export default function AIAssistant() {
  const [lang, setLang] = useState('English');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activePack, setActivePack] = useState(null);
  const [translatedPack, setTranslatedPack] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [messages, setMessages] = useState([{ role:'ai', text:'Welcome to ResQNet AI. I provide real-time, language-aware emergency instructions powered by Gemini AI.\n\nDescribe your emergency or choose a scenario from the right panel.' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEnd = useRef(null);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const translatePack = async (pack, targetLang) => {
    if (targetLang === 'English') { setTranslatedPack(null); return; }
    setTranslating(true);
    try {
      const res = await fetch('/api/gemini', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ prompt: `Translate the following emergency instructions to ${targetLang}. Return ONLY the translated numbered list, no extra text:\n${pack.steps.map((s,i)=>`${i+1}. ${s}`).join('\n')}` })
      });
      if (!res.ok) throw new Error('Translation failed');
      const data = await res.json();
      setTranslatedPack(data.text);
    } catch { setTranslatedPack('⚠️ Translation unavailable offline. Use English instructions above.'); }
    setTranslating(false);
  };

  const loadPack = (name) => {
    setActivePack(name);
    setTranslatedPack(null);
    const pack = OFFLINE_PACKS[name];
    setMessages(prev => [...prev, { role:'system', text: `Loading offline pack: ${pack.icon} ${name}` }]);
    if (lang !== 'English') translatePack(pack, lang);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role:'user', text: userMsg }]);
    setLoading(true);
    try {
      const langNote = lang !== 'English' ? ` Respond in ${lang}.` : '';
      const res = await fetch('/api/gemini', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ prompt: `You are ResQNet AI, an emergency response assistant. The user describes an emergency situation. Provide clear, numbered, actionable first-aid or safety instructions. Be concise (max 6 steps).${langNote}\n\nUser: ${userMsg}` })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'API error');
      }
      const data = await res.json();
      setMessages(prev => [...prev, { role:'ai', text: data.text }]);
    } catch (err) {
      setMessages(prev => [...prev, { role:'ai', text: `⚠️ ${err.message || 'Could not reach Gemini AI'}. Try an offline pack from the sidebar instead.` }]);
    }
    setLoading(false);
  };

  const handleScenario = (sc) => {
    loadPack(sc.pack);
    setInput(sc.label);
  };

  const currentPack = activePack ? OFFLINE_PACKS[activePack] : null;

  return (
    <div className="w-full flex-1 flex bg-[#0a0c10] overflow-hidden">
      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[.07]">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-crisis" />
            <span className="font-head text-sm font-bold text-white">Gemini AI</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[var(--muted)] uppercase tracking-wider">Language:</span>
            <select value={lang} onChange={e => { setLang(e.target.value); if (activePack) translatePack(OFFLINE_PACKS[activePack], e.target.value); }}
              className="bg-[#1c2030] border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 outline-none focus:border-crisis/50">
              {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${isOnline ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
              {isOnline ? <Wifi size={12}/> : <WifiOff size={12}/>}
              {isOnline ? 'Online · Gemini' : 'Offline'}
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div className="mx-4 mt-3 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
          <span className="text-[11px] text-emerald-400">🟢 Gemini AI ready · Offline packs available without internet</span>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`max-w-[85%] ${m.role === 'user' ? 'ml-auto' : ''}`}>
              {m.role === 'system' ? (
                <div className="text-center py-2"><span className="text-[11px] px-3 py-1 rounded-full bg-[#1c2030] text-[var(--muted)] border border-white/5">🟢 {m.text}</span></div>
              ) : m.role === 'user' ? (
                <div className="bg-crisis/15 border border-crisis/25 rounded-2xl rounded-br-md px-4 py-3 text-sm text-white">{m.text}</div>
              ) : (
                <div className="bg-[#151820] border border-white/[.07] rounded-2xl rounded-bl-md px-4 py-3 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{m.text}</div>
              )}
            </div>
          ))}

          {/* Active Offline Pack Display */}
          {currentPack && (
            <div className="bg-[#151820] border border-white/[.07] rounded-2xl px-5 py-4">
              <h3 className="font-head text-sm font-bold mb-3" style={{ color: currentPack.color }}>{activePack} Protocol</h3>
              <ol className="space-y-2.5">
                {currentPack.steps.map((s, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5" style={{ background: currentPack.color }}>{i+1}</span>
                    <span className="text-sm text-slate-300 leading-relaxed">{s}</span>
                  </li>
                ))}
              </ol>
              {/* Translation */}
              {lang !== 'English' && (
                <div className="mt-4 pt-3 border-t border-white/[.07]">
                  <p className="text-[11px] text-[var(--muted)] uppercase tracking-wider mb-2 font-bold flex items-center gap-1.5"><Globe size={12}/> {lang} Translation</p>
                  {translating ? (
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)]"><span className="animate-spin">⏳</span> Translating via Gemini AI...</div>
                  ) : translatedPack ? (
                    <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{translatedPack}</div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="flex gap-2 items-center text-xs text-[var(--muted)]"><span className="animate-spin">⏳</span> Gemini AI is thinking...</div>
          )}
          <div ref={chatEnd}/>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-white/[.07]">
          <div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Describe your emergency situation..."
              className="flex-1 bg-[#151820] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-[var(--muted2)] outline-none focus:border-crisis/40 transition-colors"/>
            <button onClick={sendMessage} disabled={loading || !input.trim()}
              className="bg-crisis hover:bg-crisis/80 disabled:opacity-40 text-white px-5 py-3 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors shrink-0">
              Send <Send size={14}/>
            </button>
          </div>
        </div>
      </div>

      {/* ── Right Sidebar ── */}
      <div className="w-[280px] border-l border-white/[.07] bg-[#0d0f14] overflow-y-auto hidden lg:block">
        <div className="p-4 space-y-5">
          {/* Offline Packs */}
          <div>
            <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-3 flex items-center gap-1.5">🟠 Offline Instruction Packs</p>
            <div className="space-y-1">
              {Object.entries(OFFLINE_PACKS).map(([name, pack]) => (
                <button key={name} onClick={() => loadPack(name)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${activePack === name ? 'bg-crisis/15 text-white border border-crisis/30' : 'text-slate-400 hover:bg-white/[.04] hover:text-white'}`}>
                  <span>{pack.icon}</span><span>{name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Scenarios */}
          <div>
            <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-3 flex items-center gap-1.5">⚡ Quick Scenarios</p>
            <div className="space-y-1">
              {SCENARIOS.map((sc, i) => (
                <button key={i} onClick={() => handleScenario(sc)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs text-slate-400 hover:bg-white/[.04] hover:text-white transition-all">
                  <span>{OFFLINE_PACKS[sc.pack]?.icon}</span><span>{sc.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Numbers */}
          <div>
            <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-3">Emergency Numbers 🇮🇳</p>
            <div className="space-y-1.5">
              {EMERGENCY_NUMS.map((e, i) => (
                <div key={i} className="flex justify-between items-center px-3 py-1.5 text-xs">
                  <span className="text-slate-400">{e.label}</span>
                  <span className="text-crisis font-bold font-mono">{e.num}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
