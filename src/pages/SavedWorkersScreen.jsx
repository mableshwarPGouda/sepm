// src/pages/SavedWorkersScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import { api } from '../services/api';
import {
  Heart,
  Star,
  Zap,
  ArrowRight,
  Trash2,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowLeft,
} from 'lucide-react';

export function SavedWorkersScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedWorkers, setSavedWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workerStatusMap, setWorkerStatusMap] = useState({});

  useEffect(() => {
    async function loadSavedWorkers() {
      if (!user?.id) return;
      try {
        const list = adminService.getSavedWorkers(user.id);
        setSavedWorkers(list);

        // Check live active job status for each saved worker
        const statusMap = {};
        for (const worker of list) {
          try {
            const activeJob = await api.getWorkerActiveJob(worker.id);
            statusMap[worker.id] = {
              isBusy: Boolean(activeJob),
              activeJobTitle: activeJob?.title || null,
            };
          } catch {
            statusMap[worker.id] = { isBusy: false, activeJobTitle: null };
          }
        }
        setWorkerStatusMap(statusMap);
      } catch (err) {
        console.warn('Could not load saved workers:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSavedWorkers();
  }, [user?.id]);

  const handleRemove = (workerId) => {
    if (!user?.id) return;
    const updated = adminService.removeSavedWorker(user.id, workerId);
    setSavedWorkers(updated);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/requester')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-950 tracking-tight">
                My Preferred Helpers
              </h1>
              <span className="w-6 h-6 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-black flex items-center justify-center">
                {savedWorkers.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Helpers you&apos;ve worked with, with real-time live availability
            </p>
          </div>
        </div>

        <Link
          to="/requester/post-task"
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Post New Task</span>
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400">
          Checking helper statuses...
        </div>
      ) : savedWorkers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <Heart className="w-7 h-7 fill-rose-500/20" />
          </div>
          <div>
            <h3 className="font-black text-slate-950 text-base">No Saved Helpers Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              When a helper completes a chore for you or bids on your task, you can tap &ldquo;Save Worker&rdquo; to easily rehire them and monitor when they are free.
            </p>
          </div>
          <Link
            to="/requester"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-slate-950 text-white hover:bg-slate-800 transition-colors shadow-xs mt-2"
          >
            <span>View My Active Tasks</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {savedWorkers.map((worker) => {
            const statusInfo = workerStatusMap[worker.id] || { isBusy: false };
            const isBusy = statusInfo.isBusy;

            return (
              <div
                key={worker.id}
                className="bg-white p-5 rounded-3xl border border-slate-200/90 hover:border-slate-300 shadow-xs flex flex-col justify-between space-y-4 group transition-all"
              >
                <div>
                  {/* Top Status & Remove */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Live Availability Badge */}
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                        isBusy
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isBusy ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                        }`}
                      ></span>
                      <span>{isBusy ? 'Busy on a Job' : 'Free & Available'}</span>
                    </span>

                    <button
                      onClick={() => handleRemove(worker.id)}
                      className="text-slate-300 hover:text-red-600 transition-colors p-1"
                      title="Remove from saved helpers"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Worker Info */}
                  <div className="flex items-start gap-3.5 mt-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-950 to-brand-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                      {worker.name ? worker.name.charAt(0).toUpperCase() : 'W'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-black text-slate-950 text-sm">{worker.name}</h3>
                        <span className="inline-flex items-center text-[10px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 mr-0.5" />
                          {Number(worker.rating_average || 5).toFixed(1)}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold block mt-0.5">
                        {worker.workerId || 'VERIFIED WORKER'}
                      </span>
                    </div>
                  </div>

                  {/* Skills Chips */}
                  {worker.skills && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {worker.skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 text-[10px] font-bold border border-slate-100"
                        >
                          {s.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {isBusy ? 'Wait or post task' : 'Ready for chores'}
                  </span>

                  <Link
                    to="/requester/post-task"
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>Post Chore</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SavedWorkersScreen;
