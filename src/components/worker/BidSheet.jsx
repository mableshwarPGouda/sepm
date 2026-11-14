// src/components/worker/BidSheet.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Send, CheckCircle2, AlertCircle, Zap, ShieldCheck } from 'lucide-react';

const SUGGESTED_OFFER_MESSAGES = [
  'Available right now, on two-wheeler',
  'I am right near this department',
  'Can deliver carefully within 20 mins',
];

export function BidSheet({
  task,
  workerLocation = null,
  existingBid = null,
  hasActiveJob = false,
  onBidSuccess,
}) {
  const navigate = useNavigate();
  const initialPrice = existingBid ? Number(existingBid.price) : Number(task.budget);

  const [price, setPrice] = useState(initialPrice);
  const [message, setMessage] = useState(existingBid?.message || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const minBid = 20;
  const maxBid = Number(task.budget) * 2;

  // 10% platform fee, minimum ₹5
  const rawFee = price * 0.1;
  const platformFee = Math.max(5, Math.round(rawFee));
  const netPayout = Math.max(0, price - platformFee);

  const handleStep = (delta) => {
    setPrice((prev) => Math.min(maxBid, Math.max(minBid, prev + delta)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasActiveJob) {
      setError('You already have an active job in progress! Maximum 1 active job per worker.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.placeBid({
        taskId: task.id,
        price: Number(price),
        latitude: workerLocation?.lat || null,
        longitude: workerLocation?.lng || null,
        message: message.trim() || null,
      });

      if (onBidSuccess) onBidSuccess();
      navigate('/worker/bids');
    } catch (err) {
      console.error('Place bid error:', err);
      setError(err.message || 'Failed to place bid');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5 animate-fade-in"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-950">
            {existingBid ? 'Update Your Offer' : 'Submit Reverse Bid'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Compete with fair pricing (Floor ₹{minBid}, Ceiling ₹{maxBid}).
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
          Reverse Bidding
        </span>
      </div>

      {hasActiveJob && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Active Job Lock:</strong> You currently have an active chore in progress. Platform safety policy permits max 1 active assignment per worker.
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Uber / Rapido Style Price Stepper */}
      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 text-center space-y-3">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          Your Proposed Fee
        </span>

        <div className="flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => handleStep(-5)}
            disabled={price <= minBid || hasActiveJob}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-300 shadow-sm flex items-center justify-center text-slate-800 hover:bg-slate-100 font-black text-2xl disabled:opacity-40 active:scale-95 transition-all"
          >
            -
          </button>
          <div className="text-4xl sm:text-5xl font-black text-slate-950 tracking-tight font-mono">
            ₹{price}
          </div>
          <button
            type="button"
            onClick={() => handleStep(5)}
            disabled={price >= maxBid || hasActiveJob}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-300 shadow-sm flex items-center justify-center text-slate-800 hover:bg-slate-100 font-black text-2xl disabled:opacity-40 active:scale-95 transition-all"
          >
            +
          </button>
        </div>

        {/* Uber Style Fare Breakdown Pill */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between text-xs max-w-sm mx-auto shadow-2xs">
          <div className="text-left">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Platform Fee (10%)
            </span>
            <p className="font-bold text-slate-700 font-mono">-₹{platformFee}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider">
              Net Take-Home
            </span>
            <p className="text-base font-black text-emerald-700 font-mono">₹{netPayout}</p>
          </div>
        </div>
      </div>

      {/* Message & Quick Chips */}
      <div className="space-y-2">
        <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
          Note to Requester (Optional)
        </label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. Can deliver in 15 mins or I have a bike"
          disabled={hasActiveJob}
          maxLength={120}
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 outline-none transition-all shadow-2xs disabled:bg-slate-100"
        />

        <div className="flex flex-wrap gap-1.5 pt-1">
          {SUGGESTED_OFFER_MESSAGES.map((msg, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setMessage(msg)}
              disabled={hasActiveJob}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors disabled:opacity-40"
            >
              {msg}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting || hasActiveJob}
          className="w-full py-4 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-slate-950 to-brand-600 hover:from-slate-900 hover:to-brand-700 text-white shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-98"
        >
          {submitting ? (
            <span>Transmitting Offer...</span>
          ) : (
            <>
              <Send className="w-4 h-4 stroke-[2.5]" />
              <span>{existingBid ? 'Update Offer • ₹' + price : 'Send Offer • ₹' + price}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default BidSheet;
