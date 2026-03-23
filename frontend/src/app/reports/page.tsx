'use client';
import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle, ChevronDown, Globe, X, ArrowRight, Activity, FlaskConical, Stethoscope, ShieldAlert, Heart } from 'lucide-react';
import Navbar from '@/components/Navbar';

const isL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API = isL ? `http://${window.location.hostname}:4000/api` : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
];

interface TestResult {
  testName: string; value: string; unit: string;
  referenceRange: string; status: string; interpretation: string;
}

interface AnalysisResult {
  patientInfo?: { name?: string; age?: string; gender?: string; date?: string; referredBy?: string; labName?: string };
  reportType?: string;
  testResults?: TestResult[];
  summary?: string;
  keyFindings?: string[];
  recommendations?: string[];
  urgencyLevel?: string;
  disclaimer?: string;
  language?: string;
  fileName?: string;
  analyzedAt?: string;
}

const statusColor = (s: string) => {
  switch (s?.toUpperCase()) {
    case 'NORMAL': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'HIGH': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'LOW': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

const urgencyConfig: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  ROUTINE: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle className="w-5 h-5" />, label: 'Routine — All Normal' },
  ATTENTION_NEEDED: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: <AlertCircle className="w-5 h-5" />, label: 'Attention Needed' },
  URGENT: { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: <ShieldAlert className="w-5 h-5" />, label: 'Urgent — Consult Doctor' },
  CRITICAL: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: <ShieldAlert className="w-5 h-5" />, label: 'Critical — Immediate Attention' },
};

export default function ReportAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      setError('File size must be under 10 MB');
      return;
    }
    setFile(f);
    setError('');
    setResult(null);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview('');
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('language', language);
      const res = await fetch(`${API}/reports/analyze`, { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze report');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview('');
    setResult(null);
    setError('');
  };

  const urgency = urgencyConfig[result?.urgencyLevel || ''] || urgencyConfig.ROUTINE;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-20 lg:pb-0">
        {/* Hero header */}
        <div className="bg-gradient-to-br from-purple-700 via-brand-700 to-indigo-800 py-10 sm:py-14 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative max-w-2xl mx-auto">
            <span className="badge bg-white/15 text-white border border-white/25 mb-4 text-sm inline-flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> AI-Powered Report Analysis
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Medical Report Analyzer
            </h1>
            <p className="text-white/75 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
              Upload your lab reports, diagnostic reports, or medical documents. Get instant AI-powered analysis in your preferred language.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Upload + controls */}
          {!result && (
            <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
              {/* Language selector */}
              <div className="flex items-center gap-3 justify-center">
                <Globe className="w-5 h-5 text-brand-500" />
                <label className="text-sm font-semibold text-gray-600">Analyze in:</label>
                <div className="relative">
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    className="h-10 pl-4 pr-9 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium text-gray-700 focus:border-brand-400 focus:outline-none appearance-none cursor-pointer"
                  >
                    {LANGUAGES.map(l => (
                      <option key={l.code} value={l.code}>{l.native} ({l.label})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 group
                  ${dragOver
                    ? 'border-brand-400 bg-brand-50 scale-[1.02]'
                    : file
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-gray-300 bg-white hover:border-brand-300 hover:bg-brand-50/30'
                  }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />

                {file ? (
                  <div className="space-y-4">
                    {preview ? (
                      <div className="relative inline-block">
                        <img src={preview} alt="Preview" className="max-h-48 rounded-xl shadow-lg mx-auto" />
                        <button onClick={(e) => { e.stopPropagation(); reset(); }}
                          className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative inline-block">
                        <div className="w-20 h-24 bg-purple-100 rounded-xl flex items-center justify-center mx-auto">
                          <FileText className="w-10 h-10 text-purple-500" />
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); reset(); }}
                          className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{file.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(0)} KB · Click to change</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                      <Upload className="w-8 h-8 text-brand-500" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-700">Drop your report here or click to upload</p>
                      <p className="text-sm text-gray-400 mt-1">Supports JPG, PNG, WebP, GIF, and PDF • Max 10 MB</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 flex-wrap mt-2">
                      {['Lab Report', 'Blood Test', 'X-Ray', 'MRI', 'Prescription'].map(t => (
                        <span key={t} className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-[fadeIn_0.2s_ease-out]">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Analyze button */}
              <button
                onClick={analyze}
                disabled={!file || loading}
                className="w-full btn btn-primary btn-lg justify-center text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing your report...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <FlaskConical className="w-5 h-5" />
                    Analyze Report
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Loading animation */}
          {loading && (
            <div className="flex flex-col items-center py-12 gap-4 animate-pulse">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-brand-200 rounded-full" />
                <div className="absolute inset-0 w-20 h-20 border-4 border-brand-500 rounded-full border-t-transparent animate-spin" />
                <Activity className="absolute inset-0 m-auto w-8 h-8 text-brand-500" />
              </div>
              <p className="text-gray-500 font-medium">AI is reading your report...</p>
              <p className="text-xs text-gray-400">This may take 10-20 seconds</p>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div className="space-y-5 animate-[fadeIn_0.4s_ease-out]">
              {/* Header bar */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Analysis Results</h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {result.reportType} • {result.language} • {result.fileName}
                  </p>
                </div>
                <button onClick={reset} className="btn btn-secondary btn-sm text-sm">
                  <Upload className="w-4 h-4" /> Analyze Another
                </button>
              </div>

              {/* Urgency badge */}
              <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${urgency.bg} ${urgency.color}`}>
                {urgency.icon}
                <span className="text-sm font-bold">{urgency.label}</span>
              </div>

              {/* Patient Info */}
              {result.patientInfo && (
                <div className="card p-5 hover:shadow-lg transition-shadow duration-300">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-brand-500" /> Patient Information
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(result.patientInfo).filter(([_, v]) => v && v !== 'Not Available').map(([k, v]) => (
                      <div key={k} className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">{k.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Test Results */}
              {result.testResults && result.testResults.length > 0 && (
                <div className="card overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-purple-500" /> Test Results ({result.testResults.length} parameters)
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50/50">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Test</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Value</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Interpretation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {result.testResults.map((t, i) => (
                          <tr key={i} className="hover:bg-brand-50/30 transition-colors group">
                            <td className="px-4 py-3 font-medium text-gray-800">{t.testName}</td>
                            <td className="px-4 py-3 font-bold text-gray-900">
                              {t.value} <span className="text-xs text-gray-400 font-normal">{t.unit}</span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">{t.referenceRange}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border ${statusColor(t.status)}`}>
                                {t.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell max-w-xs">{t.interpretation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Summary */}
              {result.summary && (
                <div className="card p-5 bg-gradient-to-br from-brand-50 to-blue-50 border-brand-100 hover:shadow-lg transition-shadow duration-300">
                  <h3 className="text-sm font-bold text-brand-800 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Summary
                  </h3>
                  <p className="text-sm text-brand-900 leading-relaxed">{result.summary}</p>
                </div>
              )}

              {/* Key Findings */}
              {result.keyFindings && result.keyFindings.length > 0 && (
                <div className="card p-5 hover:shadow-lg transition-shadow duration-300">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" /> Key Findings
                  </h3>
                  <ul className="space-y-2">
                    {result.keyFindings.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="w-5 h-5 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="card p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100 hover:shadow-lg transition-shadow duration-300">
                  <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Heart className="w-4 h-4" /> Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {result.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-emerald-900">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <div className="p-4 bg-gray-100 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-500 text-center italic">{result.disclaimer}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
