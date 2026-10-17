import React, { useState } from 'react';
import { HouseSpec } from '../../types/house';
import { Share2, Copy, Check, Globe, Link, Twitter, Facebook } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  spec: HouseSpec;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, spec }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}?house=${spec.id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white text-base"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3">
            <Share2 className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Share Architectural Design</h3>
          <p className="text-xs text-slate-400 mt-1">
            Anyone with this link can view the interactive 3D model and 2D floor plans.
          </p>
        </div>

        {/* Share Link Input */}
        <div className="mb-6">
          <label className="text-[11px] text-slate-400 block mb-1.5 font-medium">Public Link</label>
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl p-1.5">
            <Link className="w-4 h-4 text-slate-400 ml-2 flex-shrink-0" />
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="bg-transparent text-xs text-slate-200 flex-1 px-1 focus:outline-none select-all truncate"
            />
            <button
              onClick={copyToClipboard}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Quick Summary Pill */}
        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 mb-6 text-xs text-slate-300">
          <p className="font-bold text-white mb-0.5">{spec.title}</p>
          <p className="text-[11px] text-slate-400">
            {spec.style} • {spec.stats.livableArea} m² • {spec.stats.bedroomCount} Beds • {spec.stats.floorCount} Floors
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};
