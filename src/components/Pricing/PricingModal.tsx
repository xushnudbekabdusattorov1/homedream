import React from 'react';
import { Check, Sparkles, Zap, Shield, HelpCircle } from 'lucide-react';

interface PricingModalProps {
  onClose?: () => void;
  isFullPage?: boolean;
}

export const PricingModal: React.FC<PricingModalProps> = ({ onClose, isFullPage }) => {
  return (
    <div
      className={
        isFullPage
          ? 'flex-1 w-full bg-slate-950 text-slate-100 p-6 overflow-y-auto'
          : 'fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4'
      }
    >
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-slate-400 hover:text-white text-lg font-bold"
          >
            ✕
          </button>
        )}

        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50 text-xs font-semibold uppercase tracking-wider">
            Plans & Exports
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-3">Simple, Transparent Pricing</h2>
          <p className="text-sm text-slate-400 mt-2">
            Build your dream home schematic for free, or upgrade to Pro for unlimited AI architectural generations and complete 3D & vector exports.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free Tier */}
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Starter Free</h3>
              <p className="text-xs text-slate-400 mt-1">Perfect for exploring ideas and visualizing layouts.</p>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-extrabold text-white">$0</span>
                <span className="text-xs text-slate-400"> / forever</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>5 AI residential generations per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Interactive 3D Three.js viewer</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>2D floor plans with dimension labels</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Physics and room overlap validation</span>
                </li>
                <li className="flex items-center gap-2 text-slate-500">
                  <span>✕ GLB / OBJ 3D Model export</span>
                </li>
                <li className="flex items-center gap-2 text-slate-500">
                  <span>✕ Vector PDF architectural blueprints</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onClose}
              className="mt-8 w-full py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Current Active Plan
            </button>
          </div>

          {/* Pro Tier */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-indigo-950/60 to-slate-900 border-2 border-indigo-500/80 shadow-xl shadow-indigo-950/50 flex flex-col justify-between relative overflow-hidden">
            <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500 text-white uppercase tracking-wider">
              Most Popular
            </span>

            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Architect Pro</span>
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </h3>
              <p className="text-xs text-indigo-200/80 mt-1">For homeowners, designers, and real estate planners.</p>

              <div className="mt-4 mb-6">
                <span className="text-4xl font-extrabold text-white">$19</span>
                <span className="text-xs text-slate-400"> / month</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="font-semibold text-white">Unlimited AI architectural generations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>Unlimited live AI chat refinements</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="font-semibold text-white">Interactive .GLB & .OBJ 3D Model export</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>Architectural vector PDF & high-res PNG export</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>Custom material palettes & live finishes swapper</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>Priority server processing & instant synthesis</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                alert('Pro Plan activated for this session! Enjoy unlimited exports and synthesis.');
                onClose?.();
              }}
              className="mt-8 w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white shadow-md shadow-indigo-600/30 transition-all"
            >
              Upgrade to Pro ($19/mo)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
