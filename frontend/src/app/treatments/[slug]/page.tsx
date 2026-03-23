import { Metadata } from 'next';
import Link from 'next/link';
import {
  IndianRupee, Clock, Building2, Star, Users, CheckCircle,
  ArrowRight, MapPin, TrendingDown, AlertCircle, ChevronRight
} from 'lucide-react';
import Navbar from '@/components/Navbar';

const isL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API = isL ? `http://${window.location.hostname}:4000/api` : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');

interface TreatmentPageData {
  treatment: {
    id: string; name: string; slug: string; category: string;
    specialization: string; description?: string; avgDuration?: number;
    seoTitle?: string; seoDescription?: string; seoKeywords?: string[];
    faqSchema?: Array<{ question: string; answer: string }>;
  };
  topHospitals: Array<{
    hospitalId: string; hospitalName: string; hospitalSlug: string;
    city: string; type: string; naabhStatus: boolean; rating?: number;
    avgCost?: number; minCost?: number; maxCost?: number;
  }>;
  costByCity: Array<{ city: string; avg: number; min: number; max: number; count: number }>;
  totalHospitals: number;
}

async function getData(slug: string): Promise<TreatmentPageData | null> {
  try {
    const res = await fetch(`${API}/seo/treatment/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getData(params.slug);
  if (!data) return { title: 'Treatment Not Found — ClearMed' };

  const { treatment, costByCity } = data;
  const delhiCost = costByCity.find(c => c.city === 'Delhi');
  const avgStr = delhiCost ? ` — Avg ₹${Math.round(delhiCost.avg / 1000)}K in Delhi` : '';

  return {
    title: treatment.seoTitle || `${treatment.name} Cost in India${avgStr} | ClearMed`,
    description: treatment.seoDescription ||
      `Compare ${treatment.name} cost across ${data.totalHospitals}+ hospitals in India. Real prices from verified patient bills.`,
    keywords: treatment.seoKeywords || [treatment.name, treatment.category, 'hospital cost India'],
  };
}

function formatCurrency(n: number) {
  if (!n) return '—';
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

const CITY_COLORS: Record<string, string> = {
  Delhi: 'bg-blue-100 text-blue-700',
  Mumbai: 'bg-purple-100 text-purple-700',
  Bengaluru: 'bg-green-100 text-green-700',
  Chennai: 'bg-orange-100 text-orange-700',
  Hyderabad: 'bg-pink-100 text-pink-700',
};

export default async function TreatmentPage({ params }: { params: { slug: string } }) {
  const data = await getData(params.slug);

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar/>
        <div className="pt-16 flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center px-4">
          <AlertCircle className="w-12 h-12 text-gray-300"/>
          <h1 className="text-xl font-bold text-gray-700">Treatment not found</h1>
          <Link href="/search" className="btn btn-primary btn-md">Search Hospitals</Link>
        </div>
      </div>
    );
  }

  const { treatment, topHospitals, costByCity, totalHospitals } = data;
  const cheapestCity = [...costByCity].sort((a, b) => a.avg - b.avg)[0];

  // JSON-LD structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    name: treatment.name,
    description: treatment.description || `${treatment.name} procedure in India`,
    procedureType: treatment.category,
    followup: treatment.avgDuration ? `Average hospital stay: ${treatment.avgDuration} days` : undefined,
    preparation: 'Please consult your doctor for preparation guidelines.',
  };

  const faqSchema = treatment.faqSchema ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: treatment.faqSchema.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  } : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar/>

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}/>
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}/>}

      <div className="pt-16 pb-20 lg:pb-0">
        {/* Hero */}
        <div className="hero-gradient py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-white/60 text-xs mb-4">
              <Link href="/" className="hover:text-white">Home</Link>
              <ChevronRight className="w-3 h-3"/>
              <Link href="/search" className="hover:text-white">Treatments</Link>
              <ChevronRight className="w-3 h-3"/>
              <span className="text-white">{treatment.name}</span>
            </nav>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="badge bg-white/20 text-white">{treatment.category}</span>
                  <span className="badge bg-white/15 text-white/80">{treatment.specialization}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  {treatment.name}
                </h1>
                {treatment.description && (
                  <p className="text-white/70 max-w-xl leading-relaxed">{treatment.description}</p>
                )}
              </div>

              <div className="bg-white/10 rounded-2xl p-4 border border-white/20 min-w-[180px]">
                {treatment.avgDuration && (
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-teal-300"/>
                    <span className="text-white text-sm">{treatment.avgDuration}–{treatment.avgDuration + 2} days stay</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-teal-300"/>
                  <span className="text-white text-sm">{totalHospitals}+ hospitals</span>
                </div>
                {cheapestCity && (
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-teal-300"/>
                    <span className="text-white text-sm">From {formatCurrency(cheapestCity.min)} in {cheapestCity.city}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">

              {/* Cost by city table */}
              <div className="card p-6">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                  <IndianRupee className="w-5 h-5 text-brand-500"/>
                  {treatment.name} Cost Across India
                </h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                      <th className="py-2 text-left">City</th>
                      <th className="py-2 text-right">Min</th>
                      <th className="py-2 text-right">Avg</th>
                      <th className="py-2 text-right">Max</th>
                      <th className="py-2 text-center">Bills</th>
                      <th className="py-2"/>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {costByCity.map(c => (
                      <tr key={c.city} className="hover:bg-gray-50">
                        <td className="py-3">
                          <span className={`badge text-xs ${CITY_COLORS[c.city] || 'bg-gray-100 text-gray-700'}`}>{c.city}</span>
                        </td>
                        <td className="py-3 text-right text-xs text-gray-500">{formatCurrency(c.min)}</td>
                        <td className="py-3 text-right font-bold text-brand-700">{formatCurrency(c.avg)}</td>
                        <td className="py-3 text-right text-xs text-gray-500">{formatCurrency(c.max)}</td>
                        <td className="py-3 text-center">
                          <span className="text-xs text-gray-400">{c.count}</span>
                        </td>
                        <td className="py-3">
                          <Link href={`/search?treatment=${treatment.slug}&city=${c.city}`}
                            className="text-xs text-brand-600 hover:underline flex items-center gap-0.5">
                            Find <ArrowRight className="w-3 h-3"/>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <p className="text-xs text-gray-400 mt-4 flex items-center gap-1.5 pt-3 border-t border-gray-50">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0"/>
                  Costs are based on verified patient-submitted bills and may vary based on complications, implant choice, and insurance.
                </p>
              </div>

              {/* Top hospitals */}
              <div className="card p-6">
                <h2 className="font-bold text-gray-900 mb-4 text-lg">
                  Best Hospitals for {treatment.name}
                </h2>
                <div className="space-y-3">
                  {topHospitals.map((h, i) => (
                    <div key={h.hospitalId} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-brand-50 hover:border-brand-200 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                        ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-brand-50 text-brand-500'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-800 text-sm">{h.hospitalName}</p>
                          {h.naabhStatus && (
                            <span className="flex items-center gap-0.5 text-xs text-emerald-600">
                              <CheckCircle className="w-3 h-3"/> NABH
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin className="w-3 h-3"/>{h.city}
                          </span>
                          <span className={`badge text-xs ${h.type === 'GOVERNMENT' ? 'badge-green' : h.type === 'PRIVATE' ? 'badge-blue' : 'badge-amber'}`}>
                            {h.type.charAt(0) + h.type.slice(1).toLowerCase()}
                          </span>
                          {h.rating && (
                            <span className="flex items-center gap-0.5 text-xs text-amber-600">
                              <Star className="w-3 h-3 fill-amber-400"/> {h.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {h.avgCost && <p className="font-bold text-brand-700 text-sm">{formatCurrency(h.avgCost)}</p>}
                        {h.minCost && h.maxCost && (
                          <p className="text-xs text-gray-400">{formatCurrency(h.minCost)}–{formatCurrency(h.maxCost)}</p>
                        )}
                      </div>
                      <Link href={`/hospitals/${h.hospitalSlug}`}
                        className="btn btn-secondary btn-sm text-xs px-3 flex-shrink-0">
                        View <ArrowRight className="w-3 h-3"/>
                      </Link>
                    </div>
                  ))}
                </div>

                <Link href={`/search?treatment=${treatment.slug}`}
                  className="flex items-center justify-center gap-2 mt-4 py-3 border-2 border-dashed border-brand-200 text-brand-600 rounded-xl text-sm font-medium hover:bg-brand-50 transition-colors">
                  View All {totalHospitals} Hospitals <ArrowRight className="w-4 h-4"/>
                </Link>
              </div>

              {/* FAQ Section */}
              {treatment.faqSchema && treatment.faqSchema.length > 0 && (
                <div className="card p-6">
                  <h2 className="font-bold text-gray-900 mb-4 text-lg">
                    Frequently Asked Questions
                  </h2>
                  <div className="space-y-4">
                    {treatment.faqSchema.map((faq, i) => (
                      <div key={i} className="border-b border-gray-100 pb-4 last:border-0">
                        <p className="font-semibold text-gray-800 text-sm mb-2">{faq.question}</p>
                        <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Quick search CTA */}
              <div className="card p-5 bg-gradient-to-br from-brand-600 to-brand-800 text-white">
                <h3 className="font-bold mb-1">Find the best hospital for you</h3>
                <p className="text-white/75 text-xs mb-3">Compare costs, ratings and ClearMed scores side-by-side.</p>
                <Link href={`/search?treatment=${treatment.slug}`}
                  className="block text-center py-2.5 bg-white text-brand-700 font-bold text-sm rounded-xl hover:bg-brand-50 transition-colors">
                  Search {treatment.name} Hospitals
                </Link>
              </div>

              {/* Stats */}
              <div className="card p-5">
                <h3 className="font-semibold text-gray-700 text-sm mb-4">Quick Facts</h3>
                <div className="space-y-3">
                  {treatment.avgDuration && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-gray-400 flex-shrink-0"/>
                      <div>
                        <p className="text-xs text-gray-500">Average Hospital Stay</p>
                        <p className="text-sm font-semibold text-gray-800">{treatment.avgDuration}–{treatment.avgDuration + 2} days</p>
                      </div>
                    </div>
                  )}
                  {costByCity[0] && (
                    <div className="flex items-center gap-3">
                      <IndianRupee className="w-4 h-4 text-gray-400 flex-shrink-0"/>
                      <div>
                        <p className="text-xs text-gray-500">Avg Cost Range</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {formatCurrency(Math.min(...costByCity.map(c => c.min)))} – {formatCurrency(Math.max(...costByCity.map(c => c.max)))}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0"/>
                    <div>
                      <p className="text-xs text-gray-500">Available Hospitals</p>
                      <p className="text-sm font-semibold text-gray-800">{totalHospitals}+ hospitals</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compare CTA */}
              <div className="card p-5 border-brand-200 bg-brand-50">
                <h3 className="font-semibold text-brand-900 text-sm mb-2">Compare Hospitals</h3>
                <p className="text-brand-700/70 text-xs mb-3">Select up to 4 hospitals and compare costs, scores, and facilities.</p>
                <Link href={`/search?treatment=${treatment.slug}`} className="btn btn-primary btn-sm w-full justify-center text-xs">
                  Start Comparing
                </Link>
              </div>

              {/* Upload CTA */}
              <div className="card p-5 text-center">
                <p className="text-sm font-semibold text-gray-800 mb-1">Had this treatment?</p>
                <p className="text-xs text-gray-500 mb-3">Share your bill and earn 50+ ClearMed points.</p>
                <Link href={`/upload?treatment=${treatment.slug}`}
                  className="btn btn-secondary btn-sm w-full justify-center text-xs">
                  <Users className="w-3.5 h-3.5"/> Contribute Your Bill
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
