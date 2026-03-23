'use client';
import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Download, Loader2, FileText } from 'lucide-react';
import Navbar from '@/components/Navbar';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface ImportResult { created: number; skipped: number; total: number }

const CSV_TEMPLATE = `name,slug,city,state,address,type,beds,nabh,phone,email
Apollo Hospital Delhi,apollo-delhi,Delhi,Delhi,"Mathura Road, Sarita Vihar",PRIVATE,700,true,+91-11-26925858,delhi@apollohospitals.com
AIIMS Delhi,aiims-delhi,Delhi,Delhi,"Ansari Nagar, New Delhi",GOVERNMENT,2478,true,+91-11-26594321,info@aiims.edu`;

export default function ImportPage() {
  const [csvText, setCsvText] = useState('');
  const [token, setToken] = useState(() => typeof window !== 'undefined' ? sessionStorage.getItem('clearmed_admin_token') || '' : '');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const parseCsv = (csv: string) => {
    const lines = csv.trim().split('\n').filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    return lines.slice(1).map(line => {
      // Handle quoted values
      const values: string[] = [];
      let cur = ''; let inQ = false;
      for (const c of line) {
        if (c === '"') { inQ = !inQ; }
        else if (c === ',' && !inQ) { values.push(cur.trim()); cur = ''; }
        else cur += c;
      }
      values.push(cur.trim());

      const row: Record<string, unknown> = {};
      headers.forEach((h, i) => {
        const v = values[i] || '';
        if (h === 'beds') row[h] = parseInt(v) || undefined;
        else if (h === 'nabh') row[h] = v.toLowerCase() === 'true';
        else row[h] = v || undefined;
      });
      return row;
    });
  };

  const runImport = async () => {
    if (!csvText.trim() || !token) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const rows = parseCsv(csvText);
      if (!rows.length) { setError('No valid rows found in CSV'); setLoading(false); return; }

      const res = await fetch(`${API}/admin/ops/import/hospitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (data.data) setResult(data.data);
      else setError(data.error || 'Import failed');
    } catch { setError('Connection error'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Upload className="w-6 h-6 text-brand-500" /> Hospital Data Import
          </h1>
          <p className="text-gray-500 text-sm mt-1">Bulk import hospitals from CSV. Duplicate slugs are skipped.</p>
        </div>

        {!token && (
          <div className="card p-5 border-amber-200 bg-amber-50 mb-6">
            <p className="text-sm text-amber-800">Please log in from the <a href="/admin/analytics" className="underline font-medium">Admin Analytics</a> page first to get a session token.</p>
          </div>
        )}

        <div className="grid sm:grid-cols-5 gap-6">
          <div className="sm:col-span-3 space-y-4">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900 text-sm">CSV Data</h2>
                <button onClick={() => setCsvText(CSV_TEMPLATE)}
                  className="btn btn-secondary btn-sm text-xs">Load Template</button>
              </div>
              <textarea
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                placeholder="Paste CSV here or click 'Load Template'..."
                rows={12}
                className="w-full text-xs font-mono text-gray-700 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none leading-relaxed"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-400">{csvText ? `${parseCsv(csvText).length} rows detected` : 'Paste CSV to begin'}</span>
                <button onClick={runImport} disabled={loading || !csvText.trim() || !token}
                  className="btn btn-primary btn-sm">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>}
                  {loading ? 'Importing...' : 'Import Hospitals'}
                </button>
              </div>
            </div>

            {error && (
              <div className="card p-4 bg-red-50 border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0"/>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {result && (
              <div className="card p-5 bg-emerald-50 border-emerald-200">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600"/>
                  <p className="font-bold text-emerald-800">Import Complete</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[{label:'Created',value:result.created,color:'text-emerald-700'},{label:'Skipped',value:result.skipped,color:'text-amber-700'},{label:'Total',value:result.total,color:'text-gray-700'}].map(s=>(
                    <div key={s.label} className="text-center">
                      <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-gray-500">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="sm:col-span-2 space-y-4">
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-500"/> CSV Format
              </h3>
              <div className="space-y-1.5 text-xs text-gray-600">
                {[
                  { field: 'name', req: true, desc: 'Hospital name' },
                  { field: 'slug', req: false, desc: 'URL slug (auto-generated)' },
                  { field: 'city', req: true, desc: 'Delhi / Mumbai / Bengaluru' },
                  { field: 'state', req: false, desc: 'State name' },
                  { field: 'address', req: true, desc: 'Street address' },
                  { field: 'type', req: false, desc: 'GOVERNMENT / PRIVATE / TRUST' },
                  { field: 'beds', req: false, desc: 'Number of beds (integer)' },
                  { field: 'nabh', req: false, desc: 'true / false' },
                  { field: 'phone', req: false, desc: 'Phone number' },
                  { field: 'email', req: false, desc: 'Email address' },
                ].map(f => (
                  <div key={f.field} className="flex items-start gap-2">
                    <code className={`text-xs px-1.5 py-0.5 rounded ${f.req ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-500'}`}>{f.field}</code>
                    <span>{f.desc} {f.req && <span className="text-red-500">*</span>}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'clearmed_hospitals_template.csv'; a.click(); }}
                className="btn btn-secondary btn-sm w-full justify-center mt-4 text-xs">
                <Download className="w-3.5 h-3.5"/> Download Template
              </button>
            </div>

            <div className="card p-4 bg-amber-50 border-amber-200">
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Note:</strong> Rows with duplicate slugs are automatically skipped. After import, run <code className="bg-amber-100 px-1 rounded">npm run scores:recalc</code> to calculate initial ClearMed Scores.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
