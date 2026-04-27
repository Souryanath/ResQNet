import React, { useState, useEffect } from 'react';
import { AlertCircle, Flame, Stethoscope, ShieldAlert, CheckCircle2, Loader2, Info, User, Heart, Phone, Droplets, Settings, Mic, MicOff, MapPin, AlertOctagon, Car, Shield } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// IMPORTANT: Replace this with your actual Gemini API Key
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "YOUR_GEMINI_API_KEY";

// Feature 8: Geofencing — known hazard zones in Kolkata
const hazardZones = [
  { lat: 22.5580, lng: 88.3420, radius: 0.005, label: 'Hooghly River Bank', type: 'river' },
  { lat: 22.5650, lng: 88.3450, label: 'Howrah Bridge Zone', radius: 0.003, type: 'bridge' },
  { lat: 22.5920, lng: 88.4000, label: 'EM Bypass Highway', radius: 0.004, type: 'highway' },
  { lat: 22.6540, lng: 88.4470, label: 'Airport Approach Zone', radius: 0.006, type: 'airport' },
];

function checkGeofence(lat, lng) {
  for (const zone of hazardZones) {
    const dist = Math.sqrt(Math.pow(lat - zone.lat, 2) + Math.pow(lng - zone.lng, 2));
    if (dist < zone.radius) return zone;
  }
  return null;
}

export default function VictimMode({ onAddIncident, incidents, onUpdateIncidentStatus, userProfile, onNavigateToProfile, onSendMessage, routeETA, routeDistance, routeTotalSteps, routeCurrentStep, darkMode }) {
  // Feature 5: Real-time countdown timer
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (routeETA && routeTotalSteps > 0 && routeCurrentStep < routeTotalSteps) {
      // Initialize time left based on progress
      const totalSeconds = routeETA * 60;
      const remaining = Math.max(0, Math.ceil(totalSeconds * (1 - (routeCurrentStep / routeTotalSteps))));
      // Only jump if we are wildly out of sync (> 10s difference), otherwise let the smooth timer tick
      setTimeLeft(prev => (prev === null || Math.abs(prev - remaining) > 10) ? remaining : prev);
    }
  }, [routeETA, routeTotalSteps, routeCurrentStep]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (secs) => {
    if (secs === null) return '--:--';
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const remainingDist = (routeDistance && routeTotalSteps > 0)
    ? (routeDistance * (1 - (routeCurrentStep / routeTotalSteps))).toFixed(2)
    : routeDistance;
  const [activeCrisisId, setActiveCrisisId] = useState(null);
  const [category, setCategory] = useState('Road Accident');
  const [description, setDescription] = useState('');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [dynamicInstructions, setDynamicInstructions] = useState('');
  const [crashCountdown, setCrashCountdown] = useState(null);
  const [countdownIntervalId, setCountdownIntervalId] = useState(null);
  const [isListening, setIsListening] = useState(false); // Feature 9: Voice
  const [geofenceAlert, setGeofenceAlert] = useState(null); // Feature 8
  const [contactAlerting, setContactAlerting] = useState(false); // Feature 1: Contact Alert
  const [chatMessage, setChatMessage] = useState(''); // Feature 4: Live Chat

  const [dismissedCrisisId, setDismissedCrisisId] = useState(null);
  const [crashAttempt, setCrashAttempt] = useState(1);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Find the current active incident if any
  const currentIncident = incidents.find(inc => inc.id === activeCrisisId);

  // Auto-restore active crisis if user switches tabs and comes back
  useEffect(() => {
    if (!activeCrisisId && incidents.length > 0) {
      const latest = incidents[incidents.length - 1];
      // If it's a pending or dispatched incident, and hasn't been manually dismissed, restore the view
      if ((latest.status === 'pending' || latest.status === 'dispatched') && latest.id !== dismissedCrisisId) {
        setActiveCrisisId(latest.id);
        setCategory(latest.category);
        const cached = localStorage.getItem(`crisisSync_ai_${latest.category}`);
        if (cached) setDynamicInstructions(cached);
      }
    }
    // Auto-show resolved screen when incident gets auto-resolved
    if (activeCrisisId && currentIncident?.status === 'resolved' && dismissedCrisisId !== activeCrisisId) {
      // Keep the crisis view active so user sees the resolution UI
    }
  }, [activeCrisisId, incidents, dismissedCrisisId]);

  // Feature 1: Multi-incident blocker
  const activeBackgroundIncident = incidents.find(inc => 
    (inc.status === 'pending' || inc.status === 'dispatched') && inc.id !== activeCrisisId
  );

  const handleSOS = (autoTriggered = false) => {
    // Feature 1: Multi-incident support - Block if active
    if (activeBackgroundIncident) {
      setActiveCrisisId(activeBackgroundIncident.id);
      setDismissedCrisisId(null);
      if (addToast) addToast("Active Emergency", "You already have an active emergency. Switching to tracking view.", "warning");
      return;
    }

    // Clear any active countdown if manually triggered
    if (countdownIntervalId) {
      clearInterval(countdownIntervalId);
      setCountdownIntervalId(null);
      setCrashCountdown(null);
    }

    // Curated land-safe locations covering Kolkata, Howrah, North & South 24 Parganas (excluding water/airports)
    const safeLocations = [
      { lat: 22.5726, lng: 88.3639 }, // Esplanade
      { lat: 22.5510, lng: 88.3530 }, // Park Street
      { lat: 22.5652, lng: 88.3694 }, // Sealdah
      { lat: 22.5280, lng: 88.3630 }, // Ballygunge
      { lat: 22.4990, lng: 88.3710 }, // Jadavpur
      { lat: 22.4890, lng: 88.3380 }, // Behala
      { lat: 22.5800, lng: 88.4200 }, // Salt Lake
      { lat: 22.5920, lng: 88.4640 }, // New Town
      { lat: 22.6233, lng: 88.4200 }, // Dum Dum
      { lat: 22.5440, lng: 88.3940 }, // EM Bypass
      { lat: 22.5150, lng: 88.3680 }, // Gariahat
      { lat: 22.6050, lng: 88.3780 }, // Shyambazar
      { lat: 22.5870, lng: 88.3900 }, // Ultadanga
      { lat: 22.5560, lng: 88.3510 }, // Maidan
      { lat: 22.4710, lng: 88.3770 }, // Garia
      { lat: 22.5710, lng: 88.3150 }, // Shibpur
      { lat: 22.5850, lng: 88.2750 }, // Santragachi
      { lat: 22.6480, lng: 88.3400 }, // Bally
      { lat: 22.6300, lng: 88.3480 }, // Belur
      { lat: 22.6100, lng: 88.3300 }, // Liluah
      { lat: 22.7200, lng: 88.4800 }, // Barasat
      { lat: 22.7600, lng: 88.3700 }, // Barrackpore
      { lat: 22.7000, lng: 88.3800 }, // Sodepur
      { lat: 22.6950, lng: 88.4500 }, // Madhyamgram
      { lat: 22.6350, lng: 88.3900 }, // Belgharia
      { lat: 22.6150, lng: 88.5000 }, // Rajarhat
      { lat: 22.3600, lng: 88.4300 }, // Baruipur
      { lat: 22.4400, lng: 88.4200 }, // Sonarpur
      { lat: 22.4420, lng: 88.3960 }, // Narendrapur
      { lat: 22.3700, lng: 88.2800 }, // Amtala
      { lat: 22.6750, lng: 88.2900 }, // Dankuni
    ];
    const safePick = safeLocations[Math.floor(Math.random() * safeLocations.length)];

    const newIncident = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      location: { lat: (safePick.lat + (Math.random() - 0.5) * 0.005).toFixed(4), lng: (safePick.lng + (Math.random() - 0.5) * 0.005).toFixed(4) },
      category: autoTriggered ? 'Road Accident' : category, // default to road accident for auto-crash
      severity: 'Critical',
      description: autoTriggered ? 'Automated Crash Detection Triggered' : (description || 'No description provided.'),
      status: 'pending' // pending -> ai_analyzing -> ai_analyzed -> dispatched
    };

    onAddIncident(newIncident);
    setActiveCrisisId(newIncident.id);
    setAiAnalyzing(true);

    // Feature 8: Check geofence
    const zone = checkGeofence(parseFloat(newIncident.location.lat), parseFloat(newIncident.location.lng));
    setGeofenceAlert(zone);

    // Feature 1: Emergency Contact Auto-Alert
    if (userProfile?.emergencyContactPhone) {
      setContactAlerting(true);
      setTimeout(() => setContactAlerting(false), 3500);
    }
  };

  // Feature 9: Voice-to-SOS using Web Speech API
  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in this browser. Try Chrome.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setDescription(prev => prev ? `${prev} ${transcript}` : transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  // Feature: Play loud beep after attempt fails
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime); // 1000 Hz loud beep
      
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.warn("Audio playback not supported", e);
    }
  };

  // Crash Simulation Logic
  const handleSimulateCrash = () => {
    if (crashCountdown !== null) return;
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
    
    const attempts = parseInt(userProfile?.autoDialAttempts) || 3;
    const seconds = parseInt(userProfile?.autoDialSeconds) || 30;
    
    let currentAttempt = 1;
    let currentSeconds = seconds;
    
    setCrashAttempt(currentAttempt);
    setCrashCountdown(currentSeconds);
    
    const id = setInterval(() => {
      currentSeconds -= 1;
      if (currentSeconds <= 0) {
        if (currentAttempt >= attempts) {
          clearInterval(id);
          setCountdownIntervalId(null);
          setCrashCountdown(null);
          handleSOS(true);
        } else {
          currentAttempt += 1;
          currentSeconds = seconds;
          setCrashAttempt(currentAttempt);
          setCrashCountdown(currentSeconds);
          playBeep(); // Generate sound after each attempt finishes
          if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
        }
      } else {
        setCrashCountdown(currentSeconds);
      }
    }, 1000);
    setCountdownIntervalId(id);
  };

  const cancelCrash = () => {
    if (countdownIntervalId) clearInterval(countdownIntervalId);
    setCountdownIntervalId(null);
    setCrashCountdown(null);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchGeminiInstructions = async () => {
      if (!aiAnalyzing) return;

      if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
        // Fallback if no API key is provided
        setTimeout(() => {
          if (isMounted) {
            setDynamicInstructions("Follow standard emergency protocols. Stay where you are and wait for responders.");
            setAiAnalyzing(false);
          }
        }, 2000);
        return;
      }

      try {
        const profileContext = userProfile ? `Patient: ${userProfile.name || 'Unknown'}, Age: ${userProfile.age || 'N/A'}, Blood: ${userProfile.bloodType || 'N/A'}, Conditions: ${userProfile.medicalConditions || userProfile.conditions || 'None'}, Allergies: ${userProfile.allergies || 'None'}.` : '';
        
        const categoryMap = {
          'Road Accident': 'road traffic accident with potential injuries',
          'Fire': 'fire emergency requiring evacuation',
          'Women Safety': 'women safety threat requiring immediate police intervention',
          'Health': 'medical/health emergency requiring immediate medical attention'
        };
        const emergencyContext = categoryMap[category] || 'general emergency';
        
        const prompt = `You are CrisisSync AI, a real-time emergency response assistant. A user reported a ${emergencyContext}. Details: "${description || 'No details provided'}". ${profileContext} Provide exactly 3 short, calm, actionable survival instructions specific to this emergency type. Keep under 50 words. No markdown.`;

        // Send request to our secure backend proxy
        const response = await fetch('/api/gemini', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
          let backendError = 'Failed to fetch instructions from backend';
          try {
            const errData = await response.json();
            if (errData.error) backendError = errData.error;
          } catch(e) {}
          throw new Error(backendError);
        }

        const data = await response.json();
        const responseText = data.text;

        if (isMounted) {
          setDynamicInstructions(responseText);
          // Save to offline cache
          localStorage.setItem(`crisisSync_ai_${category}`, responseText);
          setAiAnalyzing(false);
        }
      } catch (error) {
        console.error("Gemini API Error:", error);
        if (isMounted) {
          // Offline / Fallback Cache
          const cachedInstructions = localStorage.getItem(`crisisSync_ai_${category}`);
          if (cachedInstructions && !navigator.onLine) {
            setDynamicInstructions(`(Offline Mode) ${cachedInstructions}`);
          } else {
            let errorMsg = error.message || 'Unknown error';
            // Clean up messy Google API JSON strings in the error message if present
            if (errorMsg.includes('API key expired')) {
              errorMsg = 'Your Gemini API key has expired. Please generate a new one at Google AI Studio and update your .env file.';
            } else if (errorMsg.includes('API key not valid')) {
              errorMsg = 'Your Gemini API key is invalid. Please check your .env file.';
            } else if (errorMsg.includes('{')) {
              errorMsg = errorMsg.split('{')[0].trim();
            }
            setDynamicInstructions(`API Error: ${errorMsg}`);
          }
          setAiAnalyzing(false);
        }
      }
    };

    fetchGeminiInstructions();

    return () => { isMounted = false; };
  }, [aiAnalyzing, category, description]);

  return (
    <div className={`w-full h-[calc(100vh-64px)] flex items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-slate-200'} py-8 overflow-y-auto transition-colors duration-300`}>
      {/* Mobile Device Mockup */}
      <div className={`w-full max-w-[400px] h-full max-h-[800px] sm:rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col sm:border-[12px] sm:border-slate-800 ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>

        {/* Status Bar Mock */}
        <div className={`h-12 w-full flex justify-between items-center px-6 text-[10px] font-medium z-50 absolute top-0 border-b ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-white border-slate-100 text-slate-500'}`}>
          <span className={`text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>CrisisSync</span>
          <button 
            onClick={() => onNavigateToProfile && onNavigateToProfile()}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors relative ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'}`}
          >
            {userProfile && userProfile.name ? (
              <>
                <span className={`text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{userProfile.name.charAt(0).toUpperCase()}</span>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 ${darkMode ? 'border-slate-900' : 'border-white'}`}></div>
              </>
            ) : (
              <User size={16} className="text-slate-400" />
            )}
          </button>
        </div>

        <div className={`flex-grow pt-14 pb-6 px-6 overflow-y-auto flex flex-col ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
          {!currentIncident ? (
            <div className="flex flex-col items-center justify-center flex-grow h-full fade-in">

              <h2 className={`text-2xl font-bold mb-2 text-center ${darkMode ? 'text-white' : 'text-slate-800'}`}>Emergency Assistance</h2>
              <p className={`text-center mb-10 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tap the SOS button to instantly notify authorities.</p>

              {/* Massive SOS Button or Countdown */}
              {crashCountdown !== null ? (
                <div className="w-56 h-56 bg-red-50 rounded-full flex flex-col items-center justify-center border-[8px] border-red-500 relative animate-pulse shadow-[0_0_40px_rgba(239,68,68,0.3)]">
                  <span className="text-6xl font-black text-red-600 tracking-tighter">{crashCountdown}</span>
                  <span className="text-xs font-bold text-red-500 uppercase mt-2 tracking-widest text-center px-4">Auto-Dialing<br/>Attempt {crashAttempt} of {userProfile?.autoDialAttempts || 3}</span>
                </div>
              ) : (
                <button
                  onClick={() => handleSOS(false)}
                  className="relative active:scale-95 transition-all duration-300 group"
                >
                  {/* Radial glow behind pill */}
                  <div className="absolute inset-0 bg-red-400 rounded-[3rem] blur-2xl opacity-30 group-hover:opacity-50 transition-opacity scale-110 animate-pulse"></div>
                  {/* Pill-shaped SOS button */}
                  <div className="relative bg-gradient-to-b from-red-500 to-red-700 rounded-[3rem] px-16 py-8 flex flex-col items-center justify-center text-white shadow-[0_8px_30px_rgba(220,38,38,0.5)]">
                    <AlertCircle size={36} className="mb-1" />
                    <span className="text-3xl font-black tracking-widest">SOS</span>
                  </div>
                </button>
              )}

              {/* Crash Cancellation Button */}
              {crashCountdown !== null && (
                <div className="mt-8 flex flex-col gap-3 w-full max-w-xs mx-auto">
                  <button 
                    onClick={cancelCrash}
                    className="w-full px-8 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors shadow-lg"
                  >
                    I'm Safe - Cancel
                  </button>
                  <button 
                    onClick={() => {
                      cancelCrash();
                      handleSOS(true);
                    }}
                    className="w-full px-8 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg"
                  >
                    I'm Not Safe - Send Help
                  </button>
                </div>
              )}

              {/* Options */}
              {crashCountdown === null && (
                <div className="w-full mt-10 space-y-5">
                  {/* Feature 1: Block new SOS if active incident exists */}
                  {activeBackgroundIncident && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-2 text-amber-800">
                        <AlertCircle size={18} />
                        <span className="text-xs font-bold">Active emergency in progress</span>
                      </div>
                      <button 
                        onClick={() => {
                          setActiveCrisisId(activeBackgroundIncident.id);
                          setDismissedCrisisId(null);
                        }}
                        className="text-xs font-bold bg-amber-500 text-white px-3 py-1.5 rounded-lg shadow hover:bg-amber-600"
                      >
                        View Tracking
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Emergency Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setCategory('Road Accident')}
                        className={`py-3 px-2 rounded-2xl flex flex-col items-center gap-1.5 transition-all duration-200 ${category === 'Road Accident' ? 'bg-red-50 text-red-600 border-2 border-red-400 shadow-sm shadow-red-100' : 'bg-white border-2 border-slate-200 text-slate-500 hover:border-slate-300'}`}
                      >
                        <Car size={20} />
                        <span className="text-[10px] font-bold">Road Accident</span>
                      </button>
                      <button
                        onClick={() => setCategory('Fire')}
                        className={`py-3 px-2 rounded-2xl flex flex-col items-center gap-1.5 transition-all duration-200 ${category === 'Fire' ? 'bg-orange-50 text-orange-600 border-2 border-orange-400 shadow-sm shadow-orange-100' : 'bg-white border-2 border-slate-200 text-slate-500 hover:border-slate-300'}`}
                      >
                        <Flame size={20} />
                        <span className="text-[10px] font-bold">Fire</span>
                      </button>
                      <button
                        onClick={() => setCategory('Women Safety')}
                        className={`py-3 px-2 rounded-2xl flex flex-col items-center gap-1.5 transition-all duration-200 ${category === 'Women Safety' ? 'bg-purple-50 text-purple-600 border-2 border-purple-400 shadow-sm shadow-purple-100' : 'bg-white border-2 border-slate-200 text-slate-500 hover:border-slate-300'}`}
                      >
                        <Shield size={20} />
                        <span className="text-[10px] font-bold">Women Safety</span>
                      </button>
                      <button
                        onClick={() => setCategory('Health')}
                        className={`py-3 px-2 rounded-2xl flex flex-col items-center gap-1.5 transition-all duration-200 ${category === 'Health' ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-400 shadow-sm shadow-emerald-100' : 'bg-white border-2 border-slate-200 text-slate-500 hover:border-slate-300'}`}
                      >
                        <Stethoscope size={20} />
                        <span className="text-[10px] font-bold">Health</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Details (Optional — or use 🎤)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., Fire in the lobby"
                        className="w-full p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent bg-white text-slate-800 text-sm placeholder:text-slate-400 pr-12"
                      />
                      {/* Feature 9: Voice mic button */}
                      <button
                        onClick={toggleVoiceInput}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                      >
                        {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="pt-3 flex justify-center">
                    <button 
                      onClick={handleSimulateCrash}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-600 border border-slate-200 px-4 py-2 rounded-full flex items-center gap-1.5 hover:bg-slate-50 transition-all"
                    >
                      <span>✨</span> Simulate Crash / Fall
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col min-h-full fade-in">
              <div className="text-center mb-8 pt-4">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                    <AlertCircle size={32} className="text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">🚨 Help is on the way.</h2>
                <p className="text-slate-500 text-sm mt-2">Authorities have been notified.</p>
              </div>

              {/* Progress Timeline */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-6 shrink-0">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Response Status</h3>
                <div className="relative pl-6 space-y-6">
                  {/* Line connecting steps */}
                  <div className="absolute left-[11px] top-2 bottom-4 w-0.5 bg-slate-200 z-0"></div>

                  {/* Step 1 */}
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0 border-2 border-white shadow-sm -ml-1.5">
                      <CheckCircle2 size={14} className="text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 leading-tight">Report Received</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Location and details captured.</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative z-10 flex items-start gap-4">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm -ml-1.5 ${aiAnalyzing ? 'bg-blue-500' : 'bg-green-500'}`}>
                      {aiAnalyzing ? (
                        <Loader2 size={14} className="text-white animate-spin" />
                      ) : (
                        <CheckCircle2 size={14} className="text-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 leading-tight">AI Analyzing Situation</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {aiAnalyzing ? 'Processing threat level...' : 'Triage complete.'}
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative z-10 flex items-start gap-4">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm -ml-1.5 ${(currentIncident.status === 'dispatched' || currentIncident.status === 'resolved') ? 'bg-blue-500' : 'bg-slate-200'}`}>
                      {(currentIncident.status === 'dispatched' || currentIncident.status === 'resolved') && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 leading-tight">Responders Dispatched</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {currentIncident.status === 'resolved' ? 'Responders have arrived. Case resolved.' : currentIncident.status === 'dispatched' ? 'Team is en route.' : 'Pending unit assignment...'}
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Resolved */}
                  <div className="relative z-10 flex items-start gap-4">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm -ml-1.5 ${currentIncident.status === 'resolved' ? 'bg-green-500' : 'bg-slate-200'}`}>
                      {currentIncident.status === 'resolved' && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 leading-tight">Resolved</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {currentIncident.status === 'resolved' ? 'Emergency resolved successfully.' : 'Awaiting arrival...'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature 14: Secure Tracking Trust Badge */}
                <div className="mt-5 flex items-center justify-center gap-2 py-2 bg-slate-50 rounded-lg border border-slate-100">
                  <ShieldAlert size={14} className="text-green-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">End-to-End Encrypted Tracking</span>
                </div>
              </div>

              {/* Feature 1: Emergency Contact Alerting Overlay */}
              {contactAlerting && userProfile?.emergencyContactName && (
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-4 flex items-center gap-4 shrink-0 shadow-lg animate-slide-up">
                  <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center shrink-0">
                    <Phone size={18} className="text-white animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Notifying Emergency Contact</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Sending SMS to {userProfile.emergencyContactName}...</p>
                  </div>
                </div>
              )}

              {/* Feature 8: Geofencing Alert */}
              {geofenceAlert && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 mb-4 flex items-start gap-3 shrink-0">
                  <AlertOctagon size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-900">Hazard Zone Detected</h4>
                    <p className="text-xs text-amber-700 mt-0.5">Near: <strong>{geofenceAlert.label}</strong> ({geofenceAlert.type}). Responders have been informed.</p>
                  </div>
                </div>
              )}

              {/* Auto-Resolved Notification */}
              {currentIncident.status === 'resolved' && (
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 mb-4 relative overflow-hidden shadow-md shrink-0">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-400 rounded-full blur-3xl opacity-10 -mr-10 -mt-10"></div>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
                      <CheckCircle2 size={28} className="text-white" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-emerald-900">🎉 Emergency Resolved!</h4>
                      <p className="text-xs text-emerald-700 mt-1 font-medium">Responders have arrived at your location. You are safe.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveCrisisId(null);
                      setDismissedCrisisId(currentIncident.id);
                      setCategory('Road Accident');
                      setDescription('');
                      setDynamicInstructions('');
                      setTimeLeft(null);
                    }}
                    className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-lg relative z-10"
                  >
                    Return to Home
                  </button>
                </div>
              )}

              {/* Live ETA Tracker (Appears when Dispatched) */}
              {currentIncident.status === 'dispatched' && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4 relative overflow-hidden shadow-sm shrink-0">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-10 -mr-10 -mt-10 animate-pulse"></div>
                  
                  {/* Feature 7: Loading Skeleton for route */}
                  {!routeETA ? (
                    <div className="flex items-start gap-3 relative z-10 animate-pulse">
                      <div className="w-10 h-10 bg-blue-200 rounded-full shrink-0"></div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-blue-200 rounded w-3/4"></div>
                        <div className="h-6 bg-blue-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-3 relative z-10">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30">
                          <span className="text-xl">🚑</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-blue-900 leading-tight">Responders Approaching</h4>
                          {/* Feature 5: Ticking Timer */}
                          <p className="text-3xl font-black text-blue-700 mt-1 tracking-tighter font-mono">{formatTime(timeLeft)}</p>
                          <p className="text-xs font-semibold text-blue-600/80 mt-1 uppercase tracking-wider">{remainingDist || '--'} km away • GPS Locked</p>
                        </div>
                      </div>
                      {/* Feature 7: Progress Bar */}
                      {routeTotalSteps > 0 && (
                        <div className="mt-3 relative z-10">
                          <div className="flex justify-between text-[10px] text-blue-500 font-bold mb-1">
                            <span>🚑 Ambulance</span>
                            <span>📍 You</span>
                          </div>
                          <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden relative">
                            <div 
                              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-linear"
                              style={{ width: `${Math.min(100, (routeCurrentStep / routeTotalSteps) * 100)}%` }}
                            ></div>
                            {/* Blinking dot at current pos */}
                            <div 
                              className="absolute top-0 h-full w-2 bg-white rounded-full shadow-md transition-all duration-1000 ease-linear animate-pulse"
                              style={{ left: `calc(${Math.min(100, (routeCurrentStep / routeTotalSteps) * 100)}% - 4px)` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Feature 7: Nearest Hospital Card */}
              {currentIncident.status === 'dispatched' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 flex items-center gap-4 shrink-0 shadow-sm">
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                    <Heart size={18} className="text-red-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-800">Apollo Gleneagles Hospital</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Destination prepared • Trauma Team Standby</p>
                  </div>
                </div>
              )}

              {/* Feature 4: Live Chat Bubble */}
              {(currentIncident.status === 'pending' || currentIncident.status === 'dispatched' || currentIncident.status === 'resolved') && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 flex flex-col shrink-0 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Live Dispatcher Chat
                  </h4>
                  <div className="h-32 overflow-y-auto bg-slate-50 rounded-lg p-3 flex flex-col gap-2 mb-3 border border-slate-100">
                    {currentIncident.messages?.map(msg => (
                      <div key={msg.id} className={`max-w-[85%] rounded-lg p-2 text-xs ${msg.sender === 'victim' ? 'bg-blue-500 text-white self-end rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 self-start rounded-bl-none'}`}>
                        <p>{msg.text}</p>
                        <span className={`text-[9px] mt-1 block opacity-70 ${msg.sender === 'victim' ? 'text-right' : 'text-left'}`}>{msg.time}</span>
                      </div>
                    ))}
                    {(!currentIncident.messages || currentIncident.messages.length === 0) && (
                      <div className="text-xs text-slate-400 text-center m-auto">No messages yet. Send an update to dispatch.</div>
                    )}
                  </div>
                  {currentIncident.status !== 'resolved' && (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={chatMessage}
                        onChange={e => setChatMessage(e.target.value)}
                        placeholder="Type message..." 
                        className="flex-1 text-slate-800 bg-white text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                        onKeyPress={e => {
                          if (e.key === 'Enter' && chatMessage.trim()) {
                            onSendMessage(currentIncident.id, 'victim', chatMessage);
                            setChatMessage('');
                          }
                        }}
                      />
                      <button 
                        onClick={() => {
                          if (chatMessage.trim()) {
                            onSendMessage(currentIncident.id, 'victim', chatMessage);
                            setChatMessage('');
                          }
                        }}
                        className="bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-600"
                      >
                        Send
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Instructions */}
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 relative overflow-hidden mt-auto shrink-0">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                <div className="flex gap-3">
                  <Info size={20} className="text-orange-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-orange-900 mb-1">AI Survival Instructions</h4>
                    <p className="text-sm text-orange-800 leading-relaxed">
                      {dynamicInstructions || "Generating survival plan..."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={() => {
                    setDismissedCrisisId(activeCrisisId);
                    setActiveCrisisId(null);
                  }}
                  className={`w-full py-3 text-sm font-bold rounded-xl border transition-colors ${darkMode ? 'text-slate-300 border-slate-700 hover:bg-slate-800' : 'text-slate-600 border-slate-300 hover:bg-slate-100'}`}
                >
                  Close & Return Home
                </button>
                
                {!showCancelConfirm ? (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full py-3 text-sm font-bold text-red-500 hover:text-white hover:bg-red-500 rounded-xl border border-red-200 transition-colors"
                  >
                    Cancel Emergency
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className={`flex-1 py-3 text-sm font-bold rounded-xl transition-colors ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      No, Keep Active
                    </button>
                    <button
                      onClick={() => {
                        if (activeCrisisId && onUpdateIncidentStatus) {
                          onUpdateIncidentStatus(activeCrisisId, 'cancelled');
                        }
                        setActiveCrisisId(null);
                        setCategory('Medical');
                        setDescription('');
                        setDynamicInstructions('');
                        setShowCancelConfirm(false);
                      }}
                      className="flex-1 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
                    >
                      Yes, Cancel SOS
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
