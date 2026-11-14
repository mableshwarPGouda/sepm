// src/pages/WalletScreen.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../hooks/useWallet';
import { SimulatedPaymentNotice } from '../components/common/SimulatedPaymentNotice';
import { Toast } from '../components/common/Toast';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Lock,
  RotateCcw,
  ShieldCheck,
  CreditCard,
  History,
  Sparkles,
} from 'lucide-react';

export function WalletScreen() {
  const { user, role, refreshUserData } = useAuth();
  const { wallet, ledger, loading, topup, withdraw } = useWallet();

  const [topupAmount, setTopupAmount] = useState(200);
  const [customTopup, setCustomTopup] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Withdrawal modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [upiId, setUpiId] = useState('yourname@upi');

  const handleTopup = async (amount) => {
    setSubmitting(true);
    try {
      await topup(amount);
      setToast({
        message: `Simulated top-up of ₹${amount} successful!`,
        type: 'success',
      });
      await refreshUserData();
    } catch (err) {
      console.error('Topup error:', err);
      setToast({ message: err.message || 'Top-up failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0) {
      setToast({ message: 'Please enter a valid withdrawal amount', type: 'warning' });
      return;
    }
    if (amt > Number(wallet?.balance || 0)) {
      setToast({ message: 'Withdrawal amount exceeds available wallet balance', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await withdraw(amt);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setToast({
        message: `Simulated withdrawal of ₹${amt} transferred to ${upiId}!`,
        type: 'success',
      });
      await refreshUserData();
    } catch (err) {
      console.error('Withdraw error:', err);
      setToast({ message: err.message || 'Withdrawal failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const getLedgerBadge = (type) => {
    switch (type) {
      case 'TOPUP':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            Topup
          </span>
        );
      case 'PAYOUT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            Payout
          </span>
        );
      case 'ESCROW_LOCK':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            Escrow Lock
          </span>
        );
      case 'ESCROW_REFUND':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            Refund
          </span>
        );
      case 'FEE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300">
            Platform Fee
          </span>
        );
      case 'WITHDRAWAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
            Withdrawal
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            {type}
          </span>
        );
    }
  };

  const balance = Number(wallet?.balance || 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-6 animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">Simulated Wallet</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Zero-leakage double-entry balance for escrow &amp; earnings
          </p>
        </div>
        <SimulatedPaymentNotice variant="pill" />
      </div>

      <SimulatedPaymentNotice variant="banner" />

      {/* WHAP Purple Luxury Wallet Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#170836] via-[#2a0845] to-[#4c1d95] text-white p-6 sm:p-7 shadow-2xl border border-purple-800/40 space-y-6">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-[#7c3aed]/25 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-200 uppercase tracking-wider">
            <CreditCard className="w-4 h-4 text-[#a78bfa]" />
            <span>WHAP Protected Escrow</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-purple-200 border border-white/10">
            Escrow Wallet
          </span>
        </div>

        <div>
          <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
            Available Balance
          </span>
          <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white mt-1">
            ₹{balance.toFixed(2)}
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 text-xs">
          <span className="text-purple-300 text-[11px]">Account: {user?.email}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
            >
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* 1-Tap Top-up Controls */}
      <div className="bg-white rounded-3xl border border-purple-100 p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#5e17eb]" />
            <span>Add Funds to Wallet</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Instant top-up to lock task escrows or test transactions.
          </p>
        </div>

        {/* Quick Top-up Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[50, 100, 200, 500].map((amt) => (
            <button
              key={amt}
              type="button"
              disabled={submitting}
              onClick={() => handleTopup(amt)}
              className="p-3 rounded-2xl bg-purple-50/50 hover:bg-[#5e17eb] hover:text-white border border-purple-100 text-slate-800 font-black text-sm font-mono transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1 group shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#5e17eb] group-hover:text-white" />
              <span>₹{amt}</span>
            </button>
          ))}
        </div>

        {/* Custom Topup */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="number"
            min={1}
            max={5000}
            value={customTopup}
            onChange={(e) => setCustomTopup(e.target.value)}
            placeholder="Custom amount (e.g. 250)"
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 outline-none"
          />
          <button
            type="button"
            disabled={submitting || !customTopup || Number(customTopup) <= 0}
            onClick={() => {
              handleTopup(Number(customTopup));
              setCustomTopup('');
            }}
            className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-colors disabled:opacity-40"
          >
            Add Funds
          </button>
        </div>
      </div>

      {/* Ledger Transaction History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <History className="w-4 h-4 text-slate-500" />
            <span>Transaction Ledger</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">Double-Entry Verified</span>
        </div>

        {loading ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/90 text-xs text-slate-400">
            Loading ledger...
          </div>
        ) : !ledger || ledger.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/90 text-xs text-slate-400">
            No transactions recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
            {ledger.map((entry) => {
              const amountNum = Number(entry.amount);
              const isPositive = amountNum > 0;

              return (
                <div
                  key={entry.id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">
                          {entry.type?.replace(/_/g, ' ')}
                        </span>
                        {getLedgerBadge(entry.type)}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(entry.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-sm font-black font-mono ${
                        isPositive ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {isPositive ? `+₹${amountNum.toFixed(2)}` : `-₹${Math.abs(amountNum).toFixed(2)}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleWithdraw}
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <h3 className="font-black text-slate-950 text-base">Simulated Withdrawal</h3>
            <p className="text-xs text-slate-500">
              Withdraw virtual funds to your simulated UPI VPA.
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                UPI ID (Virtual)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Amount (₹)
              </label>
              <input
                type="number"
                min={1}
                max={balance}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`Max ₹${balance.toFixed(0)}`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono outline-none"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl text-xs font-black bg-slate-950 text-white shadow-xs"
              >
                {submitting ? 'Processing...' : 'Withdraw'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default WalletScreen;
