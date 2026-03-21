import Link from 'next/link';
import { MapPin, Star, Users, Award, TrendingDown, CheckCircle, Building2 } from 'lucide-react';
import { Hospital, formatCurrency } from '@/lib/api';

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  GOVERNMENT: { label: 'Government', color: 'badge-green' },
  PRIVATE: { label: 'Private', color: 'badge-blue' },
  CHARITABLE: { label: 'Charitable', color: 'badge-amber' },
  TRUST: { label: 'Trust', color: 'badge-gray' },
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

  return (
    <div className={`card p-5 group transition-all duration-200 relative
      ${selected ? 'ring-2 ring-brand-500 border-brand-200' : 'hover:border-gray-200'}`}>

      {/* Compare checkbox */}
      {onSelect && (
        <button
          onClick={() => onSelect(hospital.id)}
          className={`absolute top-4 right-4 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
            ${selected ? 'bg-brand-600 border-brand-600 text-white' : 'border-gray-300 hover:border-brand-400'}`}>
          {selected && <CheckCircle className="w-4 h-4" />}
        </button>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-brand-600" />
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <Link href={`/hospitals/${hospital.slug}`}>
            <h3 className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors leading-tight line-clamp-2">
              {hospital.name}
            </h3>
          </Link>
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-500 truncate">{hospital.city} · {hospital.address.split(',').slice(-2).join(',').trim()}</span>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        <span className={typeInfo.color}>{typeInfo.label}</span>
        {hospital.naabhStatus && (
          <span className="badge bg-purple-100 text-purple-800">
            <Award className="w-3 h-3" /> NABH
          </span>
        )}
        {hospital._count.bills > 0 && (
          <span className="badge bg-emerald-100 text-emerald-700">
            <CheckCircle className="w-3 h-3" /> Verified Bills
          </span>
        )}
      </div>

      {/* Cost */}
      {cost && cost.avg > 0 ? (
        <div className="bg-brand-50 rounded-xl p-3.5 mb-4">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs text-gray-500 font-medium">{treatmentName || 'Treatment Cost'}</span>
            {cost.source === 'real_bills' && (
              <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> {cost.dataPoints} real {cost.dataPoints === 1 ? 'bill' : 'bills'}
              </span>
            )}
            {cost.source === 'estimated' && (
              <span className="text-xs text-amber-700 font-medium">Estimate</span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-brand-700">{formatCurrency(cost.avg)}</span>
            <span className="text-xs text-gray-400">avg</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">
              {formatCurrency(cost.min)} – {formatCurrency(cost.max)}
            </span>
            {hospital.type === 'GOVERNMENT' && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <TrendingDown className="w-3 h-3" /> Affordable
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-3.5 mb-4 text-center">
          <p className="text-xs text-gray-400">Cost data not available</p>
          <p className="text-xs text-brand-600 mt-0.5">Upload a bill to contribute</p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-sm font-semibold text-gray-800">{hospital.rating?.toFixed(1) || '—'}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Rating</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Users className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-sm font-semibold text-gray-800">{hospital._count.doctors}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Doctors</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-sm font-semibold text-gray-800">{hospital.beds || '—'}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Beds</p>
        </div>
      </div>

      {/* Doctors preview */}
      {hospital.doctors?.slice(0, 2).map(doc => (
        <div key={doc.id} className="flex items-center gap-2 py-1.5 border-t border-gray-50 first:border-t-0">
          <div className="w-7 h-7 bg-gradient-to-br from-brand-100 to-teal-100 rounded-full flex items-center justify-center text-xs font-bold text-brand-700 shrink-0">
            {doc.name.split(' ').slice(-1)[0]?.[0] || 'D'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-700 truncate">{doc.name}</p>
            <p className="text-xs text-gray-400 truncate">{doc.specialization} · {doc.experienceYears}y exp</p>
          </div>
        </div>
      ))}

      {/* CTA */}
      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
        <Link href={`/hospitals/${hospital.slug}`}
          className="btn btn-primary btn-sm flex-1 text-xs">
          View Details
        </Link>
      </div>
    </div>
  );
}
