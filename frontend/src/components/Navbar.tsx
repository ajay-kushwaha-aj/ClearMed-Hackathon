'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Menu, X, Heart, Search, Upload, Stethoscope, LayoutDashboard, Trophy, TrendingUp, Users, Shield, Building2, IndianRupee, LogIn, LogOut, UserCircle, FileText } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/search', icon: <Search className="w-4 h-4" />, label: 'Find Hospitals' },
  { href: '/symptoms', icon: <Stethoscope className="w-4 h-4" />, label: 'Symptoms' },
  { href: '/reports', icon: <FileText className="w-4 h-4" />, label: 'Reports' },
  { href: '/insurance', icon: <Shield className="w-4 h-4" />, label: 'Insurance' },
  { href: '/dashboard', icon: <TrendingUp className="w-4 h-4" />, label: 'Cost Trends' },
  { href: '/community', icon: <Users className="w-4 h-4" />, label: 'Reviews' },
  { href: '/admin/analytics', icon: <Shield className="w-4 h-4" />, label: 'Admin' },
];

const MOBILE_NAV = [
  { href: '/', icon: <Heart className="w-5 h-5" />, label: 'Home' },
  { href: '/search', icon: <Search className="w-5 h-5" />, label: 'Search' },
  { href: '/symptoms', icon: <Stethoscope className="w-5 h-5" />, label: 'Symptoms' },
  { href: '/reports', icon: <FileText className="w-5 h-5" />, label: 'Reports' },
  { href: '/upload', icon: <Upload className="w-5 h-5" />, label: 'Upload' },
];

export default function Navbar({ transparent = false }: { transparent?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ name: string; points: number } | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    // Load user from localStorage
    try {
      const stored = localStorage.getItem('clearmed_user');
      if (stored) setUser(JSON.parse(stored));
    } catch { }
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('clearmed_token');
    localStorage.removeItem('clearmed_user');
    setUser(null);
    setOpen(false);
    router.push('/');
  };

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href));
  const solid = !transparent || scrolled || open;
  const bg = solid ? 'bg-white border-b border-gray-100 shadow-sm' : 'bg-transparent';
  const linkBase = solid ? 'text-gray-600 hover:text-brand-700 hover:bg-brand-50' : 'text-white/80 hover:text-white hover:bg-white/10';

  return (
    <>
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${bg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Image src="/logo.png" alt="ClearMed" width={44} height={44} className="rounded-xl" />
              <span className={`text-xl font-bold ${solid ? 'text-brand-800' : 'text-white'}`}>
                Clear<span className={solid ? 'text-brand-500' : 'text-teal-300'}>Med</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {NAV_ITEMS.map(item => (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive(item.href) ? 'bg-brand-100 text-brand-700' : linkBase}`}>
                  {item.icon} {item.label}
                </Link>
              ))}
            </nav>

            {/* Desktop right */}
            <div className="hidden lg:flex items-center gap-2">
              {user ? (
                <>
                  <Link href="/contribute" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${solid ? 'text-gray-600 hover:text-brand-700' : 'text-white/70 hover:text-white'}`}>
                    <Trophy className="w-3.5 h-3.5" />
                    <span className={`${solid ? 'text-brand-600' : 'text-white'} font-bold`}>{user.points || 0} pts</span>
                  </Link>
                  <Link href="/profile" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${solid ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'}`}>
                    <UserCircle className="w-4 h-4" />
                    {user.name?.split(' ')[0]}
                  </Link>
                  <button onClick={handleLogout} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${solid ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-white/50 hover:text-white'}`}>
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className={`btn btn-sm px-4 py-2 text-sm ${solid ? 'btn-secondary' : 'bg-white/15 hover:bg-white/25 text-white border border-white/30'}`}>
                    <LogIn className="w-4 h-4" /> Sign In
                  </Link>
                  <Link href="/signup" className="btn btn-primary btn-sm px-4 py-2 text-sm">
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <button onClick={() => setOpen(!open)}
              className={`lg:hidden p-2 rounded-xl transition-colors ${solid ? 'text-gray-600 hover:bg-gray-100' : 'text-white hover:bg-white/10'}`}>
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl">
            <div className="px-4 py-4 space-y-1 max-h-[75vh] overflow-y-auto">
              {/* User info */}
              {user ? (
                <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-brand-50 rounded-xl">
                  <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center">
                    <UserCircle className="w-5 h-5 text-brand-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-brand-600 font-medium">{user.points || 0} ClearMed Points</p>
                  </div>
                  <button onClick={handleLogout} className="text-xs text-red-500 font-medium flex items-center gap-1">
                    <LogOut className="w-3.5 h-3.5" /> Logout
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Link href="/login" onClick={() => setOpen(false)} className="btn btn-secondary btn-md justify-center text-sm">
                    <LogIn className="w-4 h-4" /> Sign In
                  </Link>
                  <Link href="/signup" onClick={() => setOpen(false)} className="btn btn-primary btn-md justify-center text-sm">
                    Get Started
                  </Link>
                </div>
              )}
              {/* Nav links */}
              {[...NAV_ITEMS,
              { href: '/compare', icon: <Shield className="w-4 h-4" />, label: 'Compare Hospitals' },
              { href: '/leaderboard', icon: <Trophy className="w-4 h-4" />, label: 'Leaderboard' },
              { href: '/partner', icon: <Building2 className="w-4 h-4" />, label: 'Partner Program' },
              { href: '/pricing', icon: <IndianRupee className="w-4 h-4" />, label: 'Pricing' },
              { href: '/upload', icon: <Upload className="w-4 h-4" />, label: 'Upload Bill' },
              { href: '/admin/analytics', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Admin' },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${isActive(item.href) ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                  {item.icon} {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="grid grid-cols-5 h-16">
          {MOBILE_NAV.map(item => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${active ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}>
                <span className={`transition-transform ${active ? 'scale-110' : ''}`}>{item.icon}</span>
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
