'use client';
import { useState } from 'react';
import { formatCurrency } from '@/lib/api';
import { ChevronDown, ChevronUp, Calculator, CheckSquare, Square } from 'lucide-react';

interface Breakdown {
  [key: string]: number;
}

export default function InteractiveTreatmentList({ treatments }: { treatments: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, Record<string, boolean>>>({});

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      // Auto-select all items by default when expanding
      const ht = treatments.find(t => t.id === id);
      if (ht?.costBreakdown && !selectedItems[id]) {
        const initialSelections: Record<string, boolean> = {};
        Object.keys(ht.costBreakdown).forEach(k => {
          initialSelections[k] = true;
        });
        setSelectedItems(prev => ({ ...prev, [id]: initialSelections }));
      }
    }
  };

  const toggleItem = (htId: string, itemKey: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [htId]: {
        ...(prev[htId] || {}),
        [itemKey]: !prev[htId]?.[itemKey]
      }
    }));
  };

  return (
    <div className="space-y-3">
      {treatments.map((ht) => {
        const isExpanded = expandedId === ht.id;
        const breakdown: Breakdown | null = ht.costBreakdown || null;
        
        let customTotal = 0;
        if (breakdown && selectedItems[ht.id]) {
          Object.entries(breakdown).forEach(([k, v]) => {
            if (selectedItems[ht.id][k]) customTotal += v;
          });
        } else {
          customTotal = ht.avgCostEstimate || 0;
        }

        return (
          <div key={ht.id} className={`border rounded-xl transition-all ${isExpanded ? 'border-brand-200 bg-white shadow-sm' : 'border-transparent bg-gray-50 hover:bg-brand-50'}`}>
            {/* Header row */}
            <div 
              onClick={() => toggleExpand(ht.id)}
              className="flex items-center justify-between p-3.5 cursor-pointer group"
            >
              <div>
                <p className={`font-medium text-sm transition-colors ${isExpanded ? 'text-brand-700' : 'text-gray-800 group-hover:text-brand-700'}`}>{ht.treatment.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{ht.treatment.category} · {ht.treatment.specialization}</p>
              </div>
              
              <div className="flex items-center gap-4 text-right">
                {ht.avgCostEstimate ? (
                  <div>
                    <p className="text-sm font-bold text-brand-700">{formatCurrency(ht.avgCostEstimate)}</p>
                    <p className="text-xs text-gray-400">
                      {formatCurrency(ht.minCostEstimate || 0)} – {formatCurrency(ht.maxCostEstimate || 0)}
                    </p>
                  </div>
                ) : <span className="text-xs text-gray-400">Cost N/A</span>}
                
                {breakdown && (
                  <div className={`p-1 hover:bg-white rounded-full transition-colors ${isExpanded ? 'bg-brand-100 text-brand-600' : 'bg-white text-gray-400'}`}>
                    {isExpanded ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                  </div>
                )}
              </div>
            </div>

            {/* Expandable Breakdown Calculator */}
            {isExpanded && breakdown && (
              <div className="p-4 border-t border-gray-100 bg-gradient-to-br from-brand-50/50 to-white rounded-b-xl animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-100 rounded-full blur-3xl opacity-50 -mr-10 -mt-10 pointer-events-none"></div>
                
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Calculator className="w-3.5 h-3.5 text-brand-500"/> Cost Estimator</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mb-4 relative z-10">
                  {Object.entries(breakdown).map(([key, value]) => {
                    const isSelected = selectedItems[ht.id]?.[key] ?? true;
                    return (
                      <div 
                        key={key} 
                        onClick={(e) => { e.stopPropagation(); toggleItem(ht.id, key); }}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border ${isSelected ? 'bg-white border-brand-200 shadow-sm' : 'bg-gray-50/80 border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <div className="flex items-center gap-2">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-brand-500" /> : <Square className="w-4 h-4 text-gray-300" />}
                          <span className={`text-sm ${isSelected ? 'text-gray-800' : 'text-gray-500'}`}>{key}</span>
                        </div>
                        <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}>{formatCurrency(value)}</span>
                      </div>
                    )
                  })}
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-brand-100/60 relative z-10">
                  <span className="text-sm text-gray-500">Your Custom Estimate</span>
                  <div className="text-right">
                    <span className="text-xl font-black text-brand-700">{formatCurrency(customTotal)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  );
}
