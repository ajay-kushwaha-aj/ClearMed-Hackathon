'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, MapPin, Loader2, ArrowUpRight, Info, Building2, Star, CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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
        {/* Dynamic Header */}
        <div className="bg-gradient-to-r from-brand-600 via-blue-600 to-indigo-700 backdrop-blur-md sticky top-16 z-40 border-b border-brand-800/30 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-black text-white flex items-center gap-2 drop-shadow-sm">
                  <BarChart3 className="w-6 h-6 text-brand-200"/> Cost Intelligence
                </h1>
                <p className="text-sm text-brand-100 mt-1 font-medium opacity-90">Real-time localized medical procedure costs</p>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1 sm:flex-none">
                  <select value={treatment} onChange={e=>setTreatment(e.target.value)} className="appearance-none w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold rounded-xl pl-4 pr-10 py-2.5 outline-none transition-all cursor-pointer backdrop-blur-sm">
                    {TREATMENTS.map(t=><option key={t} value={t} className="text-gray-800">{t.replace(/-/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}</option>)}
                  </select>
                </div>
                <div className="relative w-32">
                  <select value={city} onChange={e=>setCity(e.target.value)} className="appearance-none w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold rounded-xl pl-4 pr-10 py-2.5 outline-none transition-all cursor-pointer backdrop-blur-sm">
                    {CITIES.map(c=><option key={c} className="text-gray-800">{c}</option>)}
                  </select>
                </div>
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
                <div key={s.l} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group">
                  <div className="w-10 h-10 mx-auto bg-gray-50 rounded-xl flex items-center justify-center text-lg mb-2 group-hover:scale-110 transition-transform">{s.emoji}</div>
                  <p className="text-2xl font-black text-gray-900 tracking-tight">{s.v}</p>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">{s.l}</p>
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
              <div className="grid sm:grid-cols-3 gap-5">
                <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-3xl p-6 shadow-sm border border-blue-100 relative overflow-hidden group hover:shadow-lg transition-all">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-100/40 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
                  <p className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-2 relative z-10">Average Cost in {city}</p>
                  <p className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-blue-600 relative z-10 drop-shadow-sm">{intel?.currentAvg ? fmt(intel.currentAvg) : '—'}</p>
                  {intel?.trend12m ? (
                    <div className={`inline-flex items-center gap-1.5 mt-4 text-sm font-bold bg-white/60 backdrop-blur px-3 py-1.5 rounded-lg border relative z-10 ${intel.trend12m > 0 ? 'text-red-600 border-red-100 shadow-sm shadow-red-100/50' : 'text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-100/50'}`}>
                      {intel.trend12m > 0 ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}
                      {Math.abs(intel.trend12m)}% vs last year
                    </div>
                  ) : <p className="text-xs text-gray-400 mt-3 font-medium relative z-10">Upload bills to see trends</p>}
                </div>

                {intel?.govtVsPrivate ? (
                  <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-3xl p-6 shadow-sm border border-emerald-100 relative overflow-hidden group hover:shadow-lg transition-all">
                    <div className="absolute bottom-0 right-0 w-24 h-24 bg-emerald-100/50 rounded-full blur-3xl -mr-8 -mb-8 transition-transform group-hover:scale-150"></div>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 relative z-10">Govt vs Private</p>
                    <div className="flex gap-6 relative z-10">
                      <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Govt</p><p className="text-2xl font-black text-emerald-600">{fmt(intel.govtVsPrivate.govtAvg)}</p></div>
                      <div className="w-px bg-gray-200"></div>
                      <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Private</p><p className="text-2xl font-black text-amber-500">{fmt(intel.govtVsPrivate.privateAvg)}</p></div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-emerald-50/50 relative z-10">
                      <p className="text-sm text-emerald-700 font-bold flex items-center gap-1.5"><CheckCircle className="w-4 h-4"/> Save {fmt(intel.govtVsPrivate.saving)} at govt hospital</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Govt vs Private</p>
                    <p className="text-sm text-gray-500 font-medium my-4">Data becomes available when enough bills are uploaded.</p>
                    <Link href="/upload" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-xl transition-colors">Contribute Data <ArrowUpRight className="w-3.5 h-3.5"/></Link>
                  </div>
                )}

                <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-lg transition-all flex flex-col justify-between">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Confidence Score</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl md:text-5xl font-black text-gray-900">{intel?.trends?.reduce((s,t)=>s+(t.sampleSize||0),0)||0}</p>
                      <p className="text-sm font-semibold text-gray-400">bills</p>
                    </div>
                  </div>
                  <Link href="/upload" className="inline-flex max-w-max items-center justify-between w-full mt-4 text-xs font-bold text-white bg-gray-900 hover:bg-gray-800 px-4 py-2.5 rounded-xl transition-all relative z-10 hover:shadow-md hover:-translate-y-0.5">
                    Add your bill <ArrowUpRight className="w-3.5 h-3.5"/>
                  </Link>
                </div>
              </div>

              {/* Trend chart */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-brand-500"/>
                    Cost Trend over Time
                  </h3>
                  <span className="badge badge-blue bg-blue-50 text-blue-700 font-bold px-3 py-1">In {city}</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <TrendChart data={intel?.trends||[]}/>
                </div>
              </div>

              {/* City comparison */}
              {intel?.cityComparison && intel.cityComparison.length > 1 && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-500"/> Regional Comparison
                  </h3>
                  <div className="space-y-4">
                    {intel.cityComparison.map(c=>{
                      const maxV = Math.max(...intel.cityComparison.map(x=>x.avg));
                      const isCurrentCity = c.city === city;
                      return (
                        <div key={c.city} className="group cursor-default">
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className={`font-semibold ${isCurrentCity ? 'text-brand-700' : 'text-gray-600'}`}>
                              {c.city} {isCurrentCity && <span className="text-[10px] ml-1 bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Selected</span>}
                            </span>
                            <span className="font-black text-gray-800">{fmt(c.avg)} <span className="text-gray-400 font-medium text-xs ml-1">({c.sampleSize} bills)</span></span>
                          </div>
                          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-1000 ease-out ${isCurrentCity ? 'bg-gradient-to-r from-brand-400 to-brand-600' : 'bg-gray-300 group-hover:bg-gray-400'}`} style={{width:`${(c.avg/maxV)*100}%`}}/>
                          </div>
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
