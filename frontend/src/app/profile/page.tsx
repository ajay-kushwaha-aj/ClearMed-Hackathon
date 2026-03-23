'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
    UserCircle, Mail, Phone, MapPin, Calendar, Trophy, Zap, Star, TrendingUp,
    Shield, Copy, Check, ChevronRight, ArrowLeft, Loader2, FileText, LogOut, Edit3
} from 'lucide-react';

const isL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API = isL ? `http://${window.location.hostname}:4000/api` : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');

interface ProfileData {
    id: string; name: string; email: string | null; phone: string | null;
    city: string | null; points: number; totalPoints: number; streak: number;
    referralCode: string | null; isEmailVerified: boolean;
    createdAt: string; lastActive: string | null;
    _count: { bills: number; feedback: number };
    pointsHistory: { id: string; activity: string; points: number; description: string | null; createdAt: string }[];
    bills: {
        id: string; status: string; totalCost: number | null; createdAt: string;
        hospital: { name: string } | null; treatment: { name: string } | null
    }[];
}

const BADGES = [
    { id: 'newcomer', label: 'Newcomer', icon: '🌱', minPoints: 0 },
    { id: 'contributor', label: 'Contributor', icon: '📊', minPoints: 50 },
    { id: 'advocate', label: 'Health Advocate', icon: '🏥', minPoints: 200 },
    { id: 'champion', label: 'ClearMed Champion', icon: '🏆', minPoints: 500 },
    { id: 'legend', label: 'Transparency Legend', icon: '⭐', minPoints: 1000 },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
    BILL_VERIFIED: { label: 'Verified', color: 'bg-emerald-100 text-emerald-700' },
    REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
    AI_PROCESSED: { label: 'Processing', color: 'bg-blue-100 text-blue-700' },
};

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', city: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('clearmed_token');
        if (!token) { router.push('/login?redirect=/profile'); return; }

        fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => { setProfile(d.data); setEditForm({ name: d.data.name || '', city: d.data.city || '' }); })
            .catch(() => router.push('/login?redirect=/profile'))
            .finally(() => setLoading(false));
    }, [router]);

    const copyReferral = () => {
        if (profile?.referralCode) {
            navigator.clipboard.writeText(profile.referralCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const token = localStorage.getItem('clearmed_token');
        try {
            const res = await fetch(`${API}/auth/profile`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(editForm),
            });
            const data = await res.json();
            if (res.ok) {
                setProfile(p => p ? { ...p, name: data.data.name, city: data.data.city } : p);
                localStorage.setItem('clearmed_user', JSON.stringify(data.data));
                setEditing(false);
            }
        } catch { } finally { setSaving(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem('clearmed_token');
        localStorage.removeItem('clearmed_user');
        router.push('/');
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
    );
    if (!profile) return null;

    const badge = [...BADGES].reverse().find(b => profile.points >= b.minPoints) || BADGES[0];
    const nextBadge = BADGES.find(b => profile.points < b.minPoints);
    const progressPercent = nextBadge ? Math.min(100, (profile.points / nextBadge.minPoints) * 100) : 100;
    const memberSince = new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    const formatCurrency = (n: number | null) => n ? `₹${n.toLocaleString('en-IN')}` : '—';

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <Navbar />
            <div className="pt-16" />

            {/* Profile header */}
            <div className="bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900 text-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                        {/* Avatar */}
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                            <span className="text-3xl">{badge.icon}</span>
                        </div>

                        <div className="flex-1">
                            {!editing ? (
                                <>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-2xl font-bold">{profile.name || 'ClearMed User'}</h1>
                                        <button onClick={() => setEditing(true)} className="text-white/40 hover:text-white"><Edit3 className="w-4 h-4" /></button>
                                    </div>
                                    <p className="text-white/60 text-sm mt-1">{badge.label} · Member since {memberSince}</p>
                                </>
                            ) : (
                                <div className="flex flex-col gap-2 max-w-xs">
                                    <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name" className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/40 focus:outline-none" />
                                    <input value={editForm.city} onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))} placeholder="Your city" className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/40 focus:outline-none" />
                                    <div className="flex gap-2">
                                        <button onClick={handleSave} disabled={saving} className="btn btn-sm bg-white text-brand-700 text-xs px-3 py-1">{saving ? 'Saving...' : 'Save'}</button>
                                        <button onClick={() => setEditing(false)} className="btn btn-sm bg-white/10 text-white text-xs px-3 py-1">Cancel</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Points badge */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20 text-center">
                            <p className="text-3xl font-bold">{profile.points}</p>
                            <p className="text-white/60 text-xs font-medium">ClearMed Points</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-4">
                {/* Stats cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                        { icon: <FileText className="w-5 h-5" />, value: profile._count.bills, label: 'Bills Uploaded', color: 'text-brand-600 bg-brand-50' },
                        { icon: <Star className="w-5 h-5" />, value: profile._count.feedback, label: 'Reviews Given', color: 'text-amber-600 bg-amber-50' },
                        { icon: <Zap className="w-5 h-5" />, value: `${profile.streak}d`, label: 'Current Streak', color: 'text-orange-600 bg-orange-50' },
                        { icon: <TrendingUp className="w-5 h-5" />, value: profile.totalPoints, label: 'Total Points Earned', color: 'text-emerald-600 bg-emerald-50' },
                    ].map(s => (
                        <div key={s.label} className="card p-4 text-center">
                            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-2`}>{s.icon}</div>
                            <p className="text-xl font-bold text-gray-900">{s.value}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Left column */}
                    <div className="md:col-span-2 space-y-6">

                        {/* Badge progress */}
                        <div className="card p-5">
                            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-brand-500" /> Badge Progress</h2>
                            <div className="flex items-center gap-4 mb-3">
                                <span className="text-3xl">{badge.icon}</span>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-900">{badge.label}</p>
                                    {nextBadge ? (
                                        <p className="text-xs text-gray-500">{nextBadge.minPoints - profile.points} more points to <strong>{nextBadge.label}</strong> {nextBadge.icon}</p>
                                    ) : (
                                        <p className="text-xs text-emerald-600 font-medium">Maximum badge achieved! 🎉</p>
                                    )}
                                </div>
                            </div>
                            {nextBadge && (
                                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-brand-400 to-teal-400 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                                </div>
                            )}
                        </div>

                        {/* Recent bills */}
                        <div className="card p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><FileText className="w-4 h-4 text-brand-500" /> Recent Bills</h2>
                                <Link href="/upload" className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">Upload New <ChevronRight className="w-3 h-3" /></Link>
                            </div>
                            {profile.bills.length > 0 ? (
                                <div className="space-y-2">
                                    {profile.bills.map(bill => {
                                        const st = STATUS_LABELS[bill.status] || { label: bill.status, color: 'bg-gray-100 text-gray-600' };
                                        return (
                                            <div key={bill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">{bill.hospital?.name || 'Unknown Hospital'}</p>
                                                    <p className="text-xs text-gray-400">{bill.treatment?.name || 'General'} · {new Date(bill.createdAt).toLocaleDateString('en-IN')}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-gray-700">{formatCurrency(bill.totalCost)}</p>
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-6 bg-gray-50 rounded-xl">
                                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400">No bills uploaded yet</p>
                                    <Link href="/upload" className="text-xs text-brand-600 font-semibold mt-2 inline-block hover:underline">Upload your first bill →</Link>
                                </div>
                            )}
                        </div>

                        {/* Points activity */}
                        {profile.pointsHistory.length > 0 && (
                            <div className="card p-5">
                                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-brand-500" /> Points Activity</h2>
                                <div className="space-y-2">
                                    {profile.pointsHistory.map(tx => (
                                        <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50">
                                            <div>
                                                <p className="text-sm text-gray-700">{tx.description || tx.activity.replace(/_/g, ' ')}</p>
                                                <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                            </div>
                                            <span className={`text-sm font-bold ${tx.points > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {tx.points > 0 ? '+' : ''}{tx.points} pts
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right sidebar */}
                    <div className="space-y-5">

                        {/* Account details */}
                        <div className="card p-5">
                            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><UserCircle className="w-4 h-4 text-brand-500" /> Account Details</h2>
                            <div className="space-y-3">
                                {profile.email && (
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm text-gray-800 truncate">{profile.email}</p>
                                            <p className="text-xs text-gray-400">{profile.isEmailVerified ? '✅ Verified' : '⚠️ Not verified'}</p>
                                        </div>
                                    </div>
                                )}
                                {profile.phone && (
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                                        <p className="text-sm text-gray-800">+91 {profile.phone}</p>
                                    </div>
                                )}
                                {profile.city && (
                                    <div className="flex items-center gap-3">
                                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                                        <p className="text-sm text-gray-800">{profile.city}</p>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                                    <p className="text-sm text-gray-800">Joined {memberSince}</p>
                                </div>
                            </div>
                        </div>

                        {/* Referral code */}
                        {profile.referralCode && (
                            <div className="card p-5 bg-gradient-to-br from-brand-50 to-teal-50 border-brand-100">
                                <h2 className="text-sm font-semibold text-brand-800 mb-2 flex items-center gap-2"><Shield className="w-4 h-4" /> Your Referral Code</h2>
                                <p className="text-xs text-brand-700/70 mb-3">Share this code with friends. You both earn bonus points when they sign up!</p>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-white rounded-lg px-3 py-2.5 text-center font-mono font-bold text-brand-700 tracking-wider text-lg border border-brand-200">
                                        {profile.referralCode}
                                    </div>
                                    <button onClick={copyReferral} className="p-2.5 bg-white rounded-lg border border-brand-200 hover:bg-brand-100 transition-colors">
                                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-brand-600" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Quick actions */}
                        <div className="card p-5 space-y-2">
                            <h2 className="text-sm font-semibold text-gray-700 mb-1">Quick Actions</h2>
                            <Link href="/upload" className="btn btn-primary btn-md w-full text-sm justify-center">Upload a Bill</Link>
                            <Link href="/leaderboard" className="btn btn-secondary btn-md w-full text-sm justify-center">View Leaderboard</Link>
                            <button onClick={handleLogout} className="btn btn-md w-full text-sm justify-center text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 flex items-center gap-2">
                                <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
