// src/components/requester/EscrowStrip.jsx
import React from 'react';
import { Lock, CheckCircle2, RotateCcw, ShieldCheck } from 'lucide-react';

export function EscrowStrip({ escrow, status }) {
  if (!escrow && status !== 'ASSIGNED' && status !== 'COMPLETED') return null;

  const amount = escrow?.amount || 0;
  const escrowStatus = escrow?.status || (status === 'ASSIGNED' ? 'HELD' : status === 'COMPLETED' ? 'RELEASED' : 'REFUNDED');

  if (escrowStatus === 'HELD') {
    return (
      <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between text-emerald-950 text-xs shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <p className="font-black text-sm">₹{amount} Secured in Safe Escrow</p>
            <p className="text-[11px] text-emerald-800 font-medium">
              Funds locked securely. Released to worker only when you verify their completion OTP.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-600 text-white uppercase tracking-wider shrink-0">
          Escrow Locked
        </span>
      </div>
    );
  }

  if (escrowStatus === 'RELEASED') {
    return (
      <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between text-blue-950 text-xs shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="font-black text-sm">₹{amount} Escrow Released</p>
            <p className="text-[11px] text-blue-800 font-medium">
              Chore confirmed. Helper received net earnings after platform fee deduction.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-blue-600 text-white uppercase tracking-wider shrink-0">
          Released
        </span>
      </div>
    );
  }

  if (escrowStatus === 'REFUNDED') {
    return (
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-center justify-between text-slate-800 text-xs shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-300 text-slate-700 flex items-center justify-center shrink-0">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <p className="font-black text-sm">₹{amount} Escrow Refunded</p>
            <p className="text-[11px] text-slate-600 font-medium">
              Task was cancelled and the full escrow balance was credited back to your wallet.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-slate-200 text-slate-800 uppercase tracking-wider shrink-0">
          Refunded
        </span>
      </div>
    );
  }

  return null;
}

export default EscrowStrip;
