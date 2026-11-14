// src/components/requester/LiveBidsList.jsx
import React, { useState } from 'react';
import { Star, Check, AlertCircle, ArrowUpRight, Zap, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LiveBidsList({
  bids = [],
  taskId,
  walletBalance = 0,
  onAcceptBid,
  accepting = false,
}) {
  const [confirmBid, setConfirmBid] = useState(null);

  if (!bids || bids.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/90 p-8 text-center text-slate-500 shadow-xs space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
          <Zap className="w-6 h-6 animate-pulse" />
        </div>
        <p className="text-xs font-black uppercase tracking-wider text-slate-900">Waiting for Worker Offers</p>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Nearby helpers are discovering your task within the 1.5 km zone. Incoming offers will pop up here live.
        </p>
      </div>
    );
  }

  const handleInitiateAccept = (bid) => {
    setConfirmBid(bid);
  };

  const handleConfirm = () => {
    if (confirmBid && onAcceptBid) {
      onAcceptBid(confirmBid.id);
      setConfirmBid(null);
    }
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-950 text-xs uppercase tracking-wider flex items-center gap-2">
          <span>Incoming Offers</span>
          <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center">
            {bids.length}
          </span>
        </h3>
        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Realtime
        </span>
      </div>

      <div className="divide-y divide-slate-100 bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
        {bids.map((bid) => {
          const isPending = bid.status === 'PENDING';
          const isAccepted = bid.status === 'ACCEPTED';
          const isRejected = bid.status === 'REJECTED';

          return (
            <div
              key={bid.id}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                isAccepted ? 'bg-emerald-50/70' : 'hover:bg-slate-50/70'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                  {bid.worker?.name ? bid.worker.name.charAt(0).toUpperCase() : 'W'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-950 text-sm">
                      {bid.worker?.name || 'Verified Helper'}
                    </span>
                    {bid.worker?.rating_average > 0 && (
                      <span className="inline-flex items-center text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 mr-1" />
                        {Number(bid.worker.rating_average).toFixed(1)}
                      </span>
                    )}
                  </div>
                  {bid.message && (
                    <p className="text-xs text-slate-600 mt-1 italic bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 max-w-md">
                      &ldquo;{bid.message}&rdquo;
                    </p>
                  )}
                  <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                    Offer sent at {new Date(bid.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <span className="text-xl font-black text-slate-950 font-mono">₹{bid.price}</span>
                  <div className="text-[10px] font-black uppercase tracking-wider">
                    {isPending && <span className="text-amber-600">Pending</span>}
                    {isAccepted && <span className="text-emerald-600">Accepted</span>}
                    {isRejected && <span className="text-slate-400">Declined</span>}
                  </div>
                </div>

                {isPending && (
                  <button
                    onClick={() => handleInitiateAccept(bid)}
                    disabled={accepting}
                    className="bg-slate-950 hover:bg-slate-800 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
                  >
                    Accept Offer
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {confirmBid && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h4 className="font-black text-slate-950 text-base">Accept Worker Offer?</h4>
            <p className="text-xs text-slate-600">
              You are assigning <strong className="text-slate-900">{confirmBid.worker?.name || 'this worker'}</strong> to your task for <strong className="text-slate-950 font-mono">₹{confirmBid.price}</strong>.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Agreed Chore Price:</span>
                <span className="font-bold text-slate-900 font-mono">₹{confirmBid.price}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Your Wallet Balance:</span>
                <span className="font-bold text-slate-900 font-mono">₹{Number(walletBalance).toFixed(0)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-950">
                <span>Escrow to Lock:</span>
                <span className="text-brand-600 font-mono">₹{confirmBid.price}</span>
              </div>
            </div>

            {walletBalance < confirmBid.price && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Insufficient Simulated Wallet Balance</p>
                  <p className="mt-0.5 text-[11px]">
                    Top up your wallet first to lock escrow funds.
                  </p>
                  <Link
                    to="/requester/wallet"
                    className="inline-flex items-center gap-1 font-bold text-brand-600 hover:underline mt-1"
                  >
                    <span>Go to Wallet</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmBid(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={accepting || walletBalance < confirmBid.price}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-slate-950 hover:bg-slate-800 text-white shadow-xs transition-colors disabled:opacity-50"
              >
                {accepting ? 'Locking Escrow...' : 'Confirm & Lock Escrow'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveBidsList;
