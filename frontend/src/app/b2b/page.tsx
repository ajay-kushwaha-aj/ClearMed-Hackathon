'use client';
import { useState } from 'react';
import { BarChart3, Zap, Shield, Code, ArrowRight, CheckCircle, Copy, Check, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const PLANS = [
  { name: 'Starter', price: '₹5,000', quota: '1,000 calls/month', target: 'Startups & researchers', color: 'border-gray-200 bg-white' },
  { name: 'Professional', price: '₹20,000', quota: '10,000 calls/month', target: 'Insurance companies & TPAs', color: 'border-brand-300 bg-brand-50', badge: 'Popular' },
  { name: 'Enterprise', price: '₹50,000', quota: '1,00,000 calls/month', target: 'Hospital chains & policy researchers', color: 'border-purple-200 bg-purple-50' },
];

const ENDPOINTS = [
  {
    method: 'GET', path: '/api/b2b/costs/:treatmentSlug/:city',
    desc: 'Cost percentile statistics (p10–p90, mean, median) for a treatment in a city',
    sample: `{"data":{"treatment":{"name":"Knee Replacement Surgery"},"city":"Delhi","sampleSize":47,"statistics":{"mean":185000,"median":172000,"p10":95000,"p25":130000,"p75":240000,"p90":310000}}}`,
  },
  {
    method: 'GET', path: '/api/b2b/outcomes/:hospitalId/:treatmentId',
    desc: 'ClearMed Score and outcome components for a specific hospital-treatment pair',
    sample: `{"data":{"hospital":{"name":"Apollo Hospital","city":"Delhi"},"score":{"overall":7.8,"components":{"patientSatisfaction":2.1,"costEfficiency":1.7,"successRate":1.9},"isReliable":true}}}`,
  },
  {
    method: 'GET', path: '/api/b2b/bulk/costs?city=Mumbai',
    desc: 'Bulk cost data for all treatments (Professional+ plan only)',
    sample: `{"data":[{"treatment":{"name":"Angioplasty"},"avg":285000,"min":180000,"max":520000,"n":23},{"treatment":{"name":"Knee Replacement"},"avg":185000,"min":95000,"max":310000,"n":47}]}`,
  },
];

export default function B2BPage() {
  const [form, setForm] = useState({ name: '', orgName: '', email: '', plan: 'STARTER' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // In production: send to admin for manual key creation
      // For demo: just show success message
      await new Promise(r => setTimeout(r, 800));
      setSubmitted(true);
    } finally { setLoading(false); }
  };

  const copy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-20 lg:pb-0">
        {/* Hero */}
        <div className="bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 py-12 sm:py-16 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 badge bg-teal-400/20 text-teal-300 border border-teal-400/30 mb-4">
              <Code className="w-3.5 h-3.5" /> Healthcare Analytics API
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Integrate India's most comprehensive hospital cost database
            </h1>
            <p className="text-white/70 text-lg mb-8">
              Anonymized, aggregated cost intelligence from verified patient bills. Built for insurers, consultants, and health-tech companies.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <a href="#access" className="btn bg-teal-500 hover:bg-teal-400 text-white btn-lg font-bold">
                <Zap className="w-5 h-5" /> Get API Access
              </a>
              <a href="#docs" className="btn border border-white/30 text-white hover:bg-white/10 btn-lg">View Docs</a>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">

          {/* Plans */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-5 text-center">API Plans</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {PLANS.map(plan => (
                <div key={plan.name} className={`card p-5 border-2 relative ${plan.color}`}>
                  {(plan as any).badge && <span className="absolute top-3 right-3 bg-brand-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{(plan as any).badge}</span>}
                  <h3 className="font-bold text-gray-900 text-lg mb-0.5">{plan.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{plan.target}</p>
                  <p className="text-2xl font-black text-gray-900 mb-0.5">{plan.price}</p>
                  <p className="text-xs text-gray-400 mb-4">/month</p>
                  <div className="flex items-center gap-2 text-sm font-semibold text-brand-700 mb-4">
                    <Zap className="w-4 h-4" />{plan.quota}
                  </div>
                  <button onClick={() => setForm(p => ({ ...p, plan: plan.name.toUpperCase() }))}
                    className="btn btn-primary btn-sm w-full justify-center text-xs">
                    Select {plan.name}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* API Docs */}
          <section id="docs">
            <h2 className="text-xl font-bold text-gray-900 mb-5">API Reference</h2>
            <div className="space-y-4">
              {ENDPOINTS.map((ep, i) => (
                <div key={i} className="card overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                    <span className="text-xs font-bold bg-teal-100 text-teal-800 px-2.5 py-1 rounded-lg">{ep.method}</span>
                    <code className="text-sm text-gray-800 font-mono flex-1 overflow-x-auto">{ep.path}</code>
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-gray-600">{ep.desc}</p>
                    <div className="relative">
                      <pre className="text-xs bg-gray-900 text-gray-300 rounded-xl p-3 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                        {JSON.stringify(JSON.parse(ep.sample), null, 2)}
                      </pre>
                      <button onClick={() => copy(ep.sample, i)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">
                        {copiedIdx === i ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 card p-4 bg-gray-900 border-0">
              <p className="text-xs text-gray-400 mb-2 font-mono">Authentication:</p>
              <code className="text-xs text-teal-300">curl -H "X-Api-Key: cm_your_api_key" \</code><br />
              <code className="text-xs text-teal-300">  https://api.clearmed.online/api/b2b/costs/knee-replacement/Delhi</code>
            </div>
          </section>

          {/* Access form */}
          <section id="access">
            <div className="card p-6 sm:p-8 max-w-lg mx-auto">
              {submitted ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Request Received!</h3>
                  <p className="text-sm text-gray-600">Our team will review your application and send your API key to <strong>{form.email}</strong> within 1 business day.</p>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Request API Access</h2>
                  <p className="text-sm text-gray-500 mb-5">Our team will review and provision your API key within 24 hours.</p>
                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    <input required placeholder="Your name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input w-full text-sm" />
                    <input required placeholder="Organisation name *" value={form.orgName} onChange={e => setForm(p => ({ ...p, orgName: e.target.value }))} className="input w-full text-sm" />
                    <input required type="email" placeholder="Work email *" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input w-full text-sm" />
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Plan</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['STARTER', 'PROFESSIONAL', 'ENTERPRISE'].map(p => (
                          <button type="button" key={p} onClick={() => setForm(prev => ({ ...prev, plan: p }))}
                            className={`py-2 rounded-xl border-2 text-xs font-medium transition-all ${form.plan === p ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                            {p.charAt(0) + p.slice(1).toLowerCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full justify-center">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                      {loading ? 'Submitting...' : 'Request Access'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
