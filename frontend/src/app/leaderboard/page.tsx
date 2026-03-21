'use client';
import { useState, useEffect } from 'react';
import { Trophy, Crown, Medal, Award, Upload, MessageSquare, Users, Gift, ArrowRight, Loader2, Star } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Leader {
  rank: number; id: string; name: string; city?: string;
  totalPoints: number; billsContributed: number; reviewsPosted: number;
  badge?: { id: string; label: string; icon: string };
}
interface PointsTable { BILL_UPLOAD: number; BILL_VERIFIED: number; OCR_BILL: number; REFERRAL_JOIN: number; REVIEW_POSTED: number; DAILY_LOGIN: number }

const CITIES = ['All Cities', 'Delhi', 'Mumbai', 'Bengaluru'];
const RANK_ICONS = [<Crown className="w-5 h-5 text-yellow-500" key="1"/>, <Medal className="w-5 h-5 text-slate-400" key="2"/>, <Award className="w-5 h-5 text-amber-600" key="3"/>];

const HOW_TO_EARN = [
  { label: 'Upload bill with file',    pts: 75,  icon: '📄', color: 'text-brand-600' },
  { label: 'Bill verified by admin',   pts: 100, icon: '✅', color: 'text-emerald-600' },
  { label: 'Upload bill manually',     pts: 50,  icon: '✏️',  color: 'text-blue-600' },
  { label: 'Post a review',            pts: 30,  icon: '💬', color: 'text-purple-600' },
  { label: 'Refer a friend',           pts: 200, icon: '🤝', color: 'text-teal-600' },
  { label: 'Daily login',              pts: 5,   icon: '🔆', color: 'text-amber-600' },
];

const BADGES = [
  { icon: '🏥', label: 'First Contribution',    desc: 'Upload your first bill',      pts: 0    },
  { icon: '⭐', label: 'Data Hero',              desc: '5 verified bills contributed', pts: 500  },
  { icon: '🔍', label: 'Transparency Champion', desc: '10 bills contributed',         pts: 1000 },
  { icon: '🤝', label: 'Community Builder',     desc: '3 successful referrals',       pts: 2000 },
  { icon: '🏆', label: 'ClearMed Legend',       desc: '25 verified bills',            pts: 5000 },
];

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('All Cities');

  useEffect(() => {
    setLoading(true);
    const q = city !== 'All Cities' ? `?city=${encodeURIComponent(city)}` : '';
    fetch(`${API}/community/leaderboard${q}`)
      .then(r => r.json())
      .then(d => setLeaders(d.data || []))
      .catch(() => setLeaders([]))
      .finally(() => setLoading(false));
  }, [city]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-20 lg:pb-0">
        {/* Hero */}
        <div className="hero-gradient py-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="relative max-w-2xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 badge bg-yellow-400/20 text-yellow-200 border border-yellow-400/30 mb-4">
              <Trophy className="w-4 h-4" /> Community Leaderboard
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">Healthcare Transparency Heroes</h1>
            <p className="text-white/70 text-lg">
              Real people sharing real bills — making healthcare costs visible for every Indian.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* ── Left: leaderboard ── */}
            <div className="lg:col-span-2 space-y-4">
              {/* Filter */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Top Contributors</h2>
                <div className="flex bg-white border border-gray-200 rounded-xl p-0.5 gap-0.5">
                  {CITIES.map(c => (
                    <button key={c} onClick={() => setCity(c)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                        ${city === c ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>
              ) : leaders.length === 0 ? (
                <div className="card p-12 text-center">
                  <Trophy className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No contributors yet — be the first!</p>
                  <Link href="/upload" className="btn btn-primary btn-md"><Upload className="w-4 h-4" /> Upload a Bill</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaders.map((leader, i) => (
                    <div key={leader.id}
                      className={`card p-4 flex items-center gap-4
                        ${i === 0 ? 'ring-2 ring-yellow-300 bg-gradient-to-r from-yellow-50 to-white' :
                          i === 1 ? 'ring-1 ring-gray-200 bg-gradient-to-r from-gray-50 to-white' :
                          i === 2 ? 'ring-1 ring-amber-200 bg-gradient-to-r from-amber-50 to-white' : ''}`}>

                      {/* Rank badge */}
                      <div className="w-9 text-center shrink-0">
                        {i < 3 ? RANK_ICONS[i] : <span className="text-sm font-bold text-gray-400">#{leader.rank}</span>}
                      </div>

                      {/* Avatar */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0
                        ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-500' : i === 2 ? 'bg-amber-100 text-amber-700' : 'bg-brand-50 text-brand-600'}`}>
                        {(leader.name || '?').charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 text-sm truncate">{leader.name}</p>
                          {leader.badge && <span className="text-base" title={leader.badge.label}>{leader.badge.icon}</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {leader.city && <span className="text-xs text-gray-400">{leader.city}</span>}
                          <span className="text-xs text-gray-400 flex items-center gap-1"><Upload className="w-3 h-3" />{leader.billsContributed} bills</span>
                          <span className="text-xs text-gray-400 flex items-center gap-1"><MessageSquare className="w-3 h-3" />{leader.reviewsPosted} reviews</span>
                        </div>
                      </div>

                      {/* Points */}
                      <div className="text-right shrink-0">
                        <p className={`text-xl font-black ${i === 0 ? 'text-yellow-600' : 'text-brand-700'}`}>
                          {leader.totalPoints.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-gray-400">pts</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Join CTA */}
              <div className="card p-6 bg-gradient-to-br from-brand-700 to-brand-900 border-0 text-white">
                <h3 className="text-lg font-bold mb-1">Make it onto the board</h3>
                <p className="text-white/70 text-sm mb-4">Upload hospital bills to earn points and help millions of patients.</p>
                <div className="flex gap-3">
                  <Link href="/upload" className="btn bg-white text-brand-700 hover:bg-brand-50 btn-md">
                    <Upload className="w-4 h-4" /> Upload Bill
                  </Link>
                  <Link href="/contribute" className="btn border border-white/30 text-white hover:bg-white/10 btn-md">
                    <Users className="w-4 h-4" /> Invite Friends
                  </Link>
                </div>
              </div>
            </div>

            {/* ── Right sidebar ── */}
            <div className="space-y-5">
              {/* How to earn */}
              <div className="card p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-brand-500" /> How to Earn Points
                </h3>
                <div className="space-y-2.5">
                  {HOW_TO_EARN.map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </div>
                      <span className={`text-sm font-bold ${item.color}`}>+{item.pts}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges */}
              <div className="card p-5">
                <h3 className="font-bold text-gray-900 mb-4">Badges to Earn</h3>
                <div className="space-y-3">
                  {BADGES.map(b => (
                    <div key={b.label} className="flex items-center gap-3">
                      <span className="text-2xl leading-none">{b.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800">{b.label}</p>
                        <p className="text-xs text-gray-400">{b.desc}</p>
                      </div>
                      <span className="text-xs font-bold text-brand-600 shrink-0">{b.pts.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Referral CTA */}
              <div className="card p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-emerald-900">Refer Friends = 200 pts</h3>
                </div>
                <p className="text-xs text-emerald-700 mb-3 leading-relaxed">
                  Share your referral code. Every friend who joins and contributes earns you 200 bonus points.
                </p>
                <Link href="/contribute" className="btn bg-emerald-600 hover:bg-emerald-700 text-white btn-sm w-full justify-center">
                  Get My Referral Link <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
