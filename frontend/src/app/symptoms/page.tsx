'use client';
import { useState } from 'react';
import { Stethoscope, Search, AlertTriangle, AlertCircle, Clock, CheckCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface SymptomResult {
  conditions: Array<{ name: string; likelihood: 'high' | 'moderate' | 'low'; icdCode?: string }>;
  specialists: string[];
  treatments: string[];
  urgency: 'emergency' | 'urgent' | 'routine' | 'elective';
  disclaimer: string;
  searchQuery: string;
}

const URGENCY: Record<string, { icon: React.ReactNode; label: string; sub: string; bg: string; border: string; text: string }> = {
  emergency: { icon: <AlertTriangle className="w-5 h-5"/>, label:'EMERGENCY', sub:'Go to ER immediately', bg:'bg-red-50', border:'border-red-300', text:'text-red-700' },
  urgent:    { icon: <AlertCircle className="w-5 h-5"/>,   label:'URGENT',    sub:'See a doctor within 24-48 hours', bg:'bg-orange-50', border:'border-orange-300', text:'text-orange-700' },
  routine:   { icon: <CheckCircle className="w-5 h-5"/>,   label:'ROUTINE',   sub:'Schedule when convenient', bg:'bg-emerald-50', border:'border-emerald-200', text:'text-emerald-700' },
  elective:  { icon: <Clock className="w-5 h-5"/>,         label:'ELECTIVE',  sub:'Non-urgent procedure', bg:'bg-blue-50', border:'border-blue-200', text:'text-blue-700' },
};

const EXAMPLES = [
  'Knee pain when climbing stairs for 3 months',
  'Chest tightness and shortness of breath',
  'Severe lower back pain radiating to leg',
  'Blurry vision and seeing halos',
  'Gallbladder pain after fatty food',
  'Kidney stone-like back pain',
];

const LIKELIHOOD_STYLE: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  moderate: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
};

export default function SymptomAnalyzerPage() {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('Delhi');
  const [result, setResult] = useState<SymptomResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = async (q = query) => {
    if (q.trim().length < 3) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch(`${API}/symptoms/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: q, city }),
      });
      const data = await res.json();
      if (data.data) setResult(data.data);
      else setError(data.error || 'Analysis failed');
    } catch {
      setError('Could not connect to server. Make sure the backend is running.');
    } finally { setLoading(false); }
  };

  const urgencyConfig = result ? (URGENCY[result.urgency] || URGENCY.routine) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-20 lg:pb-0">
        {/* Hero */}
        <div className="hero-gradient py-12 text-center">
          <div className="max-w-2xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 badge bg-white/15 text-white mb-4">
              <Sparkles className="w-4 h-4 text-teal-300" />
              AI-Powered Symptom Analyzer
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Describe your symptoms
            </h1>
            <p className="text-white/70 text-lg mb-8">
              Get matched to relevant treatments and hospitals in seconds.
            </p>

            {/* Input */}
            <div className="bg-white rounded-2xl p-4 shadow-xl">
              <textarea
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); analyze(); }}}
                placeholder="e.g. I have severe knee pain when walking stairs, especially in the morning. It has been going on for 2 months..."
                rows={3}
                className="w-full resize-none text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none leading-relaxed"
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <select value={city} onChange={e => setCity(e.target.value)}
                  className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer">
                  {['Delhi','Mumbai','Bengaluru','Chennai','Hyderabad'].map(c=><option key={c}>{c}</option>)}
                </select>
                <button onClick={() => analyze()} disabled={loading || query.length < 3}
                  className="btn btn-primary btn-sm">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>}
                  {loading ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Examples */}
          {!result && !loading && (
            <div className="mb-8">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Try an example</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map(e => (
                  <button key={e} onClick={() => { setQuery(e); analyze(e); }}
                    className="px-3 py-2 bg-white border border-gray-200 hover:border-brand-300 hover:bg-brand-50 text-xs text-gray-600 hover:text-brand-700 rounded-xl transition-all">
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="card p-6 space-y-3">
              {[80, 60, 90, 50].map((w, i) => (
                <div key={i} className={`h-4 bg-gray-100 rounded-full animate-pulse`} style={{width:`${w}%`}} />
              ))}
            </div>
          )}

          {error && (
            <div className="card p-5 border-red-200 bg-red-50 text-center">
              <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2"/>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {result && urgencyConfig && (
            <div className="space-y-4 animate-fade-in">
              {/* Urgency banner */}
              <div className={`rounded-2xl p-4 border-2 ${urgencyConfig.bg} ${urgencyConfig.border}`}>
                <div className={`flex items-center gap-3 ${urgencyConfig.text}`}>
                  {urgencyConfig.icon}
                  <div>
                    <span className="font-bold text-sm">{urgencyConfig.label}</span>
                    <span className="text-sm opacity-80 ml-2">— {urgencyConfig.sub}</span>
                  </div>
                </div>
              </div>

              {/* Conditions */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-brand-500"/> Possible Conditions
                </h3>
                <div className="space-y-2">
                  {result.conditions.map((c, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{c.name}</p>
                        {c.icdCode && <p className="text-xs text-gray-400">ICD: {c.icdCode}</p>}
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${LIKELIHOOD_STYLE[c.likelihood]}`}>
                        {c.likelihood.charAt(0).toUpperCase() + c.likelihood.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specialists */}
              {result.specialists.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    See a Specialist
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.specialists.map(s => (
                      <span key={s} className="badge badge-blue">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Treatments + Hospital search */}
              {result.treatments.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Relevant Treatments
                  </h3>
                  <div className="space-y-2 mb-4">
                    {result.treatments.map(t => (
                      <div key={t} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-700">{t}</span>
                        <Link href={`/search?treatment=${encodeURIComponent(t)}&city=${city}`}
                          className="text-xs text-brand-600 font-medium hover:underline flex items-center gap-1">
                          Find hospitals <ArrowRight className="w-3 h-3"/>
                        </Link>
                      </div>
                    ))}
                  </div>
                  {result.searchQuery && (
                    <Link href={`/search?treatment=${encodeURIComponent(result.searchQuery)}&city=${city}`}
                      className="btn btn-primary btn-md w-full text-sm">
                      <Search className="w-4 h-4"/> Find Hospitals in {city}
                    </Link>
                  )}
                </div>
              )}

              {/* Disclaimer */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>⚠️ Medical Disclaimer:</strong> {result.disclaimer}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
