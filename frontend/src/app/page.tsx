import Image from 'next/image';
import Link from 'next/link';
import { Search, Shield, TrendingDown, ArrowRight, Upload, Stethoscope, Trophy, TrendingUp, BarChart3, MapPin, Building2, IndianRupee, Heart, FileText, Globe, FlaskConical } from 'lucide-react';
import Navbar from '@/components/Navbar';
import SearchBar from '@/components/SearchBar';

const MOBILE_QUICK_LINKS = [
  { icon: '🔍', label: 'Find Hospitals', href: '/search', color: 'bg-brand-50 text-brand-700' },
  { icon: '🩺', label: 'Check Symptoms', href: '/symptoms', color: 'bg-teal-50 text-teal-700' },
  { icon: '📋', label: 'Report Analyzer', href: '/reports', color: 'bg-purple-50 text-purple-700' },
  { icon: '🛡️', label: 'Insurance', href: '/insurance', color: 'bg-emerald-50 text-emerald-700' },
  { icon: '📊', label: 'Cost Trends', href: '/dashboard', color: 'bg-indigo-50 text-indigo-700' },
  { icon: '💬', label: 'Reviews', href: '/community', color: 'bg-pink-50 text-pink-700' },
];

const TOP_TREATMENTS = [
  { icon: '🦵', name: 'Knee Replacement', slug: 'knee-replacement', city: 'Delhi', range: '₹1.8L–₹3.2L' },
  { icon: '🫀', name: 'Angioplasty', slug: 'angioplasty', city: 'Mumbai', range: '₹2.5L–₹5L' },
  { icon: '👁️', name: 'Cataract Surgery', slug: 'cataract-surgery', city: 'Delhi', range: '₹25K–₹80K' },
  { icon: '👶', name: 'Normal Delivery', slug: 'normal-delivery', city: 'Delhi', range: '₹40K–₹1.2L' },
  { icon: '🔬', name: 'Gallbladder', slug: 'gallbladder-removal', city: 'Bengaluru', range: '₹60K–₹1.5L' },
  { icon: '💎', name: 'Kidney Stone', slug: 'kidney-stone-removal', city: 'Delhi', range: '₹80K–₹2L' },
];

const STATS = [
  { icon: <Building2 className="w-7 h-7 text-blue-600" />, value: '28+', label: 'Hospitals', bg: 'bg-blue-50', border: 'border-blue-100' },
  { icon: <Heart className="w-7 h-7 text-rose-500" />, value: '29', label: 'Treatments', bg: 'bg-rose-50', border: 'border-rose-100' },
  { icon: <FileText className="w-7 h-7 text-emerald-600" />, value: '200+', label: 'Verified Bills', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  { icon: <Globe className="w-7 h-7 text-purple-600" />, value: '3', label: 'Cities', bg: 'bg-purple-50', border: 'border-purple-100' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar transparent />

      {/* ── Hero ── */}
      <section className="hero-gradient min-h-[80vh] sm:min-h-[85vh] flex flex-col items-center px-4 text-center relative pt-32 md:pt-40 pb-20 sm:pb-24">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative max-w-4xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 badge bg-white/15 text-white border border-white/20 mb-6 text-sm">
            <span className="text-yellow-300">★</span> Powered by Real Patient Data
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-white leading-tight mb-5">
            Know the real cost. Make smarter<br />
            <span className="text-teal-300">healthcare</span> decisions.
          </h1>
          <p className="text-white/80 text-lg sm:text-xl mb-6 max-w-2xl mx-auto leading-relaxed">
            <span className="font-semibold text-teal-200">Smarter Choices. Better Care.</span> Built on real patient data. Analyze symptoms, understand reports, and choose the best hospital with confidence.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-sm sm:text-base font-medium text-teal-100 mb-8 bg-white/5 border border-white/10 w-fit mx-auto px-5 py-2.5 rounded-full">
            <span>🔒 Privacy Protected</span>
            <span className="text-white/30">•</span>
            <span>🧠 AI-Assisted</span>
            <span className="text-white/30">•</span>
            <span>📊 Real Patient Data</span>
          </div>

          {/* Solid white search box */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-2xl max-w-3xl mx-auto">
            <SearchBar />
          </div>

          <p className="mt-4 text-white/80 text-sm sm:text-base font-medium tracking-wide">
            Get cost insights, outcomes, and hospital recommendations in seconds.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mt-8">
            <Link href="/reports" className="btn bg-white/15 hover:bg-white/25 text-white border border-white/30 btn-lg w-full sm:w-auto justify-center text-base font-medium">
              <FileText className="w-5 h-5" /> Understand My Report
            </Link>
            <Link href="/symptoms" className="btn bg-white text-brand-700 hover:bg-brand-50 border border-transparent shadow-xl btn-lg w-full sm:w-auto justify-center text-base font-extrabold sm:scale-110 transition-transform">
              <Stethoscope className="w-5 h-5" /> Check Symptoms
            </Link>
            <Link href="/insurance" className="btn bg-white/15 hover:bg-white/25 text-white border border-white/30 btn-lg w-full sm:w-auto justify-center text-base font-medium">
              <Shield className="w-5 h-5" /> Find Hospitals
            </Link>
          </div>

          <p className="mt-6 text-white/60 text-sm sm:text-base font-medium tracking-wide">
            Start with symptoms or upload your report <ArrowRight className="inline w-4 h-4 mx-1 opacity-70 mb-0.5" /> get insights <ArrowRight className="inline w-4 h-4 mx-1 opacity-70 mb-0.5" /> find the right hospital
          </p>
        </div>
      </section>

      {/* ── Stats Cards ── */}
      <section className="px-4 -mt-10 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map(s => (
              <div key={s.label} className={`${s.bg} ${s.border} border-2 rounded-2xl p-5 sm:p-6 text-center shadow-lg hover:shadow-xl transition-shadow`}>
                <div className="flex items-center justify-center mb-3">{s.icon}</div>
                <p className="text-3xl sm:text-4xl font-black text-gray-900">{s.value}</p>
                <p className="text-gray-600 text-sm sm:text-base font-semibold mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick Access ── */}
      <section className="px-4 py-10 sm:py-12 max-w-6xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-5">Quick Access</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {MOBILE_QUICK_LINKS.map(link => (
            <Link key={link.href} href={link.href}
              className={`${link.color} rounded-2xl p-4 text-center flex flex-col items-center gap-2 hover:opacity-80 transition-all active:scale-95 shadow-sm`}>
              <span className="text-3xl leading-none">{link.icon}</span>
              <span className="text-sm font-semibold leading-tight">{link.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="px-4 pb-8 max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 gap-5">
          {/* Insurance card */}
          <div className="card p-6 sm:p-7 bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-100 border-2">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="font-bold text-teal-900 text-lg">Insurance Coverage Estimator</p>
                <p className="text-sm text-teal-700 mt-1">See exactly how much your policy covers</p>
              </div>
            </div>
            <p className="text-sm text-teal-700 leading-relaxed mb-4">
              Support for Star Health, HDFC Ergo, Niva Bupa, Care Health, and 6 more insurers. Find cashless hospitals near you.
            </p>
            <Link href="/insurance" className="btn bg-teal-600 hover:bg-teal-700 text-white btn-md w-full justify-center text-sm font-bold">
              Check My Coverage <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Partner card */}
          <div className="card p-6 sm:p-7 bg-gradient-to-br from-brand-50 to-blue-50 border-brand-100 border-2">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <p className="font-bold text-brand-900 text-lg">Hospital Partner Program</p>
                <p className="text-sm text-brand-700 mt-1">Get verified. Receive patient leads.</p>
              </div>
            </div>
            <p className="text-sm text-brand-700 leading-relaxed mb-4">
              Free listing + Verified badge. Pro plan includes sponsored placement and direct patient enquiry routing.
            </p>
            <Link href="/partner" className="btn btn-primary btn-md w-full justify-center text-sm font-bold">
              List Your Hospital <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── AI Symptom CTA ── */}
      <section className="px-4 pb-8 max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-teal-700 via-brand-700 to-brand-800 rounded-3xl p-8 sm:p-12 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative">
            <span className="badge bg-teal-400/20 text-teal-200 border border-teal-400/30 mb-4 text-sm">✨ AI-Powered</span>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Don't know your treatment?</h2>
            <p className="text-white/80 text-base sm:text-lg mb-7 max-w-lg mx-auto leading-relaxed">
              Describe symptoms in plain language. Claude AI maps them to conditions, specialists, and treatment costs.
            </p>
            <Link href="/symptoms" className="btn bg-white text-brand-700 hover:bg-teal-50 btn-lg font-bold w-full sm:w-auto justify-center text-base">
              <Stethoscope className="w-5 h-5" /> Analyze My Symptoms
            </Link>
          </div>
        </div>
      </section>

      {/* ── Report Analyzer CTA ── */}
      <section className="px-4 pb-8 max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-purple-700 via-indigo-700 to-brand-800 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
            <div className="flex-1 text-center sm:text-left">
              <span className="badge bg-purple-400/20 text-purple-200 border border-purple-400/30 mb-4 text-sm">📋 AI Report Reader</span>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Understand your lab reports instantly</h2>
              <p className="text-white/80 text-base sm:text-lg leading-relaxed">
                Upload blood tests, X-rays, or any diagnostic report. AI explains every parameter in your language — Hindi, Tamil, Bengali & 7 more.
              </p>
            </div>
            <Link href="/reports" className="btn bg-white text-purple-700 hover:bg-purple-50 btn-lg font-bold w-full sm:w-auto justify-center text-base shrink-0">
              <FlaskConical className="w-5 h-5" /> Analyze Report
            </Link>
          </div>
        </div>
      </section>

      {/* ── Popular treatments ── */}
      <section className="px-4 pb-8 max-w-6xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-5">Popular Treatment Cost Pages</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {TOP_TREATMENTS.map(t => (
            <Link key={t.slug} href={`/treatments/${t.slug}?city=${t.city}`}
              className="card p-4 sm:p-5 hover:border-brand-200 hover:shadow-lg transition-all active:scale-[0.97] flex items-center gap-3 group">
              <span className="text-3xl sm:text-4xl leading-none">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm sm:text-base leading-tight group-hover:text-brand-600 line-clamp-1">{t.name}</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">{t.city} · {t.range}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-white py-12 sm:py-16 px-4 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">How ClearMed works</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { step: '01', icon: '🔍', title: 'Search', desc: 'Find hospitals by treatment or describe your symptoms' },
              { step: '02', icon: '💰', title: 'Compare Costs', desc: 'See real costs from verified patient bills' },
              { step: '03', icon: '🛡️', title: 'Check Insurance', desc: 'Find cashless hospitals and estimate coverage' },
              { step: '04', icon: '⭐', title: 'Contribute', desc: 'Upload your bill, earn points, help the next patient' },
            ].map(s => (
              <div key={s.step} className="text-center p-4">
                <div className="w-14 h-14 bg-brand-600 text-white rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-4">{s.icon}</div>
                <p className="font-bold text-gray-900 text-base sm:text-lg mb-2">{s.title}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gamification CTA ── */}
      <section className="hero-gradient py-12 sm:py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Help make healthcare transparent in India</h2>
          <p className="text-white/75 text-base sm:text-lg mb-8 leading-relaxed">Every bill you contribute helps thousands of patients. Earn ClearMed Points, unlock badges, climb the leaderboard.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/upload" className="btn bg-white text-brand-700 hover:bg-brand-50 btn-lg font-bold w-full sm:w-auto justify-center text-base">
              <Upload className="w-5 h-5" /> Upload Your Bill
            </Link>
            <Link href="/leaderboard" className="btn border-2 border-white/40 text-white hover:bg-white/10 btn-lg w-full sm:w-auto justify-center text-base">
              <Trophy className="w-5 h-5" /> See Leaderboard
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
