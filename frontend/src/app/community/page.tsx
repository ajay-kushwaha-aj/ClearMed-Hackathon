'use client';
import { useState } from 'react';
import { Star, ThumbsUp, CheckCircle, SortAsc, MessageSquare, Upload } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

interface Review {
  id: string; overallScore: number; doctorScore?: number; facilityScore?: number;
  careScore?: number; costTransparency?: number; reviewText?: string;
  recoveryDays?: number; isVerified: boolean; isBillLinked: boolean;
  helpfulVotes: number; createdAt: string;
  treatment?: { name: string; slug: string };
  user?: { name?: string; city?: string };
}

function Stars({ score, size = 'sm' }: { score: number; size?: 'sm'|'md' }) {
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({length:5},(_,i)=>(
        <Star key={i} className={`${sz} ${i<Math.round(score)?'text-amber-400 fill-amber-400':'text-gray-200 fill-gray-200'}`}/>
      ))}
      <span className="text-xs text-gray-500 ml-1">{score.toFixed(1)}</span>
    </span>
  );
}

const REVIEWS: Review[] = [
  {id:'1',overallScore:4.5,doctorScore:5,facilityScore:4,careScore:4.5,costTransparency:3,reviewText:'The surgery went very well. Dr. Sharma was excellent — explained everything clearly. Cost was ₹1.8L for knee replacement which seemed fair for Delhi. Room was clean, food was decent. Overall very happy with the outcome.',recoveryDays:45,isVerified:true,isBillLinked:true,helpfulVotes:12,createdAt:'2024-11-15T10:00:00Z',treatment:{name:'Knee Replacement Surgery',slug:'knee-replacement'},user:{name:'Rajesh Kumar',city:'Delhi'}},
  {id:'2',overallScore:3.5,doctorScore:4,facilityScore:3,careScore:3.5,costTransparency:2,reviewText:'The procedure itself was fine but the billing was confusing. Multiple line items I didn\'t understand. Recommend asking for a full breakdown before paying. Nursing staff was helpful.',isVerified:false,isBillLinked:false,helpfulVotes:7,createdAt:'2024-10-22T10:00:00Z',treatment:{name:'Angioplasty',slug:'angioplasty'},user:{name:'Priya Menon',city:'Mumbai'}},
  {id:'3',overallScore:5,doctorScore:5,facilityScore:5,careScore:5,costTransparency:5,reviewText:'Exceptional experience. Cataract surgery took 20 minutes and I could see clearly the same day. Cost was totally transparent — written estimate beforehand, final bill matched exactly. Highly recommend.',recoveryDays:7,isVerified:true,isBillLinked:true,helpfulVotes:23,createdAt:'2024-12-01T10:00:00Z',treatment:{name:'Cataract Surgery (Phaco)',slug:'cataract-surgery'},user:{name:'Sunita Rao',city:'Bengaluru'}},
];

export default function CommunityPage() {
  const [reviews, setReviews] = useState(REVIEWS);
  const [sort, setSort] = useState('helpful');
  const avg = reviews.reduce((s,r)=>s+r.overallScore,0)/reviews.length;
  const dist = [5,4,3,2,1].map(n=>({n,c:reviews.filter(r=>Math.round(r.overallScore)===n).length}));
  const sorted = [...reviews].sort((a,b)=>sort==='helpful'?b.helpfulVotes-a.helpfulVotes:sort==='rating_high'?b.overallScore-a.overallScore:sort==='rating_low'?a.overallScore-b.overallScore:new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
  const ago=(d:string)=>{const days=Math.floor((Date.now()-new Date(d).getTime())/86400000);return days<1?'Today':days===1?'Yesterday':days<30?`${days}d ago`:`${Math.floor(days/30)}mo ago`;};

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar/>
      <div className="pt-16 pb-20 lg:pb-0">
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><MessageSquare className="w-6 h-6 text-brand-500"/>Patient Reviews</h1>
            <p className="text-gray-500 text-sm mt-1">Honest reviews from verified patients across India</p>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="space-y-5">
              <div className="card p-5 text-center">
                <p className="text-5xl font-black text-gray-900 mb-1">{avg.toFixed(1)}</p>
                <Stars score={avg} size="md"/>
                <p className="text-xs text-gray-400 mt-1">{reviews.length} reviews</p>
                <div className="mt-4 space-y-1.5">
                  {dist.map(d=>(
                    <div key={d.n} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-4">{d.n}</span>
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0"/>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{width:`${reviews.length?(d.c/reviews.length)*100:0}%`}}/>
                      </div>
                      <span className="text-xs text-gray-400 w-4">{d.c}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card p-5 bg-gradient-to-br from-brand-50 to-teal-50 border-brand-100">
                <h3 className="font-bold text-brand-900 mb-2">Share Your Experience</h3>
                <p className="text-xs text-brand-700 mb-3">Earn <strong>30 points</strong> + Verified Patient badge when you link your bill.</p>
                <Link href="/upload" className="btn btn-primary btn-sm w-full justify-center"><Upload className="w-3.5 h-3.5"/>Post a Review</Link>
              </div>
            </div>
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600"><strong>{reviews.length}</strong> reviews</p>
                <div className="flex items-center gap-2">
                  <SortAsc className="w-4 h-4 text-gray-400"/>
                  <select value={sort} onChange={e=>setSort(e.target.value)} className="input text-sm py-1.5 cursor-pointer">
                    <option value="helpful">Most Helpful</option>
                    <option value="recent">Most Recent</option>
                    <option value="rating_high">Highest Rated</option>
                    <option value="rating_low">Lowest Rated</option>
                  </select>
                </div>
              </div>
              {sorted.map(r=>(
                <div key={r.id} className="card p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <div className="w-8 h-8 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center font-bold text-sm">{(r.user?.name||'A').charAt(0)}</div>
                        <div><p className="text-sm font-semibold text-gray-800">{r.user?.name||'Anonymous'}</p>{r.user?.city&&<p className="text-xs text-gray-400">{r.user.city}</p>}</div>
                        {r.isBillLinked&&<span className="badge badge-green text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3"/>Verified Patient</span>}
                      </div>
                      <Stars score={r.overallScore} size="md"/>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{ago(r.createdAt)}</span>
                  </div>
                  {(r.doctorScore||r.facilityScore||r.careScore||r.costTransparency)&&(
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[{l:'Doctor',v:r.doctorScore},{l:'Facility',v:r.facilityScore},{l:'Care',v:r.careScore},{l:'Cost Clarity',v:r.costTransparency}].filter(s=>s.v).map(s=>(
                        <div key={s.l} className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-400 mb-0.5">{s.l}</p><Stars score={s.v!} size="sm"/>
                        </div>
                      ))}
                    </div>
                  )}
                  {r.reviewText&&<p className="text-sm text-gray-700 leading-relaxed">{r.reviewText}</p>}
                  {r.treatment&&<p className="text-xs text-gray-500">Treatment: <Link href={`/treatments/${r.treatment.slug}`} className="text-brand-600 hover:underline">{r.treatment.name}</Link>{r.recoveryDays?` · Recovery: ${r.recoveryDays} days`:''}</p>}
                  <div className="flex items-center justify-between pt-1">
                    <button onClick={()=>setReviews(p=>p.map(x=>x.id===r.id?{...x,helpfulVotes:x.helpfulVotes+1}:x))} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600 transition-colors">
                      <ThumbsUp className="w-3.5 h-3.5"/>Helpful ({r.helpfulVotes})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
