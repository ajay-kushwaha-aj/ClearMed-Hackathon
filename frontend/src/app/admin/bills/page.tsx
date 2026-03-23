'use client';
import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { ocrAPI } from '@/lib/api';

interface Bill {
  id: string;
  hospital: { id: string; name: string; city: string };
  treatment: { id: string; name: string };
  status: string;
  totalCost: number;
  roomCharges?: number;
  implantCost?: number;
  surgeryFee?: number;
  pharmacyCost?: number;
  pathologyCost?: number;
  radiologyCost?: number;
  gst?: number;
  otherCharges?: number;
  stayDays?: number;
  fileUrl?: string;
  ocrResult?: {
    status: string;
    confidence: number;
    extractedData: any;
  };
  createdAt: string;
}

export default function AdminBillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [form, setForm] = useState<any>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Note: we assume admin is already logged in (using token/session) in a real app.
  // We'll skip the auth check here to focus on the review UI.

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await ocrAPI.getQueue('BILL_OCR_REVIEW', 1);
      if (res.data) setBills(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const openBill = (b: Bill) => {
    setSelectedBill(b);
    setForm({
      totalCost: b.totalCost || '',
      roomCharges: b.roomCharges || '',
      implantCost: b.implantCost || '',
      surgeryFee: b.surgeryFee || '',
      pharmacyCost: b.pharmacyCost || '',
      pathologyCost: b.pathologyCost || '',
      radiologyCost: b.radiologyCost || '',
      gst: b.gst || '',
      otherCharges: b.otherCharges || '',
      stayDays: b.stayDays || '',
    });
    setShowRejectForm(false);
  };

  const handleApprove = async () => {
    if (!selectedBill) return;
    setActionLoading(true);
    try {
      await ocrAPI.approve(selectedBill.id, form);
      setSelectedBill(null);
      loadQueue();
    } catch (err) {
      alert('Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedBill) return;
    setActionLoading(true);
    try {
      await ocrAPI.reject(selectedBill.id, rejectReason || 'Rejected by admin');
      setSelectedBill(null);
      loadQueue();
    } catch (err) {
      alert('Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-20 lg:pb-0">
        <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-500" /> Admin Bill Review
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">Verify uploaded bills with OCR results</p>
              </div>
              <button onClick={loadQueue} className="btn btn-secondary btn-sm">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* List */}
            <div className={`w-full ${selectedBill ? 'md:w-1/3 opacity-50' : 'md:w-full'} transition-all`}>
              <div className="card">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Pending Review ({bills.length})</h3>
                </div>
                {loading ? (
                  <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>
                ) : bills.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <CheckCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p>All caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
                    {bills.map(b => (
                      <div key={b.id} onClick={() => openBill(b)} className="p-4 hover:bg-brand-50 cursor-pointer transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium text-gray-900 text-sm line-clamp-1">{b.hospital?.name}</p>
                          <span className="text-xs font-bold text-brand-600 shrink-0">₹{b.totalCost}</span>
                        </div>
                        <p className="text-xs text-gray-500">{b.treatment?.name}</p>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-[10px] text-gray-400">{new Date(b.createdAt).toLocaleDateString()}</p>
                          {b.ocrResult && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${b.ocrResult.confidence > 0.7 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              OCR {Math.round(b.ocrResult.confidence * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Details panel */}
            {selectedBill && (
              <div className="w-full md:w-2/3">
                <div className="card overflow-hidden sticky top-36">
                  <div className="p-4 bg-brand-900 text-white flex justify-between items-center">
                    <div>
                      <h2 className="font-bold">{selectedBill.hospital?.name}</h2>
                      <p className="text-xs text-brand-200">{selectedBill.treatment?.name} · {selectedBill.hospital?.city}</p>
                    </div>
                    <button onClick={() => setSelectedBill(null)} className="text-brand-300 hover:text-white"><XCircle className="w-5 h-5"/></button>
                  </div>

                  <div className="flex flex-col lg:flex-row h-[60vh]">
                    {/* Image */}
                    <div className="w-full lg:w-1/2 border-r border-gray-100 bg-gray-100 overflow-y-auto p-4 flex items-center justify-center">
                      {selectedBill.fileUrl ? (
                        <img src={`http://localhost:4000${selectedBill.fileUrl}`} alt="Bill Document" className="max-w-full shadow-sm rounded border border-gray-200" />
                      ) : (
                        <div className="text-gray-400 text-sm text-center">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          No image uploaded
                        </div>
                      )}
                    </div>
                    {/* Form */}
                    <div className="w-full lg:w-1/2 bg-white overflow-y-auto p-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-4 border-b pb-2">Edit & Confirm Details</h3>
                      
                      <div className="space-y-3 mb-6">
                        {[
                          { key: 'totalCost', label: 'Total Cost *', required: true },
                          { key: 'roomCharges', label: 'Room Charges' },
                          { key: 'surgeryFee', label: 'Surgery / Doctor' },
                          { key: 'implantCost', label: 'Implants' },
                          { key: 'pharmacyCost', label: 'Pharmacy' },
                          { key: 'pathologyCost', label: 'Pathology / Lab' },
                          { key: 'radiologyCost', label: 'Radiology / X-Ray' },
                          { key: 'gst', label: 'GST / Tax' },
                          { key: 'otherCharges', label: 'Other Charges' },
                          { key: 'stayDays', label: 'Stay Days' },
                        ].map(f => (
                          <div key={f.key} className="flex items-center gap-3">
                            <label className="text-xs font-medium text-gray-600 w-1/3">{f.label}</label>
                            <div className="relative w-2/3">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                              <input 
                                type="number" 
                                value={form[f.key]} 
                                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                className="input text-sm py-1.5 pl-6 w-full"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {showRejectForm ? (
                        <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                          <p className="text-xs font-semibold text-red-800 mb-2">Provide Reason for Rejection</p>
                          <textarea 
                            className="input w-full text-sm mb-2" 
                            rows={3} 
                            placeholder="Data is incorrect, unreadable, etc."
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button onClick={handleReject} disabled={actionLoading} className="btn bg-red-600 hover:bg-red-700 text-white flex-1 disabled:opacity-50">Confirm Reject</button>
                            <button onClick={() => setShowRejectForm(false)} className="btn btn-secondary flex-1">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <button onClick={handleApprove} disabled={actionLoading} className="btn btn-primary flex-1 py-2 shadow-sm disabled:opacity-50">
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>} Approve
                          </button>
                          <button onClick={() => setShowRejectForm(true)} disabled={actionLoading} className="btn bg-red-100 text-red-700 hover:bg-red-200 flex-1 py-2 disabled:opacity-50">
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
