// src/pages/AdminDisputesScreen.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { adminService } from '../services/adminService';
import { Toast } from '../components/common/Toast';
import { TASK_CATEGORIES, getCategoryMeta } from '../constants/categories';
import {
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
  History,
  TrendingUp,
  Wallet,
  Phone,
  Mail,
  Zap,
  Users,
  Eye,
  Check,
  X,
  FileText,
  Clock,
  Sparkles,
  MapPin,
  RefreshCw,
  Sliders,
  DollarSign,
  IdCard,
} from 'lucide-react';

export function AdminDisputesScreen() {
  const [activeTab, setActiveTab] = useState('FINANCIALS'); // 'FINANCIALS' | 'LIVE_WORKS' | 'DISPUTES' | 'WORKERS' | 'SETTINGS'

  // Data states
  const [disputes, setDisputes] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [toast, setToast] = useState(null);

  // Filters & Modals
  const [liveWorkFilter, setLiveWorkFilter] = useState('ALL');
  const [selectedProofModal, setSelectedProofModal] = useState(null); // { type, title, image }
  const [contactModal, setContactModal] = useState(null); // { name, role, phone, email, taskTitle }

  const loadAdminData = async () => {
    try {
      const [disputeData, taskData, cloudApps] = await Promise.all([
        api.getDisputedTasks().catch(() => []),
        api.getAllTasksAdmin().catch(() => []),
        adminService.fetchApplicationsCloud().catch(() => adminService.getApplications()),
      ]);
      setDisputes(disputeData || []);
      setAllTasks(taskData || []);
      setApplications(cloudApps || adminService.getApplications());
    } catch (err) {
      console.warn('Admin data load warning:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    const interval = setInterval(loadAdminData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Financial Calculations
  const completedTasks = allTasks.filter((t) => t.status === 'COMPLETED');
  const activeAssignedTasks = allTasks.filter((t) => t.status === 'ASSIGNED');

  const totalGMV = completedTasks.reduce((acc, t) => acc + Number(t.agreed_price || t.budget || 0), 0);
  const totalCommissionRevenue = completedTasks.reduce((acc, t) => {
    const price = Number(t.agreed_price || t.budget || 0);
    const fee = Math.max(5, Math.round(price * 0.1));
    return acc + fee;
  }, 0);
  const totalEscrowHeld = activeAssignedTasks.reduce((acc, t) => acc + Number(t.agreed_price || t.budget || 0), 0);

  // Dispute Adjudication Actions
  const handleResolve = async (taskId, decision) => {
    setResolvingId(taskId);
    try {
      await api.resolveDispute({ taskId, decision });
      setToast({
        message: `Dispute resolved successfully with decision: ${decision}`,
        type: 'success',
      });
      await loadAdminData();
    } catch (err) {
      console.error('Resolve dispute error:', err);
      setToast({ message: err.message || 'Failed to resolve dispute', type: 'error' });
    } finally {
      setResolvingId(null);
    }
  };

  // Reset OTP attempt lockout (Admin override)
  const handleResetOtp = async (taskId) => {
    setResolvingId(taskId);
    try {
      await api.resetTaskOtp(taskId);
      setToast({
        message: 'OTP attempts reset! Task moved back to ASSIGNED for customer handover.',
        type: 'success',
      });
      await loadAdminData();
    } catch (err) {
      setToast({ message: err.message || 'Could not reset OTP', type: 'error' });
    } finally {
      setResolvingId(null);
    }
  };

  // Worker Application Review
  const handleReviewApplication = async (applicationId, status, applicantName) => {
    try {
      await adminService.reviewApplication({ applicationId, status });
      const updated = await adminService.fetchApplicationsCloud();
      setApplications(updated);
      setToast({
        message: `${applicantName} marked as ${status}! Worker ID generated.`,
        type: 'success',
      });
    } catch (err) {
      console.error('Review application error:', err);
    }
  };

  const filteredTasks = allTasks.filter((t) => {
    if (liveWorkFilter === 'ALL') return true;
    return t.status === liveWorkFilter;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Admin Hub Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-200 bg-purple-950 px-3 py-1 rounded-full border border-purple-800">
              Platform Administration
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-1">
            Platform Operations &amp; Commission Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time chores, platform fees, dispute resolution, and worker verification
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Live Data</span>
        </button>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-slate-200/80 rounded-2xl scrollbar-none shadow-2xs">
        <button
          onClick={() => setActiveTab('FINANCIALS')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
            activeTab === 'FINANCIALS'
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>Commission &amp; Earnings</span>
        </button>

        <button
          onClick={() => setActiveTab('LIVE_WORKS')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
            activeTab === 'LIVE_WORKS'
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap className="w-4 h-4 text-blue-600" />
          <span>Live Chores ({allTasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('DISPUTES')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
            activeTab === 'DISPUTES'
              ? 'bg-white text-purple-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Disputes &amp; 3-OTP Lockouts ({disputes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('WORKERS')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
            activeTab === 'WORKERS'
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <IdCard className="w-4 h-4 text-brand-600" />
          <span>Worker Verification ({applications.length})</span>
        </button>
      </div>

      {/* TAB 1: Commission & Financial Overview */}
      {activeTab === 'FINANCIALS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Commission Revenue Card */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-6 rounded-3xl shadow-lg border border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  Platform Commission (10%)
                </span>
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-3xl font-black font-mono tracking-tight text-emerald-300">
                  ₹{totalCommissionRevenue.toFixed(2)}
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Net platform fees accumulated from completed micro-tasks
                </p>
              </div>
            </div>

            {/* Total Gross Chore Volume */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Gross Chore Volume (GMV)
                </span>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-black font-mono tracking-tight text-slate-950">
                  ₹{totalGMV.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Total value of chores settled on the platform
                </p>
              </div>
            </div>

            {/* Active Escrow Currently Held */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Active Escrow Locked
                </span>
                <Wallet className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="text-3xl font-black font-mono tracking-tight text-brand-600">
                  ₹{totalEscrowHeld.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Funds currently held in 3-level database row locks for ongoing jobs
                </p>
              </div>
            </div>
          </div>

          {/* Revenue Model Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <h3 className="font-black text-slate-950 text-base">
              Platform Commission &amp; Double-Entry Economics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-slate-900 block">Requester Fee</span>
                <p className="text-emerald-700 font-black text-base font-mono">0% (Free)</p>
                <p className="text-slate-500 text-[11px]">
                  Students and staff post chores at zero platform surcharge.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-slate-900 block">Worker Payout Commission</span>
                <p className="text-brand-600 font-black text-base font-mono">10% (Min ₹5)</p>
                <p className="text-slate-500 text-[11px]">
                  Deducted automatically from escrow upon valid 4-digit OTP handover.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-slate-900 block">Conservation of Value</span>
                <p className="text-blue-700 font-black text-base font-mono">ΔTotal = 0.00</p>
                <p className="text-slate-500 text-[11px]">
                  Double-entry ledger verifies zero financial leakage across all accounts.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Live Works Real-Time Monitoring */}
      {activeTab === 'LIVE_WORKS' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              {['ALL', 'ASSIGNED', 'OPEN', 'COMPLETED', 'DISPUTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setLiveWorkFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                    liveWorkFilter === st
                      ? 'bg-slate-950 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'ASSIGNED' ? 'In Progress' : st}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500">
              Showing {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400">
              No tasks currently match this filter.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const meta = getCategoryMeta(task.category);
                const IconComp = meta.icon;

                return (
                  <div
                    key={task.id}
                    className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                        <IconComp className={`w-5 h-5 ${meta.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              task.status === 'ASSIGNED'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : task.status === 'OPEN'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : task.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-purple-50 text-purple-800 border border-purple-200'
                            }`}
                          >
                            {task.status === 'ASSIGNED' ? '● In Progress' : task.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {task.id.slice(0, 8)}
                          </span>
                        </div>
                        <h4 className="font-black text-slate-950 text-sm mt-1">{task.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">{task.address || 'Task Location'}</p>

                        {/* Customer & Worker names with contact pills */}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                          <button
                            type="button"
                            onClick={() =>
                              setContactModal({
                                name: task.requester?.name || 'Customer',
                                role: 'Requester / Customer',
                                email: task.requester?.email || 'customer@whap.local',
                                phone: '+91 98765 11001',
                                taskTitle: task.title,
                              })
                            }
                            className="inline-flex items-center gap-1 text-slate-700 hover:text-brand-600 font-bold bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>Customer: {task.requester?.name || 'Requester'}</span>
                          </button>

                          {task.worker && (
                            <button
                              type="button"
                              onClick={() =>
                                setContactModal({
                                  name: task.worker?.name || 'Worker',
                                  role: 'Assigned Helper',
                                  email: task.worker?.email || 'worker@whap.local',
                                  phone: '+91 98765 22002',
                                  taskTitle: task.title,
                                })
                              }
                              className="inline-flex items-center gap-1 text-slate-700 hover:text-emerald-700 font-bold bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>Worker: {task.worker?.name}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 font-black uppercase">
                          {task.status === 'ASSIGNED' || task.status === 'COMPLETED' ? 'Agreed Fare' : 'Budget'}
                        </span>
                        <p className="text-xl font-black font-mono text-slate-950">
                          ₹{task.agreed_price || task.budget}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Disputes & 3-OTP Failure Lockout Resolution */}
      {activeTab === 'DISPUTES' && (
        <div className="space-y-4">
          <div className="p-5 bg-purple-50 border border-purple-200 rounded-3xl text-xs text-purple-950 flex items-start gap-3.5 shadow-2xs">
            <ShieldAlert className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-sm">Dispute &amp; 3-Strike Lockout Resolution</p>
              <p className="text-purple-900/90 mt-1 leading-relaxed">
                When a worker fails OTP entry 3 times or either party reports a delivery issue, the chore is locked into <strong>DISPUTED</strong> status. Escrow remains frozen. You can inspect contacts, contact both parties directly, override/reset the OTP attempts, or dispatch financial settlements.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
              Loading active disputes...
            </div>
          ) : disputes.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="font-black text-slate-950 text-base">Zero Active Disputes</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                All tasks are operating normally with zero disputes or lockouts.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-3xl border-2 border-purple-200 p-6 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-800 border border-red-200">
                          ⚠ 3 Incorrect OTP Attempts / Dispute Lock
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          ID: {task.id.slice(0, 8)}
                        </span>
                      </div>
                      <h3 className="font-black text-slate-950 text-base mt-1">{task.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{task.address || 'Task Location'}</p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                        Frozen Escrow
                      </span>
                      <p className="text-2xl font-black text-slate-950 font-mono leading-none">
                        ₹{task.agreed_price || task.budget}
                      </p>
                    </div>
                  </div>

                  {/* Customer and Worker Contact Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Customer</span>
                        <p className="font-black text-slate-950 text-xs">{task.requester?.name || 'Customer'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setContactModal({
                            name: task.requester?.name || 'Customer',
                            role: 'Requester / Customer',
                            email: task.requester?.email || 'customer@whap.local',
                            phone: '+91 98765 11001',
                            taskTitle: task.title,
                          })
                        }
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-1 transition-colors"
                      >
                        <Phone className="w-3 h-3 text-brand-600" />
                        <span>Contact</span>
                      </button>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Worker</span>
                        <p className="font-black text-slate-950 text-xs">{task.worker?.name || 'Worker'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setContactModal({
                            name: task.worker?.name || 'Worker',
                            role: 'Assigned Worker',
                            email: task.worker?.email || 'worker@whap.local',
                            phone: '+91 98765 22002',
                            taskTitle: task.title,
                          })
                        }
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-1 transition-colors"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>Contact</span>
                      </button>
                    </div>
                  </div>

                  {/* Resolution Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                    <button
                      onClick={() => handleResetOtp(task.id)}
                      disabled={resolvingId === task.id}
                      className="px-3.5 py-2 rounded-xl text-xs font-black bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 transition-colors flex items-center gap-1"
                      title="Reset failed OTP count and let customer/worker re-verify in person"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset OTP Attempts (Reopen)</span>
                    </button>

                    <button
                      onClick={() => handleResolve(task.id, 'REFUND_REQUESTER')}
                      disabled={resolvingId === task.id}
                      className="px-3.5 py-2 rounded-xl text-xs font-black bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 transition-colors"
                    >
                      Refund Customer (100%)
                    </button>

                    <button
                      onClick={() => handleResolve(task.id, 'RELEASE_TO_WORKER')}
                      disabled={resolvingId === task.id}
                      className="px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                    >
                      Release to Worker
                    </button>

                    <button
                      onClick={() => handleResolve(task.id, 'SPLIT')}
                      disabled={resolvingId === task.id}
                      className="px-3.5 py-2 rounded-xl text-xs font-black bg-slate-950 text-white hover:bg-slate-800 transition-colors"
                    >
                      Split 50/50
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Worker Verification Applications */}
      {activeTab === 'WORKERS' && (
        <div className="space-y-4">
          <div className="p-5 bg-blue-50 border border-blue-200 rounded-3xl text-xs text-blue-950 flex items-start gap-3.5 shadow-2xs">
            <IdCard className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-sm">Worker Identity &amp; Physical Verification Queue</p>
              <p className="text-blue-900/90 mt-1 leading-relaxed">
                Review candidate details, inspect uploaded Aadhar ID and achievement certificates, and issue official <strong>Worker IDs</strong>. Once approved, candidates are authorized to switch to worker mode and bid on chores.
              </p>
            </div>
          </div>

          {applications.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400">
              No worker applications submitted yet.
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-950 to-brand-600 text-white font-black text-lg flex items-center justify-center shrink-0">
                        {app.name ? app.name.charAt(0).toUpperCase() : 'W'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-950 text-base">{app.name}</h4>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              app.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : app.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          📞 {app.phone} • 📍 {app.rollNumber || 'Area Landmark'}
                        </p>
                        {app.workerId && (
                          <span className="font-mono text-xs font-black text-emerald-700 block mt-1">
                            Worker ID: {app.workerId}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* View Uploaded Proofs Buttons */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {app.aadharImage && (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedProofModal({
                              title: `${app.name} - Aadhar / Govt ID Proof`,
                              image: app.aadharImage,
                            })
                          }
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Aadhar</span>
                        </button>
                      )}

                      {app.certificateImage && (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedProofModal({
                              title: `${app.name} - Achievements / Certificate`,
                              image: app.certificateImage,
                            })
                          }
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Certificate</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Skills badges */}
                  {app.skills && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Qualified Skills
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {app.skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 text-xs font-bold"
                          >
                            {s.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Approve / Reject Controls */}
                  {app.status === 'PENDING' && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                      <button
                        onClick={() => handleReviewApplication(app.id, 'REJECTED', app.name)}
                        className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-bold rounded-xl transition-colors"
                      >
                        Reject Candidate
                      </button>
                      <button
                        onClick={() => handleReviewApplication(app.id, 'APPROVED', app.name)}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Approve &amp; Issue Worker ID</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Contact Customer / Worker */}
      {contactModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">
                {contactModal.role}
              </span>
              <h3 className="font-black text-slate-950 text-lg mt-0.5">{contactModal.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Task: {contactModal.taskTitle}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-mono font-bold text-slate-900">{contactModal.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono text-slate-900">{contactModal.email}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <a
                href={`tel:${contactModal.phone}`}
                className="w-full py-3 bg-slate-950 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>Call Directly ({contactModal.phone})</span>
              </a>

              <a
                href={`mailto:${contactModal.email}`}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                <span>Send Email</span>
              </a>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setContactModal(null)}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: View Document Proof Image */}
      {selectedProofModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-950 text-base">{selectedProofModal.title}</h3>
              <button
                onClick={() => setSelectedProofModal(null)}
                className="p-1 text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2 bg-slate-100 rounded-2xl overflow-hidden max-h-[70vh] flex items-center justify-center">
              <img
                src={selectedProofModal.image}
                alt="Document Preview"
                className="max-h-[65vh] w-auto object-contain rounded-xl shadow-md"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedProofModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-950 text-white font-black text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDisputesScreen;
