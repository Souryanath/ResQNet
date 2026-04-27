import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, AlertTriangle, Shield, Flame, Stethoscope, User, Activity, Volume2, Car, FileText, Download } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';



let dispatcherAudioCtx = null;
const getDispatcherAudioCtx = () => {
  if (!dispatcherAudioCtx) {
    try {
      dispatcherAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) { console.warn('Audio not supported'); }
  }
  if (dispatcherAudioCtx && dispatcherAudioCtx.state === 'suspended') {
    dispatcherAudioCtx.resume();
  }
  return dispatcherAudioCtx;
};

// Feature 3: Sound Alert using Web Audio API (no external files needed)
function playAlertSound() {
  const ctx = getDispatcherAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
    // Second beep
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 1200;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.3);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.1);
    osc2.start(ctx.currentTime + 0.3);
    osc2.stop(ctx.currentTime + 1.1);
  } catch(e) { console.warn('Audio not supported'); }
}

const defaultCenter = {
  lat: 22.5726,
  lng: 88.3639
};

// Curated land-safe coordinates across Kolkata, Howrah, North/South 24 Parganas (avoids Hooghly River)
const kolkataLandPoints = [
  // Kolkata Core
  { lat: 22.5726, lng: 88.3639, area: 'Esplanade' },
  { lat: 22.5510, lng: 88.3530, area: 'Park Street' },
  { lat: 22.5652, lng: 88.3694, area: 'Sealdah' },
  { lat: 22.5280, lng: 88.3630, area: 'Ballygunge' },
  { lat: 22.4990, lng: 88.3710, area: 'Jadavpur' },
  { lat: 22.4890, lng: 88.3380, area: 'Behala' },
  { lat: 22.5800, lng: 88.4200, area: 'Salt Lake' },
  { lat: 22.5920, lng: 88.4640, area: 'New Town' },
  { lat: 22.6233, lng: 88.4200, area: 'Dum Dum' },
  { lat: 22.5440, lng: 88.3940, area: 'EM Bypass' },
  { lat: 22.5150, lng: 88.3680, area: 'Gariahat' },
  { lat: 22.6050, lng: 88.3780, area: 'Shyambazar' },
  { lat: 22.5870, lng: 88.3900, area: 'Ultadanga' },
  { lat: 22.5560, lng: 88.3510, area: 'Maidan' },
  { lat: 22.4710, lng: 88.3770, area: 'Garia' },
  // Howrah (West of Hooghly River)
  { lat: 22.5710, lng: 88.3150, area: 'Shibpur' },
  { lat: 22.5850, lng: 88.2750, area: 'Santragachi' },
  { lat: 22.6480, lng: 88.3400, area: 'Bally' },
  { lat: 22.6300, lng: 88.3480, area: 'Belur' },
  { lat: 22.6100, lng: 88.3300, area: 'Liluah' },
  // North 24 Parganas
  { lat: 22.7200, lng: 88.4800, area: 'Barasat' },
  { lat: 22.7600, lng: 88.3700, area: 'Barrackpore' },
  { lat: 22.7000, lng: 88.3800, area: 'Sodepur' },
  { lat: 22.6950, lng: 88.4500, area: 'Madhyamgram' },
  { lat: 22.6350, lng: 88.3900, area: 'Belgharia' },
  { lat: 22.6150, lng: 88.5000, area: 'Rajarhat' },
  // South 24 Parganas
  { lat: 22.3600, lng: 88.4300, area: 'Baruipur' },
  { lat: 22.4400, lng: 88.4200, area: 'Sonarpur' },
  { lat: 22.4420, lng: 88.3960, area: 'Narendrapur' },
  { lat: 22.3700, lng: 88.2800, area: 'Amtala' },
  // Adjacent areas
  { lat: 22.6750, lng: 88.2900, area: 'Dankuni' },
];

// --- SVG Icon Library (No emojis, consistent vector icons) ---
const svgIcons = {
  ambulance: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10H6"/><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14"/><path d="M8 8v4"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`,
  police: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L4 7v4c0 5.25 3.4 10.74 8 12 4.6-1.26 8-6.75 8-12V7l-8-5z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`,
  firedept: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
  hospital: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v4"/><path d="M14 14h-4"/><path d="M14 18h-4"/><path d="M14 8h-4"/><path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2"/><path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18"/></svg>`,
  victim: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M12 7v2"/><path d="M12 13h.01"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
};

const createPin = (color, svgType, state = 'normal') => {
  let scale = 1, opacity = 1, animation = '', boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
  if (state === 'faded') { scale = 0.6; opacity = 0.3; }
  else if (state === 'selected') { scale = 1.15; animation = 'animate-pulse'; boxShadow = `0 0 12px ${color}`; }
  else if (state === 'resolved') { scale = 0.7; opacity = 0.4; boxShadow = 'none'; }
  const svg = svgIcons[svgType] || svgIcons.victim;
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div style="position:relative;display:flex;justify-content:center;align-items:center;transform:scale(${scale});opacity:${opacity};transition:all .3s ease;" class="${animation}">
      <div style="background:${color};width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2.5px solid white;box-shadow:${boxShadow};color:white;z-index:2;position:relative;"><div style="width:18px;height:18px;">${svg}</div></div>
      <div style="position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:9px solid white;z-index:1;"></div>
      <div style="position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:3.5px solid transparent;border-right:3.5px solid transparent;border-top:7px solid ${color};z-index:3;"></div>
    </div>`,
    iconSize: [34, 44], iconAnchor: [17, 44], popupAnchor: [0, -44], tooltipAnchor: [0, -44]
  });
};

const icons = {
  victim: createPin('#ef4444', 'victim', 'selected'),
  dispatchedVictim: createPin('#3b82f6', 'victim'),
  resolvedVictim: createPin('#22c55e', 'check', 'resolved'),
  liveAmbulance: createPin('#f59e0b', 'ambulance', 'selected'),
  busyAmbulance: createPin('#64748b', 'ambulance', 'faded'),
  faded: { hospital: createPin('#22c55e', 'hospital', 'faded'), police: createPin('#3b82f6', 'police', 'faded'), ambulance: createPin('#f59e0b', 'ambulance', 'faded'), firedept: createPin('#ef4444', 'firedept', 'faded') },
  selected: { hospital: createPin('#22c55e', 'hospital', 'selected'), police: createPin('#3b82f6', 'police', 'selected'), ambulance: createPin('#f59e0b', 'ambulance', 'selected'), firedept: createPin('#ef4444', 'firedept', 'selected') }
};

// Create a live-tracking vehicle icon with bearing rotation
const createLiveVehicleIcon = (type, bearing = 0) => {
  const colors = { ambulance: '#f59e0b', police: '#3b82f6', firedept: '#ef4444' };
  const color = colors[type] || '#f59e0b';
  const svg = svgIcons[type] || svgIcons.ambulance;
  return L.divIcon({
    className: 'live-vehicle-icon',
    html: `<div class="live-vehicle-inner" style="transform:rotate(${bearing}deg);filter:drop-shadow(0 0 8px ${color});will-change:transform;"><div style="background:${color};width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;color:white;"><div style="width:20px;height:20px;">${svg}</div></div></div>`,
    iconSize: [38, 38], iconAnchor: [19, 19], popupAnchor: [0, -19], tooltipAnchor: [0, -24]
  });
};

// Haversine formula to calculate distance between two lat/lng coordinates in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

// Calculate bearing between two coordinates
function calculateBearing(lat1, lon1, lat2, lon2) {
  const lat1R = lat1 * Math.PI / 180;
  const lat2R = lat2 * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2R);
  const x = Math.cos(lat1R) * Math.sin(lat2R) - Math.sin(lat1R) * Math.cos(lat2R) * Math.cos(dLon);
  const brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
}

export default function DispatcherDashboard({ incidents, onUpdateIncidentStatus, onRouteUpdate, onSendMessage, portalMode, addToast }) {
  const isVisible = portalMode === 'dispatcher';
  // Feature 6: FlyTo logic inside main component for stability
  const MapController = () => {
    const map = useMap();
    
    useEffect(() => {
      if (!isVisible) return;
      
      const activeIncidents = incidents.filter(inc => inc.status !== 'resolved' && inc.status !== 'cancelled');
      const latest = activeIncidents.length > 0 ? activeIncidents[activeIncidents.length - 1] : null;
      if (latest && latest.location) {
        const lat = parseFloat(latest.location.lat);
        const lng = parseFloat(latest.location.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
          try {
            map.flyTo([lat, lng], 14, { duration: 1.5 });
          } catch (e) { console.error("FlyTo error", e); }
        }
      }
    }, [incidents.length, isVisible]);

    useEffect(() => {
      if (isVisible) {
        setTimeout(() => {
          try { map.invalidateSize(); } catch (e) {}
        }, 200);
      }
    }, [isVisible]);

    return null;
  };

  const [cityFleet, setCityFleet] = useState([]);
  const [selectedResponders, setSelectedResponders] = useState(null);
  const [vehicleRoutes, setVehicleRoutes] = useState({}); // { ambulance: [[lat,lng],...], police: [...], firedept: [...] }
  const [vehicleProgress, setVehicleProgress] = useState({}); // { ambulance: 0.42, police: 0.31 } — fractional progress along route
  const [liveVehicles, setLiveVehicles] = useState({}); // { ambulance: {lat, lng}, ... }
  const [vehicleBearings, setVehicleBearings] = useState({});
  const [routeETA, setRouteETA] = useState(null);
  const [routeDistance, setRouteDistance] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const prevIncidentCount = useRef(0);
  const animFrameRef = useRef(null);
  
  // High-performance DOM Refs for bypassing React renders during 60fps animation
  const liveMarkerRefs = useRef({});
  const polylineRefs = useRef({});
  const smoothedBearings = useRef({});

  // Helper: get which vehicle types to dispatch per category
  const getDispatchTypes = (category) => {
    switch (category) {
      case 'Fire': return ['firedept', 'police', 'ambulance'];
      case 'Women Safety': return ['police', 'ambulance'];
      case 'Road Accident': return ['ambulance', 'police'];
      case 'Health': return ['ambulance'];
      default: return ['ambulance', 'police'];
    }
  };

  // Helper: fetch OSRM road-network route between two points
  const fetchOSRMRoute = async (fromLat, fromLng, toLat, toLng) => {
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?geometries=geojson&overview=full`);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        const eta = Math.ceil(data.routes[0].duration / 60);
        const dist = (data.routes[0].distance / 1000).toFixed(1);
        return { coords, eta: parseFloat(eta), dist: parseFloat(dist) };
      }
    } catch (err) { console.error('OSRM route error:', err); }
    return null;
  };

  // Helper: interpolate position along a polyline at fractional progress (0..1)
  const interpolateAlongRoute = (route, progress) => {
    if (!route || route.length < 2) return route?.[0] || null;
    const clampedProgress = Math.max(0, Math.min(1, progress));
    // Calculate total route length
    let totalDist = 0;
    const segDists = [];
    for (let i = 1; i < route.length; i++) {
      const d = calculateDistance(route[i-1][0], route[i-1][1], route[i][0], route[i][1]);
      segDists.push(d);
      totalDist += d;
    }
    const targetDist = clampedProgress * totalDist;
    let accumulated = 0;
    for (let i = 0; i < segDists.length; i++) {
      if (accumulated + segDists[i] >= targetDist) {
        const segFraction = (targetDist - accumulated) / segDists[i];
        const lat = route[i][0] + (route[i+1][0] - route[i][0]) * segFraction;
        const lng = route[i][1] + (route[i+1][1] - route[i][1]) * segFraction;
        return [lat, lng];
      }
      accumulated += segDists[i];
    }
    return route[route.length - 1];
  };

  // Helper: trim polyline from start to fractional progress (for remaining route display)
  const trimRouteFromProgress = (route, progress) => {
    if (!route || route.length < 2) return route || [];
    const clampedProgress = Math.max(0, Math.min(1, progress));
    let totalDist = 0;
    const segDists = [];
    for (let i = 1; i < route.length; i++) {
      const d = calculateDistance(route[i-1][0], route[i-1][1], route[i][0], route[i][1]);
      segDists.push(d);
      totalDist += d;
    }
    const targetDist = clampedProgress * totalDist;
    let accumulated = 0;
    for (let i = 0; i < segDists.length; i++) {
      if (accumulated + segDists[i] >= targetDist) {
        const segFraction = (targetDist - accumulated) / segDists[i];
        const interpLat = route[i][0] + (route[i+1][0] - route[i][0]) * segFraction;
        const interpLng = route[i][1] + (route[i+1][1] - route[i][1]) * segFraction;
        return [[interpLat, interpLng], ...route.slice(i + 1)];
      }
      accumulated += segDists[i];
    }
    return [route[route.length - 1]];
  };

  // Print Medical PDF Logic
  const handlePrintProfile = (incident) => {
    const profile = incident.userProfile;
    if (!profile) return;
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Medical Emergency Report - ${profile.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { border-bottom: 2px solid #e63946; padding-bottom: 20px; margin-bottom: 30px; }
            .title { color: #e63946; font-size: 24px; font-weight: bold; margin: 0; }
            .subtitle { color: #666; font-size: 14px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 18px; font-weight: bold; color: #1d3557; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .row { display: flex; margin-bottom: 8px; }
            .label { font-weight: bold; width: 200px; color: #457b9d; }
            .value { flex: 1; }
            .alert-box { border: 2px solid #e63946; background-color: #fff0f0; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">CRISISSYNC - EMERGENCY MEDICAL REPORT</div>
            <div class="subtitle">Generated on: ${new Date().toLocaleString()} | Incident ID: ${incident.id}</div>
          </div>
          
          <div class="alert-box">
            <div class="row"><div class="label">Primary Emergency:</div><div class="value"><strong>${incident.category}</strong> (${incident.severity})</div></div>
            <div class="row"><div class="label">Location:</div><div class="value">Lat: ${incident.location.lat}, Lng: ${incident.location.lng}</div></div>
            <div class="row"><div class="label">Initial Report:</div><div class="value">"${incident.description}"</div></div>
          </div>

          <div class="section">
            <div class="section-title">Patient Demographics</div>
            <div class="row"><div class="label">Full Name:</div><div class="value">${profile.name || 'N/A'}</div></div>
            <div class="row"><div class="label">Age:</div><div class="value">${profile.age || 'N/A'}</div></div>
            <div class="row"><div class="label">Blood Type:</div><div class="value" style="color:#e63946; font-weight:bold; font-size:16px;">${profile.bloodType || 'Unknown'}</div></div>
          </div>

          <div class="section">
            <div class="section-title">Critical Medical History</div>
            <div class="row"><div class="label">Known Conditions:</div><div class="value">${profile.medicalConditions || 'None reported'}</div></div>
            <div class="row"><div class="label">Allergies:</div><div class="value">${profile.allergies || 'None reported'}</div></div>
            <div class="row"><div class="label">Current Medications:</div><div class="value">${profile.medications || 'None reported'}</div></div>
            <div class="row"><div class="label">Past Surgeries:</div><div class="value">${profile.surgeries || 'None reported'}</div></div>
          </div>

          <div class="section">
            <div class="section-title">Emergency Contacts</div>
            <div class="row"><div class="label">Primary Contact:</div><div class="value">${profile.emergencyContactName || 'N/A'}</div></div>
            <div class="row"><div class="label">Contact Phone:</div><div class="value">${profile.emergencyContactPhone || 'N/A'}</div></div>
          </div>
          
          <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #999;">
            Confidential Medical Information - For Emergency Responders & Hospital Staff Only
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Feature 6: Compute Analytics
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved' && i.resolvedAt && i.timestamp);
  const avgResponseTimeMs = resolvedIncidents.length > 0 
    ? resolvedIncidents.reduce((acc, i) => acc + (i.resolvedAt - i.timestamp), 0) / resolvedIncidents.length
    : 0;
  const avgResponseMins = Math.floor(avgResponseTimeMs / 60000);
  const avgResponseSecs = Math.floor((avgResponseTimeMs % 60000) / 1000);

  // Feature 3: Sound alert on new incident
  useEffect(() => {
    if (incidents.length > prevIncidentCount.current && incidents.length > 0) {
      playAlertSound();
    }
    prevIncidentCount.current = incidents.length;
  }, [incidents.length]);

  // Generate fleet and find nearest on incident
  useEffect(() => {
    const activeIncidents = incidents.filter(inc => inc.status !== 'resolved' && inc.status !== 'cancelled');
    if (activeIncidents.length === 0) {
      setSelectedResponders(null);
      setVehicleRoutes({});
      setVehicleProgress({});
      setLiveVehicles({});
      return;
    }

    const activeIncident = activeIncidents[activeIncidents.length - 1];
    const victimLat = parseFloat(activeIncident.location.lat);
    const victimLng = parseFloat(activeIncident.location.lng);

    // 1. Generate City Fleet
    let fleet = cityFleet;
    if (fleet.length === 0) {
      const shuffled = [...kolkataLandPoints].sort(() => Math.random() - 0.5);
      fleet = Array.from({ length: 12 }).map((_, i) => {
        let type, isEmpty = true;
        if (i === 0) type = 'hospital';
        else if (i === 1) type = 'police';
        else if (i === 2) { type = 'ambulance'; isEmpty = true; }
        else if (i === 3) type = 'firedept';
        else {
          const r = Math.random();
          type = r < 0.2 ? 'hospital' : r < 0.4 ? 'police' : r < 0.7 ? 'ambulance' : 'firedept';
          isEmpty = type === 'ambulance' ? Math.random() > 0.4 : true;
        }
        const base = shuffled[i % shuffled.length];
        return { id: i, type, lat: base.lat + (Math.random() - 0.5) * 0.004, lng: base.lng + (Math.random() - 0.5) * 0.004, isEmpty, area: base.area };
      });
      setCityFleet(fleet);
    }

    // 2. Find nearest responders
    const fleetWithDist = fleet.map(r => ({ ...r, dist: calculateDistance(victimLat, victimLng, r.lat, r.lng) }));
    const nearestHospital = fleetWithDist.filter(r => r.type === 'hospital').sort((a,b) => a.dist - b.dist)[0];
    const nearestPolice = fleetWithDist.filter(r => r.type === 'police').sort((a,b) => a.dist - b.dist)[0];
    const nearestAmbulance = fleetWithDist.filter(r => r.type === 'ambulance' && r.isEmpty).sort((a,b) => a.dist - b.dist)[0];
    const nearestFireDept = fleetWithDist.filter(r => r.type === 'firedept').sort((a,b) => a.dist - b.dist)[0];

    setSelectedResponders({ hospital: nearestHospital, police: nearestPolice, ambulance: nearestAmbulance, firedept: nearestFireDept });

    // 3. Fetch OSRM routes for ALL dispatched vehicle types
    const dispatchTypes = getDispatchTypes(activeIncident.category);
    const responderMap = { hospital: nearestHospital, police: nearestPolice, ambulance: nearestAmbulance, firedept: nearestFireDept };

    const fetchAllRoutes = async () => {
      const routes = {};
      let primaryETA = null, primaryDist = null;
      
      for (const type of dispatchTypes) {
        const vehicle = responderMap[type];
        if (!vehicle || isNaN(vehicle.lat)) continue;
        const result = await fetchOSRMRoute(vehicle.lat, vehicle.lng, victimLat, victimLng);
        if (result) {
          routes[type] = result.coords;
          if (!primaryETA) { primaryETA = result.eta; primaryDist = result.dist; }
        }
      }
      
      setVehicleRoutes(routes);
      setVehicleProgress({});
      if (primaryETA) { setRouteETA(primaryETA); setRouteDistance(primaryDist); }
      if (onRouteUpdate && primaryETA) onRouteUpdate({ eta: primaryETA, distance: primaryDist, totalSteps: 100, currentStep: 0 });
    };

    fetchAllRoutes();
  }, [incidents]);

  // Smooth Road-Following Animation Engine (requestAnimationFrame)
  useEffect(() => {
    const activeIncidents = incidents.filter(inc => inc.status !== 'resolved' && inc.status !== 'cancelled');
    if (activeIncidents.length === 0 || !selectedResponders) {
      setLiveVehicles({});
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }
    const activeIncident = activeIncidents[activeIncidents.length - 1];
    const dispatchTypes = getDispatchTypes(activeIncident.category);

    // Show static positions when pending
    if (activeIncident.status === 'pending') {
      const positions = {};
      dispatchTypes.forEach(type => {
        if (selectedResponders[type] && !isNaN(selectedResponders[type].lat)) {
          positions[type] = { lat: selectedResponders[type].lat, lng: selectedResponders[type].lng };
        }
      });
      setLiveVehicles(positions);
      return;
    }

    // Animate when dispatched
    if (activeIncident.status === 'dispatched' && Object.keys(vehicleRoutes).length > 0) {
      const progress = {};
      dispatchTypes.forEach(type => { progress[type] = 0; });
      
      const SPEED = 0.003; // progress per frame (~60fps → arrives in ~5.5s)
      let lastTime = performance.now();
      let frameCount = 0;

      const animate = (now) => {
        const dt = (now - lastTime) / 16.67; // normalize to ~60fps
        lastTime = now;
        frameCount++;
        
        let allDone = true;

        dispatchTypes.forEach(type => {
          const route = vehicleRoutes[type];
          if (!route || route.length < 2) {
            // Fallback: use linear interpolation if no OSRM route
            if (selectedResponders[type]) {
              const from = selectedResponders[type];
              const to = activeIncident.location;
              progress[type] = Math.min(1, (progress[type] || 0) + SPEED * dt);
              const lat = from.lat + (parseFloat(to.lat) - from.lat) * progress[type];
              const lng = from.lng + (parseFloat(to.lng) - from.lng) * progress[type];
              
              // Direct marker update
              const marker = liveMarkerRefs.current[type];
              if (marker) marker.setLatLng([lat, lng]);

              if (progress[type] < 1) allDone = false;
            }
            return;
          }

          progress[type] = Math.min(1, (progress[type] || 0) + SPEED * dt);
          const pos = interpolateAlongRoute(route, progress[type]);
          
          if (pos) {
            // 1. Direct Marker Position Update
            const marker = liveMarkerRefs.current[type];
            if (marker) {
              marker.setLatLng([pos[0], pos[1]]);
              
              // 2. Look-ahead Bearing + LERP Damping
              const lookAheadProgress = Math.min(1, progress[type] + 0.03); // look 3% ahead
              const lookAheadPos = interpolateAlongRoute(route, lookAheadProgress);
              
              let targetBearing = smoothedBearings.current[type] || 0;
              if (lookAheadPos && (Math.abs(pos[0] - lookAheadPos[0]) > 0.00001 || Math.abs(pos[1] - lookAheadPos[1]) > 0.00001)) {
                 targetBearing = calculateBearing(pos[0], pos[1], lookAheadPos[0], lookAheadPos[1]);
              }
              
              let currentB = smoothedBearings.current[type] ?? targetBearing;
              // Shortest path interpolation for angles
              let diff = ((((targetBearing - currentB) % 360) + 540) % 360) - 180;
              currentB += diff * 0.15; // Damping factor (0.15 = smooth easing)
              smoothedBearings.current[type] = currentB;

              // Direct DOM update for rotation (bypassing React)
              const el = marker.getElement();
              if (el) {
                  const inner = el.querySelector('.live-vehicle-inner');
                  if (inner) inner.style.transform = `rotate(${currentB}deg)`;
              }
            }

            // 3. Direct Polyline Trimming Update
            const poly = polylineRefs.current[type];
            if (poly) {
              const trimmed = trimRouteFromProgress(route, progress[type]);
              if (trimmed.length > 0) poly.setLatLngs(trimmed);
            }
          }
          if (progress[type] < 1) allDone = false;
        });

        // Throttle React state updates to ~2 times a second for the ETA HUD
        if (frameCount % 30 === 0) {
           setVehicleProgress({ ...progress });
        }

        if (allDone) {
          // Final sync
          setVehicleProgress({ ...progress });
          if (onUpdateIncidentStatus) onUpdateIncidentStatus(activeIncident.id, 'resolved');
        } else {
          animFrameRef.current = requestAnimationFrame(animate);
        }
      };

      animFrameRef.current = requestAnimationFrame(animate);
      return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
    }
  }, [incidents, selectedResponders, vehicleRoutes]);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Fire': return <Flame size={16} />;
      case 'Road Accident': return <Car size={16} />;
      case 'Women Safety': return <Shield size={16} />;
      case 'Health': return <Stethoscope size={16} />;
      default: return <AlertTriangle size={16} />;
    }
  };

  // Category-specific dispatch mapping
  const getDispatchUnits = (category) => {
    switch (category) {
      case 'Road Accident': return ['ambulance', 'police', 'hospital'];
      case 'Fire': return ['ambulance', 'firedept', 'hospital', 'police'];
      case 'Women Safety': return ['police', 'police'];
      case 'Health': return ['ambulance', 'hospital'];
      default: return ['ambulance', 'police', 'hospital'];
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500/20 text-red-500 border-red-500/50';
      case 'High': return 'bg-orange-500/20 text-orange-500 border-orange-500/50';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/50';
    }
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const activeIncidents = incidents.filter(inc => inc.status !== 'resolved' && inc.status !== 'cancelled');
  const activeIncident = activeIncidents.length > 0 ? activeIncidents[activeIncidents.length - 1] : null;
  const isDispatched = activeIncident?.status === 'dispatched';
  const victimLat = activeIncident ? parseFloat(activeIncident.location.lat) : 0;
  const victimLng = activeIncident ? parseFloat(activeIncident.location.lng) : 0;

  return (
    <div className="w-full h-[calc(100vh-64px)] bg-slate-950 flex flex-col md:flex-row text-slate-300 overflow-hidden font-sans">
      
      {/* Sidebar: Live Feed - Responsive */}
      <div className="w-full md:w-96 bg-slate-900 border-r border-slate-800 flex flex-col h-1/2 md:h-full shrink-0 z-10 shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/95 sticky top-0 z-20 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            Live Incidents
          </h2>
          <span className="bg-slate-800 text-slate-400 text-xs font-bold px-2 py-1 rounded-full">
            {activeIncidents.length} Active
          </span>
        </div>
        
        {/* Feature 6: Analytics HUD */}
        <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 grid grid-cols-2 gap-3 shrink-0">
          <div className="bg-slate-800/50 border border-slate-700/50 p-2.5 rounded-xl">
            <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Avg Response</p>
            <p className="text-lg font-mono text-emerald-400 leading-tight">{avgResponseMins > 0 ? `${avgResponseMins}m ` : ''}{avgResponseSecs}s</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 p-2.5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Resolved</p>
              <p className="text-lg font-mono text-purple-400 leading-tight">{resolvedIncidents.length}</p>
            </div>
            <Activity size={20} className="text-purple-500/50" />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-3 space-y-3">
          {incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
              <Shield size={48} className="opacity-20" />
              <p>No active incidents.</p>
            </div>
          ) : (
            incidents.slice().reverse().map(incident => (
              <div 
                key={incident.id} 
                className={`bg-slate-800/80 rounded-2xl p-5 border cursor-pointer transition-all ${
                  activeIncident?.id === incident.id ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'border-slate-700 hover:border-slate-600'
                } ${incident.status === 'cancelled' ? 'opacity-60 grayscale' : ''}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2 items-center">
                    <div className={`p-1.5 rounded-md ${
                      incident.category === 'Fire' ? 'bg-orange-500/20 text-orange-500' :
                      incident.category === 'Road Accident' ? 'bg-red-500/20 text-red-500' :
                      incident.category === 'Women Safety' ? 'bg-purple-500/20 text-purple-500' :
                      incident.category === 'Health' ? 'bg-emerald-500/20 text-emerald-500' :
                      'bg-indigo-500/20 text-indigo-500'
                    }`}>
                      {getCategoryIcon(incident.category)}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">{incident.category} Emergency</h3>
                      <div className="flex items-center text-xs text-slate-400 gap-1 mt-0.5">
                        <Clock size={12} /> {formatTime(incident.timestamp)}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getSeverityColor(incident.severity)}`}>
                    {incident.severity}
                  </span>
                </div>
                
                <div className="bg-slate-900/50 rounded-lg p-2.5 mb-3">
                  <p className="text-xs text-slate-300 italic mb-2 line-clamp-2">"{incident.description}"</p>
                  <div className="flex items-center text-xs text-slate-400 gap-1.5 font-mono bg-slate-950 p-1.5 rounded border border-slate-800">
                    <MapPin size={12} className="text-slate-500" />
                    Lat: {incident.location.lat}, Lng: {incident.location.lng}
                  </div>
                </div>

                {/* Profile Data Display */}
                {incident.userProfile && (
                  <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-2.5 mb-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-blue-300">
                        <User size={14} className="shrink-0" />
                        <span className="text-xs font-bold break-words">{incident.userProfile.name || 'Unknown'} (Age {incident.userProfile.age || '?'})</span>
                        {incident.userProfile.bloodType && (
                          <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold shrink-0">{incident.userProfile.bloodType}</span>
                        )}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handlePrintProfile(incident); }}
                        className="shrink-0 bg-slate-800 hover:bg-blue-600 text-[10px] text-white px-2 py-1.5 rounded border border-slate-700 transition-colors flex items-center gap-1"
                        title="Export to PDF"
                      >
                        🖨️ PDF
                      </button>
                    </div>
                    {incident.userProfile.medicalConditions && (
                      <div className="flex items-start gap-2 text-slate-400 text-[10px]">
                        <Activity size={12} className="mt-0.5 shrink-0" />
                        <p className="leading-tight">Med: {incident.userProfile.medicalConditions}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Feature 10: Mini Timeline */}
                {incident.status === 'cancelled' ? (
                  <div className="text-[12px] font-bold text-slate-500 mt-4 mb-2 text-center bg-slate-800/50 py-2 rounded border border-slate-700">
                    EMERGENCY CANCELLED BY USER
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-[10px] font-bold mt-4 mb-2">
                      <span className={incident.status !== 'pending' ? 'text-green-500' : 'text-blue-400'}>SOS</span>
                      <span className="text-slate-600 flex-1 flex items-center px-2"><span className="w-full h-[1px] bg-slate-700"></span></span>
                      <span className={incident.status === 'dispatched' || incident.status === 'resolved' ? 'text-blue-400' : 'text-slate-600'}>DISPATCHED</span>
                      <span className="text-slate-600 flex-1 flex items-center px-2"><span className="w-full h-[1px] bg-slate-700"></span></span>
                      <span className={incident.status === 'resolved' ? 'text-purple-500' : 'text-slate-500'}>RESOLVED</span>
                    </div>

                    {incident.status === 'resolved' ? (
                      <button 
                        disabled
                        className="w-full py-2 bg-purple-500/10 text-purple-400 text-sm font-semibold rounded-lg cursor-not-allowed flex items-center justify-center gap-2 border border-purple-500/30"
                      >
                        Incident Resolved
                      </button>
                    ) : incident.status === 'dispatched' ? (
                      <button 
                        disabled
                        className="w-full py-2 bg-slate-700/50 text-blue-400 text-sm font-semibold rounded-lg cursor-not-allowed flex items-center justify-center gap-2 border border-blue-900/50"
                      >
                        Responders En Route...
                      </button>
                    ) : (
                      <button 
                        onClick={() => onUpdateIncidentStatus(incident.id, 'dispatched')}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]"
                      >
                        Dispatch Team
                      </button>
                    )}
                  </>
                )}

                {/* Category-Specific Dispatch Info */}
                {incident.status === 'dispatched' && (
                  <div className="bg-slate-900/50 border border-slate-700 p-3 rounded-xl mt-4 space-y-1.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Dispatched Units</p>
                    {(incident.category === 'Road Accident' || !incident.category) && (
                      <>
                        <div className="flex items-center gap-2 text-[10px]"><span>🚑</span><span className="text-blue-300">Ambulance dispatched</span></div>
                        <div className="flex items-center gap-2 text-[10px]"><span>🚓</span><span className="text-indigo-300">Police car dispatched</span></div>
                        <div className="flex items-center gap-2 text-[10px]"><span>🏥</span><span className="text-emerald-300">Nearest hospital alerted</span></div>
                      </>
                    )}
                    {incident.category === 'Fire' && (
                      <>
                        <div className="flex items-center gap-2 text-[10px]"><span>🚒</span><span className="text-red-300">Fire truck dispatched</span></div>
                        <div className="flex items-center gap-2 text-[10px]"><span>🚑</span><span className="text-blue-300">Ambulance dispatched</span></div>
                        <div className="flex items-center gap-2 text-[10px]"><span>🏥</span><span className="text-emerald-300">Hospital alerted</span></div>
                        <div className="flex items-center gap-2 text-[10px]"><span>🚓</span><span className="text-indigo-300">Police station notified</span></div>
                      </>
                    )}
                    {incident.category === 'Women Safety' && (
                      <>
                        <div className="flex items-center gap-2 text-[10px]"><span>🚓</span><span className="text-purple-300">Nearest police car dispatched</span></div>
                        <div className="flex items-center gap-2 text-[10px]"><span>🏛️</span><span className="text-indigo-300">Nearest police station alerted</span></div>
                      </>
                    )}
                    {incident.category === 'Health' && (
                      <>
                        <div className="flex items-center gap-2 text-[10px]"><span>🚑</span><span className="text-blue-300">Ambulance dispatched</span></div>
                        <div className="flex items-center gap-2 text-[10px]"><span>🏥</span><span className="text-emerald-300">Nearest hospital alerted</span></div>
                      </>
                    )}
                  </div>
                )}

                {/* Feature 4: Live Chat Interface */}
                {(incident.status === 'dispatched' || incident.status === 'pending') && (
                  <div className="mt-4 border-t border-slate-800 pt-4">
                    <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-2">
                      <Volume2 size={12} className="text-slate-500" /> Dispatcher Comms
                    </h4>
                    <div className="bg-slate-900 rounded-lg h-32 overflow-y-auto p-2 mb-2 border border-slate-800 flex flex-col gap-2">
                      {incident.messages?.map(msg => (
                        <div key={msg.id} className={`max-w-[90%] rounded-md p-2 text-[10px] ${msg.sender === 'dispatcher' ? 'bg-slate-800 text-white self-end ml-auto rounded-br-none' : 'bg-blue-900/40 border border-blue-500/30 text-blue-100 self-start rounded-bl-none'}`}>
                          <p>{msg.text}</p>
                          <span className={`text-[8px] mt-1 block opacity-50 ${msg.sender === 'dispatcher' ? 'text-right' : 'text-left'}`}>{msg.time}</span>
                        </div>
                      ))}
                      {(!incident.messages || incident.messages.length === 0) && (
                        <div className="text-[10px] text-slate-600 text-center m-auto">Secure channel open.</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={chatMessage}
                        onChange={e => setChatMessage(e.target.value)}
                        placeholder="Send message to victim..." 
                        className="flex-1 bg-slate-900 border border-slate-700 rounded text-xs px-2 py-1.5 text-white focus:outline-none focus:border-slate-500"
                        onKeyPress={e => {
                          if (e.key === 'Enter' && chatMessage.trim()) {
                            onSendMessage(incident.id, 'dispatcher', chatMessage);
                            setChatMessage('');
                          }
                        }}
                      />
                      <button 
                        onClick={() => {
                          if (chatMessage.trim()) {
                            onSendMessage(incident.id, 'dispatcher', chatMessage);
                            setChatMessage('');
                          }
                        }}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Area: Map */}
      <div className="flex-grow relative bg-[#0f172a] overflow-hidden z-0 h-1/2 md:h-full">
        <MapContainer 
          center={[defaultCenter.lat, defaultCenter.lng]} 
          zoom={13} 
          className="w-full h-full z-0" 
          zoomControl={false}
        >
          {/* CartoDB Dark Matter Free Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          <MapController />

          {/* Victim Incidents */}
          {incidents.map((incident) => {
            if (incident.status === 'cancelled') return null;
            const lat = parseFloat(incident.location.lat);
            const lng = parseFloat(incident.location.lng);
            if (isNaN(lat) || isNaN(lng)) return null;
            return (
              <Marker
                key={incident.id}
                position={[lat, lng]}
                icon={incident.status === 'resolved' ? icons.resolvedVictim : incident.status === 'dispatched' ? icons.dispatchedVictim : icons.victim}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                  <div className="font-bold text-slate-800 text-xs">Victim Location</div>
                </Tooltip>
                <Popup className="custom-popup">
                  <div className="font-bold text-slate-800">{incident.category} Emergency</div>
                  <div className="text-xs text-slate-500">Status: {incident.status}</div>
                </Popup>
              </Marker>
            );
          })}

          {/* Connection Web (Dashed lines to category-relevant responders) */}
          {selectedResponders && activeIncident && activeIncident.status === 'pending' && !isNaN(victimLat) && !isNaN(victimLng) && (
            <>
              {/* 1) Fire: Fire Truck, Police Car, Ambulance */}
              {activeIncident.category === 'Fire' && (
                <>
                  {selectedResponders.firedept && !isNaN(selectedResponders.firedept.lat) && <Polyline positions={[[victimLat, victimLng], [selectedResponders.firedept.lat, selectedResponders.firedept.lng]]} pathOptions={{ color: '#ef4444', weight: 2, dashArray: '5, 5', opacity: 0.5 }} />}
                  {selectedResponders.ambulance && !isNaN(selectedResponders.ambulance.lat) && <Polyline positions={[[victimLat, victimLng], [selectedResponders.ambulance.lat, selectedResponders.ambulance.lng]]} pathOptions={{ color: '#f59e0b', weight: 2, dashArray: '5, 5', opacity: 0.4 }} />}
                  {selectedResponders.police && !isNaN(selectedResponders.police.lat) && <Polyline positions={[[victimLat, victimLng], [selectedResponders.police.lat, selectedResponders.police.lng]]} pathOptions={{ color: '#3b82f6', weight: 2, dashArray: '5, 5', opacity: 0.4 }} />}
                </>
              )}
              {/* 2) Women Safety: Police Car, Ambulance */}
              {activeIncident.category === 'Women Safety' && (
                <>
                  {selectedResponders.police && !isNaN(selectedResponders.police.lat) && <Polyline positions={[[victimLat, victimLng], [selectedResponders.police.lat, selectedResponders.police.lng]]} pathOptions={{ color: '#a855f7', weight: 2, dashArray: '5, 5', opacity: 0.5 }} />}
                  {selectedResponders.ambulance && !isNaN(selectedResponders.ambulance.lat) && <Polyline positions={[[victimLat, victimLng], [selectedResponders.ambulance.lat, selectedResponders.ambulance.lng]]} pathOptions={{ color: '#f59e0b', weight: 2, dashArray: '5, 5', opacity: 0.4 }} />}
                </>
              )}
              {/* 3) Road Accident: Ambulance, Police Car */}
              {activeIncident.category === 'Road Accident' && (
                <>
                  {selectedResponders.ambulance && !isNaN(selectedResponders.ambulance.lat) && <Polyline positions={[[victimLat, victimLng], [selectedResponders.ambulance.lat, selectedResponders.ambulance.lng]]} pathOptions={{ color: '#f59e0b', weight: 2, dashArray: '5, 5', opacity: 0.4 }} />}
                  {selectedResponders.police && !isNaN(selectedResponders.police.lat) && <Polyline positions={[[victimLat, victimLng], [selectedResponders.police.lat, selectedResponders.police.lng]]} pathOptions={{ color: '#3b82f6', weight: 2, dashArray: '5, 5', opacity: 0.4 }} />}
                </>
              )}
              {/* 4) Health/Medical: Ambulance */}
              {activeIncident.category === 'Health' && (
                <>
                  {selectedResponders.ambulance && !isNaN(selectedResponders.ambulance.lat) && <Polyline positions={[[victimLat, victimLng], [selectedResponders.ambulance.lat, selectedResponders.ambulance.lng]]} pathOptions={{ color: '#f59e0b', weight: 2, dashArray: '5, 5', opacity: 0.4 }} />}
                </>
              )}
            </>
          )}

          {/* Entire City Fleet */}
          {cityFleet.map((responder) => {
            const isSelected = selectedResponders && (
              selectedResponders.hospital?.id === responder.id ||
              selectedResponders.police?.id === responder.id ||
              selectedResponders.ambulance?.id === responder.id ||
              selectedResponders.firedept?.id === responder.id
            );
            
            // Hide the dispatched vehicles if they are currently live-animating
            if (isSelected && liveVehicles[responder.type]) {
              const cat = activeIncident?.category;
              if (cat === 'Women Safety' && (responder.type === 'police' || responder.type === 'ambulance')) return null;
              if (cat === 'Fire' && (responder.type === 'firedept' || responder.type === 'police' || responder.type === 'ambulance')) return null;
              if (cat === 'Road Accident' && (responder.type === 'ambulance' || responder.type === 'police')) return null;
              if (cat === 'Health' && responder.type === 'ambulance') return null;
            }

            let iconToUse = icons.faded[responder.type] || icons.faded.hospital;
            let tooltipText = responder.type === 'hospital' ? 'Hospital' : responder.type === 'police' ? 'Police Station' : responder.type === 'firedept' ? 'Fire Department' : 'Ambulance';
            
            if (responder.type === 'ambulance' && !responder.isEmpty) {
              tooltipText = 'Busy Ambulance';
              iconToUse = icons.busyAmbulance;
            }

            let isAlerted = false;

            if (isSelected) {
              iconToUse = icons.selected[responder.type];
              tooltipText = `Selected Nearest ${tooltipText}`;
              
              if (isDispatched && (responder.type === 'hospital' || responder.type === 'police')) {
                isAlerted = true;
              }
            }

            return (
              <Marker
                key={`fleet-${responder.id}`}
                position={[responder.lat, responder.lng]}
                icon={iconToUse}
                zIndexOffset={isSelected ? 500 : 0}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                  {isAlerted ? (
                     <div className="flex flex-col items-center">
                       <span className="font-bold text-red-600 text-[11px] animate-pulse uppercase tracking-wider">⚠️ Alerted!</span>
                       <span className="font-bold text-slate-800 text-[10px] capitalize">{tooltipText}</span>
                     </div>
                  ) : (
                    <div className="font-bold text-slate-800 text-xs capitalize">{tooltipText}</div>
                  )}
                </Tooltip>
              </Marker>
            );
          })}

          {/* LIVE Moving Vehicles (Multi-agency, road-following) */}
          {Object.keys(liveVehicles).map(type => {
             const pos = liveVehicles[type];
             if (!pos || isNaN(pos.lat) || isNaN(pos.lng)) return null;
             const vehicleNames = { ambulance: 'Ambulance', police: 'Police', firedept: 'Fire Truck' };
             return (
               <Marker 
                 key={`live-${type}`}
                 position={[pos.lat, pos.lng]} 
                 icon={createLiveVehicleIcon(type, vehicleBearings[type] || 0)} 
                 zIndexOffset={1000}
                 ref={r => { if (r) liveMarkerRefs.current[type] = r; }}
               >
                 <Tooltip permanent direction="top" offset={[0, -24]} className="live-tracking-tooltip">
                   <div className="flex flex-col items-center">
                     <span className="font-bold text-red-600 animate-pulse text-[10px]">LIVE</span>
                     <span className="text-slate-800 font-bold text-[10px]">{vehicleNames[type] || type}</span>
                   </div>
                 </Tooltip>
               </Marker>
             );
          })}

          {/* Road-Network Route Polylines (one per dispatched vehicle, dynamically trimmed) */}
          {Object.keys(vehicleRoutes).map(type => {
            const route = vehicleRoutes[type];
            if (!route || route.length < 2) return null;
            const colors = { ambulance: '#f59e0b', police: '#3b82f6', firedept: '#ef4444' };
            const color = colors[type] || '#3b82f6';
            const progress = vehicleProgress[type] || 0;
            const isDisp = activeIncident?.status === 'dispatched';
            const displayRoute = isDisp ? trimRouteFromProgress(route, progress) : route;
            return (
              <Polyline 
                key={`route-${type}`}
                positions={displayRoute} 
                ref={r => { if (r) polylineRefs.current[type] = r; }}
                pathOptions={{ 
                  color, weight: 4, opacity: isDisp ? 0.85 : 0.4,
                  dashArray: isDisp ? undefined : '8, 8',
                  lineCap: 'round', lineJoin: 'round', smoothFactor: 1.5
                }} 
              />
            );
          })}

          {/* Feature 2: Heat Map Toggle Layer */}
          {showHeatmap && resolvedIncidents.map(inc => {
            const lat = parseFloat(inc.location.lat);
            const lng = parseFloat(inc.location.lng);
            if(isNaN(lat) || isNaN(lng)) return null;
            return (
              <circle key={inc.id} cx="0" cy="0" r="0" /> // We will use CircleMarker instead
            );
          })}
          {showHeatmap && resolvedIncidents.map(inc => {
            const lat = parseFloat(inc.location.lat);
            const lng = parseFloat(inc.location.lng);
            if(isNaN(lat) || isNaN(lng)) return null;
            return (
              <Marker key={`heat-${inc.id}`} position={[lat, lng]} icon={L.divIcon({
                className: 'custom-heatmap-icon',
                html: `<div style="width: 40px; height: 40px; background: radial-gradient(circle, rgba(239,68,68,0.5) 0%, rgba(239,68,68,0) 70%); border-radius: 50%; transform: translate(-10px, -10px);"></div>`,
                iconSize: [20, 20]
              })} />
            )
          })}
          
          {/* Map Overlays */}
          <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2 pointer-events-none">
            {/* Feature 2: Heat Map Toggle Button */}
            <button 
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-md backdrop-blur-md border ${showHeatmap ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-slate-900/60 text-slate-300 border-slate-700/50 hover:bg-slate-800/80'}`}
            >
              <Flame size={14} className={showHeatmap ? "text-orange-500" : "text-slate-400"} />
              {showHeatmap ? 'Hide Heat Map' : 'Show Heat Map'}
            </button>
          </div>
        </MapContainer>

        {/* Dashboard HUD Overlay */}
        <div className="absolute top-6 left-6 flex gap-4 pointer-events-none z-[1000]">
          <div className="bg-slate-900/80 backdrop-blur border border-slate-700 p-4 rounded-xl shadow-xl">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">System Status</div>
            <div className="text-emerald-400 font-mono text-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              ONLINE & SYNCED
            </div>
          </div>
          
          <div className="bg-slate-900/80 backdrop-blur border border-slate-700 p-4 rounded-xl shadow-xl min-w-[220px]">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
              <Activity size={14} /> Smart Dispatch Engine
            </div>
            {selectedResponders?.ambulance ? (
               <div className="text-xs space-y-2 mt-2">
                 {routeETA && (
                   <div className="flex justify-between items-center bg-emerald-900/30 border border-emerald-500/40 p-2 rounded mb-1">
                     <span className="text-emerald-400 font-bold">⏱ ETA:</span>
                     <span className="text-emerald-300 font-black text-base">{Math.max(1, Math.ceil(routeETA * (1 - (vehicleProgress[Object.keys(vehicleProgress)[0]] || 0))))} MIN</span>
                   </div>
                 )}
                 <div className={`flex justify-between items-center bg-slate-800/50 p-1.5 rounded transition-all ${isDispatched ? 'border border-blue-500/50 bg-blue-900/20' : ''}`}>
                   <span className={isDispatched ? 'text-blue-400 font-bold' : 'text-slate-400'}>
                     {isDispatched ? '🚑 En Route:' : 'Nearest Empty 🚑:'}
                   </span>
                   <span className="text-white font-bold">{selectedResponders.ambulance?.dist?.toFixed(1) || '--'} km</span>
                 </div>
                 <div className={`flex justify-between items-center bg-slate-800/50 p-1.5 rounded transition-all ${isDispatched ? 'border border-indigo-500/50 bg-indigo-900/20' : ''}`}>
                   <span className={isDispatched ? 'text-indigo-400 font-bold animate-pulse' : 'text-slate-400'}>
                     {isDispatched ? '🚓 Police Alerted:' : 'Nearest 🚓:'}
                   </span>
                   <span className="text-white font-bold">{selectedResponders.police?.dist?.toFixed(1) || '--'} km</span>
                 </div>
                 <div className={`flex justify-between items-center bg-slate-800/50 p-1.5 rounded transition-all ${isDispatched ? 'border border-emerald-500/50 bg-emerald-900/20' : ''}`}>
                   <span className={isDispatched ? 'text-emerald-400 font-bold animate-pulse' : 'text-slate-400'}>
                     {isDispatched ? '🏥 ER Alerted:' : 'Nearest 🏥:'}
                   </span>
                   <span className="text-white font-bold">{selectedResponders.hospital?.dist?.toFixed(1) || '--'} km</span>
                 </div>
                 <div className={`flex justify-between items-center bg-slate-800/50 p-1.5 rounded transition-all ${isDispatched ? 'border border-red-500/50 bg-red-900/20' : ''}`}>
                   <span className={isDispatched ? 'text-red-400 font-bold animate-pulse' : 'text-slate-400'}>
                     {isDispatched ? '🚒 Fire Dept:' : 'Nearest 🚒:'}
                   </span>
                   <span className="text-white font-bold">{selectedResponders.firedept?.dist?.toFixed(1) || '--'} km</span>
                 </div>
               </div>
            ) : (
               <div className="text-slate-500 text-xs italic mt-2 animate-pulse">Calculating fleet distances...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
