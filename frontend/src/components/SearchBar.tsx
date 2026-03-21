'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, Stethoscope, ChevronDown } from 'lucide-react';
import { treatmentsAPI, Treatment } from '@/lib/api';

const POPULAR = [
  'Knee Replacement', 'Angioplasty', 'Bypass Surgery',
  'Kidney Stone Removal', 'Cataract Surgery', 'Normal Delivery',
];

const CITIES = ['Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Hyderabad'];

export default function SearchBar({
  size = 'lg',
  defaultValue = '',
}: {
  size?: 'lg' | 'md';
  defaultValue?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState('Delhi');
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await treatmentsAPI.search(query);
        setResults(res.data.slice(0, 7));
      } catch { setResults([]); } finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const go = (q: string, c = city) => {
    setOpen(false);
    router.push(`/search?treatment=${encodeURIComponent(q)}&city=${encodeURIComponent(c)}`);
  };

  if (size === 'md') {
    return (
      <div ref={wrapperRef} className="flex items-center gap-2 w-full relative">
        <div className="relative flex-1">
          {loading
            ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
            : <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
          <input ref={inputRef} type="text" value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={e => { if (e.key === 'Enter' && query) go(query); if (e.key === 'Escape') setOpen(false); }}
            placeholder="Search treatment..."
            className="w-full h-10 pl-10 pr-8 rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 focus:border-brand-400 focus:outline-none text-sm"
            autoComplete="off" />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          )}
          {open && results.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-100 z-[100] overflow-hidden max-h-60 overflow-y-auto">
              {results.map(t => (
                <button key={t.id} onClick={() => { setQuery(t.name); go(t.name); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-brand-50 flex items-center gap-2 text-sm">
                  <Stethoscope className="w-3.5 h-3.5 text-brand-400 shrink-0" />{t.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <select value={city} onChange={e => setCity(e.target.value)}
          className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:border-brand-400 focus:outline-none w-28 cursor-pointer">
          {CITIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="w-full max-w-2xl mx-auto relative z-10">

      {/* Search row */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch">

        {/* Treatment input */}
        <div className="relative flex-1">
          {loading
            ? <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 animate-spin" />
            : <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />}
          <input
            ref={inputRef} type="text" value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={e => { if (e.key === 'Enter' && query) go(query); if (e.key === 'Escape') setOpen(false); }}
            placeholder="Search treatment, surgery, condition..."
            className="w-full h-14 pl-12 pr-10 rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder:text-white/50 focus:border-white/60 focus:bg-white/20 focus:outline-none text-base transition-all"
            autoComplete="off" />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); }} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* City selector */}
        <div className="relative sm:w-36">
          <select value={city} onChange={e => setCity(e.target.value)}
            className="w-full h-14 pl-4 pr-9 rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white focus:border-white/60 focus:outline-none text-sm font-medium cursor-pointer appearance-none"
            style={{ WebkitAppearance: 'none' }}>
            {CITIES.map(c => (
              <option key={c} value={c} style={{ color: '#1f2937', background: '#ffffff' }}>{c}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" />
        </div>

        {/* Search button */}
        <button
          onClick={() => query ? go(query) : router.push(`/search?city=${city}`)}
          className="h-14 px-7 bg-white text-brand-700 font-bold rounded-2xl hover:bg-brand-50 active:scale-95 transition-all shadow-lg text-sm whitespace-nowrap">
          Search
        </button>
      </div>

      {/* Autocomplete dropdown — appears BELOW the entire row, not inside any col */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[999] overflow-hidden max-h-72 overflow-y-auto">
          {results.length > 0 ? (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                Treatments & Procedures
              </div>
              {results.map(t => (
                <button key={t.id} onClick={() => { setQuery(t.name); go(t.name); }}
                  className="w-full text-left px-4 py-3 hover:bg-brand-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0">
                  <Stethoscope className="w-4 h-4 text-brand-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.category} · {t.specialization}</p>
                  </div>
                </button>
              ))}
            </>
          ) : query.length >= 2 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-500">No results for "{query}"</p>
              <button onClick={() => go(query)} className="mt-2 text-xs text-brand-600 hover:underline font-medium">
                Search all hospitals →
              </button>
            </div>
          ) : (
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Popular Treatments</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map(p => (
                  <button key={p} onClick={() => { setQuery(p); go(p); }}
                    className="px-3 py-1.5 text-xs bg-gray-50 hover:bg-brand-50 hover:text-brand-700 text-gray-600 rounded-lg font-medium transition-colors border border-gray-100">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
