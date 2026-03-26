'use client';
import { useState } from 'react';
import { Stethoscope, Search, AlertTriangle, AlertCircle, Clock, CheckCircle, ArrowRight, Loader2, Sparkles, ChevronDown, ChevronUp, ClipboardList, Building2, MapPin, Star, IndianRupee, Info } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Condition {
  name: string;
  likelihood: 'high' | 'moderate' | 'low';
  matchConfidence: number;
  icdCode?: string;
  description: string;
  prerequisites: string[];
  recoveryTime: string;
  department: string;
}

interface HospitalMatch {
  id: string;
  name: string;
  address: string;
  city: string;
  rating: number | null;
  imageUrl: string | null;
  doctors: Array<{ name: string; specialization: string }>;
}

interface SymptomResult {
  conditions: Condition[];
  specialists: string[];
  treatments: string[];
  urgency: 'emergency' | 'urgent' | 'routine' | 'elective';
  disclaimer: string;
  searchQuery: string;
  hospitalsByDepartment?: Record<string, HospitalMatch[]>;
}

const URGENCY: Record<string, { icon: React.ReactNode; label: string; sub: string; bg: string; border: string; text: string }> = {
  emergency: { icon: <AlertTriangle className="w-5 h-5" />, label: 'EMERGENCY', sub: 'Go to ER immediately', bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' },
  urgent: { icon: <AlertCircle className="w-5 h-5" />, label: 'URGENT', sub: 'See a doctor within 24-48 hours', bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700' },
  routine: { icon: <CheckCircle className="w-5 h-5" />, label: 'ROUTINE', sub: 'Schedule when convenient', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  elective: { icon: <Clock className="w-5 h-5" />, label: 'ELECTIVE', sub: 'Non-urgent procedure', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
};

const EXAMPLES = [
  'Knee pain when climbing stairs for 3 months',
  'Chest tightness and shortness of breath',
  'Severe lower back pain radiating to leg',
  'Blurry vision and seeing halos',
  'Gallbladder pain after fatty food',
  'Kidney stone-like back pain',
];

const CONFIDENCE_COLOR = (c: number) =>
  c >= 75 ? 'text-emerald-600' : c >= 40 ? 'text-blue-600' : 'text-gray-500';

const BORDER_COLOR = (l: string) =>
  l === 'high' ? 'border-l-blue-500' : l === 'moderate' ? 'border-l-amber-400' : 'border-l-gray-300';

export default function SymptomAnalyzerPage() {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('Delhi');
  const [result, setResult] = useState<SymptomResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<Array<{ id: string, text: string, options: string[] }> | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const requestQuiz = async (q = query) => {
    if (q.trim().length < 3) return;
    setLoading(true); setError(''); setResult(null); setQuizQuestions(null); setAnswers({}); setExpandedIdx(null);
    try {
      const res = await fetch(`${API}/symptoms/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: q }),
      });
      const data = await res.json();
      if (data.data?.questions) setQuizQuestions(data.data.questions);
      else setError(data.error || 'Failed to generate clarification questions');
    } catch {
      setError('Could not connect to server. Make sure the backend is running.');
    } finally { setLoading(false); }
  };

  const submitFinalAnalysis = async () => {
    setLoading(true); setError('');
    try {
      const formattedAnswers = quizQuestions?.map(q => ({
        question: q.text,
        answer: answers[q.id] || 'Not sure',
      })) || [];
      const res = await fetch(`${API}/symptoms/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: query, city, answers: formattedAnswers }),
      });
      const data = await res.json();
      if (data.data) {
        setResult(data.data);
        setQuizQuestions(null);
      }
      else setError(data.error || 'Analysis failed');
    } catch {
      setError('Could not connect to server.');
    } finally { setLoading(false); }
  };

  const toggleExpand = (idx: number) => {
    setExpandedIdx(prev => prev === idx ? null : idx);
  };

  const getHospitalsForDept = (dept: string): HospitalMatch[] => {
    if (!result?.hospitalsByDepartment) return [];
    return result.hospitalsByDepartment[dept] || [];
  };

  const urgencyConfig = result ? (URGENCY[result.urgency] || URGENCY.routine) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-20 lg:pb-0">
        {/* Hero */}
        <div className="hero-gradient py-12 text-center">
          <div className="max-w-2xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 badge bg-white/15 text-white mb-4">
              <Sparkles className="w-4 h-4 text-teal-300" />
              AI-Powered Symptom Analyzer
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Describe your symptoms
            </h1>
            <p className="text-white/70 text-lg mb-8">
              Get matched to relevant treatments and hospitals in seconds.
            </p>

            {/* Input */}
            <div className="bg-white rounded-2xl p-5 shadow-xl text-left">
              <textarea
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); requestQuiz(); } }}
                placeholder="Describe your symptoms or doctor's recommendation..."
                rows={3}
                className="w-full resize-none text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none leading-relaxed"
                disabled={loading || quizQuestions !== null}
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <select value={city} onChange={e => setCity(e.target.value)}
                    className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer">
                    {['Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow', 'Ahmedabad'].map(c => <option key={c}>{c}</option>)}
                  </select>
                  <span className="text-xs text-gray-400 hidden sm:inline-flex items-center gap-1"><Info className="w-3 h-3" /> Use plain English or medical terms.</span>
                </div>
                {!quizQuestions && (
                  <button onClick={() => requestQuiz()} disabled={loading || query.length < 3}
                    className="btn btn-primary btn-sm px-5">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {loading ? 'Analyzing...' : 'Analyze'}
                    {!loading && <ArrowRight className="w-3.5 h-3.5 ml-0.5" />}
                  </button>
                )}
                {quizQuestions && (
                  <button onClick={() => { setQuizQuestions(null); setAnswers({}); setResult(null); }} className="text-sm font-semibold text-gray-500 hover:text-gray-700">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Examples */}
          {!result && !loading && !quizQuestions && (
            <div className="mb-8">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Try an example</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map(e => (
                  <button key={e} onClick={() => { setQuery(e); requestQuiz(e); }}
                    className="px-3 py-2 bg-white border border-gray-200 hover:border-brand-300 hover:bg-brand-50 text-xs text-gray-600 hover:text-brand-700 rounded-xl transition-all">
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-2 flex-1">
                      <div className="h-5 bg-gray-100 rounded w-48"></div>
                      <div className="h-3 bg-gray-50 rounded w-72"></div>
                    </div>
                    <div className="h-10 w-16 bg-gray-100 rounded"></div>
                  </div>
                  <div className="h-3 bg-gray-50 rounded w-full mt-4"></div>
                  <div className="h-3 bg-gray-50 rounded w-3/4 mt-2"></div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="card p-5 border-red-200 bg-red-50 text-center mb-8">
              <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Quiz Section */}
          {quizQuestions && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-2xl p-6 border border-brand-200 shadow-sm border-t-4 border-t-brand-500">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                  <Stethoscope className="w-6 h-6 text-brand-500" />
                  Clarification Questions
                </h2>
                <p className="text-sm text-gray-500 mb-6">Please answer a few quick questions to help us narrow down the most accurate conditions.</p>

                <div className="space-y-5">
                  {quizQuestions.map((q, i) => (
                    <div key={q.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                      <p className="font-semibold text-gray-800 mb-3">{i + 1}. {q.text}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {(q.options || ['Yes', 'No', 'Not sure']).map((opt: string) => (
                          <button
                            key={opt}
                            onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors border ${answers[q.id] === opt ? 'bg-brand-100 border-brand-300 text-brand-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <button onClick={submitFinalAnalysis} disabled={loading} className="btn btn-primary px-6">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {loading ? 'Analyzing...' : 'Get Final Analysis'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {result && urgencyConfig && (
            <div className="space-y-5 animate-fade-in">
              {/* Urgency banner */}
              <div className={`rounded-2xl p-4 border-2 ${urgencyConfig.bg} ${urgencyConfig.border}`}>
                <div className={`flex items-center gap-3 ${urgencyConfig.text}`}>
                  {urgencyConfig.icon}
                  <div>
                    <span className="font-bold text-sm">{urgencyConfig.label}</span>
                    <span className="text-sm opacity-80 ml-2">— {urgencyConfig.sub}</span>
                  </div>
                </div>
              </div>

              {/* Analysis Results Header */}
              <h2 className="text-lg font-bold text-gray-800">Analysis Results</h2>

              {/* Condition Cards */}
              <div className="space-y-4">
                {result.conditions.map((c, idx) => {
                  const isExpanded = expandedIdx === idx;
                  const hospitals = getHospitalsForDept(c.department);
                  return (
                    <div key={idx} className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-l-4 ${BORDER_COLOR(c.likelihood)} transition-all duration-300`}>
                      {/* Card Header — clickable */}
                      <button
                        onClick={() => toggleExpand(idx)}
                        className="w-full text-left px-5 py-4 hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h3 className="text-base font-bold text-gray-900">{c.name}</h3>
                              {c.icdCode && (
                                <span className="text-[10px] font-mono font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                                  ICD {c.icdCode}
                                </span>
                              )}
                            </div>
                            <p className={`text-sm mt-1 sm:mt-1.5 ${isExpanded ? 'text-gray-700 font-medium' : 'text-gray-500 line-clamp-2'}`}>
                              {c.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <p className="text-[11px] text-gray-400 font-medium">Match Confidence</p>
                              <p className={`text-xl font-bold ${CONFIDENCE_COLOR(c.matchConfidence)}`}>
                                {c.matchConfidence}%
                              </p>
                            </div>
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                          </div>
                        </div>
                      </button>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4 animate-fade-in">
                          <div className="grid sm:grid-cols-2 gap-4">
                            {/* Prerequisites */}
                            {c.prerequisites && c.prerequisites.length > 0 && (
                              <div className="bg-gray-50 rounded-xl p-4">
                                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                  <ClipboardList className="w-3.5 h-3.5 text-blue-500" /> Common Prerequisites
                                </h4>
                                <ul className="space-y-1.5">
                                  {c.prerequisites.map((p, j) => (
                                    <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>
                                      {p}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Recovery Time */}
                            <div className="bg-gray-50 rounded-xl p-4">
                              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-emerald-500" /> Expected Recovery Time
                              </h4>
                              <p className="text-sm text-gray-600 leading-relaxed">{c.recoveryTime}</p>
                            </div>
                          </div>

                          {/* Department & Specialist */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs font-semibold text-white bg-blue-600 px-3 py-1 rounded-full">
                              {c.department}
                            </span>
                            <span className="text-xs text-gray-500">
                              Likelihood: <span className={`font-bold ${c.likelihood === 'high' ? 'text-red-600' : c.likelihood === 'moderate' ? 'text-amber-600' : 'text-gray-500'}`}>
                                {c.likelihood === 'high' ? 'High' : c.likelihood === 'moderate' ? 'Medium' : 'Low'}
                              </span>
                            </span>
                          </div>

                          {/* Find Hospitals */}
                          <div className="pt-3 border-t border-gray-100">
                            {hospitals.length > 0 ? (
                              <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-brand-600" /> Recommended Hospitals in {city}
                                </h4>
                                <div className="grid sm:grid-cols-2 gap-3">
                                  {hospitals.map((h, hIdx) => (
                                    <Link
                                      key={h.id}
                                      href={`/hospitals/${h.id}`}
                                      className="group relative bg-white border border-gray-100 rounded-2xl p-4 transition-all duration-300 ease-out hover:shadow-lg hover:shadow-brand-100/40 hover:border-brand-200 hover:-translate-y-0.5"
                                      style={{ animationDelay: `${hIdx * 80}ms`, animation: 'fadeInUp 0.4s ease-out both' }}
                                    >
                                      {/* Top gradient accent */}
                                      <div className="absolute top-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r from-brand-400 via-blue-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                      <div className="flex items-start gap-3">
                                        {/* Icon */}
                                        <div className="w-12 h-12 bg-gradient-to-br from-brand-50 to-blue-100 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                                          {h.imageUrl
                                            ? <img src={h.imageUrl} alt={h.name} className="w-full h-full object-cover rounded-xl" />
                                            : <Building2 className="w-5 h-5 text-brand-500" />}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                          <h5 className="font-semibold text-sm text-gray-800 group-hover:text-brand-700 transition-colors line-clamp-1">{h.name}</h5>

                                          {/* Badges row */}
                                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md">
                                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {h.rating?.toFixed(1) || '4.5'}
                                            </span>
                                            <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded-md">
                                              <MapPin className="w-3 h-3" /> {h.city}
                                            </span>
                                            {h.type && (
                                              <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-md ${h.type === 'GOVERNMENT' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                {h.type === 'GOVERNMENT' ? 'Govt' : h.type === 'PRIVATE' ? 'Private' : h.type}
                                              </span>
                                            )}
                                          </div>

                                          {/* Doctors line */}
                                          {h.doctors && h.doctors.length > 0 && (
                                            <p className="text-[11px] text-brand-600 font-medium mt-1.5">
                                              {h.doctors.length} specialist{h.doctors.length > 1 ? 's' : ''} available
                                            </p>
                                          )}
                                        </div>

                                        {/* Arrow */}
                                        <div className="self-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0">
                                          <ArrowRight className="w-4 h-4 text-brand-500" />
                                        </div>
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <Link
                                href={`/search?treatment=${encodeURIComponent(c.name)}&city=${city}`}
                                className="group inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-800 border border-brand-200 hover:bg-brand-50 px-5 py-3 rounded-xl transition-all duration-300 hover:shadow-md hover:shadow-brand-100/30"
                              >
                                <Building2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> Find Hospitals for this Condition
                                <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Specialists */}
              {result.specialists.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Recommended Specialists
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.specialists.map(s => (
                      <span key={s} className="badge badge-blue">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Treatments + Hospital search */}
              {result.treatments.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Relevant Treatments
                  </h3>
                  <div className="space-y-2 mb-4">
                    {result.treatments.map(t => (
                      <div key={t} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-700">{t}</span>
                        <Link href={`/search?treatment=${encodeURIComponent(t)}&city=${city}`}
                          className="text-xs text-brand-600 font-medium hover:underline flex items-center gap-1">
                          Compare costs <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    ))}
                  </div>
                  {result.searchQuery && (
                    <Link href={`/search?treatment=${encodeURIComponent(result.searchQuery)}&city=${city}`}
                      className="btn btn-primary btn-md w-full text-sm">
                      <IndianRupee className="w-4 h-4" /> Compare Treatment Costs in {city}
                    </Link>
                  )}
                </div>
              )}

              {/* Disclaimer */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>⚠️ Medical Disclaimer:</strong> {result.disclaimer}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
