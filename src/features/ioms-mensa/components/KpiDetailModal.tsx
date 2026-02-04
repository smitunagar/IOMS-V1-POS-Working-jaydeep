import React from 'react';
import { X, Calculator, Target, TrendingUp } from 'lucide-react';
import { KpiDetail } from '../types';

interface KpiDetailModalProps {
  detail: KpiDetail;
  onClose: () => void;
}

const KpiDetailModal: React.FC<KpiDetailModalProps> = ({ detail, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800">{detail.title} Details</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          <div>
            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Definition</h4>
            <p className="text-slate-700 leading-relaxed">{detail.explanation}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2 mb-2 text-emerald-600 font-semibold text-sm">
                <Calculator size={16} />
                <span>Formula</span>
              </div>
              <code className="text-xs bg-white px-2 py-1 rounded border border-slate-200 block text-slate-600 font-mono break-words">
                {detail.formula}
              </code>
            </div>

             <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2 mb-2 text-blue-600 font-semibold text-sm">
                <Target size={16} />
                <span>Benchmark</span>
              </div>
              <p className="text-sm text-slate-700">{detail.benchmark}</p>
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
             <div className="flex items-center gap-2 mb-1 text-amber-700 font-semibold text-sm">
                <TrendingUp size={16} />
                <span>Business Impact</span>
              </div>
              <p className="text-sm text-amber-800">{detail.impact}</p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-right">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default KpiDetailModal;