'use client';
import { useState, useEffect } from 'react';
import { Shield, Search, CheckCircle, Building2, Star, MapPin, ArrowRight, ChevronDown, Loader2, TrendingDown, AlertCircle, Phone } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Insurer { id: string; name: string; waitingPeriod?: number }
interface Hospital {
  id: string; name: string; slug: string; city: string; type: string;
  naabhStatus: boolean; rating?: number; address: string; phone?: string;
  cashlessInsurers: Array<{ id: string; name: string }>;
  _count: { doctors: number };
}
interface Estimate {
  insurer: string; sumInsured: number; estimatedTotalCost: number;
  estimatedCovered: number; estimatedOutOfPocket: number; coveragePct: number;
  breakdown: Record<string, { covered: number; note?: string; pct?: number }>;
  waitingPeriodYears: number; disclaimer: string;
}

const CITIES = ['Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Hyderabad'];
const TREATMENTS = [
  { label: 'Knee Replacement', slug: 'knee-replacement' },
  { label: 'Angioplasty', slug: 'angioplasty' },
  { label: 'Cataract Surgery', slug: 'cataract-surgery' },
  { label: 'Normal Delivery', slug: 'normal-delivery' },
  { label: 'Gallbladder Removal', slug: 'gallbladder-removal' },
];
const SUM_INSURED_OPTIONS = [300000, 500000, 1000000, 1500000, 2000000, 5000000];
const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}K`;

export default function InsurancePage() {
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [selectedInsurer, setSelectedInsurer] = useState('');
  const [city, setCity] = useState('Delhi');
  const [treatmentSlug, setTreatmentSlug] = useState('');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'cashless' | 'estimate'>('cashless');
  const [sumInsured, setSumInsured] = useState(500000);
  const [estimateCost, setEstimateCost] = useState('');
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/insurance/insurers`).then(r => r.json()).then(d => setInsurers(d.data || []));
  }, []);

  const searchHospitals = async () => {
    if (!selectedInsurer) return;
    setLoading(true);
    try {
      const p = new URLSearchParams({ insurer: selectedInsurer, city });
      if (treatmentSlug) p.set('treatmentSlug', treatmentSlug);
      const res = await fetch(`${API}/insurance/cashless?${p}`);
      const data = await res.json();
      setHospitals(data.data || []);
    } catch {} finally { setLoading(false); }
  };

  const getEstimate = async () => {
    if (!selectedInsurer || !estimateCost) return;
    setEstimateLoading(true);
    try {
      const res = await fetch(`${API}/insurance/estimate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insurer: selectedInsurer, sumInsured, estimatedCost: parseFloat(estimateCost) }),
      });
      const data = await res.json();
      if (data.data) setEstimate(data.data);
    } catch {} finally { setEstimateLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-20 lg:pb-0">
        {/* Hero */}
        <div className="hero-gradient py-10 sm:py-12 px-4 text-center">
          <div className="max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 badge bg-white/15 text-white border border-white/20 mb-4">
              <Shield className="w-3.5 h-3.5 text-teal-300"/> Insurance Intelligence
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Find Cashless Hospitals & Estimate Coverage</h1>
            <p className="text-white/70 text-base">Know exactly which hospitals accept your insurance — and how much your policy covers.</p>
          </div>
        </div>

        {/* Tab + Insurer selector */}
        <div className="bg-white border-b border-gray-100 sticky top-16 z-40 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-4 py-3 overflow-x-auto">
              <div className="flex bg-gray-100 rounded-xl p-0.5 shrink-0">
                <button onClick={() => setTab('cashless')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === 'cashless' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500'}`}>
                  Cashless Hospitals
                </button>
                <button onClick={() => setTab('estimate')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === 'estimate' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500'}`}>
                  Coverage Estimator
                </button>
              </div>
              <select value={selectedInsurer} onChange={e => setSelectedInsurer(e.target.value)}
                className="input text-sm py-2 flex-1 min-w-36 cursor-pointer">
                <option value="">Select Insurer</option>
                {insurers.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">

          {/* ── Cashless Hospital Finder ── */}
          {tab === 'cashless' && (
            <div className="space-y-5">
              {/* Filters */}
              <div className="card p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <select value={city} onChange={e => setCity(e.target.value)} className="input text-sm py-2 cursor-pointer col-span-1">
                    {CITIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <select value={treatmentSlug} onChange={e => setTreatmentSlug(e.target.value)} className="input text-sm py-2 cursor-pointer col-span-1">
                    <option value="">All Treatments</option>
                    {TREATMENTS.map(t => <option key={t.slug} value={t.slug}>{t.label}</option>)}
                  </select>
                  <button onClick={searchHospitals} disabled={!selectedInsurer || loading}
                    className="btn btn-primary btn-sm col-span-2 sm:col-span-1 justify-center">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>}
                    {loading ? 'Searching...' : 'Find Hospitals'}
                  </button>
                </div>
              </div>

              {/* Insurer info */}
              {selectedInsurer && (() => {
                const ins = insurers.find(i => i.id === selectedInsurer);
                return ins ? (
                  <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-2xl p-3.5">
                    <Shield className="w-5 h-5 text-teal-600 shrink-0"/>
                    <div>
                      <p className="font-semibold text-teal-900 text-sm">{ins.name}</p>
                      <p className="text-xs text-teal-700">Waiting period: {ins.waitingPeriod} years for most surgical procedures</p>
                    </div>
                  </div>
                ) : null;
              })()}

              {!loading && hospitals.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-3 font-medium">{hospitals.length} cashless hospitals in {city}</p>
                  <div className="space-y-3">
                    {hospitals.map(h => (
                      <div key={h.id} className="card p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                            {h.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <Link href={`/hospitals/${h.slug}`} className="font-semibold text-gray-900 text-sm hover:text-brand-600">{h.name}</Link>
                              {h.naabhStatus && <span className="badge badge-green text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3"/>NABH</span>}
                              <span className={`badge text-xs ${h.type === 'GOVERNMENT' ? 'badge-green' : 'badge-blue'}`}>{h.type.charAt(0) + h.type.slice(1).toLowerCase()}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{h.city}</span>
                              {h.rating && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400"/>{h.rating.toFixed(1)}</span>}
                              <span>{h._count.doctors} doctors</span>
                            </div>
                            {/* Cashless insurers */}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {h.cashlessInsurers.slice(0, 4).map(i => (
                                <span key={i.id} className={`text-xs px-2 py-0.5 rounded-full border ${i.id === selectedInsurer ? 'bg-teal-100 border-teal-300 text-teal-800 font-semibold' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                                  {i.name}
                                </span>
                              ))}
                              {h.cashlessInsurers.length > 4 && <span className="text-xs text-gray-400">+{h.cashlessInsurers.length - 4} more</span>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <Link href={`/hospitals/${h.slug}`} className="btn btn-primary btn-sm text-xs">View</Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!loading && hospitals.length === 0 && selectedInsurer && (
                <div className="card p-8 text-center">
                  <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2"/>
                  <p className="text-gray-500 text-sm">Click "Find Hospitals" to search cashless hospitals</p>
                </div>
              )}
            </div>
          )}

          {/* ── Coverage Estimator ── */}
          {tab === 'estimate' && (
            <div className="space-y-5">
              <div className="card p-5">
                <h3 className="font-bold text-gray-900 mb-4 text-sm">Estimate Your Insurance Coverage</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Sum Insured</label>
                    <div className="flex flex-wrap gap-2">
                      {SUM_INSURED_OPTIONS.map(v => (
                        <button key={v} onClick={() => setSumInsured(v)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${sumInsured === v ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 text-gray-600 hover:border-brand-300'}`}>
                          {fmt(v)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Estimated Treatment Cost (₹)</label>
                    <input type="number" placeholder="e.g. 150000" value={estimateCost} onChange={e => setEstimateCost(e.target.value)}
                      className="input w-full text-sm"/>
                  </div>
                  <button onClick={getEstimate} disabled={!selectedInsurer || !estimateCost || estimateLoading}
                    className="btn btn-primary btn-md w-full justify-center">
                    {estimateLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Shield className="w-4 h-4"/>}
                    {estimateLoading ? 'Calculating...' : 'Estimate My Coverage'}
                  </button>
                  {!selectedInsurer && <p className="text-xs text-amber-600 text-center">Select your insurer at the top first</p>}
                </div>
              </div>

              {estimate && (
                <div className="space-y-4 animate-fade-in">
                  {/* Summary */}
                  <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Policy: {estimate.insurer} · Sum Insured: {fmt(estimate.sumInsured)}</p>
                        <p className="font-bold text-gray-900 mt-0.5">Coverage Summary</p>
                      </div>
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-black border-4 ${estimate.coveragePct >= 70 ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : estimate.coveragePct >= 50 ? 'border-amber-300 text-amber-700 bg-amber-50' : 'border-red-300 text-red-600 bg-red-50'}`}>
                        {estimate.coveragePct}%
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { label: 'Total Cost', value: fmt(estimate.estimatedTotalCost), color: 'text-gray-900' },
                        { label: 'Covered', value: fmt(estimate.estimatedCovered), color: 'text-emerald-600' },
                        { label: 'Out of Pocket', value: fmt(estimate.estimatedOutOfPocket), color: 'text-red-600' },
                      ].map(s => (
                        <div key={s.label} className="text-center bg-gray-50 rounded-xl p-2.5">
                          <p className={`text-base sm:text-lg font-black ${s.color}`}>{s.value}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Breakdown bars */}
                    <div className="space-y-2.5">
                      {Object.entries(estimate.breakdown).map(([key, val]) => {
                        const labels: Record<string, string> = { roomCharges: 'Room Charges', surgeryFee: 'Surgery Fee', implants: 'Implants', prePostHospital: 'Pre/Post Hospital' };
                        return (
                          <div key={key}>
                            <div className="flex justify-between text-xs mb-0.5">
                              <span className="text-gray-500">{labels[key] || key}</span>
                              <span className="font-medium text-gray-700">{fmt(val.covered)} {val.pct ? `(${val.pct}%)` : ''} {val.note ? `· ${val.note}` : ''}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full">
                              <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${estimate.estimatedTotalCost > 0 ? Math.min(100, (val.covered / estimate.estimatedTotalCost) * 100) : 0}%` }}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {estimate.waitingPeriodYears > 0 && (
                      <div className="mt-4 flex items-start gap-2 bg-amber-50 rounded-xl p-3">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5"/>
                        <p className="text-xs text-amber-700">Waiting period: {estimate.waitingPeriodYears} years for surgical procedures. Pre-existing conditions may have additional exclusions.</p>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed px-1">{estimate.disclaimer}</p>

                  <div className="card p-4 bg-brand-50 border-brand-100">
                    <p className="text-sm font-semibold text-brand-900 mb-1">Find cashless hospitals near you</p>
                    <p className="text-xs text-brand-700 mb-3">With {estimate.insurer} cashless facility, you won't need to pay upfront.</p>
                    <button onClick={() => setTab('cashless')} className="btn btn-primary btn-sm">
                      Find Cashless Hospitals <ArrowRight className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
