// src/pages/ActiveJobScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { OtpInputBoxes } from '../components/worker/OtpInputBoxes';
import { Toast } from '../components/common/Toast';
import { getCategoryMeta } from '../constants/categories';
import confetti from 'canvas-confetti';
import {
  Briefcase,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Star,
  ShieldAlert,
  Zap,
  Clock,
  Sparkles,
} from 'lucide-react';

const getCategoryIcon = (category) => {
  const meta = getCategoryMeta(category);
  const IconComp = meta.icon;
  return <IconComp className={`w-5 h-5 ${meta.color}`} />;
};

export function ActiveJobScreen() {
  const { user, refreshUserData } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [otpCode, setOtpCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [hasOtpError, setHasOtpError] = useState(false);
  const [completedPayout, setCompletedPayout] = useState(null);
  const [toast, setToast] = useState(null);

  // Review Modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const fetchActiveJob = async () => {
    if (!user?.id) return;
    try {
      const data = await api.getWorkerActiveJob(user.id);
      setJob(data);
    } catch (err) {
      console.warn('Error fetching active job:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveJob();
  }, [user?.id]);

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 4) {
      setToast({ message: 'Please enter all 4 digits of the OTP', type: 'warning' });
      return;
    }

    setSubmitting(true);
    setHasOtpError(false);

    try {
      const res = await api.completeTask({ taskId: job.id, otpCode });

      if (res.success) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });

        setCompletedPayout(res);
        setToast({ message: 'Job verified! Escrow payout credited to your wallet.', type: 'success' });
        await refreshUserData();
      } else {
        setHasOtpError(true);
        setAttemptCount(res.attemptCount || 1);

        if (res.isDisputed) {
          setToast({
            message: '3 failed OTP attempts! Task has escalated to DISPUTED.',
            type: 'error',
          });
          await fetchActiveJob();
        } else {
          setToast({
            message: `Incorrect OTP. Attempt ${res.attemptCount || 1} of 3.`,
            type: 'error',
          });
        }
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      setToast({ message: err.message || 'OTP verification failed', type: 'error' });
      setHasOtpError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!job?.id) return;
    setSubmittingReview(true);
    try {
      await api.submitReview({ taskId: job.id, rating, comment });
      setShowReviewModal(false);
      setHasReviewed(true);
      setToast({
        message: 'Review submitted! It will be revealed once requester reviews or after 7 days.',
        type: 'success',
      });
    } catch (err) {
      console.error('Submit review error:', err);
      setToast({ message: err.message || 'Failed to submit review', type: 'error' });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-slate-500">
        <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-bold text-slate-700">Checking active assignment...</p>
      </div>
    );
  }

  // Case 1: Job completed successfully just now
  if (completedPayout) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto text-emerald-600 shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Escrow Released
          </span>
          <h1 className="text-2xl font-black text-slate-950 mt-2">Chore Complete!</h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            The 4-digit code was validated in-person. Funds have been credited to your simulated earnings wallet.
          </p>
        </div>

        <div className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-3xl text-xs space-y-2.5 max-w-xs mx-auto shadow-xs">
          <div className="flex justify-between text-emerald-950">
            <span>Agreed Chore Fee:</span>
            <span className="font-mono font-bold">₹{job?.agreed_price}</span>
          </div>
          <div className="flex justify-between text-emerald-800">
            <span>Platform Fee (10%):</span>
            <span className="font-mono font-semibold">-₹{completedPayout.fee_amount || 10}</span>
          </div>
          <div className="pt-2 border-t border-emerald-300/60 flex justify-between text-base font-black text-emerald-950">
            <span>Net Credited to Wallet:</span>
            <span className="font-mono text-emerald-700">+₹{completedPayout.payout_amount || (job?.agreed_price - 10)}</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-2.5 max-w-xs mx-auto">
          {!hasReviewed ? (
            <button
              onClick={() => setShowReviewModal(true)}
              className="w-full py-3 rounded-2xl text-xs font-black bg-slate-950 hover:bg-slate-800 text-white shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Star className="w-4 h-4 fill-white" />
              <span>Rate &amp; Review Requester</span>
            </button>
          ) : (
            <div className="text-xs text-emerald-800 font-bold bg-emerald-50 py-2.5 rounded-2xl border border-emerald-200">
              ✓ Review submitted (Double-blind)
            </div>
          )}

          <Link
            to="/worker"
            className="w-full py-3 rounded-2xl text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
          >
            Find Next Chore
          </Link>
        </div>
      </div>
    );
  }

  // Case 2: No active job
  if (!job) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-400">
          <Briefcase className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-base font-black text-slate-950">No Active Job Right Now</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            You don&apos;t currently have an assigned chore in progress. Discover open gigs nearby and submit reverse bids!
          </p>
        </div>
        <Link
          to="/worker"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black bg-slate-950 hover:bg-slate-800 text-white shadow-md transition-all active:scale-95"
        >
          <span>Find Available Chores</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // Calculate estimated net payout
  const agreedPrice = Number(job.agreed_price || job.budget);
  const fee = Math.max(5, Math.round(agreedPrice * 0.1));
  const netEarnings = agreedPrice - fee;

  return (
    <div className="max-w-xl mx-auto px-4 py-5 space-y-5 animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Uber Driver Trip Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Current Assignment
          </span>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight mt-1">Active Job</h1>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Your Payout
          </span>
          <p className="text-2xl font-black text-emerald-600 font-mono">₹{netEarnings}</p>
        </div>
      </div>

      {/* Task Summary Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
              {getCategoryIcon(job.category)}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {job.category?.replace(/_/g, ' ')}
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-950 mt-0.5">{job.title}</h2>
            </div>
          </div>
        </div>

        {job.description && (
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            {job.description}
          </p>
        )}

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
            <span className="font-semibold text-slate-900">{job.address || 'Local Area / Landmark'}</span>
          </div>
          {job.requester && (
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="text-slate-400">Requester:</span>
              <strong className="text-slate-950">{job.requester.name}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Rapido / Uber Driver OTP Handover Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs text-center space-y-5">
        <div>
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-950 mb-2">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h3 className="font-black text-slate-950 text-base">Enter Requester&apos;s 4-Digit Handover PIN</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Upon delivering items or completing work in person, ask the requester for their 4-digit code to immediately release escrow funds.
          </p>
        </div>

        <OtpInputBoxes
          value={otpCode}
          onChange={(code) => setOtpCode(code)}
          disabled={submitting}
          hasError={hasOtpError}
          attemptCount={attemptCount}
        />

        <div className="pt-2">
          <button
            onClick={handleVerifyOtp}
            disabled={submitting || otpCode.length !== 4}
            className="w-full py-4 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-98"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>{submitting ? 'Verifying PIN...' : 'Verify PIN & Claim ₹' + netEarnings}</span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Security Notice: 3 incorrect PIN entries locks task into dispute.</span>
        </div>
      </div>

      {/* Double-Blind Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-black text-slate-950 text-base">Rate &amp; Review Requester</h3>
            <p className="text-xs text-slate-500">
              How was your experience with <strong className="text-slate-900">{job.requester?.name || 'Requester'}</strong>?
            </p>

            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-125 active:scale-95"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Clear directions, quick meeting, polite!"
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 outline-none resize-none"
              maxLength={300}
            />

            <div className="p-3 rounded-xl bg-blue-50 text-[10px] text-blue-900 border border-blue-200">
              <span className="font-bold">Double-Blind Policy:</span> Ratings remain hidden until reciprocal review or 7 days elapse.
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                disabled={submittingReview}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-slate-950 hover:bg-slate-800 text-white shadow-xs transition-colors disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActiveJobScreen;
