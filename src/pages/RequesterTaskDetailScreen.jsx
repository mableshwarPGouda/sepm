// src/pages/RequesterTaskDetailScreen.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRealtimeTask } from '../hooks/useRealtimeTask';
import { api } from '../services/api';
import { OtpDisplayCard } from '../components/requester/OtpDisplayCard';
import { LiveBidsList } from '../components/requester/LiveBidsList';
import { EscrowStrip } from '../components/requester/EscrowStrip';
import { Toast } from '../components/common/Toast';
import { adminService } from '../services/adminService';
import { getCategoryMeta } from '../constants/categories';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Star,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-react';

const getCategoryIcon = (category) => {
  const meta = getCategoryMeta(category);
  const IconComp = meta.icon;
  return <IconComp className={`w-5 h-5 ${meta.color}`} />;
};

export function RequesterTaskDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, wallet, refreshUserData } = useAuth();
  const { task, loading, error, refetch } = useRealtimeTask(id);

  const [otpCode, setOtpCode] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState(null);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch OTP if task is ASSIGNED and current user is requester
  useEffect(() => {
    async function loadOtp() {
      if (task?.status === 'ASSIGNED' && task.requester_id === user?.id) {
        try {
          const otp = await api.getTaskOtp(task.id);
          setOtpCode(otp);
        } catch (err) {
          console.warn('Could not fetch OTP:', err);
        }
      }
    }
    loadOtp();
  }, [task?.status, task?.id, task?.requester_id, user?.id]);

  const handleAcceptBid = async (bidId) => {
    setAccepting(true);
    try {
      await api.acceptBid({ taskId: task.id, bidId });
      setToast({ message: 'Bid accepted! Escrow locked and completion OTP generated.', type: 'success' });
      await refetch();
      await refreshUserData();
    } catch (err) {
      console.error('Accept bid error:', err);
      setToast({ message: err.message || 'Failed to accept bid', type: 'error' });
    } finally {
      setAccepting(false);
    }
  };

  const handleCancelTask = async () => {
    if (!window.confirm('Are you sure you want to cancel this task? Any escrow funds will be fully refunded.')) {
      return;
    }
    setCancelling(true);
    try {
      await api.cancelTask({ taskId: task.id, reason: 'Cancelled by requester' });
      setToast({ message: 'Task cancelled. Escrow refunded to your wallet.', type: 'info' });
      await refetch();
      await refreshUserData();
    } catch (err) {
      console.error('Cancel task error:', err);
      setToast({ message: err.message || 'Failed to cancel task', type: 'error' });
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitReview = async () => {
    setSubmittingReview(true);
    try {
      await api.submitReview({ taskId: task.id, rating, comment });
      setShowReviewModal(false);
      setToast({
        message: 'Review submitted! It will be revealed once worker reviews or after 7 days (double-blind).',
        type: 'success',
      });
      await refetch();
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
        <p className="mt-3 text-xs font-bold text-slate-700">Loading chore status...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="max-w-md mx-auto p-8 text-center bg-white rounded-3xl border border-slate-200 mt-6 shadow-xs">
        <p className="text-sm font-black text-red-600">Task Not Found</p>
        <p className="text-xs text-slate-500 mt-1">{error || 'This task does not exist or has been removed.'}</p>
        <Link
          to="/requester"
          className="mt-4 inline-block text-xs font-bold text-slate-900 hover:underline"
        >
          ← Return to Dashboard
        </Link>
      </div>
    );
  }

  const isRequester = user?.id === task.requester_id;
  const isCompleted = task.status === 'COMPLETED';
  const hasReviewed = task.reviews?.some((r) => r.reviewer_id === user?.id);

  // Stepper helper
  const getTimelineStep = () => {
    if (task.status === 'COMPLETED') return 4;
    if (task.status === 'ASSIGNED') return 3;
    if (task.bids && task.bids.length > 0) return 2;
    return 1;
  };
  const currentStep = getTimelineStep();

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-5 animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/requester')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* Task Status Pill */}
        <span
          className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
            task.status === 'OPEN'
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : task.status === 'ASSIGNED'
              ? 'bg-blue-100 text-blue-900 border border-blue-300'
              : task.status === 'COMPLETED'
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              : task.status === 'DISPUTED'
              ? 'bg-purple-100 text-purple-900 border border-purple-300'
              : 'bg-slate-100 text-slate-700 border border-slate-300'
          }`}
        >
          {task.status}
        </span>
      </div>

      {/* Uber / Swiggy Style Lifecycle Stepper */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs">
        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
          <span className={currentStep >= 1 ? 'text-slate-950' : ''}>1. Posted</span>
          <span className={currentStep >= 2 ? 'text-slate-950' : ''}>2. Bids ({task.bids?.length || 0})</span>
          <span className={currentStep >= 3 ? 'text-slate-950' : ''}>3. Assigned</span>
          <span className={currentStep >= 4 ? 'text-emerald-600' : ''}>4. Complete</span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-slate-950 to-brand-600 h-full transition-all duration-500 rounded-full"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Task Specification Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
              {getCategoryIcon(task.category)}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-600">
                {task.category?.replace(/_/g, ' ')}
              </span>
              <h1 className="text-base sm:text-lg font-black text-slate-950 mt-0.5">{task.title}</h1>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
              {task.status === 'ASSIGNED' || isCompleted ? 'Agreed Price' : 'Budget'}
            </span>
            <p className="text-2xl font-black text-slate-950 font-mono leading-none">
              ₹{task.agreed_price || task.budget}
            </p>
          </div>
        </div>

        {task.description && (
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            {task.description}
          </p>
        )}

        {/* Attached Task Photo if available */}
        {(task.photo_url || localStorage.getItem(`whap_task_photo_${task.id}`)) && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Attached Task Reference Photo
            </span>
            <div className="rounded-2xl overflow-hidden border border-purple-100 max-h-64 bg-slate-50 shadow-2xs">
              <img
                src={task.photo_url || localStorage.getItem(`whap_task_photo_${task.id}`)}
                alt="Task attachment"
                className="w-full h-auto max-h-64 object-cover"
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
            <span className="font-semibold text-slate-800">{task.address || 'Local Area / Landmark'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Posted {new Date(task.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Escrow Status Strip */}
      <EscrowStrip escrow={task.escrow} status={task.status} />

      {/* ASSIGNED STATE: Completion OTP Card (Requester Only) */}
      {task.status === 'ASSIGNED' && isRequester && (
        <div className="space-y-4">
          <OtpDisplayCard otpCode={otpCode} />

          {/* Assigned Worker Profile Card */}
          {task.worker && (
            <div className="bg-white p-4 rounded-3xl border border-slate-200/90 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                  {task.worker.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                    Assigned Helper
                  </span>
                  <p className="font-extrabold text-slate-950 text-sm">{task.worker.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {task.worker.rating_average > 0 && (
                  <div className="flex items-center gap-1 text-xs font-black text-amber-600 bg-amber-50 border border-amber-200/70 px-2.5 py-1 rounded-xl">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{Number(task.worker.rating_average).toFixed(1)}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    adminService.saveWorker(user?.id, task.worker);
                    setToast({ message: `Saved ${task.worker.name} to your preferred helpers!`, type: 'success' });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors flex items-center gap-1"
                  title="Save worker to My Preferred Helpers"
                >
                  <Star className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                  <span className="hidden sm:inline">Save Helper</span>
                </button>
              </div>
            </div>
          )}

          {/* Cancel Assigned Task Button */}
          <div className="text-center pt-1">
            <button
              onClick={handleCancelTask}
              disabled={cancelling}
              className="text-xs font-bold text-red-600 hover:text-red-700 p-2 rounded-xl hover:bg-red-50 transition-colors inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{cancelling ? 'Cancelling...' : 'Cancel Task & Refund Escrow'}</span>
            </button>
          </div>
        </div>
      )}

      {/* OPEN STATE: Incoming Worker Bids */}
      {task.status === 'OPEN' && (
        <div className="space-y-4">
          <LiveBidsList
            bids={task.bids}
            taskId={task.id}
            walletBalance={wallet?.balance || 0}
            onAcceptBid={handleAcceptBid}
            accepting={accepting}
          />

          <div className="text-center pt-1">
            <button
              onClick={handleCancelTask}
              disabled={cancelling}
              className="text-xs font-bold text-slate-500 hover:text-red-600 p-2 transition-colors"
            >
              {cancelling ? 'Cancelling...' : 'Cancel This Task'}
            </button>
          </div>
        </div>
      )}

      {/* COMPLETED STATE: Double-Blind Review Action */}
      {isCompleted && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h3 className="font-black text-slate-950 text-lg">Task Verified &amp; Completed!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            The completion OTP was confirmed in-person and escrow was released to your helper.
          </p>

          {!hasReviewed ? (
            <button
              onClick={() => setShowReviewModal(true)}
              className="mt-2 px-6 py-3 rounded-2xl text-xs font-black bg-slate-950 hover:bg-slate-800 text-white shadow-md inline-flex items-center gap-2 transition-all active:scale-95"
            >
              <Star className="w-4 h-4 fill-white" />
              <span>Rate &amp; Review Worker</span>
            </button>
          ) : (
            <div className="p-3.5 bg-slate-50 rounded-2xl text-xs text-slate-700 border border-slate-200/70 max-w-sm mx-auto">
              <p className="font-bold text-slate-900">✓ Review Submitted</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Double-blind policy: Reviews reveal after reciprocal evaluation or 7 days.
              </p>
            </div>
          )}
        </div>
      )}

      {/* DISPUTED STATE */}
      {task.status === 'DISPUTED' && (
        <div className="bg-purple-50 border border-purple-200 rounded-3xl p-5 text-purple-950 space-y-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-700" />
            <h3 className="font-black text-sm">Under Administrative Dispute</h3>
          </div>
          <p className="text-xs text-purple-900/90 leading-relaxed">
            This task has been flagged for administrative dispute (triggered by 3 incorrect OTP entries or unresolved delivery issue). Escrow funds remain safely frozen. A platform administrator will adjudicate.
          </p>
        </div>
      )}

      {/* Double-Blind Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-black text-slate-950 text-base">Rate &amp; Review Worker</h3>
            <p className="text-xs text-slate-500">
              Share your experience with <strong className="text-slate-900">{task.worker?.name || 'Helper'}</strong>.
            </p>

            {/* Star Rating Picker */}
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
              placeholder="e.g. Prompt delivery, brought exact notes, polite and fast!"
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 outline-none resize-none"
              maxLength={300}
            />

            <div className="p-3 rounded-xl bg-blue-50 text-[10px] text-blue-900 border border-blue-200">
              <span className="font-bold">Double-Blind Guarantee:</span> Your rating is kept hidden until the worker rates you or 7 days elapse.
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                disabled={submittingReview}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
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

export default RequesterTaskDetailScreen;
