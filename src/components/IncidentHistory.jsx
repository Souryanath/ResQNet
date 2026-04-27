import React from 'react';
import { Clock, MapPin, CheckCircle2, XCircle, Download, Flame, Stethoscope, Shield, AlertTriangle, Car, FileText } from 'lucide-react';

// Feature VI: Export Incident Report as PDF using browser canvas
function exportReportPDF(incident) {
  // Build PDF-like content as a printable HTML page
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) { alert('Please allow popups for PDF export.'); return; }

  const resolvedTime = incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleString() : 'N/A';
  const profile = incident.userProfile || {};

  const html = `
  <!DOCTYPE html>
  <html><head><title>ResQNet Report - ${incident.id}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a2e; line-height: 1.7; }
    .header { text-align: center; border-bottom: 3px solid #E63946; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #E63946; font-size: 22px; margin: 0; }
    .header p { color: #666; font-size: 12px; margin-top: 4px; }
    .section { margin-bottom: 24px; }
    .section h2 { font-size: 14px; color: #E63946; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #eee; padding-bottom: 6px; margin-bottom: 12px; }
    .field { display: flex; padding: 4px 0; font-size: 13px; }
    .field .label { font-weight: 600; width: 180px; color: #444; flex-shrink: 0; }
    .field .value { color: #1a1a2e; }
    .status-badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .status-resolved { background: #d4edda; color: #155724; }
    .status-cancelled { background: #f8d7da; color: #721c24; }
    .status-dispatched { background: #cce5ff; color: #004085; }
    .status-pending { background: #fff3cd; color: #856404; }
    .footer { text-align: center; color: #999; font-size: 10px; border-top: 1px solid #eee; padding-top: 15px; margin-top: 40px; }
    @media print { body { padding: 20px; } }
  </style></head><body>
  <div class="header">
    <h1>🆘 ResQNet AI — Incident Report</h1>
    <p>Automated Emergency Response Documentation</p>
  </div>

  <div class="section">
    <h2>Incident Details</h2>
    <div class="field"><span class="label">Report ID:</span><span class="value">${incident.id}</span></div>
    <div class="field"><span class="label">Category:</span><span class="value">${incident.category} Emergency</span></div>
    <div class="field"><span class="label">Severity:</span><span class="value">${incident.severity}</span></div>
    <div class="field"><span class="label">Status:</span><span class="value"><span class="status-badge status-${incident.status}">${incident.status?.toUpperCase()}</span></span></div>
    <div class="field"><span class="label">Reported At:</span><span class="value">${new Date(incident.timestamp).toLocaleString()}</span></div>
    <div class="field"><span class="label">Resolved At:</span><span class="value">${resolvedTime}</span></div>
    <div class="field"><span class="label">Description:</span><span class="value">${incident.description || 'N/A'}</span></div>
  </div>

  <div class="section">
    <h2>Location</h2>
    <div class="field"><span class="label">Latitude:</span><span class="value">${incident.location.lat}</span></div>
    <div class="field"><span class="label">Longitude:</span><span class="value">${incident.location.lng}</span></div>
  </div>

  <div class="section">
    <h2>Patient Profile</h2>
    <div class="field"><span class="label">Name:</span><span class="value">${profile.name || 'Unknown'}</span></div>
    <div class="field"><span class="label">Age:</span><span class="value">${profile.age || 'N/A'}</span></div>
    <div class="field"><span class="label">Blood Group:</span><span class="value">${profile.bloodType || 'N/A'}</span></div>
    <div class="field"><span class="label">Medical Conditions:</span><span class="value">${profile.medicalConditions || profile.conditions || 'None reported'}</span></div>
    <div class="field"><span class="label">Allergies:</span><span class="value">${profile.allergies || 'None reported'}</span></div>
    <div class="field"><span class="label">Current Medications:</span><span class="value">${profile.medications || 'None reported'}</span></div>
    <div class="field"><span class="label">Previous Surgeries:</span><span class="value">${profile.surgeries || 'None reported'}</span></div>
    <div class="field"><span class="label">Disability/Special Needs:</span><span class="value">${profile.disability || 'None reported'}</span></div>
  </div>

  <div class="section">
    <h2>Emergency Contact</h2>
    <div class="field"><span class="label">Contact Name:</span><span class="value">${profile.emergencyContactName || 'N/A'}</span></div>
    <div class="field"><span class="label">Contact Phone:</span><span class="value">${profile.emergencyContactPhone || 'N/A'}</span></div>
  </div>

  ${incident.messages && incident.messages.length > 0 ? `
  <div class="section">
    <h2>Communication Log</h2>
    ${incident.messages.map(m => `<div class="field"><span class="label">[${m.time}] ${m.sender}:</span><span class="value">${m.text}</span></div>`).join('')}
  </div>` : ''}

  <div class="footer">
    <p>Generated by CrisisSync AI Platform · ${new Date().toLocaleString()}</p>
    <p>This document is auto-generated for hospital handover and medical record keeping.</p>
  </div>
  </body></html>`;

  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => { printWindow.print(); }, 500);
}

const getCategoryIcon = (category) => {
  switch (category) {
    case 'Fire': return <Flame size={14} />;
    case 'Road Accident': return <Car size={14} />;
    case 'Women Safety': return <Shield size={14} />;
    case 'Health': return <Stethoscope size={14} />;
    default: return <AlertTriangle size={14} />;
  }
};

export default function IncidentHistory({ incidents, isDispatcherView = false }) {
  const resolved = incidents.filter(i => i.status === 'resolved' || i.status === 'cancelled');
  const active = incidents.filter(i => i.status === 'pending' || i.status === 'dispatched');

  return (
    <div className={`w-full ${isDispatcherView ? 'h-full' : 'flex-1'} bg-night overflow-y-auto p-4 sm:p-8 animate-fade-in`}>
      <div className={`${isDispatcherView ? 'max-w-full' : 'max-w-[600px]'} mx-auto`}>
        
        <div className="mb-6">
          <h2 className="font-head text-xl font-bold text-white flex items-center gap-2 mb-1">
            <Clock size={20} className="text-[var(--muted)]" /> {isDispatcherView ? 'Dispatch History & Reports' : 'Incident History'}
          </h2>
          <p className="text-xs text-[var(--muted)]">{incidents.length} total · {active.length} active · {resolved.length} resolved</p>
        </div>

        <div className="space-y-3">
          {incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--muted)] space-y-3">
              <Clock size={40} className="opacity-20" />
              <p className="text-sm">No incidents recorded yet.</p>
            </div>
          ) : (
            incidents.slice().reverse().map(incident => (
              <div 
                key={incident.id}
                className={`bg-card border rounded-xl p-4 transition-all ${
                  (incident.status === 'cancelled' || incident.status === 'resolved') ? 'border-[var(--border)] opacity-60' :
                  (incident.status === 'dispatched') ? 'border-[rgba(52,152,219,.35)]' :
                  'border-[var(--border-accent)]'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${
                      incident.category === 'Fire' ? 'bg-[rgba(243,156,18,.15)] text-[var(--amber)]' :
                      incident.category === 'Road Accident' ? 'bg-[rgba(230,57,70,.15)] text-crisis' :
                      incident.category === 'Women Safety' ? 'bg-[rgba(168,85,247,.15)] text-purple-400' :
                      incident.category === 'Health' ? 'bg-[rgba(16,185,129,.15)] text-emerald-400' :
                      'bg-[rgba(52,152,219,.15)] text-[var(--blue)]'
                    }`}>
                      {getCategoryIcon(incident.category)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{incident.category} Emergency</h3>
                      <p className="text-[10px] text-[var(--muted)]">{new Date(incident.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                    (incident.status === 'dispatched') ? 'bg-[rgba(52,152,219,.1)] text-[var(--blue)] border-[rgba(52,152,219,.3)]' :
                    (incident.status === 'resolved') ? 'bg-[rgba(46,204,113,.1)] text-[var(--green)] border-[rgba(46,204,113,.3)]' :
                    (incident.status === 'cancelled') ? 'bg-[rgba(90,96,112,.1)] text-[var(--muted)] border-[var(--border)]' :
                    'bg-[rgba(230,57,70,.1)] text-crisis border-[var(--border-accent)]'
                  }`}>
                    {incident.status === 'resolved' ? '✅ Resolved' :
                     incident.status === 'cancelled' ? '✗ Cancelled' : 
                     incident.status === 'dispatched' ? '🚀 Dispatched' :
                     '● Active'}
                  </span>
                </div>

                <p className="text-xs text-[var(--muted)] mb-2 italic line-clamp-1">"{incident.description}"</p>

                {/* Patient info in dispatcher view */}
                {isDispatcherView && incident.userProfile && (
                  <div className="text-[10px] text-[var(--muted2)] mb-2 flex flex-wrap gap-3">
                    <span>👤 {incident.userProfile.name || 'Unknown'}</span>
                    {incident.userProfile.bloodType && <span>🩸 {incident.userProfile.bloodType}</span>}
                    {incident.userProfile.medicalConditions && <span>⚕️ {incident.userProfile.medicalConditions}</span>}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-[10px] text-[var(--muted2)] gap-1 font-mono">
                    <MapPin size={10} />
                    {incident.location.lat}, {incident.location.lng}
                  </div>
                  <div className="flex gap-2">
                    {/* PDF Export - shown for resolved incidents */}
                    {incident.status === 'resolved' && (
                      <button
                        onClick={() => exportReportPDF(incident)}
                        className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors px-2 py-1 rounded-lg hover:bg-emerald-500/10"
                      >
                        <FileText size={12} /> PDF Report
                      </button>
                    )}
                    <button
                      onClick={() => exportReportPDF(incident)}
                      className="flex items-center gap-1 text-[10px] font-bold text-crisis hover:text-crisis-dark transition-colors px-2 py-1 rounded-lg hover:bg-crisis/10"
                    >
                      <Download size={12} /> Export
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
