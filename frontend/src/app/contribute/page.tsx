'use client';
import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Upload, CheckCircle, AlertCircle, Loader2, FileText,
  IndianRupee, Building2, Sparkles, Gift, Shield, ArrowRight, X
} from 'lucide-react';
import Navbar from '@/components/Navbar';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const STEPS = ['Hospital & Treatment', 'Cost Breakdown', 'Upload Bill', 'Review & Submit'];

interface FormData {
  hospitalId: string; hospitalSearch: string;
  treatmentId: string; treatmentSearch: string;
  totalCost: string; roomCharges: string; surgeryFee: string;
  implantCost: string; pharmacyCost: string; otherCharges: string;
  stayDays: string; city: string;
  file: File | null;
  consentGiven: boolean;
}

const CITIES = ['Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad'];

export default function ContributePage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    hospitalId: '', hospitalSearch: '', treatmentId: '', treatmentSearch: '',
    totalCost: '', roomCharges: '', surgeryFee: '', implantCost: '',
    pharmacyCost: '', otherCharges: '', stayDays: '', city: 'Delhi',
    file: null, consentGiven: false,
  });
  const [hospitalOptions, setHospitalOptions] = useState<Array<{id:string;name:string;city:string}>>([]);
  const [treatmentOptions, setTreatmentOptions] = useState<Array<{id:string;name:string;category:string}>>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{points: number; message: string} | null>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof FormData, v: string | boolean | File | null) => setForm(f => ({ ...f, [k]: v }));

  const searchHospitals = async (q: string) => {
    set('hospitalSearch', q);
    if (q.length < 2) { setHospitalOptions([]); return; }
    try {
      const res = await fetch(`${API}/hospitals?city=${form.city}&limit=6`);
      const data = await res.json();
      setHospitalOptions(data.data?.map((h: {id:string;name:string;city:string}) => ({ id: h.id, name: h.name, city: h.city })) || []);
    } catch {}
  };

  const searchTreatments = async (q: string) => {
    set('treatmentSearch', q);
    if (q.length < 2) { setTreatmentOptions([]); return; }
    try {
      const res = await fetch(`${API}/treatments/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setTreatmentOptions(data.data || []);
    } catch {}
  };

  const handleFile = (file: File | null) => {
    if (!file) return;
    const ok = ['application/pdf','image/jpeg','image/png','image/webp'].includes(file.type);
    if (!ok) { setError('Please upload a PDF or image (JPG/PNG/WebP)'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('File too large — max 10MB'); return; }
    set('file', file); setError('');
  };

  const submit = async () => {
    if (!form.hospitalId || !form.treatmentId || !form.totalCost) {
      setError('Please fill all required fields'); return;
    }
    if (!form.consentGiven) { setError('Please confirm you consent to share this data'); return; }
    setLoading(true); setError('');

    try {
      const fd = new FormData();
      fd.append('hospitalId', form.hospitalId);
      fd.append('treatmentId', form.treatmentId);
      fd.append('totalCost', form.totalCost);
      fd.append('roomCharges', form.roomCharges);
      fd.append('surgeryFee', form.surgeryFee);
      fd.append('implantCost', form.implantCost);
      fd.append('pharmacyCost', form.pharmacyCost);
      fd.append('otherCharges', form.otherCharges);
      fd.append('stayDays', form.stayDays);
      fd.append('city', form.city);
      if (form.file) fd.append('bill', form.file);

      const res = await fetch(`${API}/bills/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.data || data.bill) {
        setSuccess({ points: form.file ? 75 : 50, message: 'Bill submitted successfully!' });
      } else {
        setError(data.error || 'Submission failed');
      }
    } catch { setError('Network error — please try again'); }
    finally { setLoading(false); }
  };

  const canProceed = [
    !!form.hospitalId && !!form.treatmentId,
    !!form.totalCost,
    true, // file optional
    form.consentGiven,
  ];

  if (success) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar/>
      <div className="pt-16 flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
        <div className="card p-10 max-w-md w-full">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500"/>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you! 🎉</h2>
          <p className="text-gray-500 mb-5">{success.message} Your data helps other patients make informed decisions.</p>

          <div className="bg-brand-50 border border-brand-200 rounded-2xl p-5 mb-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-brand-700 font-medium">Points Earned</span>
              <span className="text-2xl font-black text-brand-700">+{success.points} pts</span>
            </div>
            {form.file && <p className="text-xs text-brand-600">Includes +25 pts bonus for uploading bill image!</p>}
            <div className="mt-2 text-xs text-brand-600">
              Your bill will be reviewed within 48 hours. You'll earn +100 pts once verified.
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button onClick={() => { setSuccess(null); setStep(0); setForm(f => ({ ...f, file: null, totalCost: '' })); }}
              className="btn btn-primary btn-md">
              <Upload className="w-4 h-4"/> Submit Another Bill
            </button>
            <Link href="/community" className="btn btn-secondary btn-md">
              <Gift className="w-4 h-4"/> View My Points
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar/>
      <div className="pt-16 pb-20 lg:pb-0">
        {/* Header */}
        <div className="hero-gradient py-10">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 badge bg-white/15 text-white mb-3">
              <Gift className="w-4 h-4 text-teal-300"/> Earn {form.file ? '75' : '50'}+ ClearMed Points
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Contribute Your Bill</h1>
            <p className="text-white/70">Help thousands of patients. Takes 3 minutes.</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Step progress */}
          <div className="flex items-center mb-8">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                    ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-brand-600 text-white shadow-lg scale-110' : 'bg-gray-100 text-gray-400'}`}>
                    {i < step ? <CheckCircle className="w-4 h-4"/> : i + 1}
                  </div>
                  <p className={`text-xs mt-1 font-medium hidden sm:block ${i === step ? 'text-brand-600' : 'text-gray-400'}`}>{s}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-emerald-400' : 'bg-gray-200'}`}/>
                )}
              </div>
            ))}
          </div>

          <div className="card p-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0"/>{error}
                <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4"/></button>
              </div>
            )}

            {/* Step 0: Hospital & Treatment */}
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 text-lg">Hospital & Treatment</h2>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">City *</label>
                  <select value={form.city} onChange={e => set('city', e.target.value)} className="input w-full">
                    {CITIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="relative">
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Hospital Name *</label>
                  <input value={form.hospitalSearch} onChange={e => searchHospitals(e.target.value)}
                    placeholder="e.g. Apollo Hospital, Fortis..." className="input w-full"/>
                  {form.hospitalId && <CheckCircle className="absolute right-3 top-9 w-4 h-4 text-emerald-500"/>}
                  {hospitalOptions.length > 0 && !form.hospitalId && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                      {hospitalOptions.map(h => (
                        <button key={h.id} onClick={() => { set('hospitalId', h.id); set('hospitalSearch', h.name); setHospitalOptions([]); }}
                          className="flex items-center gap-2 w-full px-4 py-3 hover:bg-brand-50 text-left text-sm">
                          <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0"/>
                          <span className="font-medium">{h.name}</span>
                          <span className="text-gray-400 text-xs ml-auto">{h.city}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Treatment / Surgery *</label>
                  <input value={form.treatmentSearch} onChange={e => searchTreatments(e.target.value)}
                    placeholder="e.g. Knee Replacement, Angioplasty..." className="input w-full"/>
                  {form.treatmentId && <CheckCircle className="absolute right-3 top-9 w-4 h-4 text-emerald-500"/>}
                  {treatmentOptions.length > 0 && !form.treatmentId && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                      {treatmentOptions.map(t => (
                        <button key={t.id} onClick={() => { set('treatmentId', t.id); set('treatmentSearch', t.name); setTreatmentOptions([]); }}
                          className="flex items-center gap-2 w-full px-4 py-3 hover:bg-brand-50 text-left text-sm">
                          <span className="font-medium">{t.name}</span>
                          <span className="text-gray-400 text-xs ml-auto">{t.category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 1: Cost Breakdown */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 text-lg">Cost Breakdown</h2>
                <p className="text-sm text-gray-500">Enter the costs from your bill. Total is required; others help create better breakdowns.</p>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Total Bill Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-medium">₹</span>
                    <input type="number" value={form.totalCost} onChange={e => set('totalCost', e.target.value)}
                      placeholder="0" className="input pl-7 w-full"/>
                  </div>
                </div>
                {[
                  { k: 'roomCharges' as const, l: 'Room / Ward Charges' },
                  { k: 'surgeryFee' as const, l: 'Surgery / Procedure Fee' },
                  { k: 'implantCost' as const, l: 'Implant / Device Cost' },
                  { k: 'pharmacyCost' as const, l: 'Pharmacy / Medicines' },
                  { k: 'otherCharges' as const, l: 'Other Charges' },
                ].map(f => (
                  <div key={f.k}>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">{f.l} <span className="text-gray-400 font-normal">(optional)</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400 font-medium">₹</span>
                      <input type="number" value={form[f.k]} onChange={e => set(f.k, e.target.value)}
                        placeholder="0" className="input pl-7 w-full"/>
                    </div>
                  </div>
                ))}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Days of Hospital Stay <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input type="number" value={form.stayDays} onChange={e => set('stayDays', e.target.value)}
                    placeholder="e.g. 3" className="input w-full"/>
                </div>
              </div>
            )}

            {/* Step 2: Upload */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 text-lg">Upload Bill <span className="text-gray-400 font-normal text-base">(Optional — earn +25 pts)</span></h2>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5"/>
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">Your privacy is protected</p>
                      <p className="text-xs text-emerald-700 mt-0.5">We automatically remove all patient information (name, phone, Aadhaar, address) before storing your bill. Only cost data is kept.</p>
                    </div>
                  </div>
                </div>

                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                    ${dragOver ? 'border-brand-400 bg-brand-50' : form.file ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-brand-300 hover:bg-brand-50/50'}`}>
                  {form.file ? (
                    <div>
                      <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2"/>
                      <p className="font-semibold text-emerald-800">{form.file.name}</p>
                      <p className="text-xs text-emerald-600 mt-1">{(form.file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button onClick={e => { e.stopPropagation(); set('file', null); }} className="text-xs text-red-500 mt-2 hover:underline">Remove</button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3"/>
                      <p className="font-medium text-gray-600">Drag & drop your bill here</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG or WebP — max 10MB</p>
                      <p className="text-xs text-brand-600 font-medium mt-2">+25 bonus points for uploading</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden"
                  onChange={e => handleFile(e.target.files?.[0] || null)}/>
              </div>
            )}

            {/* Step 3: Review & submit */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 text-lg">Review & Submit</h2>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Hospital</span><span className="font-medium">{form.hospitalSearch}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Treatment</span><span className="font-medium">{form.treatmentSearch}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">City</span><span className="font-medium">{form.city}</span></div>
                  <div className="flex justify-between pt-2 border-t border-gray-200"><span className="text-gray-700 font-medium">Total Cost</span><span className="font-black text-brand-700">₹{Number(form.totalCost).toLocaleString('en-IN')}</span></div>
                  {form.file && <div className="flex justify-between"><span className="text-gray-500">Bill attached</span><span className="text-emerald-600 font-medium">✓ {form.file.name}</span></div>}
                </div>

                <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-brand-700 font-medium text-sm">You'll earn</span>
                    <span className="text-xl font-black text-brand-700">+{form.file ? 75 : 50} pts</span>
                  </div>
                  <p className="text-xs text-brand-600 mt-1">+100 bonus pts when your bill is verified by our team</p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.consentGiven} onChange={e => set('consentGiven', e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-brand-600"/>
                  <span className="text-xs text-gray-600 leading-relaxed">
                    I confirm this bill is real and I consent to ClearMed using the <strong>cost data</strong> (not personal info) to help patients compare prices. I understand all personal information will be automatically removed.
                  </span>
                </label>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)} className="btn btn-secondary btn-md">← Back</button>
              )}
              <div className="flex-1"/>
              {step < STEPS.length - 1 ? (
                <button onClick={() => setStep(s => s + 1)} disabled={!canProceed[step]}
                  className={`btn btn-md ${canProceed[step] ? 'btn-primary' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                  Continue →
                </button>
              ) : (
                <button onClick={submit} disabled={loading || !form.consentGiven} className="btn btn-primary btn-md px-8">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin"/> Submitting...</> : <><Sparkles className="w-4 h-4"/> Submit & Earn Points</>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
