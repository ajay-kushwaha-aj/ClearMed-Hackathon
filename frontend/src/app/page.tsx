import Image from 'next/image';
import Link from 'next/link';
import { Search, Shield, TrendingDown, ArrowRight, Upload, Stethoscope, Trophy, TrendingUp, BarChart3, MapPin, Building2, IndianRupee } from 'lucide-react';
import Navbar from '@/components/Navbar';
import SearchBar from '@/components/SearchBar';

const MOBILE_QUICK_LINKS = [
  { icon: '🔍', label: 'Find Hospitals', href: '/search', color: 'bg-brand-50 text-brand-700' },
  { icon: '🩺', label: 'Check Symptoms', href: '/symptoms', color: 'bg-teal-50 text-teal-700' },
  { icon: '🛡️', label: 'Insurance', href: '/insurance', color: 'bg-emerald-50 text-emerald-700' },
  { icon: '📊', label: 'Cost Trends', href: '/dashboard', color: 'bg-purple-50 text-purple-700' },
  { icon: '🏆', label: 'Leaderboard', href: '/leaderboard', color: 'bg-amber-50 text-amber-700' },
  { icon: '💬', label: 'Reviews', href: '/community', color: 'bg-pink-50 text-pink-700' },
];

const TOP_TREATMENTS = [
  { icon:'🦵', name:'Knee Replacement', slug:'knee-replacement', city:'Delhi', range:'₹1.8L–₹3.2L' },
  { icon:'🫀', name:'Angioplasty',      slug:'angioplasty',      city:'Mumbai',   range:'₹2.5L–₹5L'   },
  { icon:'👁️', name:'Cataract Surgery', slug:'cataract-surgery', city:'Delhi', range:'₹25K–₹80K'    },
  { icon:'👶', name:'Normal Delivery',  slug:'normal-delivery',  city:'Delhi', range:'₹40K–₹1.2L'   },
  { icon:'🔬', name:'Gallbladder',      slug:'gallbladder-removal', city:'Bengaluru', range:'₹60K–₹1.5L' },
  { icon:'💎', name:'Kidney Stone',     slug:'kidney-stone-removal', city:'Delhi', range:'₹80K–₹2L'  },
];

const STATS = [
  { emoji:'🏥', value:'28+',  label:'Hospitals' },
  { emoji:'💊', value:'29',   label:'Treatments' },
  { emoji:'🧾', value:'200+', label:'Verified Bills' },
  { emoji:'🌆', value:'3',    label:'Cities' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar transparent />

      {/* ── Hero ── */}
      <section className="hero-gradient min-h-[75vh] sm:min-h-[80vh] flex flex-col items-center justify-center px-4 text-center relative pt-16 pb-16 sm:pb-20">
        <div className="absolute inset-0 opacity-[0.06]" style={{backgroundImage:'radial-gradient(circle,white 1px,transparent 1px)',backgroundSize:'28px 28px'}}/>
        <div className="relative max-w-3xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 badge bg-white/15 text-white border border-white/20 mb-5 text-xs sm:text-sm">
            <span className="text-yellow-300">★</span> Trusted by patients in Delhi, Mumbai & Bengaluru
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight mb-4">
            Know the real cost of<br/>
            <span className="text-teal-300">healthcare</span> before you pay
          </h1>
          <p className="text-white/75 text-base sm:text-xl mb-8 max-w-xl mx-auto">
            Compare verified hospital costs. Check insurance coverage. Earn points for contributing your bill.
          </p>
          <SearchBar />

          {/* CTA buttons — stacked on mobile */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <Link href="/symptoms" className="btn bg-white/15 hover:bg-white/25 text-white border border-white/30 btn-lg w-full sm:w-auto justify-center">
              <Stethoscope className="w-5 h-5"/> Check Symptoms
            </Link>
            <Link href="/insurance" className="btn bg-white/15 hover:bg-white/25 text-white border border-white/30 btn-lg w-full sm:w-auto justify-center">
              <Shield className="w-5 h-5"/> Find Cashless Hospitals
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-3xl mx-auto px-4">
          <div className="grid grid-cols-4 gap-3">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl leading-none mb-1">{s.emoji}</p>
                <p className="text-xl sm:text-2xl font-black text-brand-700">{s.value}</p>
                <p className="text-gray-400 text-[10px] sm:text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile quick links grid ── */}
      <section className="px-4 py-6 sm:py-8 max-w-4xl mx-auto">
        <h2 className="text-base font-bold text-gray-700 mb-3">Quick Access</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {MOBILE_QUICK_LINKS.map(link => (
            <Link key={link.href} href={link.href}
              className={`${link.color} rounded-2xl p-3 text-center flex flex-col items-center gap-1.5 hover:opacity-80 transition-all active:scale-95`}>
              <span className="text-2xl leading-none">{link.icon}</span>
              <span className="text-xs font-semibold leading-tight">{link.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Phase 5 Feature cards ── */}
      <section className="px-4 pb-6 max-w-4xl mx-auto">
        <div className="grid sm:grid-cols-2 gap-3">
          {/* Insurance card */}
          <div className="card p-5 bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-100">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-teal-600"/>
              </div>
              <div>
                <p className="font-bold text-teal-900 text-sm">Insurance Coverage Estimator</p>
                <p className="text-xs text-teal-700 mt-0.5">See exactly how much your policy covers</p>
              </div>
            </div>
            <p className="text-xs text-teal-700 leading-relaxed mb-3">
              Support for Star Health, HDFC Ergo, Niva Bupa, Care Health, and 6 more insurers. Find cashless hospitals near you.
            </p>
            <Link href="/insurance" className="btn bg-teal-600 hover:bg-teal-700 text-white btn-sm w-full justify-center text-xs">
              Check My Coverage <ArrowRight className="w-3.5 h-3.5"/>
            </Link>
          </div>

          {/* Partner card */}
          <div className="card p-5 bg-gradient-to-br from-brand-50 to-blue-50 border-brand-100">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-brand-600"/>
              </div>
              <div>
                <p className="font-bold text-brand-900 text-sm">Hospital Partner Program</p>
                <p className="text-xs text-brand-700 mt-0.5">Get verified. Receive patient leads.</p>
              </div>
            </div>
            <p className="text-xs text-brand-700 leading-relaxed mb-3">
              Free listing + Verified badge. Pro plan includes sponsored placement and direct patient enquiry routing.
            </p>
            <Link href="/partner" className="btn btn-primary btn-sm w-full justify-center text-xs">
              List Your Hospital <ArrowRight className="w-3.5 h-3.5"/>
            </Link>
          </div>
        </div>
      </section>

      {/* ── AI Symptom CTA ── */}
      <section className="px-4 pb-6 max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-teal-700 via-brand-700 to-brand-800 rounded-3xl p-6 sm:p-8 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle,white 1px,transparent 1px)',backgroundSize:'20px 20px'}}/>
          <div className="relative">
            <span className="badge bg-teal-400/20 text-teal-200 border border-teal-400/30 mb-3 text-xs">✨ AI-Powered</span>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Don't know your treatment?</h2>
            <p className="text-white/75 text-sm sm:text-base mb-5 max-w-sm mx-auto">
              Describe symptoms in plain language. Claude AI maps them to conditions, specialists, and treatment costs.
            </p>
            <Link href="/symptoms" className="btn bg-white text-brand-700 hover:bg-teal-50 btn-lg font-bold w-full sm:w-auto justify-center">
              <Stethoscope className="w-5 h-5"/> Analyze My Symptoms
            </Link>
          </div>
        </div>
      </section>

      {/* ── Popular treatments ── */}
      <section className="px-4 pb-6 max-w-4xl mx-auto">
        <h2 className="text-base font-bold text-gray-700 mb-3">Popular Treatment Cost Pages</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {TOP_TREATMENTS.map(t => (
            <Link key={t.slug} href={`/treatments/${t.slug}?city=${t.city}`}
              className="card p-3 hover:border-brand-200 hover:shadow-md transition-all active:scale-[0.97] flex items-center gap-2.5 group">
              <span className="text-2xl leading-none">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-xs leading-tight group-hover:text-brand-600 line-clamp-1">{t.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{t.city} · {t.range}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-white py-10 px-4 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-6">How ClearMed works</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { step:'01', icon:'🔍', title:'Search', desc:'Find hospitals by treatment or describe your symptoms' },
              { step:'02', icon:'💰', title:'Compare Costs', desc:'See real costs from verified patient bills' },
              { step:'03', icon:'🛡️', title:'Check Insurance', desc:'Find cashless hospitals and estimate coverage' },
              { step:'04', icon:'⭐', title:'Contribute', desc:'Upload your bill, earn points, help the next patient' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-11 h-11 bg-brand-600 text-white rounded-2xl flex items-center justify-center text-xl font-black mx-auto mb-2">{s.icon}</div>
                <p className="font-bold text-gray-900 text-xs mb-1">{s.title}</p>
                <p className="text-[11px] text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gamification CTA ── */}
      <section className="hero-gradient py-10 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Help make healthcare transparent in India</h2>
          <p className="text-white/70 text-sm mb-6">Every bill you contribute helps thousands of patients. Earn ClearMed Points, unlock badges, climb the leaderboard.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/upload" className="btn bg-white text-brand-700 hover:bg-brand-50 btn-lg font-bold w-full sm:w-auto justify-center">
              <Upload className="w-5 h-5"/> Upload Your Bill
            </Link>
            <Link href="/leaderboard" className="btn border-2 border-white/40 text-white hover:bg-white/10 btn-lg w-full sm:w-auto justify-center">
              <Trophy className="w-5 h-5"/> See Leaderboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 px-4 pb-24 lg:pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
            {[
              { title:'Platform', links:[{label:'Find Hospitals',href:'/search'},{label:'Symptom Analyzer',href:'/symptoms'},{label:'Cost Intelligence',href:'/dashboard'},{label:'Upload Bill',href:'/upload'}] },
              { title:'Insurance', links:[{label:'Cashless Hospitals',href:'/insurance'},{label:'Coverage Estimator',href:'/insurance'},{label:'Find Insurers',href:'/insurance'}] },
              { title:'For Hospitals', links:[{label:'Partner Program',href:'/partner'},{label:'Pricing',href:'/pricing'},{label:'B2B Data API',href:'/b2b'}] },
              { title:'Legal', links:[{label:'Privacy Policy',href:'/privacy'},{label:'Terms of Service',href:'/terms'},{label:'Contact',href:'mailto:hello@clearmed.in'}] },
            ].map(col => (
              <div key={col.title}>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">{col.title}</p>
                <div className="space-y-2">
                  {col.links.map(l => (
                    <Link key={l.label} href={l.href} className="block text-gray-500 hover:text-gray-300 text-xs transition-colors">{l.label}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-6 text-center">
            <p className="text-gray-500 text-xs">© 2025 ClearMed Health Technologies Pvt. Ltd.</p>
            <p className="text-gray-600 text-xs mt-1.5">Medical disclaimer: ClearMed does not provide medical diagnosis or advice. Always consult a qualified doctor.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
