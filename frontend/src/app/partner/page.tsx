'use client';
import { useState, useEffect } from 'react';
import { Building2, CheckCircle, Users, BarChart3, MessageSquare, TrendingUp, Loader2, ArrowRight, Star, Shield, Zap, Phone, Mail, Eye, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const isL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API = isL ? `http://${window.location.hostname}:4000/api` : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');

interface DashboardData {
  partner: { id: string; plan: string; isVerified: boolean; status: string; hospital: { name: string; city: string; rating?: number; _count: { bills: number; feedback: number } } };
  stats: { totalEnquiries: number; newEnquiries: number; profileViews: number; verifiedBills: number };
  recentEnquiries: Array<{ id: string; patientName?: string; phone?: string; email?: string; message?: string; status: string; createdAt: string; treatment?: { name: string } }>;
  planFeatures: { slots: number; quota: number };
}

const STATUS_COLOR: Record<string, string> = {
  NEW: 'badge-blue', CONTACTED: 'badge-amber', CONVERTED: 'badge-green', CLOSED: 'badge-gray',
};

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  FREE_TIER: { label: 'Basic', color: 'text-gray-600 bg-gray-100' },
  PRO: { label: 'Pro', color: 'text-brand-700 bg-brand-100' },
  ENTERPRISE: { label: 'Enterprise', color: 'text-purple-700 bg-purple-100' },
};

export default function PartnerPage() {
  const [token, setToken] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('clearmed_partner_token') || '' : '');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'landing' | 'signup' | 'dashboard'>('landing');

  const [form, setForm] = useState({ hospitalId: '', plan: 'FREE_TIER', contactName: '', contactEmail: '', contactPhone: '' });
  const [hospitals, setHospitals] = useState<Array<{ id: string; name: string; city: string }>>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  useEffect(() => {
    fetch(`${API}/hospitals?limit=50`).then(r => r.json()).then(d => setHospitals(d.data || []));
    if (token) { loadDashboard(token); setView('dashboard'); }
  }, []);

  const loadDashboard = async (t: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/partners/dashboard/${t}`);
      const data = await res.json();
      if (data.data) { setDashboard(data.data); setView('dashboard'); }
      else { localStorage.removeItem('clearmed_partner_token'); setToken(''); setView('landing'); }
    } catch {} finally { setLoading(false); }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true); setSubmitMsg('');
    try {
      const res = await fetch(`${API}/partners/apply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.data?.analyticsToken) {
        localStorage.setItem('clearmed_partner_token', data.data.analyticsToken);
        setToken(data.data.analyticsToken);
        loadDashboard(data.data.analyticsToken);
      } else {
        setSubmitMsg(data.message || data.error || 'Something went wrong');
      }
    } catch { setSubmitMsg('Connection error'); } finally { setSubmitLoading(false); }
  };

  const markEnquiry = async (id: string, status: string) => {
    await fetch(`${API}/partners/enquiry/${id}?token=${token}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    loadDashboard(token);
  };

  if (view === 'dashboard' && dashboard) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-20 lg:pb-0">
        {/* Partner header */}
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-brand-100 text-brand-700 rounded-xl flex items-center justify-center font-bold text-lg">
                {dashboard.partner.hospital.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-gray-900 text-sm">{dashboard.partner.hospital.name}</p>
                  {dashboard.partner.isVerified && <span className="badge badge-green text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3"/>Verified</span>}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_LABELS[dashboard.partner.plan]?.color || ''}`}>{PLAN_LABELS[dashboard.partner.plan]?.label}</span>
                </div>
                <p className="text-xs text-gray-400">{dashboard.partner.hospital.city}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => loadDashboard(token)} className="btn btn-secondary btn-sm"><RefreshCw className="w-3.5 h-3.5"/></button>
              <Link href="/pricing" className="btn btn-primary btn-sm text-xs">Upgrade Plan</Link>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'New Enquiries', value: dashboard.stats.newEnquiries, icon: <MessageSquare className="w-4 h-4 text-brand-500"/>, highlight: dashboard.stats.newEnquiries > 0 },
              { label: 'Total Enquiries', value: dashboard.stats.totalEnquiries, icon: <Users className="w-4 h-4 text-purple-500"/>, highlight: false },
              { label: 'Profile Views', value: dashboard.stats.profileViews, icon: <Eye className="w-4 h-4 text-teal-500"/>, highlight: false },
              { label: 'Verified Bills', value: dashboard.stats.verifiedBills, icon: <CheckCircle className="w-4 h-4 text-emerald-500"/>, highlight: false },
            ].map(kpi => (
              <div key={kpi.label} className={`card p-4 ${kpi.highlight ? 'ring-2 ring-brand-300 bg-brand-50' : ''}`}>
                <div className="flex items-center gap-2 mb-1">{kpi.icon}<span className="text-xs text-gray-500">{kpi.label}</span></div>
                <p className={`text-2xl font-black ${kpi.highlight ? 'text-brand-700' : 'text-gray-900'}`}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Enquiries */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Patient Enquiries</h3>
              {dashboard.stats.newEnquiries > 0 && (
                <span className="badge badge-blue text-xs">{dashboard.stats.newEnquiries} new</span>
              )}
            </div>
            {dashboard.recentEnquiries.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2"/>
                <p className="text-sm text-gray-400">No enquiries yet</p>
                <p className="text-xs text-gray-300 mt-1">Upgrade to Pro to start receiving patient leads</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {dashboard.recentEnquiries.map(enq => (
                  <div key={enq.id} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{enq.patientName || 'Anonymous Patient'}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                          {enq.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/>{enq.phone}</span>}
                          {enq.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3"/>{enq.email}</span>}
                          {enq.treatment && <span className="text-brand-600">{enq.treatment.name}</span>}
                        </div>
                      </div>
                      <span className={`badge text-xs ${STATUS_COLOR[enq.status] || 'badge-gray'}`}>{enq.status}</span>
                    </div>
                    {enq.message && <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 mb-2">{enq.message}</p>}
                    {enq.status === 'NEW' && (
                      <div className="flex gap-2">
                        <button onClick={() => markEnquiry(enq.id, 'CONTACTED')} className="btn btn-primary btn-sm text-xs">Mark Contacted</button>
                        <button onClick={() => markEnquiry(enq.id, 'CONVERTED')} className="btn btn-secondary btn-sm text-xs">Converted ✓</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Plan info */}
          <div className="card p-5 bg-gradient-to-r from-brand-50 to-teal-50 border-brand-100">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-bold text-brand-900 text-sm">Current Plan: {PLAN_LABELS[dashboard.partner.plan]?.label}</p>
                <p className="text-xs text-brand-700 mt-0.5">
                  {dashboard.planFeatures.slots > 0 ? `${dashboard.planFeatures.slots} sponsored slots` : 'No sponsored placement'}
                  {' · '}
                  {dashboard.planFeatures.quota > 0 ? `${dashboard.planFeatures.quota} enquiries/month` : 'Upgrade for patient leads'}
                </p>
              </div>
              <Link href="/pricing" className="btn btn-primary btn-sm text-xs shrink-0">
                <Zap className="w-3.5 h-3.5"/> Upgrade
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (view === 'signup') return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 max-w-lg mx-auto px-4 py-10">
        <button onClick={() => setView('landing')} className="text-sm text-gray-500 hover:text-brand-600 mb-6 flex items-center gap-1.5">← Back</button>
        <div className="card p-6 sm:p-8">
          <div className="w-12 h-12 bg-brand-100 rounded-2xl flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-brand-600"/>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Join ClearMed Partner Program</h2>
          <p className="text-sm text-gray-500 mb-6">Get verified, receive patient leads, track your performance.</p>

          {submitMsg && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm text-amber-800">{submitMsg}</div>
          )}

          <form onSubmit={handleApply} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Your Hospital *</label>
              <select required value={form.hospitalId} onChange={e => setForm(p => ({ ...p, hospitalId: e.target.value }))} className="input w-full text-sm cursor-pointer">
                <option value="">Select hospital...</option>
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.name} — {h.city}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Plan</label>
              <div className="grid grid-cols-3 gap-2">
                {[{id:'FREE_TIER',label:'Basic',price:'Free'},{id:'PRO',label:'Pro',price:'₹4,999/mo'},{id:'ENTERPRISE',label:'Enterprise',price:'₹14,999/mo'}].map(p=>(
                  <button type="button" key={p.id} onClick={() => setForm(prev=>({...prev,plan:p.id}))}
                    className={`p-2.5 rounded-xl border-2 text-xs font-medium transition-all ${form.plan===p.id?'border-brand-500 bg-brand-50 text-brand-700':'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <p className="font-bold">{p.label}</p><p className="opacity-70">{p.price}</p>
                  </button>
                ))}
              </div>
            </div>
            <input required placeholder="Contact person name *" value={form.contactName} onChange={e => setForm(p=>({...p,contactName:e.target.value}))} className="input w-full text-sm"/>
            <input required type="email" placeholder="Contact email *" value={form.contactEmail} onChange={e => setForm(p=>({...p,contactEmail:e.target.value}))} className="input w-full text-sm"/>
            <input placeholder="Phone (optional)" value={form.contactPhone} onChange={e => setForm(p=>({...p,contactPhone:e.target.value}))} className="input w-full text-sm"/>
            <button type="submit" disabled={submitLoading} className="btn btn-primary btn-lg w-full justify-center">
              {submitLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <CheckCircle className="w-5 h-5"/>}
              {submitLoading ? 'Submitting...' : form.plan==='FREE_TIER' ? 'List My Hospital Free' : 'Apply for Partnership'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  // Landing
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-20 lg:pb-0">
        <div className="hero-gradient py-14 sm:py-20 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 badge bg-white/15 text-white border border-white/20 mb-4">
              <Star className="w-3.5 h-3.5 text-yellow-300"/> Hospital Partner Program
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Get Verified. Get Patients.</h1>
            <p className="text-white/75 text-lg mb-8">Join India's fastest-growing healthcare cost transparency platform and connect with patients actively researching your treatments.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => setView('signup')} className="btn bg-white text-brand-700 hover:bg-brand-50 btn-lg font-bold">
                <Building2 className="w-5 h-5"/> List Your Hospital Free
              </button>
              <Link href="/pricing" className="btn border-2 border-white/40 text-white hover:bg-white/10 btn-lg">View Pricing</Link>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon:<Users className="w-7 h-7 text-brand-500"/>, bg:'bg-brand-50', title:'Patient Leads', desc:'Receive direct enquiries from high-intent patients researching your treatments.' },
              { icon:<BarChart3 className="w-7 h-7 text-purple-500"/>, bg:'bg-purple-50', title:'Analytics Dashboard', desc:'Track profile views, comparison appearances, and enquiry conversion rates.' },
              { icon:<Shield className="w-7 h-7 text-emerald-500"/>, bg:'bg-emerald-50', title:'Verified Badge', desc:'Build trust with patients using our independently verified hospital badge.' },
            ].map(f => (
              <div key={f.title} className={`card p-5 ${f.bg} border-0`}>
                <div className="mb-3">{f.icon}</div>
                <p className="font-bold text-gray-900 mb-1">{f.title}</p>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button onClick={() => setView('signup')} className="btn btn-primary btn-lg">
              Get Started <ArrowRight className="w-5 h-5"/>
            </button>
            <p className="text-xs text-gray-400 mt-3">Free tier available · No credit card required</p>
          </div>
        </div>
      </div>
    </div>
  );
}
