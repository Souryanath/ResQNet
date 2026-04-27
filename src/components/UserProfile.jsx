import React, { useState, useEffect } from 'react';
import { User, X, CheckCircle2, Save, Trash2 } from 'lucide-react';

const TABS = ['Basic Info', 'ID Verification', 'Medical Records', 'Preferred Care', 'Emergency Contacts', 'Settings'];

const defaultProfile = {
  // Basic
  name: '', dob: '', gender: '', phone: '', address: '', nationality: 'Indian', occupation: '',
  // ID
  aadhaar: '', pan: '', dl: '', dlExpiry: '',
  aadhaarVerified: false, panVerified: false, dlVerified: false,
  // Medical
  bloodType: '', height: '', weight: '', organDonor: 'No',
  allergies: '', conditions: '', medications: '', surgeries: '', disability: '',
  // Care
  preferredHospital: '', secondaryHospital: '', insuranceProvider: '', policyNumber: '',
  doctors: [{ name: '', specialisation: '', hospital: '', contact: '' }],
  // Contacts
  emergencyContacts: [{ name: '', relationship: 'Mother', phone: '', altPhone: '', email: '' }],
  // Legacy compat
  age: '', docType: 'Aadhar', docId: '', medicalConditions: '', preferredDoctor: '',
  emergencyContactName: '', emergencyContactPhone: '', shareLiveLocation: true,
  // Settings
  autoDialAttempts: 3, autoDialSeconds: 30,
};

export default function UserProfile({ userProfile, onUpdateProfile, onCancel, onDeleteProfile }) {
  const [activeTab, setActiveTab] = useState(0);
  const [form, setForm] = useState({ ...defaultProfile, ...userProfile });
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    setForm(prev => ({ ...defaultProfile, ...userProfile, ...prev }));
  }, [userProfile]);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to PERMANENTLY delete your profile? This action cannot be undone.')) {
      onDeleteProfile();
    }
  };

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSave = () => {
    // Sync legacy fields for backward compat
    const synced = {
      ...form,
      age: form.dob ? String(new Date().getFullYear() - new Date(form.dob).getFullYear()) : form.age,
      docId: form.aadhaar || form.pan || form.dl || form.docId,
      medicalConditions: form.conditions || form.medicalConditions,
      preferredDoctor: form.doctors?.[0]?.name || form.preferredDoctor,
      emergencyContactName: form.emergencyContacts?.[0]?.name || form.emergencyContactName,
      emergencyContactPhone: form.emergencyContacts?.[0]?.phone || form.emergencyContactPhone,
    };
    onUpdateProfile(synced);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const verifyDoc = (type) => {
    set(`${type}Verified`, true);
  };

  // Doctors helpers
  const addDoctor = () => set('doctors', [...(form.doctors || []), { name: '', specialisation: '', hospital: '', contact: '' }]);
  const removeDoctor = (i) => set('doctors', form.doctors.filter((_, idx) => idx !== i));
  const setDoctor = (i, field, val) => {
    const updated = [...form.doctors];
    updated[i] = { ...updated[i], [field]: val };
    set('doctors', updated);
  };

  // Contacts helpers
  const addContact = () => set('emergencyContacts', [...(form.emergencyContacts || []), { name: '', relationship: 'Mother', phone: '', altPhone: '', email: '' }]);
  const removeContact = (i) => set('emergencyContacts', form.emergencyContacts.filter((_, idx) => idx !== i));
  const setContact = (i, field, val) => {
    const updated = [...form.emergencyContacts];
    updated[i] = { ...updated[i], [field]: val };
    set('emergencyContacts', updated);
  };

  const inputClass = "w-full py-3 px-4 rounded-lg bg-[#1c2030] border border-[rgba(255,255,255,0.07)] text-[#f0f2f5] text-[.84rem] outline-none transition-colors focus:border-[rgba(230,57,70,0.35)] placeholder:text-[#5a6070] font-body";
  const selectClass = "w-full py-3 px-4 rounded-lg bg-[#1c2030] border border-[rgba(255,255,255,0.07)] text-[#f0f2f5] text-[.84rem] outline-none transition-colors focus:border-[rgba(230,57,70,0.35)] font-body appearance-none";
  const labelClass = "block text-[.72rem] font-semibold text-[#8a90a0] uppercase tracking-[.05em] mb-2";
  const sectionTitle = "font-head text-[.85rem] font-bold text-white mb-4 pb-2 border-b border-[rgba(255,255,255,0.07)]";

  return (
    <div className="w-full h-[calc(100vh-57px)] bg-[#0a0c10] flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-[700px] bg-[#111420] border border-[rgba(255,255,255,0.07)] rounded-2xl overflow-hidden flex flex-col max-h-[90vh] animate-modal-in">
        
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(255,255,255,0.07)] shrink-0">
          <h3 className="font-head text-lg font-bold text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[rgba(230,57,70,0.15)] flex items-center justify-center">
              <User size={18} className="text-[#E63946]" />
            </div>
            My Emergency Profile
          </h3>
          <button 
            onClick={() => onCancel ? onCancel() : null}
            className="w-8 h-8 rounded-lg bg-[#1c2030] border border-[rgba(255,255,255,0.07)] flex items-center justify-center text-[#8a90a0] hover:text-white hover:border-[rgba(230,57,70,0.35)] transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex border-b border-[rgba(255,255,255,0.07)] px-6 shrink-0 overflow-x-auto">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`py-3 px-4 text-[.78rem] font-medium cursor-pointer border-b-2 transition-all whitespace-nowrap font-body ${
                activeTab === i 
                  ? 'text-[#E63946] border-[#E63946]' 
                  : 'text-[#8a90a0] border-transparent hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1c2030 transparent' }}>
          
          {/* ═══ BASIC INFO ═══ */}
          {activeTab === 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-5">
              <div>
                <label className={labelClass}>Full Name</label>
                <input className={inputClass} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Enter your full name" />
              </div>
              <div>
                <label className={labelClass}>Date of Birth</label>
                <input type="date" className={inputClass} value={form.dob} onChange={e => set('dob', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Gender</label>
                <select className={selectClass} value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="">Select gender</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Phone Number</label>
                <input type="tel" className={inputClass} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Current Address</label>
                <input className={inputClass} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street, City, State, PIN" />
              </div>
              <div>
                <label className={labelClass}>Nationality</label>
                <input className={inputClass} value={form.nationality} onChange={e => set('nationality', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Occupation</label>
                <input className={inputClass} value={form.occupation} onChange={e => set('occupation', e.target.value)} placeholder="Your profession" />
              </div>
            </div>
          )}

          {/* ═══ ID VERIFICATION ═══ */}
          {activeTab === 1 && (
            <div>
              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className={`inline-flex items-center gap-1.5 text-[.7rem] font-medium px-3 py-1.5 rounded-md border ${
                  form.aadhaarVerified 
                    ? 'bg-[rgba(46,204,113,0.12)] border-[rgba(46,204,113,0.25)] text-[#2ecc71]' 
                    : 'bg-[rgba(243,156,18,0.1)] border-[rgba(243,156,18,0.25)] text-[#f39c12]'
                }`}>
                  {form.aadhaarVerified ? '✓' : '⏳'} Aadhaar — {form.aadhaarVerified ? 'Verified' : 'Not Verified'}
                </span>
                <span className={`inline-flex items-center gap-1.5 text-[.7rem] font-medium px-3 py-1.5 rounded-md border ${
                  form.panVerified 
                    ? 'bg-[rgba(46,204,113,0.12)] border-[rgba(46,204,113,0.25)] text-[#2ecc71]' 
                    : 'bg-[rgba(243,156,18,0.1)] border-[rgba(243,156,18,0.25)] text-[#f39c12]'
                }`}>
                  {form.panVerified ? '✓' : '⏳'} PAN — {form.panVerified ? 'Verified' : 'Not Verified'}
                </span>
                <span className={`inline-flex items-center gap-1.5 text-[.7rem] font-medium px-3 py-1.5 rounded-md border ${
                  form.dlVerified 
                    ? 'bg-[rgba(46,204,113,0.12)] border-[rgba(46,204,113,0.25)] text-[#2ecc71]' 
                    : 'bg-[rgba(243,156,18,0.1)] border-[rgba(243,156,18,0.25)] text-[#f39c12]'
                }`}>
                  {form.dlVerified ? '✓' : '⏳'} Driver's License — {form.dlVerified ? 'Verified' : 'Not Added'}
                </span>
              </div>

              <div className="space-y-5">
                <div>
                  <label className={labelClass}>Aadhaar Number</label>
                  <input className={inputClass} value={form.aadhaar} onChange={e => {
                    let v = e.target.value.replace(/\D/g, '').slice(0, 12);
                    set('aadhaar', v.replace(/(\d{4})(?=\d)/g, '$1 ').trim());
                  }} placeholder="XXXX XXXX XXXX" maxLength={14} />
                </div>
                <button onClick={() => verifyDoc('aadhaar')} className="bg-[#E63946] hover:bg-[#b02530] text-white font-bold py-2.5 px-5 rounded-lg text-[.82rem] transition-colors cursor-pointer font-body">
                  Verify Aadhaar via OTP
                </button>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className={labelClass}>PAN Card Number</label>
                    <input className={`${inputClass} uppercase`} value={form.pan} onChange={e => set('pan', e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} />
                  </div>
                  <div className="flex items-end">
                    <button onClick={() => verifyDoc('pan')} className="w-full bg-[#E63946] hover:bg-[#b02530] text-white font-bold py-3 px-5 rounded-lg text-[.82rem] transition-colors cursor-pointer font-body">
                      Verify PAN
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Driver's License Number</label>
                    <input className={inputClass} value={form.dl} onChange={e => set('dl', e.target.value)} placeholder="MH0120XXXXXXXXX" />
                  </div>
                  <div>
                    <label className={labelClass}>DL Expiry Date</label>
                    <input type="date" className={inputClass} value={form.dlExpiry} onChange={e => set('dlExpiry', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ MEDICAL RECORDS ═══ */}
          {activeTab === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Blood Group</label>
                  <select className={selectClass} value={form.bloodType} onChange={e => set('bloodType', e.target.value)}>
                    <option value="">Select</option>
                    <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                    <option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Height (cm)</label>
                  <input type="number" className={inputClass} value={form.height} onChange={e => set('height', e.target.value)} placeholder="175" />
                </div>
                <div>
                  <label className={labelClass}>Weight (kg)</label>
                  <input type="number" className={inputClass} value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="70" />
                </div>
                <div>
                  <label className={labelClass}>Organ Donor</label>
                  <select className={selectClass} value={form.organDonor} onChange={e => set('organDonor', e.target.value)}>
                    <option>No</option><option>Yes — All Organs</option><option>Yes — Specific</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Known Allergies</label>
                <input className={inputClass} value={form.allergies} onChange={e => set('allergies', e.target.value)} placeholder="e.g. Penicillin, Aspirin, Latex (comma separated)" />
              </div>

              <div>
                <label className={labelClass}>Pre-Existing Conditions</label>
                <textarea className={`${inputClass} resize-vertical min-h-[80px]`} value={form.conditions} onChange={e => set('conditions', e.target.value)} placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma..." />
              </div>

              <div>
                <label className={labelClass}>Current Medications</label>
                <textarea className={`${inputClass} resize-vertical min-h-[80px]`} value={form.medications} onChange={e => set('medications', e.target.value)} placeholder="List medications and dosages..." />
              </div>

              <div>
                <label className={labelClass}>Previous Surgeries / Major Medical Events</label>
                <textarea className={`${inputClass} resize-vertical min-h-[80px]`} value={form.surgeries} onChange={e => set('surgeries', e.target.value)} placeholder="e.g. Appendectomy (2018), Knee replacement (2021)..." />
              </div>

              <div>
                <label className={labelClass}>Disability / Special Needs</label>
                <textarea className={`${inputClass} resize-vertical min-h-[80px]`} value={form.disability} onChange={e => set('disability', e.target.value)} placeholder="Any relevant disability or special care requirement..." />
              </div>
            </div>
          )}

          {/* ═══ PREFERRED CARE ═══ */}
          {activeTab === 3 && (
            <div className="space-y-5">
              <h4 className={sectionTitle}>Preferred Hospital</h4>
              <div>
                <label className={labelClass}>Primary Preferred Hospital</label>
                <input className={inputClass} value={form.preferredHospital} onChange={e => set('preferredHospital', e.target.value)} placeholder="e.g. Apollo Hospitals, Jubilee Hills" />
              </div>
              <div>
                <label className={labelClass}>Secondary Preferred Hospital</label>
                <input className={inputClass} value={form.secondaryHospital} onChange={e => set('secondaryHospital', e.target.value)} placeholder="Backup hospital preference" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Insurance Provider</label>
                  <input className={inputClass} value={form.insuranceProvider} onChange={e => set('insuranceProvider', e.target.value)} placeholder="e.g. Star Health, HDFC Ergo" />
                </div>
                <div>
                  <label className={labelClass}>Policy Number</label>
                  <input className={inputClass} value={form.policyNumber} onChange={e => set('policyNumber', e.target.value)} placeholder="Policy / card number" />
                </div>
              </div>

              <h4 className={sectionTitle}>Preferred Doctors</h4>
              {(form.doctors || []).map((doc, i) => (
                <div key={i} className="bg-[#151820] border border-[rgba(255,255,255,0.07)] rounded-xl p-4 relative">
                  {form.doctors.length > 1 && (
                    <button onClick={() => removeDoctor(i)} className="absolute top-3 right-3 text-[#5a6070] hover:text-[#E63946] transition-colors cursor-pointer text-sm">✕</button>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Doctor Name</label>
                      <input className={inputClass} value={doc.name} onChange={e => setDoctor(i, 'name', e.target.value)} placeholder="Dr. Priya Mehta" />
                    </div>
                    <div>
                      <label className={labelClass}>Specialisation</label>
                      <input className={inputClass} value={doc.specialisation} onChange={e => setDoctor(i, 'specialisation', e.target.value)} placeholder="Cardiologist" />
                    </div>
                    <div>
                      <label className={labelClass}>Hospital / Clinic</label>
                      <input className={inputClass} value={doc.hospital} onChange={e => setDoctor(i, 'hospital', e.target.value)} placeholder="Apollo, Hyderabad" />
                    </div>
                    <div>
                      <label className={labelClass}>Contact Number</label>
                      <input type="tel" className={inputClass} value={doc.contact} onChange={e => setDoctor(i, 'contact', e.target.value)} placeholder="+91 XXXXX XXXXX" />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addDoctor} className="w-full py-3 rounded-lg border border-dashed border-[rgba(255,255,255,0.07)] text-[#8a90a0] text-[.8rem] hover:border-[rgba(230,57,70,0.35)] hover:text-white transition-all cursor-pointer font-body bg-transparent">
                + Add Doctor
              </button>
            </div>
          )}

          {/* ═══ EMERGENCY CONTACTS ═══ */}
          {activeTab === 4 && (
            <div className="space-y-4">
              {(form.emergencyContacts || []).map((contact, i) => (
                <div key={i} className="bg-[#151820] border border-[rgba(255,255,255,0.07)] rounded-xl p-4 relative">
                  {form.emergencyContacts.length > 1 && (
                    <button onClick={() => removeContact(i)} className="absolute top-3 right-3 text-[#5a6070] hover:text-[#E63946] transition-colors cursor-pointer text-sm">✕</button>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Contact Name</label>
                      <input className={inputClass} value={contact.name} onChange={e => setContact(i, 'name', e.target.value)} placeholder="Full name" />
                    </div>
                    <div>
                      <label className={labelClass}>Relationship</label>
                      <select className={selectClass} value={contact.relationship} onChange={e => setContact(i, 'relationship', e.target.value)}>
                        <option>Mother</option><option>Father</option><option>Spouse</option><option>Sibling</option><option>Friend</option><option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Phone Number</label>
                      <input type="tel" className={inputClass} value={contact.phone} onChange={e => setContact(i, 'phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
                    </div>
                    <div>
                      <label className={labelClass}>Alternate Phone</label>
                      <input type="tel" className={inputClass} value={contact.altPhone} onChange={e => setContact(i, 'altPhone', e.target.value)} placeholder="Optional" />
                    </div>
                    <div className="col-span-2">
                      <label className={labelClass}>Email Address</label>
                      <input type="email" className={inputClass} value={contact.email} onChange={e => setContact(i, 'email', e.target.value)} placeholder="email@example.com" />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addContact} className="w-full py-3 rounded-lg border border-dashed border-[rgba(255,255,255,0.07)] text-[#8a90a0] text-[.8rem] hover:border-[rgba(230,57,70,0.35)] hover:text-white transition-all cursor-pointer font-body bg-transparent">
                + Add Emergency Contact
              </button>
              <p className="text-[.75rem] text-[#5a6070] italic mt-3">
                All listed contacts will be notified automatically when SOS is triggered and when you are admitted to hospital.
              </p>
            </div>
          )}

          {/* ═══ SETTINGS ═══ */}
          {activeTab === 5 && (
            <div className="space-y-5">
              <h4 className={sectionTitle}>SOS Auto-Dial Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Auto-Dial Attempts</label>
                  <input type="number" className={inputClass} value={form.autoDialAttempts} onChange={e => set('autoDialAttempts', e.target.value)} min="1" max="10" />
                </div>
                <div>
                  <label className={labelClass}>Seconds Per Attempt</label>
                  <input type="number" className={inputClass} value={form.autoDialSeconds} onChange={e => set('autoDialSeconds', e.target.value)} min="5" max="120" />
                </div>
              </div>
              <p className="text-[.75rem] text-[#5a6070] italic">
                When a crash or fall is detected, the system will ring for the specified duration before sending the SOS automatically. You can cancel during this time.
              </p>

              <div className="pt-4">
                <button 
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[rgba(230,57,70,0.1)] border border-[rgba(230,57,70,0.3)] text-[#E63946] hover:bg-[#E63946] hover:text-white transition-all cursor-pointer font-bold text-[.82rem]"
                >
                  <Trash2 size={16} /> Delete Profile
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.07)] flex justify-end items-center gap-3 shrink-0">
          {savedMsg && (
            <span className="text-[.75rem] text-[#2ecc71] mr-auto flex items-center gap-1">
              <CheckCircle2 size={14} /> Saved successfully
            </span>
          )}
          <button onClick={() => onCancel ? onCancel() : null} className="py-2.5 px-5 rounded-lg text-[.82rem] font-medium bg-transparent text-[#8a90a0] border border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.2)] hover:text-white transition-all cursor-pointer font-body">
            Cancel
          </button>
          <button onClick={handleSave} className="py-2.5 px-5 rounded-lg text-[.82rem] font-bold bg-[#E63946] text-white border-none hover:bg-[#b02530] transition-all cursor-pointer font-body flex items-center gap-1.5">
            {savedMsg ? <><CheckCircle2 size={16} /> Saved</> : <><Save size={16} /> Save Profile</>}
          </button>
        </div>
      </div>
    </div>
  );
}
