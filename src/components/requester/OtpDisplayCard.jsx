// src/components/requester/OtpDisplayCard.jsx
import React, { useState } from 'react';
import { Copy, Check, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';

export function OtpDisplayCard({ otpCode }) {
  const [copied, setCopied] = useState(false);

  if (!otpCode) return null;

  const digits = String(otpCode).padStart(4, '0').split('');

  const handleCopy = () => {
    navigator.clipboard.writeText(String(otpCode));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white border-2 border-indigo-500/30 rounded-3xl p-6 shadow-xl">
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Card Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="font-black text-xs uppercase tracking-wider text-indigo-200">
            Delivery Handover PIN
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
          <Clock className="w-3 h-3 text-indigo-400" />
          <span>Valid 2 Hours</span>
        </div>
      </div>

      {/* OTP Display Blocks */}
      <div className="my-6 flex flex-col items-center">
        <span className="text-xs text-slate-300 font-medium mb-4 text-center max-w-xs">
          Hand this 4-digit code in-person to your worker <strong className="text-white">ONLY</strong> after you inspect the chore:
        </span>
        <div className="flex items-center gap-3">
          {digits.map((digit, idx) => (
            <div
              key={idx}
              className="w-14 sm:w-16 h-18 sm:h-20 bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border-2 border-indigo-400/40 flex items-center justify-center text-3xl sm:text-4xl font-black text-white font-mono tracking-tighter"
            >
              {digit}
            </div>
          ))}
        </div>
      </div>

      {/* Warning & Copy Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 border-t border-white/10">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Never share this code over phone, chat, or before items arrive.</span>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-950 font-black text-xs rounded-xl shadow-sm transition-all active:scale-95 shrink-0 self-end sm:self-auto"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
              <span className="text-emerald-700">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default OtpDisplayCard;
