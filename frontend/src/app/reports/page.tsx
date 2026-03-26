'use client';
import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle, ChevronDown, Globe, X, ArrowRight, Activity, FlaskConical, Stethoscope, ShieldAlert, Heart, MessageSquare } from 'lucide-react';
import Navbar from '@/components/Navbar';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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
  overallAnalysis?: {
    conditions: { name: string; likelihood: string }[];
    topDepartment: string;
  };
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
    case 'HIGH': return 'bg-orange-50 text-orange-600 border-orange-200';
    case 'LOW': return 'bg-red-50 text-red-600 border-red-200';
    case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200 font-bold';
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
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'ai', text: string, suggestions?: string[]}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
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
    setChatMessages([]);
    setChatInput('');
  };

  const sendChatMessage = async (presetMsg?: string) => {
    const msg = presetMsg || chatInput.trim();
    if (!msg || !result) return;
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await fetch(`${API}/reports/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, reportContext: result, language }),
      });
      const data = await res.json();
      if (data.data?.reply) {
        setChatMessages(prev => [...prev, { role: 'ai', text: data.data.reply, suggestions: data.data.followUpQuestions }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Error connecting to chatbot server.' }]);
    } finally {
      setChatLoading(false);
    }
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

              {/* Abnormal Test Results */}
              {result.testResults && result.testResults.filter(t => t.status?.toUpperCase() !== 'NORMAL').length > 0 && (
                <div className="card overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500" /> Key Parameters (Abnormal)
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-gray-100">
                        {result.testResults.filter(t => t.status?.toUpperCase() !== 'NORMAL').map((t, i) => (
                          <tr key={i} className="hover:bg-brand-50/30 transition-colors group">
                            <td className="px-5 py-3.5 font-semibold text-gray-800 w-1/3">{t.testName}</td>
                            <td className="px-5 py-3.5 font-bold text-gray-900">
                              {t.value} <span className="text-xs text-gray-500 font-medium ml-1">{t.unit}</span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <span className={`inline-flex px-3 py-1 rounded-xl text-xs font-bold border ${statusColor(t.status)}`}>
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {result.testResults && result.testResults.length > 0 && result.testResults.filter(t => t.status?.toUpperCase() !== 'NORMAL').length === 0 && (
                 <div className="card p-5 bg-emerald-50 border-emerald-100 text-emerald-800 flex items-center gap-3">
                   <CheckCircle className="w-6 h-6 text-emerald-500" />
                   <div>
                     <p className="font-bold">All Parameters Normal</p>
                     <p className="text-sm mt-0.5 opacity-80">No abnormal findings were detected in the interpreted parameters.</p>
                   </div>
                 </div>
              )}

              {/* Overall Analysis */}
              {result.overallAnalysis && result.overallAnalysis.conditions?.length > 0 && (
                <div className="card p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-purple-100 hover:shadow-lg transition-shadow duration-300">
                  <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Overall Analysis
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3 mb-5">
                    {result.overallAnalysis.conditions.map((c, i) => (
                      <div key={i} className="bg-white p-3 rounded-xl border border-indigo-100/50 shadow-sm flex items-center justify-between">
                        <span className="font-semibold text-gray-800 text-sm">{c.name}</span>
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-bold
                          ${c.likelihood.toLowerCase() === 'high' ? 'bg-red-50 text-red-600' : 
                            c.likelihood.toLowerCase() === 'moderate' ? 'bg-orange-50 text-orange-600' : 
                            'bg-blue-50 text-blue-600'}`}>
                          {c.likelihood}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {result.overallAnalysis.topDepartment && (
                    <div className="mt-2 pt-4 border-t border-indigo-100/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <p className="text-xs text-indigo-600 font-bold uppercase tracking-wide mb-1">Recommended Department</p>
                        <p className="text-lg font-black text-indigo-900">{result.overallAnalysis.topDepartment}</p>
                      </div>
                      <a href={`/search?q=${encodeURIComponent(result.overallAnalysis.topDepartment)}&type=department`} 
                         className="btn bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto shadow-md">
                        👉 Find Hospitals
                      </a>
                    </div>
                  )}
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

              <div className="p-4 bg-gray-100 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-500 text-center italic">{result.disclaimer}</p>
              </div>

              {/* AI Chatbot */}
              <div className="card p-5 border-brand-200 shadow-sm mt-8">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-brand-500" /> Ask AI about this report
                </h3>
                
                <div className="bg-gray-50 rounded-xl p-4 h-64 overflow-y-auto mb-4 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm mt-10">
                      Ask me anything about your report findings, medical terms, or recommendations!
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-brand-500 text-white rounded-br-none' : 'bg-white border text-gray-800 rounded-bl-none shadow-sm whitespace-pre-wrap'}`}>
                          {msg.text}
                        </div>
                        {msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2 ml-1 animate-[fadeIn_0.5s_ease-out]">
                            {msg.suggestions.map((s, idx) => (
                              <button key={idx} onClick={() => sendChatMessage(s)} className="text-xs bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 px-3 py-1.5 rounded-full transition-colors font-medium text-left">
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border text-gray-400 rounded-2xl p-3 text-sm rounded-bl-none shadow-sm flex gap-1">
                        <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if(e.key === 'Enter') sendChatMessage(); }}
                    placeholder="Type your question..."
                    className="input flex-1 text-sm bg-white"
                    disabled={chatLoading}
                  />
                  <button onClick={() => sendChatMessage()} disabled={chatLoading} className="btn btn-primary px-4">
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
