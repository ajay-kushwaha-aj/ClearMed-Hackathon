'use client';
import { useState } from 'react';
import { CheckCircle, X, Star, Building2, BarChart3, Zap, ArrowRight, MessageSquare, Shield, Users } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const PLANS = [
  {
    id: 'FREE_TIER',
    name: 'Basic',
    price: 0,
    period: 'Free forever',
    tagline: 'Get your hospital listed',
    color: 'from-gray-50 to-gray-100',
    border: 'border-gray-200',
    badge: null,
    cta: 'List Your Hospital',
    ctaStyle: 'btn-secondary',
    features: [
      { text: 'Verified Hospital Badge', yes: true },
      { text: 'Basic profile listing', yes: true },
      { text: 'Public cost data display', yes: true },
      { text: 'Patient reviews visible', yes: true },
      { text: 'Sponsored search placement', yes: false },
      { text: 'Patient enquiry leads', yes: false },
      { text: 'Analytics dashboard', yes: false },
      { text: 'Dedicated account manager', yes: false },
    ],
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 4999,
    period: 'per month',
    tagline: 'Grow your patient pipeline',
    color: 'from-brand-600 to-brand-800',
    border: 'border-brand-500',
    badge: 'Most Popular',
    cta: 'Start Pro Trial',
    ctaStyle: 'bg-white text-brand-700 hover:bg-brand-50',
    features: [
      { text: 'Verified Hospital Badge', yes: true },
      { text: 'Enhanced profile listing', yes: true },
      { text: 'Public cost data display', yes: true },
      { text: 'Patient reviews visible', yes: true },
      { text: 'Sponsored placement (3 slots)', yes: true },
      { text: 'Patient enquiry leads (500/mo)', yes: true },
      { text: 'Analytics dashboard', yes: true },
      { text: 'Dedicated account manager', yes: false },
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 14999,
    period: 'per month',
    tagline: 'Full partnership & analytics',
    color: 'from-slate-800 to-slate-900',
    border: 'border-slate-600',
    badge: 'Best Value',
    cta: 'Contact Sales',
    ctaStyle: 'bg-amber-400 text-slate-900 hover:bg-amber-300',
    features: [
      { text: 'Verified Hospital Badge', yes: true },
      { text: 'Priority profile listing', yes: true },
      { text: 'Public cost data display', yes: true },
      { text: 'Patient reviews visible', yes: true },
      { text: 'Sponsored placement (10 slots)', yes: true },
      { text: 'Unlimited patient enquiry leads', yes: true },
      { text: 'Advanced analytics dashboard', yes: true },
      { text: 'Dedicated account manager', yes: true },
    ],
  },
];

const B2B_PLANS = [
  { name: 'Starter', price: 5000, quota: '1,000', target: 'Startups & researchers', color: 'bg-teal-50 border-teal-200', badge: null },
  { name: 'Professional', price: 20000, quota: '10,000', target: 'Insurance companies & TPAs', color: 'bg-brand-50 border-brand-200', badge: 'Popular' },
  { name: 'Enterprise', price: 50000, quota: '1,00,000', target: 'Hospital chains & NHA', color: 'bg-purple-50 border-purple-200', badge: null },
];

const STATS = [
  { icon: '🏥', value: '28+', label: 'Listed Hospitals' },
  { icon: '🧾', value: '500+', label: 'Verified Bills' },
  { icon: '👥', value: '10K+', label: 'Monthly Users' },
  { icon: '📍', value: '3', label: 'Cities (Growing)' },
];

export default function PricingPage() {
  const [tab, setTab] = useState<'hospital' | 'api'>('hospital');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-20 lg:pb-0">
        {/* Hero */}
        <div className="hero-gradient py-12 sm:py-16 text-center px-4">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 badge bg-white/15 text-white border border-white/20 mb-4">
              <Zap className="w-3.5 h-3.5 text-amber-300" /> Simple, transparent pricing
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Grow with ClearMed
            </h1>
            <p className="text-white/70 text-lg">
              Partner with India's fastest-growing healthcare cost transparency platform.
            </p>
          </div>
        </div>

        {/* Tab selector */}
        <div className="flex justify-center px-4 py-6">
          <div className="bg-white rounded-2xl p-1 border border-gray-200 flex gap-1 shadow-sm">
            <button onClick={() => setTab('hospital')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'hospital' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Building2 className="w-4 h-4" /> Hospital Partners
            </button>
            <button onClick={() => setTab('api')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'api' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
              <BarChart3 className="w-4 h-4" /> Data API
            </button>
          </div>
        </div>

        {/* ── Hospital Plans ── */}
        {tab === 'hospital' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
              {STATS.map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                  <p className="text-2xl mb-1">{s.icon}</p>
                  <p className="text-xl font-black text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Plan cards */}
            <div className="grid sm:grid-cols-3 gap-4 mb-12">
              {PLANS.map(plan => {
                const isHighlight = plan.id !== 'FREE_TIER';
                return (
                  <div key={plan.id}
                    className={`relative rounded-3xl overflow-hidden ${isHighlight ? `bg-gradient-to-br ${plan.color} text-white` : 'bg-white border border-gray-200'}`}>
                    {plan.badge && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full">{plan.badge}</span>
                      </div>
                    )}
                    <div className="p-6">
                      <p className={`text-sm font-semibold mb-0.5 ${isHighlight ? 'text-white/60' : 'text-gray-400'}`}>{plan.tagline}</p>
                      <h3 className={`text-xl font-bold mb-3 ${isHighlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                      <div className="mb-5">
                        {plan.price === 0 ? (
                          <p className={`text-3xl font-black ${isHighlight ? 'text-white' : 'text-gray-900'}`}>Free</p>
                        ) : (
                          <div>
                            <span className={`text-3xl font-black ${isHighlight ? 'text-white' : 'text-gray-900'}`}>₹{plan.price.toLocaleString('en-IN')}</span>
                            <span className={`text-sm ml-1 ${isHighlight ? 'text-white/60' : 'text-gray-400'}`}>/month</span>
                          </div>
                        )}
                      </div>

                      <Link href="/partner"
                        className={`btn btn-md w-full justify-center mb-5 text-sm font-semibold ${isHighlight ? plan.ctaStyle : 'btn-primary'}`}>
                        {plan.cta} <ArrowRight className="w-4 h-4" />
                      </Link>

                      <div className="space-y-2.5">
                        {plan.features.map(f => (
                          <div key={f.text} className="flex items-center gap-2.5">
                            {f.yes
                              ? <CheckCircle className={`w-4 h-4 shrink-0 ${isHighlight ? 'text-teal-300' : 'text-emerald-500'}`} />
                              : <X className={`w-4 h-4 shrink-0 ${isHighlight ? 'text-white/30' : 'text-gray-300'}`} />}
                            <span className={`text-sm ${f.yes ? (isHighlight ? 'text-white/90' : 'text-gray-700') : (isHighlight ? 'text-white/30' : 'text-gray-300')}`}>{f.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Why partner */}
            <div className="card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Why hospitals partner with ClearMed</h2>
              <div className="grid sm:grid-cols-3 gap-5">
                {[
                  { icon: <Users className="w-6 h-6 text-brand-500"/>, title: 'Qualified Patient Leads', desc: 'Receive enquiries from patients already researching your treatments — higher intent than generic ads.' },
                  { icon: <Shield className="w-6 h-6 text-emerald-500"/>, title: 'Build Trust with Transparency', desc: 'Hospitals with Verified badges and visible cost data get 3× more profile views than unverified competitors.' },
                  { icon: <BarChart3 className="w-6 h-6 text-purple-500"/>, title: 'Competitive Intelligence', desc: 'See exactly how your costs compare to competing hospitals in your city with live market data.' },
                ].map(f => (
                  <div key={f.title} className="text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">{f.icon}</div>
                    <p className="font-semibold text-gray-900 text-sm mb-1">{f.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── B2B API Plans ── */}
        {tab === 'api' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <div className="text-center mb-8">
              <p className="text-gray-600 max-w-xl mx-auto text-sm leading-relaxed">
                Access anonymized, aggregated healthcare cost and outcome data via REST API. Built for health insurers, TPAs, hospital consultants, and policy researchers.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              {B2B_PLANS.map(plan => (
                <div key={plan.name} className={`card p-5 ${plan.color} border relative`}>
                  {plan.badge && <span className="absolute top-3 right-3 bg-brand-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{plan.badge}</span>}
                  <h3 className="font-bold text-gray-900 text-lg mb-0.5">{plan.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{plan.target}</p>
                  <p className="text-2xl font-black text-gray-900">₹{plan.price.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-400 mb-4">/month</p>
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-brand-500" />
                    <span className="text-sm font-semibold text-gray-700">{plan.quota} API calls/month</span>
                  </div>
                  <Link href="/b2b" className="btn btn-primary btn-sm w-full justify-center text-xs">
                    Get API Access <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>

            {/* API endpoints preview */}
            <div className="card p-5 bg-gray-900 border-0">
              <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Sample API Endpoints</p>
              <div className="space-y-2.5 font-mono">
                {[
                  { method: 'GET', path: '/api/b2b/costs/knee-replacement/Delhi', desc: 'Cost percentile stats' },
                  { method: 'GET', path: '/api/b2b/outcomes/:hospitalId/:treatmentId', desc: 'ClearMed Score data' },
                  { method: 'GET', path: '/api/b2b/bulk/costs?city=Mumbai', desc: 'Bulk cost export (Pro+)' },
                ].map(e => (
                  <div key={e.path} className="flex items-start gap-3">
                    <span className="text-xs bg-teal-900 text-teal-300 px-2 py-0.5 rounded shrink-0 mt-0.5">{e.method}</span>
                    <div>
                      <code className="text-xs text-white">{e.path}</code>
                      <p className="text-xs text-gray-500 mt-0.5">{e.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/b2b" className="mt-4 btn bg-teal-600 hover:bg-teal-500 text-white btn-sm inline-flex items-center gap-2">
                View Full API Docs <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="bg-white py-12 px-4 border-t border-gray-100">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 text-center mb-6">Common Questions</h2>
            <div className="space-y-3">
              {[
                { q: 'Is there a free trial for Pro?', a: 'Yes — Pro plan comes with a 14-day free trial. No credit card required.' },
                { q: 'Can I cancel anytime?', a: 'Yes. Cancel anytime from your partner dashboard. No lock-in period.' },
                { q: 'How are patient enquiries routed?', a: 'Enquiries are sent directly to your registered email and WhatsApp number within minutes of submission.' },
                { q: 'What data does the API return?', a: 'Anonymized, aggregated cost statistics (percentiles, averages) and ClearMed Scores. No patient-identifying data is ever exposed.' },
              ].map(item => (
                <details key={item.q} className="card p-4 cursor-pointer group">
                  <summary className="flex items-center justify-between font-semibold text-gray-900 text-sm list-none">
                    {item.q}
                    <ArrowRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform shrink-0 ml-3" />
                  </summary>
                  <p className="text-sm text-gray-600 mt-3 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
            <div className="text-center mt-6">
              <p className="text-sm text-gray-500">Have more questions? <a href="mailto:partners@clearmed.in" className="text-brand-600 font-medium hover:underline">partners@clearmed.in</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
