const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error ${res.status}`);
  }
  return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────
export interface Hospital {
  id: string; name: string; slug: string; city: string; state: string;
  address: string; phone?: string; website?: string; type: 'GOVERNMENT' | 'PRIVATE' | 'TRUST' | 'CHARITABLE';
  beds?: number; naabhStatus: boolean; rating?: number; lat?: number; lng?: number;
  description?: string; established?: number;
  departments?: any;
  doctors: Doctor[];
  hospitalTreatments: HospitalTreatment[];
  costSummary?: CostSummary;
  clearmedScore?: ClearMedScoreData;
  _count: { bills: number; feedback: number; doctors: number };
  feedback?: FeedbackItem[];
}

export interface Treatment {
  id: string; name: string; slug: string; category: string;
  specialization: string; description?: string; avgDuration?: number;
}

export interface Doctor {
  id: string; name: string; specialization: string; qualification?: string;
  experienceYears?: number; rating?: number; bio?: string;
}

export interface HospitalTreatment {
  id: string; hospitalId: string; treatmentId: string;
  avgCostEstimate?: number; minCostEstimate?: number; maxCostEstimate?: number;
  costBreakdown?: any;
  treatment: Treatment;
}

export interface CostSummary {
  avg: number; min: number; max: number; dataPoints: number;
  source: 'real_bills' | 'estimated';
}

export interface ClearMedScoreData {
  overallScore: number;
  satisfactionScore?: number;
  doctorScore?: number;
  costEfficiencyScore?: number;
  successRateScore?: number;
  recoveryScore?: number;
  naabhBonus: number;
  dataPoints: number;
  isReliable: boolean;
  label?: string;
  lastCalculated: string;
}

export interface FeedbackItem {
  id: string; overallScore: number; doctorScore?: number; facilityScore?: number;
  reviewText?: string; recoveryDays?: number; isVerified: boolean; createdAt: string;
}

export interface SymptomResult {
  conditions: Array<{ name: string; likelihood: 'high' | 'moderate' | 'low'; icdCode?: string }>;
  specialists: string[]; treatments: string[];
  urgency: 'emergency' | 'urgent' | 'routine' | 'elective';
  disclaimer: string; searchQuery: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// ─── Hospital API ─────────────────────────────────────────────────────────
export interface HospitalFilters {
  treatment?: string; search?: string; city?: string; type?: string;
  minCost?: number; maxCost?: number; nabh?: boolean;
  page?: number; limit?: number;
  sort?: 'rating' | 'cost_asc' | 'cost_desc' | 'name';
}

export const hospitalsAPI = {
  list: (f: HospitalFilters = {}) => {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, String(v)); });
    return fetchAPI<PaginatedResponse<Hospital>>(`/hospitals?${p}`);
  },
  get: (id: string) => fetchAPI<{ data: Hospital & { billStats: unknown[] } }>(`/hospitals/${id}`),
  getDoctors: (id: string) => fetchAPI<{ data: Doctor[] }>(`/hospitals/${id}/doctors`),
  compare: (ids: string[], treatmentSlug?: string) =>
    fetchAPI<{ data: Hospital[] }>(`/hospitals/compare`, { method: 'POST', body: JSON.stringify({ ids, treatmentSlug }) }),
};

// ─── Treatment API ────────────────────────────────────────────────────────
export const treatmentsAPI = {
  search: (q: string) => fetchAPI<{ data: Treatment[] }>(`/treatments/search?q=${encodeURIComponent(q)}`),
  list: () => fetchAPI<{ data: Record<string, Treatment[]> }>(`/treatments`),
  get: (slug: string) => fetchAPI<{ data: Treatment & { hospitalTreatments: HospitalTreatment[] } }>(`/treatments/${slug}`),
};

// ─── Costs API ────────────────────────────────────────────────────────────
export const costsAPI = {
  get: (treatmentId: string, city: string) =>
    fetchAPI<{ data: { treatment: Treatment; city: string; costs: Record<string, number | string> } }>(
      `/costs/${treatmentId}/${encodeURIComponent(city)}`
    ),
};

// ─── Symptoms API — Phase 2 ───────────────────────────────────────────────
export const symptomsAPI = {
  analyze: (symptoms: string, city?: string) =>
    fetchAPI<{ data: SymptomResult }>(`/symptoms/analyze`, {
      method: 'POST',
      body: JSON.stringify({ symptoms, city }),
    }),
};

// ─── Scores API — Phase 2 ─────────────────────────────────────────────────
export const scoresAPI = {
  get: (hospitalId: string, treatmentId: string) =>
    fetchAPI<{ data: ClearMedScoreData }>(`/scores/${hospitalId}/${treatmentId}`),
  recalculate: (hospitalId: string, treatmentId: string) =>
    fetchAPI<{ data: ClearMedScoreData }>(`/scores/calculate`, {
      method: 'POST',
      body: JSON.stringify({ hospitalId, treatmentId }),
    }),
};

// ─── Bills API ────────────────────────────────────────────────────────────
export const billsAPI = {
  extract: (formData: FormData) =>
    fetch(`${API_URL}/bills/extract`, { method: 'POST', body: formData }).then(r => r.json()),
  upload: (formData: FormData) =>
    fetch(`${API_URL}/bills/upload`, { method: 'POST', body: formData }).then(r => r.json()),
};

// ─── OCR API ──────────────────────────────────────────────────────────────
export const ocrAPI = {
  getQueue: (status = 'BILL_OCR_REVIEW', page = 1) => fetchAPI<{ data: any[], meta: any }>(`/ocr/queue?status=${status}&page=${page}`),
  approve: (id: string, data: any) => fetch(`${API_URL}/ocr/bill/${id}/approve`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  reject: (id: string, reason: string) => fetch(`${API_URL}/ocr/bill/${id}/reject`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) }).then(r => r.json()),
};

// ─── Stats API ────────────────────────────────────────────────────────────
export const statsAPI = {
  get: () => fetchAPI<{ data: { hospitals: number; treatments: number; bills: number; doctors: number } }>(`/stats`),
};

// ─── Utilities ────────────────────────────────────────────────────────────
export function formatCurrency(amount: number): string {
  if (!amount) return '—';
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatCurrencyFull(amount: number): string {
  if (!amount) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}
