import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  X,
  Play,
  ShieldAlert,
  PlusCircle,
  FileText,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export const QuickActionFAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <>
      {/* Floating Action Button (FAB) matching ArthaSetu design tokens */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 rounded-full bg-slate-900/10 backdrop-blur-xs transition-all duration-300 hover:scale-105 active:scale-95 group focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 shadow-xl cursor-pointer"
        aria-label="Open Operations Quick Actions"
      >
        <div className="w-12 h-12 rounded-full bg-black group-hover:bg-slate-950 flex items-center justify-center shadow-lg transition-colors p-1.5 border border-slate-700/50">
          <Sparkles className="w-5 h-5 text-white animate-pulse" />
        </div>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E1E7EF] shadow-2xl p-5 space-y-4 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Close Quick Actions Modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">EOC Quick Actions</h3>
                <p className="text-xs text-[#64748B]">Instant controls for disaster simulation & drills</p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <Link
                to="/scenarios/new"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900">Create New Scenario</div>
                    <div className="text-[11px] text-slate-500">Configure road blocks and hazards</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                to="/shelters"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900">Check Shelter Capacity</div>
                    <div className="text-[11px] text-slate-500">Verify availability across 4 regional shelters</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                to="/reports"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-800">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900">Download Audit Reports</div>
                    <div className="text-[11px] text-slate-500">Export compliance PDF and executive summaries</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
