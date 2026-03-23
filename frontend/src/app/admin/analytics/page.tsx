'use client';
import { useState, useEffect } from 'react';
import { BarChart3, Users, FileText, Star, AlertCircle, Clock, TrendingUp, RefreshCw, Loader2, CheckCircle, XCircle, Eye, Shield, Download } from 'lucide-react';
import Navbar from '@/components/Navbar';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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
  const [tab, setTab] = useState<'overview' | 'audit' | 'moderation' | 'verification'>('overview');

  // Verification tab state
  const [bills, setBills] = useState<any[]>([]);
  const [selectedBill, setSelectedBill] = useState<any | null>(null);
  const [confirmAction, setConfirmAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [processingSubmit, setProcessingSubmit] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('clearmed_admin_token');
    if (saved) { setToken(saved); loadData(saved); }
  }, []);
  useEffect(() => {
    if (tab === 'verification' && token) loadBills();
  }, [tab, token]);
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
  const loadBills = async () => {
    try {
      const res = await fetch(`${API}/admin/ops/bills?status=BILL_PENDING,BILL_OCR_REVIEW`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.data) setBills(data.data);
    } catch {}
  };

  const handleVerify = async () => {
    if (!selectedBill || !confirmAction) return;
    setProcessingSubmit(true);
    try {
      const res = await fetch(`${API}/admin/ops/bills/${selectedBill.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: confirmAction, notes: actionNotes })
      });
      if (res.ok) {
        setBills(b => b.filter(x => x.id !== selectedBill.id));
        setConfirmAction(null);
        setSelectedBill(null);
        setActionNotes('');
        loadData(token); // refresh analytics
      }
    } catch {} finally { setProcessingSubmit(false); }
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
                {[{id:'overview',label:'Overview'},{id:'verification',label:'Bill Verification'},{id:'audit',label:'Audit Log'},{id:'moderation',label:'Moderation'}].map(t=>(
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
          {!loading && tab === 'verification' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Pending Bill Verifications</h2>
                  <p className="text-sm text-gray-500">Review user uploaded bills against OCR extraction to verify data authenticity.</p>
                </div>
              </div>

              {bills.length === 0 ? (
                <div className="card p-12 text-center text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-400 opacity-50" />
                  <p className="font-medium text-gray-600">All caught up!</p>
                  <p className="text-sm">There are no pending bills waiting for verification.</p>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* List */}
                  <div className="card overflow-hidden h-[600px] flex flex-col">
                    <div className="overflow-y-auto p-4 space-y-3">
                      {bills.map(b => (
                        <div key={b.id} onClick={() => setSelectedBill(b)}
                          className={`p-4 rounded-xl border cursor-pointer transition-colors ${selectedBill?.id === b.id ? 'bg-brand-50 border-brand-300' : 'bg-white border-gray-100 hover:border-brand-200'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold text-gray-900">{b.hospital?.name || 'Unknown'}</p>
                              <p className="text-xs text-brand-600 font-medium">{b.treatment?.name || 'Unknown'}</p>
                            </div>
                            <span className="font-bold text-gray-900">₹{b.totalCost}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{new Date(b.createdAt).toLocaleDateString('en-IN')} · {b.city}</span>
                            <span className={`px-2 py-0.5 rounded-full font-medium ${b.ocrResult ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                              {b.ocrResult ? 'AI Processed' : 'Manual'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Details Panel */}
                  {selectedBill && (
                    <div className="card p-6 h-[600px] overflow-y-auto relative flex flex-col">
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                        <h3 className="font-bold text-lg text-gray-900">Bill Details</h3>
                        <button onClick={() => setSelectedBill(null)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-5 h-5"/></button>
                      </div>

                      <div className="space-y-6 flex-1">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 mb-1">Hospital</p>
                            <p className="font-medium text-gray-900">{selectedBill.hospital?.name}</p>
                            <p className="text-xs text-gray-500">{selectedBill.city}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Treatment</p>
                            <p className="font-medium text-gray-900">{selectedBill.treatment?.name}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Dates</p>
                            <p className="font-medium text-gray-900">{selectedBill.admissionDate ? new Date(selectedBill.admissionDate).toLocaleDateString('en-IN') : 'N/A'} - {selectedBill.dischargeDate ? new Date(selectedBill.dischargeDate).toLocaleDateString('en-IN') : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Uploader</p>
                            <p className="font-medium text-gray-900">{selectedBill.user?.name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-500">{selectedBill.user?.email}</p>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4">
                          <h4 className="font-bold text-gray-900 mb-3 text-sm">Cost Breakdown</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-500">Room Charges</span><span className="font-medium">₹{selectedBill.roomCharges || 0}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Surgery Fee</span><span className="font-medium">₹{selectedBill.surgeryFee || 0}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Implant Cost</span><span className="font-medium">₹{selectedBill.implantCost || 0}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Pharmacy Cost</span><span className="font-medium">₹{selectedBill.pharmacyCost || 0}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Pathology/Radiology</span><span className="font-medium">₹{(selectedBill.pathologyCost||0) + (selectedBill.radiologyCost||0)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Taxes & Other</span><span className="font-medium">₹{(selectedBill.gst||0) + (selectedBill.otherCharges||0)}</span></div>
                            <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between font-bold text-brand-800">
                              <span>Total Uploaded Cost</span><span>₹{selectedBill.totalCost}</span>
                            </div>
                          </div>
                        </div>

                        {selectedBill.fileUrl && (
                          <div>
                            <a href={selectedBill.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 bg-brand-50 p-3 rounded-xl justify-center font-medium transition-colors">
                              <Eye className="w-4 h-4" /> View Original Document
                            </a>
                          </div>
                        )}
                        
                        {selectedBill.ocrResult && (
                          <div className="text-xs text-gray-500 bg-blue-50 border border-blue-100 p-3 rounded-xl flex gap-3">
                             <CheckCircle className="w-5 h-5 text-blue-500 shrink-0"/>
                             <div>
                              <p className="font-bold text-blue-800 mb-0.5">AI OCR Extraction info</p>
                              <p>Confidence: {(selectedBill.ocrResult.confidence * 100).toFixed(1)}%</p>
                              <p className="mt-1 opacity-75">Extracted data matches with the entered form fields as verified by the internal system. Look out for any stark anomalies.</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex gap-3 mt-4">
                        <button onClick={() => setConfirmAction('REJECT')} className="flex-1 btn bg-red-50 text-red-600 hover:bg-red-100 border border-red-200">Reject</button>
                        <button onClick={() => setConfirmAction('APPROVE')} className="flex-1 btn btn-primary">Approve Bill</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && selectedBill && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl leading-relaxed">
            <h3 className={`text-lg font-bold mb-2 flex items-center gap-2 ${confirmAction === 'APPROVE' ? 'text-emerald-700' : 'text-red-700'}`}>
              <AlertCircle className="w-5 h-5"/>
              Confirm {confirmAction === 'APPROVE' ? 'Approval' : 'Rejection'}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Are you sure you want to {confirmAction.toLowerCase()} the bill for <strong>{selectedBill.hospital?.name}</strong>? This action will notify the user and {confirmAction === 'APPROVE' ? 'update the hospital averages.' : 'discard the bill from public stats.'}
            </p>
            <textarea 
              placeholder="Optional notes for audit log..."
              value={actionNotes}
              onChange={e => setActionNotes(e.target.value)}
              className="w-full input text-sm mb-6 bg-gray-50 border-gray-200"
              rows={3}
            />
            <div className="flex gap-3">
              <button disabled={processingSubmit} onClick={() => { setConfirmAction(null); setActionNotes(''); }} className="flex-1 btn btn-secondary text-sm">Cancel</button>
              <button disabled={processingSubmit} onClick={handleVerify} className={`flex-1 btn text-sm justify-center ${confirmAction === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
                {processingSubmit ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
