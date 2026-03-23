'use client';
import { useState, useEffect } from 'react';
import { BarChart3, Users, FileText, Star, AlertCircle, Clock, TrendingUp, RefreshCw, Loader2, CheckCircle, XCircle, Eye, Shield, Download } from 'lucide-react';
import Navbar from '@/components/Navbar';

const isL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API = isL ? `http://${window.location.hostname}:4000/api` : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');

interface Analytics {
  bills: { total: number; last7d: number; last30d: number; pending: number; verified: number; rejected: number; ocrReview: number };
  users: { total: number; last7d: number; last30d: number };
  reviews: { total: number; last7d: number };
  symptoms: { last7d: number };
  moderation: { abuseReportsOpen: number; erasurePending: number };
  charts: {
    billsByCity: Array<{ city: string; _count: { id: number } }>;
    billsByStatus: Record<string, number>;
    dailyBills: Array<{ date: string; count: number }>;
  };
}

interface AuditEntry { id: string; action: string; entity: string; description: string; createdAt: string; admin?: { name: string; role: string } }

// Tiny inline bar
function MiniBar({ value, max, color = 'bg-brand-400' }: { value: number; max: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-8 text-right">{value}</span>
    </div>
  );
}

// Inline sparkline
function Sparkline({ data }: { data: number[] }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const W = 80; const H = 28; const points = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * W},${H - (v / max) * H}`).join(' ');
  return (
    <svg width={W} height={H} className="opacity-60">
      <polyline points={points} fill="none" stroke="#0e87ef" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [token, setToken] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '', totp: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'overview' | 'audit' | 'moderation'>('overview');

  useEffect(() => {
    const saved = sessionStorage.getItem('clearmed_admin_token');
    if (saved) { setToken(saved); loadData(saved); }
  }, []);

  const login = async () => {
    setLoginLoading(true); setLoginError('');
    try {
      const res = await fetch(`${API}/admin/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: loginForm.email, password: loginForm.password, totpToken: loginForm.totp || undefined }) });
      const data = await res.json();
      if (data.token) { setToken(data.token); sessionStorage.setItem('clearmed_admin_token', data.token); loadData(data.token); }
      else setLoginError(data.error || 'Login failed');
    } catch { setLoginError('Connection error'); } finally { setLoginLoading(false); }
  };

  const loadData = async (t: string) => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${t}` };
    try {
      const [aRes, auditRes] = await Promise.all([
        fetch(`${API}/admin/ops/analytics`, { headers }),
        fetch(`${API}/admin/ops/audit?limit=15`, { headers }),
      ]);
      const [aData, auditData] = await Promise.all([aRes.json(), auditRes.json()]);
      if (aData.data) setAnalytics(aData.data);
      if (auditData.data) setAudit(auditData.data);
    } catch {} finally { setLoading(false); }
  };

  if (!token) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 flex items-center justify-center min-h-[80vh] px-4">
        <div className="card p-8 max-w-sm w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center"><Shield className="w-5 h-5 text-white"/></div>
            <div><p className="font-bold text-gray-900">Admin Login</p><p className="text-xs text-gray-500">ClearMed Operations</p></div>
          </div>
          {loginError && <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4"/>{loginError}</div>}
          <div className="space-y-3">
            <input type="email" placeholder="Admin email" value={loginForm.email} onChange={e => setLoginForm(p=>({...p,email:e.target.value}))} className="input w-full text-sm"/>
            <input type="password" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm(p=>({...p,password:e.target.value}))} className="input w-full text-sm"/>
            <input placeholder="2FA code (if enabled)" maxLength={6} value={loginForm.totp} onChange={e => setLoginForm(p=>({...p,totp:e.target.value}))} className="input w-full text-sm"/>
            <button onClick={login} disabled={loginLoading} className="btn btn-primary btn-md w-full justify-center">
              {loginLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Shield className="w-4 h-4"/>}
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
          <p className="text-xs text-center text-gray-400 mt-4">Seed admin: npm run seed:admin</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-20 lg:pb-0">
        <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-1">
                {[{id:'overview',label:'Overview'},{id:'audit',label:'Audit Log'},{id:'moderation',label:'Moderation'}].map(t=>(
                  <button key={t.id} onClick={()=>setTab(t.id as any)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab===t.id?'bg-brand-50 text-brand-700':'text-gray-600 hover:bg-gray-50'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => loadData(token)} className="btn btn-secondary btn-sm"><RefreshCw className="w-3.5 h-3.5"/>Refresh</button>
                <button onClick={() => { setToken(''); sessionStorage.removeItem('clearmed_admin_token'); }} className="btn btn-secondary btn-sm text-red-600">Logout</button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading && <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-brand-400 animate-spin"/></div>}

          {!loading && analytics && tab === 'overview' && (
            <div className="space-y-6">
              {/* KPI row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label:'Total Bills', value:analytics.bills.total, sub:`+${analytics.bills.last7d} this week`, icon:<FileText className="w-5 h-5 text-brand-500"/>, trend: analytics.charts.dailyBills.map(d=>d.count) },
                  { label:'Users', value:analytics.users.total, sub:`+${analytics.users.last7d} this week`, icon:<Users className="w-5 h-5 text-purple-500"/>, trend:[] },
                  { label:'Reviews', value:analytics.reviews.total, sub:`+${analytics.reviews.last7d} this week`, icon:<Star className="w-5 h-5 text-amber-500"/>, trend:[] },
                  { label:'Symptom Searches', value:analytics.symptoms.last7d, sub:'last 7 days', icon:<BarChart3 className="w-5 h-5 text-teal-500"/>, trend:[] },
                ].map(kpi=>(
                  <div key={kpi.label} className="card p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center">{kpi.icon}</div>
                      {kpi.trend.length>0 && <Sparkline data={kpi.trend}/>}
                    </div>
                    <p className="text-2xl font-black text-gray-900">{kpi.value.toLocaleString('en-IN')}</p>
                    <p className="text-xs font-medium text-gray-500 mt-0.5">{kpi.label}</p>
                    <p className="text-xs text-emerald-600 mt-1">{kpi.sub}</p>
                  </div>
                ))}
              </div>

              {/* Alert badges */}
              {(analytics.moderation.abuseReportsOpen > 0 || analytics.moderation.erasurePending > 0) && (
                <div className="flex gap-3 flex-wrap">
                  {analytics.moderation.abuseReportsOpen > 0 && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                      <AlertCircle className="w-4 h-4 text-red-500"/>
                      <span className="text-sm text-red-700 font-medium">{analytics.moderation.abuseReportsOpen} open abuse report{analytics.moderation.abuseReportsOpen !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {analytics.moderation.erasurePending > 0 && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                      <Shield className="w-4 h-4 text-amber-500"/>
                      <span className="text-sm text-amber-700 font-medium">{analytics.moderation.erasurePending} pending erasure request{analytics.moderation.erasurePending !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-6">
                {/* Bill status breakdown */}
                <div className="card p-5">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-brand-500"/>Bills by Status</h3>
                  <div className="space-y-3">
                    {[
                      { label:'Verified', value: analytics.bills.verified, color: 'bg-emerald-400' },
                      { label:'OCR Review', value: analytics.bills.ocrReview, color: 'bg-amber-400' },
                      { label:'Pending', value: analytics.bills.pending, color: 'bg-blue-400' },
                      { label:'Rejected', value: analytics.bills.rejected, color: 'bg-red-400' },
                    ].map(s=>(
                      <div key={s.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">{s.label}</span>
                        </div>
                        <MiniBar value={s.value} max={analytics.bills.total} color={s.color}/>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bills by city */}
                <div className="card p-5">
                  <h3 className="font-bold text-gray-900 mb-4">Bills by City</h3>
                  <div className="space-y-3">
                    {analytics.charts.billsByCity.map(c=>(
                      <div key={c.city}>
                        <div className="flex justify-between text-xs mb-1"><span className="text-gray-600">{c.city}</span></div>
                        <MiniBar value={c._count.id} max={Math.max(...analytics.charts.billsByCity.map(x=>x._count.id))} color="bg-brand-400"/>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && tab === 'audit' && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Audit Log</h3>
                <p className="text-xs text-gray-500 mt-0.5">All admin actions — tracked and immutable</p>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{['Time','Admin','Action','Entity','Description'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {audit.map(a=>(
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(a.createdAt).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'})}</td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-700">{a.admin?.name || '—'}</td>
                      <td className="px-4 py-3"><span className={`badge text-xs ${a.action==='APPROVE'?'badge-green':a.action==='REJECT'?'badge-red':a.action==='DATA_ERASURE'?'badge-amber':'badge-blue'}`}>{a.action}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{a.entity}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">{a.description}</td>
                    </tr>
                  ))}
                  {audit.length===0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">No audit logs yet</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {!loading && tab === 'moderation' && (
            <div className="space-y-5">
              <div className="card p-8 text-center">
                <Shield className="w-10 h-10 text-brand-300 mx-auto mb-3"/>
                <p className="text-gray-600 font-medium">Moderation Queue</p>
                <p className="text-sm text-gray-400 mt-1">Abuse reports and erasure requests managed via admin API.</p>
                <div className="flex gap-3 justify-center mt-4">
                  <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-center">
                    <p className="text-2xl font-black text-red-600">{analytics?.moderation.abuseReportsOpen ?? 0}</p>
                    <p className="text-xs text-red-700">Open Reports</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-center">
                    <p className="text-2xl font-black text-amber-600">{analytics?.moderation.erasurePending ?? 0}</p>
                    <p className="text-xs text-amber-700">Erasure Pending</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
