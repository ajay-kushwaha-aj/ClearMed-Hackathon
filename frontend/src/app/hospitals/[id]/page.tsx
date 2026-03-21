import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin, Phone, Globe, Star, Award, Building2, Users, Calendar,
  ArrowLeft, ChevronRight, CheckCircle, AlertCircle
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import CostRange from '@/components/CostRange';
import { hospitalsAPI, Hospital, formatCurrency } from '@/lib/api';

async function getHospital(slug: string) {
  try {
    const res = await hospitalsAPI.get(slug);
    return res.data;
  } catch {
    return null;
  }
}

export default async function HospitalDetailPage({ params }: { params: { id: string } }) {
  const hospital = await getHospital(params.id);
  if (!hospital) notFound();

  const topTreatment = hospital.hospitalTreatments[0];
  const avgRating = hospital.feedback?.length
    ? hospital.feedback.reduce((sum, f: {overallScore: number}) => sum + f.overallScore, 0) / hospital.feedback.length
    : hospital.rating;

  const TYPE_COLOR: Record<string, string> = {
    GOVERNMENT: 'badge-green',
    PRIVATE: 'badge-blue',
    CHARITABLE: 'badge-amber',
    TRUST: 'badge-gray',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16" />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-brand-600">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/search" className="hover:text-brand-600">Hospitals</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-800 font-medium truncate">{hospital.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/search" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to results
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header card */}
            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center shrink-0">
                  <Building2 className="w-8 h-8 text-brand-600" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 leading-tight">{hospital.name}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={TYPE_COLOR[hospital.type] || 'badge-gray'}>{hospital.type.charAt(0) + hospital.type.slice(1).toLowerCase()}</span>
                    {hospital.naabhStatus && (
                      <span className="badge bg-purple-100 text-purple-800"><Award className="w-3 h-3" /> NABH Accredited</span>
                    )}
                    {hospital._count.bills > 0 && (
                      <span className="badge badge-green"><CheckCircle className="w-3 h-3" /> {hospital._count.bills} Verified Bills</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span className="text-2xl font-bold text-gray-900">{avgRating?.toFixed(1) || '—'}</span>
                  </div>
                  <p className="text-xs text-gray-400">{hospital._count.feedback} reviews</p>
                </div>
              </div>

              {hospital.description && (
                <p className="text-gray-600 text-sm leading-relaxed mt-4 pt-4 border-t border-gray-50">
                  {hospital.description}
                </p>
              )}

              {/* Contact info */}
              <div className="grid sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-50">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-600">{hospital.address}, {hospital.city}</p>
                </div>
                {hospital.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-brand-400 shrink-0" />
                    <a href={`tel:${hospital.phone}`} className="text-xs text-brand-600 hover:underline">{hospital.phone}</a>
                  </div>
                )}
                {hospital.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-brand-400 shrink-0" />
                    <a href={hospital.website} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline truncate">Website</a>
                  </div>
                )}
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-50">
                {[
                  { label: 'Beds', value: hospital.beds || '—', icon: <Building2 className="w-4 h-4" /> },
                  { label: 'Doctors', value: hospital._count.doctors, icon: <Users className="w-4 h-4" /> },
                  { label: 'Est.', value: hospital.established || '—', icon: <Calendar className="w-4 h-4" /> },
                  { label: 'Treatments', value: hospital.hospitalTreatments.length, icon: <CheckCircle className="w-4 h-4" /> },
                ].map(s => (
                  <div key={s.label} className="text-center p-2.5 bg-gray-50 rounded-xl">
                    <div className="flex justify-center text-brand-400 mb-1">{s.icon}</div>
                    <p className="text-lg font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Treatments & Costs */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Treatments & Costs</h2>
              {hospital.hospitalTreatments.length > 0 ? (
                <div className="space-y-3">
                  {hospital.hospitalTreatments.map((ht: {
                    id: string;
                    treatment: { id: string; name: string; category: string; specialization: string };
                    avgCostEstimate?: number;
                    minCostEstimate?: number;
                    maxCostEstimate?: number;
                  }) => (
                    <div key={ht.id} className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 hover:bg-brand-50 transition-colors group">
                      <div>
                        <p className="font-medium text-gray-800 text-sm group-hover:text-brand-700">{ht.treatment.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{ht.treatment.category} · {ht.treatment.specialization}</p>
                      </div>
                      {ht.avgCostEstimate ? (
                        <div className="text-right">
                          <p className="text-sm font-bold text-brand-700">{formatCurrency(ht.avgCostEstimate)}</p>
                          <p className="text-xs text-gray-400">
                            {formatCurrency(ht.minCostEstimate || 0)} – {formatCurrency(ht.maxCostEstimate || 0)}
                          </p>
                        </div>
                      ) : <span className="text-xs text-gray-400">Cost N/A</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No treatment data available</p>
                </div>
              )}
            </div>

            {/* Doctors */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Doctors</h2>
                <span className="text-sm text-gray-500">{hospital._count.doctors} total</span>
              </div>
              {hospital.doctors.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {hospital.doctors.map((doc: {
                    id: string;
                    name: string;
                    specialization: string;
                    qualification?: string;
                    experienceYears?: number;
                    rating?: number;
                    bio?: string;
                  }) => (
                    <div key={doc.id} className="p-4 rounded-xl border border-gray-100 hover:border-brand-200 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-100 to-teal-100 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
                          {doc.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{doc.name}</p>
                          <p className="text-xs text-brand-600 font-medium">{doc.specialization}</p>
                          {doc.qualification && <p className="text-xs text-gray-400 mt-0.5 leading-tight">{doc.qualification}</p>}
                        </div>
                        {doc.rating && (
                          <div className="flex items-center gap-1 shrink-0">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span className="text-xs font-semibold text-gray-700">{doc.rating?.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      {doc.bio && <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">{doc.bio}</p>}
                      {doc.experienceYears && (
                        <div className="mt-2 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{doc.experienceYears} years experience</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No doctor data available</p>
                </div>
              )}
            </div>

            {/* Reviews */}
            {hospital.feedback?.length > 0 && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Reviews</h2>
                <div className="space-y-4">
                  {hospital.feedback.map((f: {
                    id: string;
                    overallScore: number;
                    doctorScore?: number;
                    facilityScore?: number;
                    reviewText?: string;
                    recoveryDays?: number;
                    isVerified: boolean;
                    createdAt: string;
                  }) => (
                    <div key={f.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`w-4 h-4 ${s <= Math.round(f.overallScore) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{f.overallScore.toFixed(1)}</span>
                        </div>
                        {f.isVerified && (
                          <span className="badge badge-green text-xs"><CheckCircle className="w-3 h-3" /> Verified Patient</span>
                        )}
                      </div>
                      {f.reviewText && <p className="text-sm text-gray-600 leading-relaxed">{f.reviewText}</p>}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                        {f.recoveryDays && <span>Recovery: {f.recoveryDays} days</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Cost summary */}
            {topTreatment && topTreatment.avgCostEstimate && (
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  {topTreatment.treatment.name} Cost
                </h3>
                <CostRange
                  avg={topTreatment.avgCostEstimate || 0}
                  min={topTreatment.minCostEstimate || 0}
                  max={topTreatment.maxCostEstimate || 0}
                  source="estimated"
                />
              </div>
            )}

            {/* Actions */}
            <div className="card p-5 space-y-3">
              <Link href={`/upload?hospitalId=${hospital.id}`}
                className="btn btn-primary btn-md w-full text-sm">
                Upload Your Bill Here
              </Link>
              <Link href={`/compare?ids=${hospital.id}`}
                className="btn btn-secondary btn-md w-full text-sm">
                Add to Compare
              </Link>
            </div>

            {/* Data contribution nudge */}
            <div className="bg-gradient-to-br from-brand-50 to-teal-50 rounded-2xl p-5 border border-brand-100">
              <p className="text-sm font-semibold text-brand-800 mb-1">Help future patients</p>
              <p className="text-xs text-brand-700/80 leading-relaxed mb-3">
                If you've been treated at {hospital.name}, upload your anonymized bill to help others see real costs.
              </p>
              <Link href="/upload" className="text-xs font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-1">
                Contribute data <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
