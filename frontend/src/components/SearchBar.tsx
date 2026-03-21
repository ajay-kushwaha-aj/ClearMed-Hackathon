'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, Stethoscope } from 'lucide-react';
import { treatmentsAPI, Treatment } from '@/lib/api';

const POPULAR = [
  'Knee Replacement', 'Angioplasty', 'Bypass Surgery',
  'Kidney Stone Removal', 'Cataract Surgery', 'C-Section',
];

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
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const go = (q: string, c = city) => {
    setOpen(false);
    router.push(`/search?treatment=${encodeURIComponent(q)}&city=${encodeURIComponent(c)}`);
  };

  const containerCls = size === 'lg'
    ? 'flex flex-col sm:flex-row gap-2 w-full max-w-2xl'
    : 'flex items-center gap-2 w-full';

  const inputCls = size === 'lg'
    ? 'flex-1 h-14 pl-12 pr-10 rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur text-white placeholder:text-white/60 focus:border-white/60 focus:bg-white/20 focus:outline-none text-base transition-all'
    : 'flex-1 h-10 pl-10 pr-8 rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 text-sm transition-all';

  return (
    <div ref={wrapperRef} className={`${containerCls} relative`}>
      {/* Treatment search */}
      <div className="relative flex-1">
        {loading
          ? <Loader2 className={`absolute left-3.5 top-1/2 -translate-y-1/2 animate-spin ${size === 'lg' ? 'w-5 h-5 text-white/60' : 'w-4 h-4 text-gray-400'}`} />
          : <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${size === 'lg' ? 'w-5 h-5 text-white/60' : 'w-4 h-4 text-gray-400'}`} />
        }
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => { if (e.key === 'Enter' && query) go(query); if (e.key === 'Escape') setOpen(false); }}
          placeholder="Search treatment, surgery, condition..."
          className={inputCls}
          autoComplete="off"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
            className={`absolute right-3 top-1/2 -translate-y-1/2 ${size === 'lg' ? 'text-white/60 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}>
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Dropdown */}
        {open && (query.length >= 2 || results.length === 0) && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden max-h-80 overflow-y-auto">
            {results.length > 0 ? (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                  Treatments & Procedures
                </div>
                {results.map(t => (
                  <button key={t.id} onClick={() => { setQuery(t.name); go(t.name); }}
                    className="w-full text-left px-4 py-3 hover:bg-brand-50 flex items-center gap-3 transition-colors">
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
                <p className="text-sm text-gray-500">No treatments found for "{query}"</p>
                <button onClick={() => go(query)} className="mt-2 text-xs text-brand-600 hover:underline">
                  Search anyway →
                </button>
              </div>
            ) : null}

            {/* Popular quick picks */}
            {query.length < 2 && (
              <div className="p-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Popular</p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR.map(p => (
                    <button key={p} onClick={() => { setQuery(p); go(p); }}
                      className="px-2.5 py-1.5 text-xs bg-gray-50 hover:bg-brand-50 hover:text-brand-700 text-gray-600 rounded-lg font-medium transition-colors">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* City selector */}
      <select
        value={city}
        onChange={e => setCity(e.target.value)}
        className={size === 'lg'
          ? 'h-14 px-4 pr-9 rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur text-white focus:border-white/60 focus:outline-none text-sm font-medium sm:w-36 appearance-none cursor-pointer'
          : 'h-10 px-3 pr-8 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:border-brand-400 focus:outline-none w-28 appearance-none cursor-pointer'
        }>
        <option value="Delhi">Delhi</option>
        <option value="Mumbai">Mumbai</option>
        <option value="Bengaluru">Bengaluru</option>
        <option value="Chennai">Chennai</option>
        <option value="Hyderabad">Hyderabad</option>
      </select>

      {/* Search button */}
      {size === 'lg' && (
        <button onClick={() => query && go(query)}
          className="h-14 px-7 bg-white text-brand-700 font-semibold rounded-2xl hover:bg-brand-50 transition-all shadow-sm hover:shadow-md text-sm whitespace-nowrap">
          Search
        </button>
      )}
    </div>
  );
}
