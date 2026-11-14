// src/pages/RequesterHomeScreen.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useRealtime } from '../context/RealtimeContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { LeafletMap } from '../components/map/LeafletMap';
import { SkeletonGrid } from '../components/common/SkeletonCard';
import { TASK_CATEGORIES, getCategoryMeta } from '../constants/categories';
import {
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  MapPin,
  ShieldCheck,
  Zap,
  ArrowRight,
  Wallet,
  Search,
  Briefcase,
  Star,
  Users,
  Check,
  Radio,
} from 'lucide-react';

const getCategoryIcon = (category) => {
  const meta = getCategoryMeta(category);
  const IconComp = meta.icon;
  return <IconComp className={`w-4 h-4 ${meta.color}`} />;
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'OPEN':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-[#5e17eb] border border-purple-200">
          ● Bidding
        </span>
      );
    case 'ASSIGNED':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
          ● In Progress
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
          ✓ Completed
        </span>
      );
    case 'DISPUTED':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
          ⚠ In Dispute
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
          Cancelled
        </span>
      );
    default:
      return null;
  }
};

export function RequesterHomeScreen() {
  const { user, profile, updateLocation, wallet } = useAuth();
  const { coords, source } = useGeolocation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { registerPolling } = useRealtime();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id && coords && source === 'gps') {
      updateLocation(coords);
    }
  }, [user?.id, coords, source, updateLocation]);

  const fetchRequesterTasks = async () => {
    if (!user?.id) return;
    try {
      const data = await api.getRequesterTasks(user.id);
      setTasks(data || []);
    } catch (err) {
      console.warn('Error fetching requester tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequesterTasks();
    const unregister = registerPolling(fetchRequesterTasks);
    return () => unregister();
  }, [user?.id, registerPolling]);

  const openTasks = tasks.filter((t) => t.status === 'OPEN');
  const isLimitReached = openTasks.length >= 3;

  // Verified helpers near user matching reference mockup
  const nearbyHelpers = [
    { name: 'Rohan S', rating: 4.8, jobs: 120, dist: '0.7 km' },
    { name: 'Ananya K', rating: 4.7, jobs: 85, dist: '1.1 km' },
    { name: 'Vikram D', rating: 4.9, jobs: 200, dist: '1.3 km' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      {/* 1. TOP SECTION: Full-width Hero Banner (Crisp & Responsive in All Browsers) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#170836] via-[#2a0845] to-[#4c1d95] text-white p-6 sm:p-9 shadow-xl border border-purple-900/40">
        {/* Glow backdrop circles */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-[#7c3aed]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-60 h-60 bg-[#5e17eb]/15 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          {/* Left: Tagline & CTA */}
          <div className="space-y-3 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold text-purple-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Fastest Micro-Task Network</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Get things done,<br />
              <span className="text-[#c084fc]">the smart way.</span>
            </h1>

            <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed max-w-md">
              Post tasks, hire nearby workers and get it done securely with instant OTP verification.
            </p>

            <div className="pt-2 flex items-center gap-3">
              {isLimitReached ? (
                <button
                  disabled
                  title="You have reached the maximum 3 open tasks limit"
                  className="px-6 py-2.5 rounded-full text-xs font-black bg-purple-950/70 text-purple-300 border border-purple-700/50 cursor-not-allowed"
                >
                  <span>Limit Reached (3/3)</span>
                </button>
              ) : (
                <Link
                  to="/requester/post-task"
                  className="px-6 py-2.5 rounded-full text-xs font-black bg-[#5e17eb] hover:bg-[#5013ca] text-white shadow-lg shadow-purple-900/40 inline-flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                  <span>Post a Task</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>

          {/* Right: Glassmorphic Floating Highlights Card (Visible on sm & up) */}
          <div className="hidden sm:flex flex-col gap-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 shadow-xl text-white min-w-[220px] shrink-0">
            <div className="flex items-center gap-2.5 text-xs font-bold text-purple-100">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <span>Verified Local Helpers</span>
            </div>

            <div className="flex items-center gap-2.5 text-xs font-bold text-purple-100">
              <div className="w-7 h-7 rounded-lg bg-[#5e17eb]/40 text-[#c084fc] flex items-center justify-center">
                <Radio className="w-4 h-4" />
              </div>
              <span>Live Radar (1.5 km Radius)</span>
            </div>

            <div className="flex items-center gap-2.5 text-xs font-bold text-purple-100">
              <div className="w-7 h-7 rounded-lg bg-purple-400/20 text-purple-200 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span>100% Escrow Protected</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. QUICK ACTIONS ROW (Spacious 2-col on tablets/narrow windows, 4-col on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Link
          to="/requester/post-task"
          className="p-4 rounded-2xl bg-white border border-purple-100 hover:border-[#5e17eb]/60 hover:shadow-md transition-all flex items-center gap-3.5 group active:scale-98"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 group-hover:bg-[#5e17eb] text-[#5e17eb] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
            <Plus className="w-5 h-5 stroke-[3]" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#5e17eb] transition-colors whitespace-nowrap">
              Post a Task
            </p>
            <p className="text-[10px] text-slate-400">Set your target &amp; post</p>
          </div>
        </Link>

        <Link
          to="/requester/saved-workers"
          className="p-4 rounded-2xl bg-white border border-purple-100 hover:border-[#5e17eb]/60 hover:shadow-md transition-all flex items-center gap-3.5 group active:scale-98"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 group-hover:bg-[#5e17eb] text-[#5e17eb] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#5e17eb] transition-colors whitespace-nowrap">
              Find Workers
            </p>
            <p className="text-[10px] text-slate-400">View nearby workers</p>
          </div>
        </Link>

        <div
          onClick={() => {
            const el = document.getElementById('tasks-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="p-4 rounded-2xl bg-white border border-purple-100 hover:border-[#5e17eb]/60 hover:shadow-md transition-all flex items-center gap-3.5 group cursor-pointer active:scale-98"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 group-hover:bg-[#5e17eb] text-[#5e17eb] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#5e17eb] transition-colors whitespace-nowrap">
              My Tasks
            </p>
            <p className="text-[10px] text-slate-400">Track your tasks</p>
          </div>
        </div>

        <Link
          to="/requester/wallet"
          className="p-4 rounded-2xl bg-white border border-purple-100 hover:border-[#5e17eb]/60 hover:shadow-md transition-all flex items-center gap-3.5 group active:scale-98"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 group-hover:bg-[#5e17eb] text-[#5e17eb] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#5e17eb] transition-colors whitespace-nowrap">
              Wallet
            </p>
            <p className="text-[10px] text-slate-400">Manage your wallet</p>
          </div>
        </Link>
      </div>

      {/* 3-Open-Tasks Limit Warning Banner (Required by business rule test suite) */}
      {isLimitReached && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-950">
            <p className="font-extrabold">Open Task Limit Reached (3/3 Open Tasks)</p>
            <p className="mt-0.5 leading-relaxed text-amber-800">
              Platform rules permit a maximum of 3 open tasks simultaneously. To post another task,
              please accept a worker bid, cancel an unneeded task, or wait for existing tasks to complete.
            </p>
          </div>
        </div>
      )}

      {/* 3. MIDDLE SECTION: Map (Left) + Active Tasks (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Nearby Workers & Leaflet Map */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-purple-100 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#5e17eb]" />
              <h2 className="text-xs font-black uppercase tracking-wider text-[#170836]">
                Nearby Workers &amp; Live Radar (1.5 km)
              </h2>
            </div>
            <Link
              to="/requester/saved-workers"
              className="text-xs font-bold text-[#5e17eb] hover:underline"
            >
              View All &rarr;
            </Link>
          </div>

          {/* Map + Workers: Side-by-side on sm screens and up (Never drops below) */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5 items-center">
            {/* Map on Left */}
            <div className="sm:col-span-3 rounded-2xl overflow-hidden border border-purple-100">
              <LeafletMap
                center={coords}
                zoom={15}
                tasks={tasks.filter((t) => t.status === 'OPEN' || t.status === 'ASSIGNED')}
                userRole="REQUESTER"
                height="240px"
              />
            </div>

            {/* Helper mini list on Right (Matching Image 1) */}
            <div className="sm:col-span-2 space-y-2.5">
              {nearbyHelpers.map((helper) => (
                <div
                  key={helper.name}
                  className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100/80 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-[#5e17eb] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      {helper.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 truncate">{helper.name}</p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500 shrink-0" />
                        <span className="truncate">{helper.rating} ({helper.jobs})</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block mb-0.5">{helper.dist}</span>
                    <Link
                      to="/requester/post-task"
                      className="px-2.5 py-0.5 rounded-md text-[10px] font-bold text-[#5e17eb] bg-white border border-purple-200 hover:bg-[#5e17eb] hover:text-white transition-colors"
                    >
                      Hire
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Active Tasks List matching Image 1 */}
        <div id="tasks-section" className="lg:col-span-5 bg-white rounded-3xl border border-purple-100 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#170836]">
              Active Tasks ({tasks.length})
            </h2>
            <Link to="/requester" className="text-xs font-bold text-[#5e17eb] hover:underline">
              View All &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2 py-4">
              <div className="h-14 bg-purple-50 rounded-2xl animate-pulse"></div>
              <div className="h-14 bg-purple-50 rounded-2xl animate-pulse"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs space-y-2">
              <Sparkles className="w-6 h-6 text-[#a78bfa] mx-auto" />
              <p>No active tasks yet</p>
              <Link
                to="/requester/post-task"
                className="inline-block text-xs font-bold text-[#5e17eb] hover:underline"
              >
                + Post your first task
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {tasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigate(`/requester/tasks/${task.id}`)}
                  className="p-3 rounded-2xl border border-purple-100/90 hover:border-[#5e17eb] hover:bg-purple-50/30 transition-all cursor-pointer flex items-center justify-between gap-2 group"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {getStatusBadge(task.status)}
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-[#5e17eb] transition-colors truncate">
                        {task.title}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        ₹{task.agreed_price || task.budget} • {task.bids?.length || 0} bids
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#5e17eb] shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. RECENT ACTIVITY & EARNINGS BANNER */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left (8 cols): Recent Activity */}
        <div className="md:col-span-8 bg-white rounded-3xl border border-purple-100 p-5 sm:p-6 shadow-xs space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#170836]">
            Recent Activity
          </h3>
          <div className="space-y-2.5">
            <div className="p-3 rounded-2xl bg-purple-50/40 border border-purple-100/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Platform Escrow Protected</p>
                  <p className="text-[11px] text-slate-500">All task payments are safely protected until OTP verification</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-400">Live</span>
            </div>
            {tasks.length > 0 && (
              <div className="p-3 rounded-2xl bg-purple-50/40 border border-purple-100/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#5e17eb] text-white flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Latest Chore: {tasks[0].title}</p>
                    <p className="text-[11px] text-slate-500">Status: {tasks[0].status}</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">Recently</span>
              </div>
            )}
          </div>
        </div>

        {/* Right (4 cols): Build your earnings banner */}
        <div className="md:col-span-4 rounded-3xl bg-gradient-to-tr from-[#1e084a] via-[#3b0764] to-[#5e17eb] text-white p-5 sm:p-6 shadow-md flex flex-col justify-between">
          <div>
            <h3 className="font-black text-sm tracking-tight text-white">
              Build your earnings with WHAP
            </h3>
            <p className="text-xs text-purple-200 mt-1 leading-relaxed">
              Turn your skills into income, one task at a time.
            </p>
          </div>
          <div className="pt-4">
            <Link
              to="/requester/profile?apply=worker"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-[#170836] text-xs font-black hover:bg-purple-50 transition-colors shadow-xs"
            >
              <span>Find Tasks &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RequesterHomeScreen;
