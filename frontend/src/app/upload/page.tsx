'use client';
import { useState, useCallback } from 'react';
import { Upload, FileText, Image as ImageIcon, X, CheckCircle, AlertCircle, Loader2, Shield, Info } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { billsAPI, treatmentsAPI, hospitalsAPI, Treatment, Hospital } from '@/lib/api';

type Step = 'hospital' | 'form' | 'success';

export default function UploadPage() {
  const [step, setStep] = useState<Step>('hospital');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Hospital search
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [hospitalResults, setHospitalResults] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  // Treatment search
  const [treatmentSearch, setTreatmentSearch] = useState('');
  const [treatmentResults, setTreatmentResults] = useState<Treatment[]>([]);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);

  // Bill form
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [form, setForm] = useState({
    city: 'Delhi',
    totalCost: '',
    roomCharges: '',
    implantCost: '',
    surgeryFee: '',
    pharmacyCost: '',
    otherCharges: '',
    admissionDate: '',
    dischargeDate: '',
  });

  // Pre-load hospitals when city changes
  useEffect(() => {
    hospitalsAPI.list({ city: form.city, limit: 50 } as any).then(r => {
      setHospitalResults(r.data || []);
    }).catch(() => {});
  }, [form.city]);

  const searchHospitals = async (q: string) => {
    setHospitalSearch(q);
    if (q.length < 2) { setHospitalResults([]); return; }
    try {
      const res = await hospitalsAPI.list({ city: form.city });
      setHospitalResults(res.data.filter(h => h.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6));
    } catch {}
  };

  const searchTreatments = async (q: string) => {
    setTreatmentSearch(q);
    if (q.length < 2) { setTreatmentResults([]); return; }
    try {
      const res = await treatmentsAPI.search(q);
      setTreatmentResults(res.data);
    } catch {}
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f && ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(f.type)) setFile(f);
    else setError('Please upload a PDF, JPG, or PNG file');
  }, []);

  const handleSubmit = async () => {
    if (!selectedHospital || !selectedTreatment || !form.totalCost) {
      setError('Please fill in the required fields'); return;
    }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('hospitalId', selectedHospital.id);
      fd.append('treatmentId', selectedTreatment.id);
      fd.append('city', form.city);
      fd.append('totalCost', form.totalCost);
      if (form.roomCharges) fd.append('roomCharges', form.roomCharges);
      if (form.implantCost) fd.append('implantCost', form.implantCost);
      if (form.surgeryFee) fd.append('surgeryFee', form.surgeryFee);
      if (form.pharmacyCost) fd.append('pharmacyCost', form.pharmacyCost);
      if (form.otherCharges) fd.append('otherCharges', form.otherCharges);
      if (form.admissionDate) fd.append('admissionDate', form.admissionDate);
      if (form.dischargeDate) fd.append('dischargeDate', form.dischargeDate);
      if (file) fd.append('bill', file);

      const res = await billsAPI.upload(fd);
      if (res.data) setStep('success');
      else setError(res.error || 'Upload failed');
    } catch {
      setError('Upload failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-20 lg:pb-0">
        <div className="bg-brand-900 py-8">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Upload Your Hospital Bill</h1>
            <p className="text-brand-300 text-sm">Help others understand real treatment costs. Your personal info is auto-removed.</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Privacy notice */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 flex gap-3">
            <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Your privacy is protected</p>
              <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                We automatically remove: patient name, phone number, address, patient ID, and insurance ID before storing any data. Only treatment type, cost breakdown, and hospital name are kept.
              </p>
            </div>
          </div>

          {step === 'success' ? (
            /* ── Success ── */
            <div className="card p-10 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Bill Uploaded!</h2>
              <p className="text-gray-500 mb-2">Thank you for contributing to healthcare transparency in India.</p>
              <p className="text-sm text-gray-400 mb-8">Your bill will be verified within 24–48 hours. Once verified, it will help future patients compare costs at {selectedHospital?.name}.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => { setStep('hospital'); setSelectedHospital(null); setSelectedTreatment(null); setFile(null); setForm(f => ({ ...f, totalCost: '', roomCharges: '', implantCost: '' })); }}
                  className="btn btn-secondary btn-md">Upload Another</button>
                <a href="/" className="btn btn-primary btn-md">Back to Home</a>
              </div>
            </div>
          ) : (
            <div className="card p-6 space-y-6">
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Hospital */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Hospital <span className="text-red-500">*</span>
                </label>
                {selectedHospital ? (
                  <div className="flex items-center justify-between p-3 bg-brand-50 rounded-xl border border-brand-200">
                    <div>
                      <p className="text-sm font-medium text-brand-800">{selectedHospital.name}</p>
                      <p className="text-xs text-brand-600">{selectedHospital.city}</p>
                    </div>
                    <button onClick={() => { setSelectedHospital(null); setHospitalSearch(''); }} className="text-brand-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input value={hospitalSearch} onChange={e => searchHospitals(e.target.value)}
                      placeholder="Type hospital name..." className="input" />
                    {hospitalResults.length > 0 && (
                      <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                        {hospitalResults.map(h => (
                          <button key={h.id} onClick={() => { setSelectedHospital(h); setHospitalResults([]); setHospitalSearch(''); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-brand-50 text-sm transition-colors">
                            <span className="font-medium text-gray-800">{h.name}</span>
                            <span className="text-gray-400 ml-2">{h.city}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Treatment */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Treatment / Surgery <span className="text-red-500">*</span>
                </label>
                {selectedTreatment ? (
                  <div className="flex items-center justify-between p-3 bg-brand-50 rounded-xl border border-brand-200">
                    <div>
                      <p className="text-sm font-medium text-brand-800">{selectedTreatment.name}</p>
                      <p className="text-xs text-brand-600">{selectedTreatment.category}</p>
                    </div>
                    <button onClick={() => { setSelectedTreatment(null); setTreatmentSearch(''); }} className="text-brand-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input value={treatmentSearch} onChange={e => searchTreatments(e.target.value)}
                      placeholder="Search treatment name..." className="input" />
                    {treatmentResults.length > 0 && (
                      <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                        {treatmentResults.map(t => (
                          <button key={t.id} onClick={() => { setSelectedTreatment(t); setTreatmentResults([]); setTreatmentSearch(''); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-brand-50 text-sm transition-colors">
                            <span className="font-medium text-gray-800">{t.name}</span>
                            <span className="text-gray-400 ml-2">{t.category}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* City */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">City</label>
                <select value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="input appearance-none cursor-pointer">
                  {['Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Cost fields */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block">
                  Bill Costs (₹) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'totalCost', label: 'Total Bill Amount *', required: true },
                    { key: 'surgeryFee', label: 'Surgery / Doctor Fee' },
                    { key: 'roomCharges', label: 'Room Charges' },
                    { key: 'implantCost', label: 'Implant / Device Cost' },
                    { key: 'pharmacyCost', label: 'Pharmacy / Medicines' },
                    { key: 'otherCharges', label: 'Other Charges' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="text-xs text-gray-500 mb-1 block">{field.label}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                        <input
                          type="number"
                          value={form[field.key as keyof typeof form]}
                          onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                          placeholder="0"
                          className="input pl-7"
                          min="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'admissionDate', label: 'Admission Date' },
                  { key: 'dischargeDate', label: 'Discharge Date' },
                ].map(d => (
                  <div key={d.key}>
                    <label className="text-xs text-gray-500 mb-1 block">{d.label}</label>
                    <input type="date" value={form[d.key as keyof typeof form]}
                      onChange={e => setForm(f => ({ ...f, [d.key]: e.target.value }))}
                      className="input text-sm" />
                  </div>
                ))}
              </div>

              {/* File upload */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Bill File (Optional)
                  <span className="ml-2 text-xs text-gray-400 font-normal">PDF, JPG or PNG · Max 10MB</span>
                </label>
                {file ? (
                  <div className="flex items-center justify-between p-3.5 bg-brand-50 rounded-xl border border-brand-200">
                    <div className="flex items-center gap-2">
                      {file.type === 'application/pdf' ? <FileText className="w-5 h-5 text-brand-600" /> : <ImageIcon className="w-5 h-5 text-brand-600" />}
                      <div>
                        <p className="text-sm font-medium text-brand-800">{file.name}</p>
                        <p className="text-xs text-brand-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button onClick={() => setFile(null)} className="text-brand-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={onDrop}
                    onDragOver={e => { e.preventDefault(); setDrag(true); }}
                    onDragLeave={() => setDrag(false)}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${drag ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'}`}
                    onClick={() => document.getElementById('file-input')?.click()}>
                    <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 font-medium">Drop your bill here, or click to browse</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG · Max 10MB</p>
                    <input id="file-input" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
                  </div>
                )}
                <div className="flex items-start gap-2 mt-2">
                  <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-400">File is optional. You can enter costs manually above without uploading a file.</p>
                </div>
              </div>

              {/* Submit */}
              <button onClick={handleSubmit} disabled={loading || !selectedHospital || !selectedTreatment || !form.totalCost}
                className="btn btn-primary btn-lg w-full">
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</> : <><Upload className="w-5 h-5" /> Submit Bill</>}
              </button>

              <p className="text-xs text-center text-gray-400">
                By submitting, you confirm this is your own bill and consent to anonymous storage of cost data only.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
