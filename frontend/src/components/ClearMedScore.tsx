'use client';
import { useState } from 'react';
import { Award, Info, ChevronDown, ChevronUp, AlertCircle, Star } from 'lucide-react';
import { ClearMedScoreData } from '@/lib/api';

interface Props {
  score: ClearMedScoreData;
  size?: 'sm' | 'md' | 'lg';
  showBreakdown?: boolean;
}

const SCORE_COLOR = (score: number) => {
  if (score >= 8.5) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', ring: 'from-emerald-400 to-teal-400' };
  if (score >= 7)   return { bg: 'bg-brand-50',   text: 'text-brand-700',   border: 'border-brand-200',   ring: 'from-brand-400 to-blue-400' };
  if (score >= 5)   return { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   ring: 'from-amber-400 to-yellow-400' };
  return               { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     ring: 'from-red-400 to-orange-400' };
};

const METRICS = [
  { key: 'satisfactionScore',   label: 'Patient Satisfaction', weight: '25%', icon: '😊' },
  { key: 'doctorScore',         label: 'Doctor Expertise',     weight: '20%', icon: '🩺' },
  { key: 'costEfficiencyScore', label: 'Cost Efficiency',      weight: '20%', icon: '💰' },
  { key: 'successRateScore',    label: 'Success Rate',         weight: '20%', icon: '✅' },
  { key: 'recoveryScore',       label: 'Recovery Speed',       weight: '10%', icon: '⚡' },
];

export default function ClearMedScore({ score, size = 'md', showBreakdown = false }: Props) {
  const [expanded, setExpanded] = useState(false);
  const colors = SCORE_COLOR(score.overallScore);

  if (!score.isReliable) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200">
        <AlertCircle className="w-4 h-4 text-gray-400" />
        <div>
          <p className="text-xs font-medium text-gray-500">ClearMed Score</p>
          <p className="text-xs text-gray-400">Needs more data ({score.dataPoints}/5 points)</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border ${colors.border} ${colors.bg} overflow-hidden`}>
      {/* Score header */}
      <div className="flex items-center gap-3 p-3">
        {/* Circular score */}
        <div className={`relative flex-shrink-0 ${size === 'lg' ? 'w-16 h-16' : 'w-12 h-12'}`}>
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
            <circle
              cx="18" cy="18" r="15.9"
              fill="none"
              stroke="url(#scoreGrad)"
              strokeWidth="2.5"
              strokeDasharray={`${(score.overallScore / 10) * 100} 100`}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0e87ef" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-bold ${size === 'lg' ? 'text-base' : 'text-sm'} ${colors.text}`}>
              {score.overallScore.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <Award className={`w-3.5 h-3.5 ${colors.text}`} />
            <span className={`text-xs font-bold ${colors.text} uppercase tracking-wide`}>ClearMed Score</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{score.dataPoints} verified data points</p>
          {score.naabhBonus > 0 && (
            <span className="text-xs text-purple-600 font-medium">+NABH bonus</span>
          )}
        </div>

        {showBreakdown && (
          <button onClick={() => setExpanded(!expanded)}
            className={`text-gray-400 hover:${colors.text} transition-colors`}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Score breakdown */}
      {(expanded || !showBreakdown) && showBreakdown !== false && (
        <div className="px-3 pb-3 border-t border-gray-100/50 pt-2 space-y-2">
          {METRICS.map(m => {
            const val = score[m.key as keyof ClearMedScoreData] as number;
            return (
              <div key={m.key}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-gray-600 flex items-center gap-1">
                    <span>{m.icon}</span> {m.label}
                    <span className="text-gray-400">({m.weight})</span>
                  </span>
                  <span className="text-xs font-bold text-gray-700">{val.toFixed(1)}/10</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-400 to-teal-400 rounded-full transition-all"
                    style={{ width: `${(val / 10) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
          <p className="text-xs text-gray-400 pt-1">
            Updated {new Date(score.lastCalculated).toLocaleDateString('en-IN')}
          </p>
        </div>
      )}
    </div>
  );
}
