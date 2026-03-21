'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, Star, Award, Building2, Users, CheckCircle, X, Search } from 'lucide-react';
import Navbar from '@/components/Navbar';
import RadarChart from '@/components/RadarChart';
import Link from 'next/link';
import { hospitalsAPI, Hospital, formatCurrency } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface ScoreData { overall: number; satisfaction?: number; doctorExp?: number; costEfficiency?: number; successRate?: number; recoveryTime?: number; isReliable: boolean; dataPoints: number }

export default function ComparePage() {
  const sp = useSearchParams();
  const ids = sp.get('ids')?.split(',').filter(Boolean) || [];
  const treatmentSlug = sp.get('treatment') || '';
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [scores, setScores] = useState<Record<string, ScoreData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ids.length < 2) return;
    setLoading(true);
    hospitalsAPI.compare(ids, treatmentSlug || undefined)
      .then(async (r) => {
        setHospitals(r.data);
        // Fetch scores for each hospital+treatment
        if (treatmentSlug) {
          const scoreMap: Record<string, ScoreData> = {};
          for (const h of r.data) {
            try {
              const sr = await fetch(`${API}/scores/${h.id}/${treatmentSlug}`);
              const sd = await sr.json();
              if (sd.data) scoreMap[h.id] = sd.data;
            } catch {}
          }
          setScores(scoreMap);
        }
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, [ids.join(','), treatmentSlug]);

  const getField = (h: Hospital, field: string) => {
    switch (field) {
      case 'type': return <span className={`badge ${h.type==='GOVERNMENT'?'badge-green':h.type==='PRIVATE'?'badge-blue':'badge-amber'}`}>{h.type.charAt(0)+h.type.slice(1).toLowerCase()}</span>;
      case 'nabh': return h.naabhStatus ? <span className="flex items-center gap-1 text-emerald-600 text-sm"><CheckCircle className="w-3.5 h-3.5"/>Yes</span> : <span className="text-gray-400 text-sm">No</span>;
      case 'beds': return <span className="text-sm font-medium">{h.beds||'—'} beds</span>;
      case 'rating': return <div className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-400 fill-amber-400"/><span className="font-bold">{h.rating?.toFixed(1)||'—'}</span></div>;
      case 'doctors': return <span className="text-sm">{h._count?.doctors||'—'} specialists</span>;
      case 'cost': {
        const ht = h.hospitalTreatments?.[0];
        if (!ht?.avgCostEstimate) return <span className="text-xs text-gray-400">N/A</span>;
        return <div><p className="text-base font-bold text-brand-700">{formatCurrency(ht.avgCostEstimate)}</p><p className="text-xs text-gray-400">{formatCurrency(ht.minCostEstimate||0)} – {formatCurrency(ht.maxCostEstimate||0)}</p></div>;
      }
      case 'score': {
        const s = scores[h.id];
        if (!s) return <span className="text-xs text-gray-400">Loading...</span>;
        const color = s.overall>=8?'text-emerald-600':s.overall>=6.5?'text-brand-600':s.overall>=5?'text-amber-600':'text-red-500';
        return <div className="flex items-center gap-2"><span className={`text-2xl font-black ${color}`}>{s.isReliable?s.overall.toFixed(1):'?'}</span><span className="text-xs text-gray-400">/10{!s.isReliable&&<><br/>Data limited</>}</span></div>;
      }
      default: return '—';
    }
  };

  if (ids.length < 2) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar/>
      <div className="pt-16 flex flex-col items-center justify-center min-h-[80vh] gap-5 text-center px-4">
        <Building2 className="w-12 h-12 text-brand-300"/>
        <h1 className="text-2xl font-bold text-gray-900">Compare Hospitals</h1>
        <p className="text-gray-500 max-w-md">Select 2–4 hospitals from search results to compare side-by-side.</p>
        <Link href="/search" className="btn btn-primary btn-lg"><Search className="w-5 h-5"/> Find Hospitals</Link>
      </div>
    </div>
  );

  const FIELDS = [
    { key:'type', label:'Type' }, { key:'nabh', label:'NABH' }, { key:'beds', label:'Beds' },
    { key:'rating', label:'Rating' }, { key:'doctors', label:'Doctors' },
    { key:'cost', label:'Avg Cost' }, { key:'score', label:'ClearMed Score' },
  ];

  const buildRadar = (h: Hospital): { label: string; value: number; max: number }[] => {
    const s = scores[h.id];
    return [
      { label: 'Rating',   value: h.rating||0, max: 5 },
      { label: 'Doctors',  value: Math.min(h._count?.doctors||0, 50), max: 50 },
      { label: 'Satisfaction', value: s?.satisfaction||0, max: 2.5 },
      { label: 'Cost Eff', value: s?.costEfficiency||0, max: 2.0 },
      { label: 'Success',  value: s?.successRate||0, max: 2.0 },
      { label: 'Recovery', value: s?.recoveryTime||0, max: 1.0 },
    ];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar/>
      <div className="pt-16 pb-20 lg:pb-0">
        <div className="bg-brand-900 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-white text-xl font-bold">Hospital Comparison</h1>
            {treatmentSlug && <p className="text-brand-300 text-sm mt-1">For: {treatmentSlug}</p>}
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-brand-500 animate-spin"/></div>
          ) : error ? (
            <div className="text-center py-16"><AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3"/><p className="text-gray-600">{error}</p></div>
          ) : (
            <div className="space-y-6">
              {/* Radar charts */}
              {Object.keys(scores).length > 0 && hospitals.length >= 2 && (
                <div className="card p-6">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Score Radar Comparison</h2>
                  <div className={`grid gap-6 ${hospitals.length===2?'grid-cols-2':hospitals.length===3?'grid-cols-3':'grid-cols-4'}`}>
                    {hospitals.map((h,i) => (
                      <div key={h.id} className="text-center">
                        <p className="text-xs font-semibold text-gray-600 mb-2 line-clamp-1">{h.name}</p>
                        <div className="flex justify-center">
                          <RadarChart
                            data={buildRadar(h)}
                            size={160}
                            color={['#0e87ef','#14b8a6','#f59e0b','#f43f5e'][i]}
                            label={h.name.split(' ').slice(0,2).join(' ')}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left px-4 py-3 bg-gray-100 rounded-tl-xl text-xs text-gray-500 w-32 font-medium">Metric</th>
                      {hospitals.map((h,i) => (
                        <th key={h.id} className="px-4 py-3 bg-white border-b-4 text-left min-w-48"
                          style={{ borderColor: ['#0e87ef','#14b8a6','#f59e0b','#f43f5e'][i] }}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-bold text-gray-900 leading-tight">{h.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{h.city}</p>
                            </div>
                            <Link href={`/search?ids=${ids.filter(id=>id!==h.id).join(',')}&treatment=${treatmentSlug}`} className="text-gray-200 hover:text-red-400"><X className="w-4 h-4"/></Link>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FIELDS.map((field, fi) => (
                      <tr key={field.key} className={fi%2===0?'bg-gray-50':'bg-white'}>
                        <td className="px-4 py-3.5 text-sm font-medium text-gray-600">{field.label}</td>
                        {hospitals.map(h => (
                          <td key={h.id} className="px-4 py-3.5 border-l border-gray-100">{getField(h, field.key)}</td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-white border-t-2 border-gray-100">
                      <td className="px-4 py-4 rounded-bl-xl"/>
                      {hospitals.map(h => (
                        <td key={h.id} className="px-4 py-4 border-l border-gray-100">
                          <Link href={`/hospitals/${h.slug}`} className="btn btn-primary btn-sm w-full text-xs justify-center">View Details</Link>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
