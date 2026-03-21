import { TrendingDown, TrendingUp, Info } from 'lucide-react';
import { formatCurrency, formatCurrencyFull } from '@/lib/api';

interface CostRangeProps {
  avg: number;
  min: number;
  max: number;
  dataPoints?: number;
  source?: 'real_bills' | 'estimated';
  breakdown?: {
    roomCharges?: number;
    implantCost?: number;
    surgeryFee?: number;
    pharmacyCost?: number;
  };
  className?: string;
}

export default function CostRange({ avg, min, max, dataPoints, source, breakdown, className = '' }: CostRangeProps) {
  const range = max - min;
  const position = range > 0 ? ((avg - min) / range) * 100 : 50;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main cost display */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">Average Cost</p>
          <p className="text-3xl font-bold text-brand-700">{formatCurrencyFull(avg)}</p>
        </div>
        <div className="text-right">
          {source === 'real_bills' && dataPoints && dataPoints > 0 && (
            <span className="badge badge-green text-xs">
              {dataPoints} verified {dataPoints === 1 ? 'bill' : 'bills'}
            </span>
          )}
          {source === 'estimated' && (
            <span className="badge badge-amber text-xs flex items-center gap-1">
              <Info className="w-3 h-3" /> Estimated
            </span>
          )}
        </div>
      </div>

      {/* Range bar */}
      <div>
        <div className="relative h-2.5 bg-gray-100 rounded-full overflow-visible">
          {/* Range fill */}
          <div className="absolute inset-y-0 bg-gradient-to-r from-brand-200 to-brand-400 rounded-full"
            style={{ left: '0%', right: '0%' }} />
          {/* Avg marker */}
          <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-brand-600 shadow-sm transition-all"
            style={{ left: `${position}%`, transform: 'translateX(-50%) translateY(-50%)' }} />
        </div>
        <div className="flex justify-between mt-2">
          <div className="flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs text-gray-500">Min: <strong className="text-gray-700">{formatCurrency(min)}</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-coral-500" />
            <span className="text-xs text-gray-500">Max: <strong className="text-gray-700">{formatCurrency(max)}</strong></span>
          </div>
        </div>
      </div>

      {/* Cost breakdown */}
      {breakdown && Object.values(breakdown).some(v => v && v > 0) && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cost Breakdown</p>
          <div className="space-y-1.5">
            {[
              { label: 'Surgery Fee', value: breakdown.surgeryFee },
              { label: 'Implant / Device', value: breakdown.implantCost },
              { label: 'Room Charges', value: breakdown.roomCharges },
              { label: 'Pharmacy', value: breakdown.pharmacyCost },
            ].filter(item => item.value && item.value > 0).map(item => {
              const pct = avg > 0 ? ((item.value! / avg) * 100).toFixed(0) : '0';
              return (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-xs text-gray-600">{item.label}</span>
                      <span className="text-xs font-medium text-gray-700">{formatCurrency(item.value!)} <span className="text-gray-400">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-300 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
