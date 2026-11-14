// src/pages/WorkerTaskDetailScreen.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRealtimeTask } from '../hooks/useRealtimeTask';
import { useGeolocation } from '../hooks/useGeolocation';
import { api } from '../services/api';
import { BidSheet } from '../components/worker/BidSheet';
import { Toast } from '../components/common/Toast';
import { getCategoryMeta } from '../constants/categories';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Star,
  Briefcase,
  Zap,
  ArrowRight,
} from 'lucide-react';

const getCategoryIcon = (category) => {
  const meta = getCategoryMeta(category);
  const IconComp = meta.icon;
  return <IconComp className={`w-5 h-5 ${meta.color}`} />;
};

export function WorkerTaskDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { coords } = useGeolocation();
  const { task, loading, error } = useRealtimeTask(id);

  const [activeJob, setActiveJob] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function checkJob() {
      if (!user?.id) return;
      try {
        const job = await api.getWorkerActiveJob(user.id);
        setActiveJob(job);
      } catch (err) {
        console.warn('Could not check active job:', err);
      }
    }
    checkJob();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-slate-500">
        <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-bold text-slate-700">Loading job specifications...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="max-w-md mx-auto p-8 text-center bg-white rounded-3xl border border-slate-200 mt-6 shadow-xs">
        <p className="text-sm font-black text-red-600">Task Not Found</p>
        <p className="text-xs text-slate-500 mt-1">{error || 'This task does not exist or has expired.'}</p>
        <button
          onClick={() => navigate('/worker')}
          className="mt-4 text-xs font-bold text-slate-950 hover:underline"
        >
          ← Back to Local Jobs
        </button>
      </div>
    );
  }

  const existingBid = task.bids?.find((b) => b.worker_id === user?.id);
  const isAssignedToMe = task.assigned_worker_id === user?.id;
  const workerCoords = coords || null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-5 animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <button
        onClick={() => navigate('/worker')}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-950 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Local Jobs</span>
      </button>

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
              Budget
            </span>
            <p className="text-2xl font-black text-slate-950 font-mono leading-none">
              ₹{task.budget}
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

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
            <span className="font-semibold text-slate-800">{task.address || 'Local Area / Landmark'}</span>
          </div>

          {task.requester && (
            <div className="flex items-center gap-2 text-slate-700">
              <span className="text-slate-400">Posted by:</span>
              <strong className="text-slate-950">{task.requester.name}</strong>
              {task.requester.rating_average > 0 && (
                <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 mr-1" />
                  {Number(task.requester.rating_average).toFixed(1)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* If task is already assigned to this worker */}
      {isAssignedToMe && task.status === 'ASSIGNED' ? (
        <div className="p-5 bg-gradient-to-r from-blue-950 to-slate-900 text-white rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg border border-blue-800/40">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="font-black text-sm text-white">This job is assigned to you!</p>
              <p className="text-blue-200 text-xs mt-0.5">Go to your Active Job view to enter the completion OTP.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/worker/active')}
            className="px-5 py-3 bg-white hover:bg-slate-100 text-slate-950 font-black text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <span>Open Active Job</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : task.status === 'OPEN' ? (
        <BidSheet
          task={task}
          workerLocation={workerCoords}
          existingBid={existingBid}
          hasActiveJob={Boolean(activeJob && activeJob.id !== task.id)}
          onBidSuccess={() => {
            setToast({ message: 'Reverse bid placed successfully!', type: 'success' });
          }}
        />
      ) : (
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl text-center text-xs text-slate-500">
          This task is no longer open for bidding (Status: {task.status}).
        </div>
      )}
    </div>
  );
}

export default WorkerTaskDetailScreen;
