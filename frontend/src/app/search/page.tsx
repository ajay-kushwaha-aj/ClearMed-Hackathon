'use client';
export const dynamic = 'force-dynamic';
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, X, ChevronDown, Loader2, Building2, AlertCircle, GitCompare } from 'lucide-react';
import Navbar from '@/components/Navbar';
import HospitalCard from '@/components/HospitalCard';
import SearchBar from '@/components/SearchBar';
import { hospitalsAPI, Hospital } from '@/lib/api';
import Link from 'next/link';

const CITIES = ['Delhi', 'Mumbai', 'Bengaluru'];
const SORT_OPTIONS = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'cost_asc', label: 'Cost: Low to High' },
  { value: 'cost_desc', label: 'Cost: High to Low' },
  { value: 'name', label: 'Name A–Z' },
];

// ─── ALL SEARCH LOGIC IN INNER COMPONENT (useSearchParams lives here) ─────────
function SearchContent() {
  const sp = useSearchParams();
  const router = useRouter();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    treatment: sp.get('treatment') || '',
    search: sp.get('search') || '',
    city: sp.get('city') || 'Delhi',
    type: sp.get('type') || '',
    minCost: sp.get('minCost') || '',
    maxCost: sp.get('maxCost') || '',
    nabh: sp.get('nabh') || '',
    sort: sp.get('sort') || 'rating',
    page: 1,
  });

  const [compareIds, setCompareIds] = useState<string[]>([]);

  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await hospitalsAPI.list({
        treatment: filters.treatment || undefined,
        search: filters.search || undefined,
        city: filters.city || undefined,
        type: (filters.type as 'GOVERNMENT' | 'PRIVATE' | 'TRUST' | 'CHARITABLE') || undefined,
        minCost: filters.minCost ? Number(filters.minCost) : undefined,
        maxCost: filters.maxCost ? Number(filters.maxCost) : undefined,
        nabh: filters.nabh ? filters.nabh === 'true' : undefined,
        sort: filters.sort as 'rating' | 'cost_asc' | 'cost_desc' | 'name',
        page: filters.page,
        limit: 12,
      });
      setHospitals(res.data);
      setTotal(res.meta.total);
    } catch (e) {
      setError('Failed to load hospitals. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchHospitals(); }, [fetchHospitals]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.treatment) params.set('treatment', filters.treatment);
    if (filters.search) params.set('search', filters.search);
    if (filters.city) params.set('city', filters.city);
    if (filters.type) params.set('type', filters.type);
    if (filters.sort !== 'rating') params.set('sort', filters.sort);
    router.replace(`/search?${params}`, { scroll: false });
  }, [filters, router]);

  const setFilter = (key: string, value: string) => {
    setFilters(f => ({ ...f, [key]: value, page: 1 }));
  };

  const clearFilters = () => setFilters(f => ({ ...f, type: '', minCost: '', maxCost: '', nabh: '' }));

  const toggleCompare = (id: string) => {
    setCompareIds(ids =>
      ids.includes(id) ? ids.filter(i => i !== id) : ids.length < 4 ? [...ids, id] : ids
    );
  };

  const activeFilterCount = [filters.type, filters.minCost, filters.maxCost, filters.nabh].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Search header */}
      <div className="bg-brand-900 pt-20 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-white/60 text-sm mb-3">
            {filters.search ? `Searching "${filters.search}"` : filters.treatment ? `Hospitals for "${filters.treatment}"` : 'All Hospitals'}
            {filters.city ? ` in ${filters.city}` : ''}
          </p>
          <SearchBar
            size="md"
            defaultValue={filters.search || filters.treatment}
            onSearch={(q, c) => {
              setFilters(f => ({ ...f, search: q, city: c, page: 1 }));
            }}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Controls bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {/* City tabs */}
            <div className="flex rounded-xl bg-white border border-gray-200 p-0.5 shadow-sm">
              {CITIES.map(c => (
                <button key={c} onClick={() => setFilter('city', c)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${filters.city === c ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                  {c}
                </button>
              ))}
            </div>

            {/* Filter button */}
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all
                ${activeFilterCount > 0 ? 'bg-brand-50 border-brand-300 text-brand-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
              <SlidersHorizontal className="w-4 h-4" />
              Filters {activeFilterCount > 0 && <span className="w-5 h-5 bg-brand-600 text-white rounded-full text-xs flex items-center justify-center">{activeFilterCount}</span>}
            </button>

            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{loading ? '...' : `${total} hospitals`}</span>
            <div className="relative">
              <select value={filters.sort} onChange={e => setFilter('sort', e.target.value)}
                className="input pr-8 h-9 text-sm w-44 appearance-none cursor-pointer">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Hospital Type</label>
                <select value={filters.type} onChange={e => setFilter('type', e.target.value)}
                  className="input h-9 text-sm appearance-none cursor-pointer">
                  <option value="">All types</option>
                  <option value="GOVERNMENT">Government</option>
                  <option value="PRIVATE">Private</option>
                  <option value="CHARITABLE">Charitable</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Min Cost (₹)</label>
                <input type="number" value={filters.minCost} onChange={e => setFilter('minCost', e.target.value)}
                  placeholder="e.g. 50000" className="input h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Max Cost (₹)</label>
                <input type="number" value={filters.maxCost} onChange={e => setFilter('maxCost', e.target.value)}
                  placeholder="e.g. 300000" className="input h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Accreditation</label>
                <select value={filters.nabh} onChange={e => setFilter('nabh', e.target.value)}
                  className="input h-9 text-sm appearance-none cursor-pointer">
                  <option value="">Any</option>
                  <option value="true">NABH Only</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            <p className="text-gray-400 text-sm">Finding hospitals...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-gray-600 font-medium">{error}</p>
            <button onClick={fetchHospitals} className="btn btn-primary btn-sm">Retry</button>
          </div>
        ) : hospitals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <Building2 className="w-12 h-12 text-gray-300" />
            <p className="text-gray-700 font-medium text-lg">No hospitals found</p>
            <p className="text-gray-400 text-sm max-w-sm">
              {filters.search
                ? <>No hospitals matching <strong>"{filters.search}"</strong> found{filters.city ? ` in ${filters.city}` : ''}. Please check the name or try a different city.</>
                : 'Try a different treatment name, city, or clear your filters.'}
            </p>
            <button onClick={() => setFilters(f => ({ ...f, search: '', treatment: '', type: '', minCost: '', maxCost: '', nabh: '' }))} className="btn btn-primary btn-sm mt-2">Clear all filters</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {hospitals.map(h => (
              <HospitalCard
                key={h.id}
                hospital={h}
                treatmentName={filters.treatment}
                selected={compareIds.includes(h.id)}
                onSelect={toggleCompare}
              />
            ))}
          </div>
        )}
      </div>

      {/* Compare float bar */}
      {compareIds.length >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-brand-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-4 border border-brand-700">
            <GitCompare className="w-5 h-5 text-brand-300" />
            <span className="text-sm font-medium">{compareIds.length} hospitals selected</span>
            <Link
              href={`/compare?ids=${compareIds.join(',')}&treatment=${encodeURIComponent(filters.treatment)}`}
              className="btn bg-white text-brand-800 btn-sm hover:bg-brand-50">
              Compare →
            </Link>
            <button onClick={() => setCompareIds([])} className="text-white/50 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VERCEL FIX: Suspense wrapper required for useSearchParams() ───────────────
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading search...</p>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
