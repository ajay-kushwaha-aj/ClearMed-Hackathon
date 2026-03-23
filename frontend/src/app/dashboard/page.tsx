'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, MapPin, Loader2, ArrowUpRight, Info, Building2, Star, CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

const isL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API = isL ? `http://${window.location.hostname}:4000/api` : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');

interface TrendPoint { label: string; avg: number; min: number; max: number; sampleSize: number; govtAvg?: number; privateAvg?: number }
interface CostIntel {
  treatment: { name: string; slug: string };
  city: string; trends: TrendPoint[]; currentAvg: number; trend12m: number;
  govtVsPrivate: { govtAvg: number; privateAvg: number; saving: number } | null;
  cityComparison: Array<{ city: string; avg: number; sampleSize: number }>;
  costBreakdown: { roomCharges: number; surgeryFee: number; implantCost: number; pharmacyCost: number; other: number } | null;
}
interface PlatformStats { hospitals: number; treatments: number; bills: number; doctors: number; users: number; reliableScores: number }
interface Hospital { id: string; name: string; slug: string; city: string; type: string; naabhStatus: boolean; rating?: number; beds?: number; _count: { doctors: number } }

const TREATMENTS = ['knee-replacement','angioplasty','cataract-surgery','gallbladder-removal','kidney-stone-removal','normal-delivery'];
const CITIES = ['Delhi','Mumbai','Bengaluru'];
const fmt = (n: number) => !n ? '—' : n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : `₹${(n/1000).toFixed(0)}K`;

function TrendChart({ data }: { data: TrendPoint[] }) {
  if (!data?.length) return (
    <div className="h-32 flex flex-col items-center justify-center text-center gap-2">
      <Info className="w-6 h-6 text-gray-300"/>
      <p className="text-xs text-gray-400">No trend data yet for this combination.</p>
      <p className="text-xs text-gray-300">Upload bills to build trends!</p>
    </div>
  );
  const vals = data.map(d => d.avg);
  const max = Math.max(...vals) * 1.1;
  const min = Math.min(...vals) * 0.9;
  const W = 500; const H = 120; const PAD = { l: 50, r: 10, t: 10, b: 30 };
  const toX = (i: number) => PAD.l + (i / Math.max(data.length - 1, 1)) * (W - PAD.l - PAD.r);
  const toY = (v: number) => PAD.t + (H - PAD.t - PAD.b) - ((v - min) / (max - min || 1)) * (H - PAD.t - PAD.b);
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.avg)}`).join(' ');
  const area = `${path} L${toX(data.length-1)},${H-PAD.b} L${toX(0)},${H-PAD.b} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0e87ef" stopOpacity="0.2"/><stop offset="100%" stopColor="#0e87ef" stopOpacity="0.02"/></linearGradient></defs>
      {[0,0.5,1].map((t,i) => <line key={i} x1={PAD.l} y1={toY(min+t*(max-min))} x2={W-PAD.r} y2={toY(min+t*(max-min))} stroke="#f3f4f6" strokeWidth="1"/>)}
      {[0,0.5,1].map((t,i) => <text key={i} x={PAD.l-4} y={toY(min+t*(max-min))} textAnchor="end" dominantBaseline="middle" style={{fontSize:9,fill:'#9ca3af'}}>{fmt(Math.round(min+t*(max-min)))}</text>)}
      <path d={area} fill="url(#grad)"/>
      <path d={path} fill="none" stroke="#0e87ef" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((d,i) => <circle key={i} cx={toX(i)} cy={toY(d.avg)} r="3.5" fill="#0e87ef" stroke="white" strokeWidth="2"/>)}
      {data.map((d,i) => (i===0||i===data.length-1||i%Math.max(1,Math.floor(data.length/4))===0) && (
        <text key={`l${i}`} x={toX(i)} y={H-PAD.b+14} textAnchor="middle" style={{fontSize:9,fill:'#9ca3af'}}>{d.label}</text>
      ))}
    </svg>
  );
}

export default function DashboardPage() {
  const [treatment, setTreatment] = useState(TREATMENTS[0]);
  const [city, setCity] = useState(CITIES[0]);
  const [intel, setIntel] = useState<CostIntel | null>(null);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/intelligence/platform-stats`).then(r=>r.json()).then(d=>setStats(d.data)).catch(()=>{});
    fetch(`${API}/hospitals?limit=12&sort=rating`).then(r=>r.json()).then(d=>setHospitals(d.data||[])).catch(()=>{});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/intelligence/intelligence/${treatment}/${city}`)
      .then(r=>r.json()).then(d=>setIntel(d.data||null))
      .catch(()=>setIntel(null))
      .finally(()=>setLoading(false));
  }, [treatment, city]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar/>
      <div className="pt-16 pb-20 lg:pb-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-brand-500"/> Cost Intelligence Dashboard
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">Real cost data from verified patient bills</p>
              </div>
              <div className="flex gap-2">
                <select value={treatment} onChange={e=>setTreatment(e.target.value)} className="input text-sm py-2 cursor-pointer flex-1 sm:flex-none">
                  {TREATMENTS.map(t=><option key={t} value={t}>{t.replace(/-/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}</option>)}
                </select>
                <select value={city} onChange={e=>setCity(e.target.value)} className="input text-sm py-2 cursor-pointer w-28">
                  {CITIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Platform stats */}
          {stats && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[
                {emoji:'🏥',v:stats.hospitals,l:'Hospitals'},
                {emoji:'💊',v:stats.treatments,l:'Treatments'},
                {emoji:'🧾',v:stats.bills,l:'Verified Bills'},
                {emoji:'👨‍⚕️',v:stats.doctors,l:'Doctors'},
                {emoji:'👥',v:stats.users,l:'Users'},
                {emoji:'⭐',v:stats.reliableScores,l:'Scored Pairs'},
              ].map(s=>(
                <div key={s.l} className="card p-3 text-center">
                  <p className="text-base mb-0.5">{s.emoji}</p>
                  <p className="text-xl font-black text-gray-900">{s.v}</p>
                  <p className="text-[10px] text-gray-400">{s.l}</p>
                </div>
              ))}
            </div>
          )}

          {/* Cost Intelligence */}
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-brand-400 animate-spin"/></div>
          ) : (
            <div className="space-y-5">
              {/* Summary cards */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="card p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Average Cost in {city}</p>
                  <p className="text-3xl font-black text-brand-700">{intel?.currentAvg ? fmt(intel.currentAvg) : '—'}</p>
                  {intel?.trend12m ? (
                    <div className={`flex items-center gap-1 mt-1 text-sm font-medium ${intel.trend12m > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {intel.trend12m > 0 ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}
                      {Math.abs(intel.trend12m)}% in 12 months
                    </div>
                  ) : <p className="text-xs text-gray-400 mt-1">Upload bills to see trends</p>}
                </div>

                {intel?.govtVsPrivate ? (
                  <div className="card p-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Govt vs Private</p>
                    <div className="flex items-end gap-4">
                      <div><p className="text-xs text-gray-400">Govt</p><p className="text-xl font-bold text-emerald-600">{fmt(intel.govtVsPrivate.govtAvg)}</p></div>
                      <div><p className="text-xs text-gray-400">Private</p><p className="text-xl font-bold text-amber-600">{fmt(intel.govtVsPrivate.privateAvg)}</p></div>
                    </div>
                    <p className="text-xs text-emerald-600 font-semibold mt-2">Save {fmt(intel.govtVsPrivate.saving)} at govt hospital</p>
                  </div>
                ) : (
                  <div className="card p-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Govt vs Private</p>
                    <p className="text-sm text-gray-400">Data available after bills are uploaded</p>
                    <Link href="/upload" className="text-xs text-brand-600 font-medium hover:underline mt-2 flex items-center gap-1">Upload a bill <ArrowUpRight className="w-3 h-3"/></Link>
                  </div>
                )}

                <div className="card p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Data Points</p>
                  <p className="text-3xl font-black text-gray-900">{intel?.trends?.reduce((s,t)=>s+(t.sampleSize||0),0)||0}</p>
                  <p className="text-xs text-gray-400 mt-1">verified patient bills</p>
                  <Link href="/upload" className="text-xs text-brand-600 font-medium hover:underline mt-2 flex items-center gap-1">Contribute your bill <ArrowUpRight className="w-3 h-3"/></Link>
                </div>
              </div>

              {/* Trend chart */}
              <div className="card p-5">
                <h3 className="font-bold text-gray-900 mb-4">
                  Cost Trend — {treatment.replace(/-/g,' ').replace(/\b\w/g,l=>l.toUpperCase())} in {city}
                </h3>
                <TrendChart data={intel?.trends||[]}/>
              </div>

              {/* City comparison */}
              {intel?.cityComparison && intel.cityComparison.length > 1 && (
                <div className="card p-5">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brand-500"/> City Comparison
                  </h3>
                  <div className="space-y-3">
                    {intel.cityComparison.map(c=>{
                      const maxV = Math.max(...intel.cityComparison.map(x=>x.avg));
                      return (
                        <div key={c.city}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 font-medium">{c.city}</span>
                            <span className="font-bold text-gray-800">{fmt(c.avg)} <span className="text-gray-400 font-normal">({c.sampleSize} bills)</span></span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full"><div className="h-full bg-brand-400 rounded-full" style={{width:`${(c.avg/maxV)*100}%`}}/></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hospital listing */}
          {hospitals.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-brand-500"/> Top Hospitals
                </h2>
                <Link href="/search" className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-1">
                  View all <ArrowUpRight className="w-3.5 h-3.5"/>
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {hospitals.slice(0,6).map(h=>(
                  <Link key={h.id} href={`/hospitals/${h.slug}`}
                    className="card p-4 hover:border-brand-200 hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm group-hover:text-brand-600 line-clamp-1">{h.name}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3"/>{h.city}</p>
                      </div>
                      {h.naabhStatus && <span className="badge badge-green text-xs flex items-center gap-1 shrink-0"><CheckCircle className="w-3 h-3"/>NABH</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {h.rating && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400"/>{h.rating.toFixed(1)}</span>}
                      <span>{h._count?.doctors||0} doctors</span>
                      <span className={`${h.type==='GOVERNMENT'?'text-emerald-600':'text-blue-600'} font-medium capitalize`}>{h.type.toLowerCase()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
