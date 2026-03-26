'use client';
import { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, Image as ImageIcon, X, CheckCircle, AlertCircle, Loader2, Shield, Info } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { billsAPI, treatmentsAPI, hospitalsAPI, Treatment, Hospital } from '@/lib/api';

const INDIA_CITIES: Record<string, string[]> = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore'],
  'Arunachal Pradesh': ['Itanagar', 'Tawang', 'Naharlagun'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Bhavnagar', 'Jamnagar', 'Porbandar', 'Junagadh', 'Anand', 'Nadiad', 'Morbi', 'Surendranagar', 'Bharuch', 'Valsad', 'Vapi'],
  'Haryana': ['Faridabad', 'Gurugram', 'Panipat', 'Ambala'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Mandi'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi', 'Davanagere', 'Ballari', 'Shivamogga', 'Tumakuru', 'Kalaburagi'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Kolhapur', 'Solapur', 'Amravati', 'Jalgaon', 'Latur', 'Sangli', 'Akola', 'Ahmednagar'],
  'Manipur': ['Imphal', 'Churachandpur'],
  'Meghalaya': ['Shillong', 'Tura'],
  'Mizoram': ['Aizawl', 'Lunglei'],
  'Nagaland': ['Dimapur', 'Kohima'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Puri'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Chandigarh'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar', 'Jaisalmer', 'Mount Abu'],
  'Sikkim': ['Gangtok', 'Namchi'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Vellore', 'Erode'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad'],
  'Tripura': ['Agartala', 'Udaipur'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Noida', 'Prayagraj', 'Meerut', 'Bareilly', 'Aligarh'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Rishikesh'],
  'West Bengal': ['Kolkata', 'Howrah', 'Siliguri', 'Durgapur', 'Asansol'],

  // Union Territories
  'Andaman and Nicobar Islands': ['Port Blair'],
  'Chandigarh': ['Chandigarh'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Diu', 'Silvassa'],
  'Delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi'],
  'Lakshadweep': ['Kavaratti'],
  'Puducherry': ['Puducherry', 'Ozhukarai']
};

type Step = 'hospital' | 'form' | 'success';

export default function UploadPage() {
  const [step, setStep] = useState<Step>('hospital');
  const [loading, setLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState('');

  // Hospital search
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [hospitalResults, setHospitalResults] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [isNewHospital, setIsNewHospital] = useState(false);

  // Treatment search
  const [treatmentSearch, setTreatmentSearch] = useState('');
  const [treatmentResults, setTreatmentResults] = useState<Treatment[]>([]);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);

  // Bill form
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [form, setForm] = useState({
    state: '',
    city: 'Delhi',
    totalCost: '',
    roomCharges: { qty: '', unitPrice: '', amount: '' },
    implantCost: { qty: '', unitPrice: '', amount: '' },
    surgeryFee: { qty: '', unitPrice: '', amount: '' },
    pharmacyCost: { qty: '', unitPrice: '', amount: '' },
    pathologyCost: { qty: '', unitPrice: '', amount: '' },
    radiologyCost: { qty: '', unitPrice: '', amount: '' },
    gst: { qty: '', unitPrice: '', amount: '' },
    otherCharges: { qty: '', unitPrice: '', amount: '' },
    admissionDate: '',
    dischargeDate: '',
    newHospitalName: '',
    newHospitalAddress: ''
  });

  // Pre-load hospitals when city changes
  useEffect(() => {
    hospitalsAPI.list({ city: form.city, limit: 50 } as any).then(r => {
      setHospitalResults(r.data || []);
    }).catch(() => { });
  }, [form.city]);

  const searchHospitals = async (q: string) => {
    setHospitalSearch(q);
    if (q.length < 2) { setHospitalResults([]); return; }
    try {
      const res = await hospitalsAPI.list({ city: form.city });
      setHospitalResults(res.data.filter(h => h.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6));
    } catch { }
  };

  const searchTreatments = async (q: string) => {
    setTreatmentSearch(q);
    if (q.length < 2) { setTreatmentResults([]); return; }
    try {
      const res = await treatmentsAPI.search(q);
      setTreatmentResults(res.data);
    } catch { }
  };

  const handleFileSelect = async (f: File) => {
    setFile(f);
    setIsExtracting(true);
    try {
      const fd = new FormData();
      fd.append('bill', f);
      const res = await billsAPI.extract(fd);
      if (res.data) {
        const d = res.data;
        setForm(prev => ({
          ...prev,
          totalCost: d.totalCost ? String(d.totalCost) : prev.totalCost,
          roomCharges: { ...prev.roomCharges, amount: d.roomCharges ? String(d.roomCharges) : prev.roomCharges.amount },
          implantCost: { ...prev.implantCost, amount: d.implantCost ? String(d.implantCost) : prev.implantCost.amount },
          surgeryFee: { ...prev.surgeryFee, amount: d.surgeryFee ? String(d.surgeryFee) : prev.surgeryFee.amount },
          pharmacyCost: { ...prev.pharmacyCost, amount: d.pharmacyCost ? String(d.pharmacyCost) : prev.pharmacyCost.amount },
          pathologyCost: { ...prev.pathologyCost, amount: d.pathologyCost ? String(d.pathologyCost) : prev.pathologyCost.amount },
          radiologyCost: { ...prev.radiologyCost, amount: d.radiologyCost ? String(d.radiologyCost) : prev.radiologyCost.amount },
          gst: { ...prev.gst, amount: d.gst ? String(d.gst) : prev.gst.amount },
          otherCharges: { ...prev.otherCharges, amount: d.otherCharges ? String(d.otherCharges) : prev.otherCharges.amount },
          admissionDate: d.admissionDate || prev.admissionDate,
          dischargeDate: d.dischargeDate || prev.dischargeDate,
        }));
      }
    } catch (err) {
      console.error('OCR Extraction failed', err);
    } finally {
      setIsExtracting(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f && ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(f.type)) handleFileSelect(f);
    else setError('Please upload a PDF, JPG, or PNG file');
  }, []);

  const calcTotalFilled = () => {
    return [
      form.roomCharges.amount,
      form.surgeryFee.amount,
      form.implantCost.amount,
      form.pharmacyCost.amount,
      form.pathologyCost.amount,
      form.radiologyCost.amount,
      form.gst.amount,
      form.otherCharges.amount
    ].reduce((sum, val) => sum + (Number(val) || 0), 0);
  };
  const totalFilled = calcTotalFilled();
  const totalCostNum = Number(form.totalCost) || 0;
  const remainingAmount = totalCostNum - totalFilled;

  const handleSubmit = async () => {
    if (!selectedHospital && (!isNewHospital || !form.newHospitalName)) {
      setError('Please select a hospital or enter a new one.'); return;
    }
    // Allow free-text treatment submission
    let finalTreatmentId = selectedTreatment?.id;
    let fallbackTreatmentName = '';
    if (!finalTreatmentId) {
      if (treatmentSearch && treatmentSearch.trim().length > 0) {
        fallbackTreatmentName = treatmentSearch.trim();
      } else {
        setError('Please select or type a treatment.');
        return;
      }
    }

    if (!form.totalCost) {
      setError('Total Bill Amount is required.'); return;
    }
    if (!form.state) {
      setError('Please select a state.'); return;
    }
    if (!form.city) {
      setError('Please enter a city.'); return;
    }
    if (totalCostNum !== totalFilled) {
      setError(`Filled amount (₹${totalFilled}) must match the Total Bill Amount (₹${totalCostNum}). Please adjust the costs or autofill the remaining amount.`); return;
    }
    if (!file) {
      setError('Please upload a bill file. It is mandatory.'); return;
    }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      if (selectedHospital) {
        fd.append('hospitalId', selectedHospital.id);
      } else if (isNewHospital && form.newHospitalName) {
        fd.append('newHospitalName', form.newHospitalName);
        if (form.newHospitalAddress) fd.append('newHospitalAddress', form.newHospitalAddress);
      }
      if (finalTreatmentId) {
        fd.append('treatmentId', finalTreatmentId);
      } else if (fallbackTreatmentName) {
        fd.append('newTreatmentName', fallbackTreatmentName);
      }
      fd.append('state', form.state);
      fd.append('city', form.city);
      fd.append('totalCost', form.totalCost);
      if (form.roomCharges.amount) fd.append('roomCharges', form.roomCharges.amount);
      if (form.implantCost.amount) fd.append('implantCost', form.implantCost.amount);
      if (form.surgeryFee.amount) fd.append('surgeryFee', form.surgeryFee.amount);
      if (form.pharmacyCost.amount) fd.append('pharmacyCost', form.pharmacyCost.amount);
      if (form.pathologyCost.amount) fd.append('pathologyCost', form.pathologyCost.amount);
      if (form.radiologyCost.amount) fd.append('radiologyCost', form.radiologyCost.amount);
      if (form.gst.amount) fd.append('gst', form.gst.amount);
      if (form.otherCharges.amount) fd.append('otherCharges', form.otherCharges.amount);
      if (form.admissionDate) fd.append('admissionDate', form.admissionDate);
      if (form.dischargeDate) fd.append('dischargeDate', form.dischargeDate);
      if (file) fd.append('bill', file);

      const userStr = localStorage.getItem('clearmed_user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.id) fd.append('userId', user.id);
        } catch (e) { }
      }

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
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Upload Your Hospital Bill</h1>
            <p className="text-brand-300 text-sm">Help others understand real treatment costs. Your personal info is auto-removed.</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
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
              <p className="text-sm text-gray-400 mb-8">Your bill will be verified within 24–48 hours. Once verified, it will help future patients compare costs at {selectedHospital?.name || form.newHospitalName}.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => { setStep('hospital'); setSelectedHospital(null); setIsNewHospital(false); setSelectedTreatment(null); setFile(null); setForm(f => ({ ...f, totalCost: '', roomCharges: { qty: '', unitPrice: '', amount: '' }, implantCost: { qty: '', unitPrice: '', amount: '' }, surgeryFee: { qty: '', unitPrice: '', amount: '' }, pharmacyCost: { qty: '', unitPrice: '', amount: '' }, pathologyCost: { qty: '', unitPrice: '', amount: '' }, radiologyCost: { qty: '', unitPrice: '', amount: '' }, gst: { qty: '', unitPrice: '', amount: '' }, otherCharges: { qty: '', unitPrice: '', amount: '' }, newHospitalName: '', newHospitalAddress: '' })); }}
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
                {isNewHospital ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-brand-50 rounded-xl border border-brand-200">
                      <div>
                        <p className="text-sm font-medium text-brand-800">Add Custom Hospital</p>
                        <p className="text-xs text-brand-600">This hospital will be permanently added to {form.city}</p>
                      </div>
                      <button onClick={() => { setIsNewHospital(false); setForm(f => ({ ...f, newHospitalName: '', newHospitalAddress: '' })); }} className="text-brand-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <input type="text" placeholder="Hospital Name *" value={form.newHospitalName} onChange={e => setForm(f => ({ ...f, newHospitalName: e.target.value }))} className="input mb-3 bg-white" />
                      <input type="text" placeholder="Hospital Full Address (Optional)" value={form.newHospitalAddress} onChange={e => setForm(f => ({ ...f, newHospitalAddress: e.target.value }))} className="input bg-white" />
                    </div>
                  </div>
                ) : selectedHospital ? (
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
                  <div>
                    <input value={hospitalSearch} onChange={e => { searchHospitals(e.target.value); setSelectedHospital(null); }}
                      placeholder="Type hospital name to search..." className="input" />
                    {hospitalResults.length > 0 && (
                      <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden z-10 max-h-48 overflow-y-auto">
                        {hospitalResults.map(h => (
                          <button key={h.id} onClick={() => { setSelectedHospital(h); setHospitalResults([]); setHospitalSearch(h.name); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-brand-50 text-sm transition-colors cursor-pointer border-b border-gray-50 last:border-0 block">
                            <span className="font-medium text-gray-800">{h.name}</span>
                            <span className="text-gray-400 ml-2">{h.city}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="mt-3">
                      <button onClick={() => { setIsNewHospital(true); setHospitalResults([]); setSelectedHospital(null); }} className="text-sm text-brand-600 font-semibold hover:underline bg-brand-50 px-3 py-1.5 rounded-lg w-full text-center">
                        + Add Custom Hospital Manually
                      </button>
                    </div>
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
                  <div>
                    <input value={treatmentSearch} onChange={e => { searchTreatments(e.target.value); setSelectedTreatment(null); }}
                      placeholder="Search treatment name (e.g. Appendicitis)..." className="input" />
                    {treatmentResults.length > 0 && (
                      <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden z-10 max-h-48 overflow-y-auto">
                        {treatmentResults.map(t => (
                          <button key={t.id} onClick={() => { setSelectedTreatment(t); setTreatmentResults([]); setTreatmentSearch(t.name); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-brand-50 text-sm transition-colors cursor-pointer border-b border-gray-50 last:border-0 block">
                            <span className="font-medium text-gray-800">{t.name}</span>
                            <span className="text-gray-400 ml-2">{t.category}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {!selectedTreatment && treatmentSearch && treatmentResults.length === 0 && (
                      <p className="text-xs text-brand-600 mt-2">Custom treatment will be submitted.</p>
                    )}
                  </div>
                )}
              </div>

              {/* State and City */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">State <span className="text-red-500">*</span></label>
                  <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value, city: '' }))} className="input w-full appearance-none">
                    <option value="">Select State</option>
                    {[
                      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
                      'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
                      'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
                      'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
                      'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli', 'Daman and Diu', 'Delhi',
                      'Lakshadweep', 'Puducherry'
                    ].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">City <span className="text-red-500">*</span></label>
                  <select disabled={!form.state} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="input w-full appearance-none">
                    <option value="">{form.state ? 'Select City' : 'Select State First'}</option>
                    {form.state && INDIA_CITIES[form.state]?.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Cost fields */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  Bill Costs
                  {file && !isExtracting && (
                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">
                      Extracted Preview - Please Verify
                    </span>
                  )}
                </label>

                {/* Total Cost always required at the top */}
                <div className="mb-6 bg-brand-50 p-4 rounded-xl border border-brand-200">
                  <label className="text-sm font-bold text-brand-900 mb-1 block">Total Bill Amount <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                    <input type="number" value={form.totalCost} onChange={e => setForm(f => ({ ...f, totalCost: e.target.value }))} className="input pl-7 font-bold text-lg bg-white" placeholder="0" min="0" />
                  </div>
                  {form.totalCost && (
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <div className="flex bg-white px-3 py-1.5 rounded-lg font-medium border border-gray-100 text-gray-600">
                        Filled Amount: <span className="ml-1 text-gray-900 font-bold">₹{totalFilled}</span>
                      </div>
                      <div className={`flex bg-white px-3 py-1.5 rounded-lg font-medium border ${remainingAmount < 0 ? 'border-red-200 text-red-600' : remainingAmount > 0 ? 'border-amber-200 text-amber-600' : 'border-emerald-200 text-emerald-600'}`}>
                        Remaining: <span className="ml-1 font-bold">₹{remainingAmount}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-gray-200 overflow-hidden text-sm">
                  <div className="grid grid-cols-12 gap-2 bg-gray-50 border-b border-gray-200 p-3 font-semibold text-gray-600 hidden md:grid">
                    <div className="col-span-12 md:col-span-5">Description of Services</div>
                    <div className="col-span-3 md:col-span-2 text-center hidden md:block">Qty</div>
                    <div className="col-span-4 md:col-span-2 text-center hidden md:block">Unit Price (₹)</div>
                    <div className="col-span-5 md:col-span-3 text-right hidden md:block">Amount (₹)</div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {[
                      { key: 'roomCharges', label: 'Room Charges' },
                      { key: 'surgeryFee', label: 'Surgery / Doctor Fee' },
                      { key: 'implantCost', label: 'Implant / Device Cost' },
                      { key: 'pharmacyCost', label: 'Pharmacy / Medicines' },
                      { key: 'pathologyCost', label: 'Pathology / Lab' },
                      { key: 'radiologyCost', label: 'Radiology / Imaging' },
                      { key: 'gst', label: 'GST / Taxes' },
                      { key: 'otherCharges', label: 'Other Charges' },
                    ].map(field => {
                      const fieldData = form[field.key as keyof typeof form] as { qty: string, unitPrice: string, amount: string };

                      const updateField = (k: keyof typeof fieldData, v: string) => {
                        setForm(f => {
                          const currentField = f[field.key as keyof typeof f] as { qty: string, unitPrice: string, amount: string };
                          const newField = { ...currentField, [k]: v };

                          if ((k === 'qty' || k === 'unitPrice') && newField.qty && newField.unitPrice) {
                            newField.amount = String(Number(newField.qty) * Number(newField.unitPrice));
                          }
                          // If GST select changes and we have a valid totalCost, calculate 
                          if (field.key === 'gst' && k === 'qty' && v !== '' && f.totalCost) {
                            // Slab is selected in qty, amount = roughly Total * slab / (100+slab) but for simplicity we can just let users fill amount or we calculate slab on top?
                            // Let's just leave amount untouched and let them fill it, or if they want it auto-populated:
                            // The user said "fill the box at the end" implying they might just want the amount to be calculated.
                          }
                          return { ...f, [field.key]: newField };
                        });
                      };

                      if (field.key === 'gst') {
                        return (
                          <div key={field.key} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-2 p-3 items-center hover:bg-gray-50 transition-colors">
                            <div className="col-span-1 md:col-span-5 font-medium text-gray-700 flex items-center mb-1 md:mb-0">{field.label}</div>
                            <div className="grid grid-cols-4 md:col-span-7 gap-2 md:gap-0">
                              <select value={fieldData.qty || ''} onChange={e => updateField('qty', e.target.value)} className="input text-center px-1 py-1.5 h-[34px] text-xs col-span-2">
                                <option value="" disabled>Slab %</option>
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="18">18%</option>
                                <option value="40">40%</option>
                              </select>
                              <div className="col-span-1 hidden md:block" />
                              <input type="number" min="0" value={fieldData.amount} onChange={e => updateField('amount', e.target.value)} placeholder="Amt ₹" className="input text-right px-2 py-1.5 h-[34px] text-sm font-semibold text-gray-900 bg-white border-gray-300 col-span-2 md:col-span-3 ml-0 md:ml-2" />
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div key={field.key} className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 items-center hover:bg-gray-50 transition-colors">
                          <div className="col-span-1 md:col-span-5 font-medium text-gray-700 flex items-center mb-1 md:mb-0">
                            {field.label}
                            {field.key === 'otherCharges' && remainingAmount > 0 && (
                              <button
                                type="button"
                                onClick={() => updateField('amount', String((Number(fieldData.amount) || 0) + remainingAmount))}
                                className="ml-2 text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded font-bold hover:bg-brand-200"
                              >
                                Autofill Remaining
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-4 md:col-span-7 gap-2 md:gap-0">
                            <input type="number" min="0" value={fieldData.qty} onChange={e => updateField('qty', e.target.value)} placeholder="Qty" className="input text-center px-1 py-1.5 h-[34px] text-xs col-span-1 md:col-span-2" />
                            <input type="number" min="0" value={fieldData.unitPrice} onChange={e => updateField('unitPrice', e.target.value)} placeholder="Price" className="input text-center px-1 py-1.5 h-[34px] text-xs col-span-1 md:col-span-2" />
                            <input type="number" min="0" value={fieldData.amount} onChange={e => updateField('amount', e.target.value)} placeholder="Amt ₹" className="input text-right px-2 py-1.5 h-[34px] text-sm font-semibold text-gray-900 bg-white border-gray-300 col-span-2 md:col-span-3 ml-0 md:ml-2" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
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
                    <input type="date" value={form[d.key as keyof typeof form] as string}
                      onChange={e => setForm(f => ({ ...f, [d.key]: e.target.value }))}
                      className="input text-sm" />
                  </div>
                ))}
              </div>

              {/* File upload */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Bill File <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs text-gray-400 font-normal">PDF, JPG or PNG · Max 10MB</span>
                </label>
                {file ? (
                  <div className="flex items-center justify-between p-3.5 bg-brand-50 rounded-xl border border-brand-200">
                    <div className="flex items-center gap-2">
                      {file.type === 'application/pdf' ? <FileText className="w-5 h-5 text-brand-600" /> : <ImageIcon className="w-5 h-5 text-brand-600" />}
                      <div>
                        <p className="text-sm font-medium text-brand-800">{file.name}</p>
                        <p className="text-xs text-brand-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        {isExtracting && <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1"><Loader2 className="w-3 h-3 animate-spin" /> Extracting data...</p>}
                        {!isExtracting && <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3" /> Data extracted</p>}
                      </div>
                    </div>
                    <button disabled={isExtracting} onClick={() => setFile(null)} className="text-brand-400 hover:text-red-500 disabled:opacity-50">
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
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
                  </div>
                )}
                <div className="flex items-start gap-2 mt-2">
                  <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-400">Uploading a bill file is mandatory for verification.</p>
                </div>
              </div>

              {/* Submit */}
              <button onClick={handleSubmit} disabled={loading}
                className="btn btn-primary btn-lg w-full flex items-center justify-center gap-2 mt-4 text-center">
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
