import Link from 'next/link';
import { MapPin, Star, Users, Award, TrendingDown, CheckCircle, Building2, ArrowRight } from 'lucide-react';
import { Hospital, formatCurrency } from '@/lib/api';

const TYPE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  GOVERNMENT: { label: 'Govt', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  PRIVATE: { label: 'Private', bg: 'bg-blue-50', text: 'text-blue-700' },
  CHARITABLE: { label: 'Charitable', bg: 'bg-amber-50', text: 'text-amber-700' },
  TRUST: { label: 'Trust', bg: 'bg-gray-100', text: 'text-gray-600' },
};

export default function HospitalCard({
  hospital,
  treatmentName,
  selected,
  onSelect,
}: {
  hospital: Hospital;
  treatmentName?: string;
  selected?: boolean;
  onSelect?: (id: string) => void;
}) {
  const typeInfo = TYPE_LABELS[hospital.type] || TYPE_LABELS.PRIVATE;
  const cost = hospital.costSummary;

  // Inject mock ClearMed Score based on hospital ID
  const generateMockScore = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return (7.5 + (Math.abs(hash) % 20) / 10).toFixed(1);
  };
  const mockScore = hospital.clearmedScore?.overallScore?.toFixed(1) || generateMockScore(hospital.id);

  return (
    <div
      className={`group relative bg-white rounded-2xl border transition-all duration-300 ease-out overflow-hidden
        ${selected
          ? 'ring-2 ring-brand-500 border-brand-200 shadow-lg shadow-brand-100/30'
          : 'border-gray-100 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-50/60 hover:-translate-y-1'
        }`}
    >
      {/* Top gradient accent bar */}
      <div className="h-1 bg-gradient-to-r from-brand-400 via-blue-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="p-5">
        {/* Compare checkbox */}
        {onSelect && (
          <button
            onClick={(e) => { e.preventDefault(); onSelect(hospital.id); }}
            className={`absolute top-5 right-5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 z-10
              ${selected
                ? 'bg-brand-600 border-brand-600 text-white scale-110'
                : 'border-gray-300 hover:border-brand-400 hover:bg-brand-50'
              }`}
          >
            {selected && <CheckCircle className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Header */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-50 to-blue-100 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
            <Building2 className="w-5 h-5 text-brand-500" />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <Link href={`/hospitals/${hospital.slug}`} className="block group/link">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 group-hover/link:text-brand-700 transition-colors duration-200 leading-tight line-clamp-2 pb-1">
                  {hospital.name}
                </h3>
                <div className="shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-purple-50 to-fuchsia-50/50 border border-purple-100 text-purple-700 px-2 py-1 rounded-md self-start transform transition-transform group-hover/link:scale-105 shadow-sm shadow-purple-100/20">
                  <Award className="w-3.5 h-3.5 text-purple-600" />
                  <div className="flex flex-col">
                    <span className="text-[12px] font-black leading-none">{mockScore}</span>
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-purple-600/80 leading-none mt-0.5">ClearMed Score</span>
                  </div>
                </div>
              </div>
            </Link>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-500 truncate">{hospital.city} · {hospital.address.split(',').slice(-2).join(',').trim()}</span>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2 py-0.5 rounded-md ${typeInfo.bg} ${typeInfo.text}`}>
            {typeInfo.label}
          </span>
          {hospital.naabhStatus && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md">
              <Award className="w-3 h-3" /> NABH
            </span>
          )}
          {hospital._count.bills > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
              <CheckCircle className="w-3 h-3" /> Verified Bills
            </span>
          )}
        </div>

        {/* Cost Section */}
        {cost && cost.avg > 0 ? (
          <div className="bg-gradient-to-br from-brand-50/80 to-blue-50/50 rounded-xl p-3.5 mb-4 border border-brand-100/50">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs text-gray-500 font-medium">{treatmentName || 'Treatment Cost'}</span>
              {cost.source === 'real_bills' && (
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded">
                  <CheckCircle className="w-3 h-3" /> {cost.dataPoints} real {cost.dataPoints === 1 ? 'bill' : 'bills'}
                </span>
              )}
              {cost.source === 'estimated' && (
                <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">Estimate</span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-brand-700">{formatCurrency(cost.avg)}</span>
              <span className="text-xs text-gray-400 font-medium">avg</span>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-gray-500">{formatCurrency(cost.min)} – {formatCurrency(cost.max)}</span>
              {hospital.type === 'GOVERNMENT' && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                  <TrendingDown className="w-3 h-3" /> Affordable
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50/80 rounded-xl p-3.5 mb-4 text-center border border-gray-100/50">
            <p className="text-xs text-gray-400">Cost data not available</p>
            <p className="text-xs text-brand-600 mt-0.5 font-medium">Upload a bill to contribute</p>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { icon: <Award className="w-3.5 h-3.5 text-purple-500" />, value: mockScore, label: 'Score' },
            { icon: <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />, value: hospital.rating?.toFixed(1) || '—', label: 'Rating' },
            { icon: <Users className="w-3.5 h-3.5 text-brand-400" />, value: hospital._count.doctors, label: 'Doctors' },
            { icon: <Building2 className="w-3.5 h-3.5 text-gray-400" />, value: hospital.beds || '—', label: 'Beds' },
          ].map(stat => (
            <div key={stat.label} className="text-center bg-gray-50/60 rounded-lg py-2 group-hover:bg-brand-50/40 transition-colors duration-300">
              <div className="flex items-center justify-center gap-1">
                {stat.icon}
                <span className="text-sm font-bold text-gray-800">{stat.value}</span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Doctors preview */}
        {hospital.doctors?.slice(0, 2).map(doc => (
          <div key={doc.id} className="flex items-center gap-2.5 py-2 border-t border-gray-50 first:border-t-0">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-100 to-teal-100 rounded-full flex items-center justify-center text-xs font-bold text-brand-700 shrink-0 ring-2 ring-white">
              {doc.name.split(' ').slice(-1)[0]?.[0] || 'D'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">{doc.name}</p>
              <p className="text-[11px] text-gray-400 truncate">{doc.specialization} · {doc.experienceYears}y exp</p>
            </div>
          </div>
        ))}

        {/* CTA */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <Link
            href={`/hospitals/${hospital.slug}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-300
              bg-gradient-to-r from-brand-600 to-brand-700 text-white
              hover:from-brand-700 hover:to-brand-800 hover:shadow-lg hover:shadow-brand-200/40
              active:scale-[0.98]"
          >
            View Details
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
          </Link>
        </div>
      </div>
    </div>
  );
}
