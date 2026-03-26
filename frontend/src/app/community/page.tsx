'use client';
import { useState, useRef } from 'react';
import { Star, ThumbsUp, CheckCircle, SortAsc, MessageSquare, Upload } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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
  const [showModal, setShowModal] = useState(false);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [form, setForm] = useState<{
    hospitalId: string; treatmentId: string; overallScore: number; reviewText: string;
    file: File | null; totalCost: string; city: string;
  }>({ hospitalId: '', treatmentId: '', overallScore: 5, reviewText: '', file: null, totalCost: '', city: 'Delhi' });
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all'|'verified'>('all');
  const [hoverStar, setHoverStar] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  let vSum=0,vCount=0,sSum=0,sCount=0,uSum=0,uCount=0;
  reviews.forEach(r=>{
    if(r.isBillLinked){vSum+=r.overallScore;vCount++}
    else if(r.user){sSum+=r.overallScore;sCount++}
    else{uSum+=r.overallScore;uCount++}
  });
  const tWt = (vCount>0?0.6:0)+(sCount>0?0.3:0)+(uCount>0?0.1:0);
  const wScore = ((vCount>0?vSum/vCount*0.6:0)+(sCount>0?sSum/sCount*0.3:0)+(uCount>0?uSum/uCount*0.1:0))/(tWt||1);
  const avg = tWt > 0 ? wScore : 0;

  const dist = [5,4,3,2,1].map(n=>({n,c:reviews.filter(r=>Math.round(r.overallScore)===n).length}));
  const sorted = [...reviews].sort((a,b)=>sort==='helpful'?b.helpfulVotes-a.helpfulVotes:sort==='rating_high'?b.overallScore-a.overallScore:sort==='rating_low'?a.overallScore-b.overallScore:new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
  const filtered = sorted.filter(r => filter === 'all' || r.isBillLinked);
  const ago=(d:string)=>{const days=Math.floor((Date.now()-new Date(d).getTime())/86400000);return days<1?'Today':days===1?'Yesterday':days<30?`${days}d ago`:`${Math.floor(days/30)}mo ago`;};

  const openModal = async () => {
    const token = localStorage.getItem('clearmed_token');
    if (!token) {
      alert('You must be logged in to post a review.');
      window.location.href = '/login?redirect=/community';
      return;
    }

    setShowModal(true);
    if (!hospitals.length) {
      try {
        const [hRes, tRes] = await Promise.all([
          fetch(`${API}/hospitals?limit=100`),
          fetch(`${API}/treatments?limit=100`)
        ]);
        const hData = await hRes.json();
        const tData = await tRes.json();
        setHospitals(hData.data || []);
        
        // Flatten grouped treatments from backend
        const tObj = tData.data || {};
        const flatTreatments = Array.isArray(tObj) ? tObj : Object.values(tObj).flat();
        setTreatments(flatTreatments);
      } catch (e) {}
    }
  };

  const submitReview = async () => {
    if (!form.hospitalId || !form.treatmentId || !form.reviewText) return alert("Please fill required fields (Hospital, Treatment, Review Details)");
    if (form.file && !form.totalCost) return alert("Please enter the Total Cost from your bill");
    
    setSubmitting(true);
    try {
      const userStr = localStorage.getItem('clearmed_user');
      const user = userStr ? JSON.parse(userStr) : null;
      let res;
      
      if (form.file) {
        // Find hospital to grab its city
        const selectedHospital = hospitals.find(h => h.id === form.hospitalId);
        const cityToUse = selectedHospital ? selectedHospital.city : 'Delhi';

        const fd = new FormData();
        fd.append('hospitalId', form.hospitalId);
        fd.append('treatmentId', form.treatmentId);
        fd.append('totalCost', form.totalCost);
        fd.append('city', cityToUse);
        fd.append('rating', form.overallScore.toString());
        fd.append('reviewText', form.reviewText);
        if (user?.id) fd.append('userId', user.id);
        fd.append('bill', form.file);

        res = await fetch(`${API}/bills/upload`, { method: 'POST', body: fd });
      } else {
        res = await fetch(`${API}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hospitalId: form.hospitalId,
            treatmentId: form.treatmentId,
            overallScore: form.overallScore,
            reviewText: form.reviewText,
            userId: user?.id
          })
        });
      }

      if (res.ok) {
        setShowModal(false);
        setForm({ hospitalId: '', treatmentId: '', overallScore: 5, reviewText: '', file: null, totalCost: '', city: 'Delhi' });
        alert(form.file ? 'Bill and review submitted successfully! You just earned points and the Verified Patient badge!' : 'Review submitted successfully! It will appear once verified by moderators.');
      } else {
        const errData = await res.json().catch(()=>({}));
        alert(errData.error || 'Failed to submit review');
      }
    } catch {
      alert('Error submitting review');
    } finally {
      setSubmitting(false);
    }
  };

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
                <p className="text-xs text-brand-700 font-medium mt-1">Based on {reviews.length} reviews • {vCount} verified</p>
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
                <button onClick={openModal} className="btn btn-primary btn-sm w-full justify-center"><MessageSquare className="w-3.5 h-3.5"/>Post a Review</button>
              </div>
            </div>
            <div className="lg:col-span-3 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button onClick={()=>setFilter('all')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter==='all'?'bg-white shadow text-gray-900':'text-gray-500 hover:text-gray-700'}`}>All Reviews</button>
                  <button onClick={()=>setFilter('verified')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter==='verified'?'bg-white shadow text-gray-900':'text-gray-500 hover:text-gray-700'}`}>Verified Only</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600"><strong>{filtered.length}</strong> reviews</p>
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
              {filtered.map(r=>(
                <div key={r.id} className="card p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <div className="w-8 h-8 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center font-bold text-sm">{(r.user?.name||'A').charAt(0)}</div>
                        <div><p className="text-sm font-semibold text-gray-800">{r.user?.name||'Anonymous'}</p>{r.user?.city&&<p className="text-xs text-gray-400">{r.user.city}</p>}</div>
                        {r.isBillLinked ? (
                          <span className="badge badge-green text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3"/>Verified Patient</span>
                        ) : r.user?.name ? (
                          <span className="bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded text-xs flex items-center gap-1">🟡 Verified User</span>
                        ) : (
                          <span className="bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded text-xs flex items-center gap-1">⚠️ Unverified Review</span>
                        )}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-fade-in relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Post a Review</h2>
            <p className="text-sm text-gray-500 mb-5">Share your medical experience to help others.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Hospital</label>
                <select value={form.hospitalId} onChange={e=>setForm({...form, hospitalId: e.target.value})} className="input w-full text-sm py-2">
                  <option value="">Select Hospital</option>
                  {hospitals.map(h => <option key={h.id} value={h.id}>{h.name} - {h.city}</option>)}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Treatment</label>
                <select value={form.treatmentId} onChange={e=>setForm({...form, treatmentId: e.target.value})} className="input w-full text-sm py-2">
                  <option value="">Select Treatment</option>
                  {treatments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Overall Score ({form.overallScore}/5)</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      type="button"
                      onClick={() => setForm({...form, overallScore: star})}
                      onMouseEnter={() => setHoverStar(star)}
                      onMouseLeave={() => setHoverStar(0)}
                      className={`text-3xl transition-colors ${star <= (hoverStar || form.overallScore) ? 'text-amber-400' : 'text-gray-200'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Review Details</label>
                <textarea 
                  rows={4} 
                  placeholder="How was the doctor? Was the cost transparent?"
                  value={form.reviewText}
                  onChange={e=>setForm({...form, reviewText: e.target.value})}
                  className="input w-full text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Attach Bill (Optional - Earn +75 pts & Verified Patient badge)</label>
                {!form.file ? (
                  <div 
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <Upload className="w-6 h-6 text-brand-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 font-medium">Click to upload bill image or PDF</p>
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileRef} 
                      accept=".pdf,image/*"
                      onChange={(e) => setForm({...form, file: e.target.files?.[0] || null})}
                    />
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-800">
                        <CheckCircle className="w-5 h-5 shrink-0" />
                        <span className="font-semibold text-sm truncate">{form.file.name}</span>
                      </div>
                      <button onClick={() => setForm({...form, file: null, totalCost: ''})} className="text-xs text-red-500 font-medium hover:underline">Remove</button>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-emerald-800 mb-1 block">Total Bill Amount *</label>
                      <input 
                        type="number" 
                        value={form.totalCost} 
                        onChange={e => setForm({...form, totalCost: e.target.value})} 
                        className="input w-full text-sm py-1.5" 
                        placeholder="e.g. 50000"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
              <button disabled={submitting} onClick={() => setShowModal(false)} className="flex-1 btn btn-secondary">Cancel</button>
              <button disabled={submitting} onClick={submitReview} className="flex-1 btn btn-primary justify-center">
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
