// src/pages/WorkerHomeScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNearbyTasks } from '../hooks/useNearbyTasks';
import { useGeolocation } from '../hooks/useGeolocation';
import { api } from '../services/api';
import { LeafletMap } from '../components/map/LeafletMap';
import { LocationPicker } from '../components/map/LocationPicker';
import { SkeletonGrid } from '../components/common/SkeletonCard';
import { TASK_CATEGORIES, getCategoryMeta } from '../constants/categories';
import {
  List,
  Map,
  Compass,
  Briefcase,
  ChevronRight,
  MapPin,
  Navigation,
  AlertCircle,
  Zap,
  ArrowRight,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';

const FILTER_CATEGORIES = [
  { key: 'ALL', label: 'All Jobs' },
  ...TASK_CATEGORIES.map((c) => ({ key: c.key, label: c.shortLabel })),
];

export function WorkerHomeScreen() {
  const { user, updateLocation } = useAuth();
  const navigate = useNavigate();
  const {
    coords,
    loading: gpsLoading,
    error: gpsError,
    source,
    refreshLocation,
    setCustomLocation,
  } = useGeolocation();

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeJob, setActiveJob] = useState(null);
  const [showAreaPicker, setShowAreaPicker] = useState(false);

  // Sync live GPS coordinates to user's profile
  useEffect(() => {
    if (user?.id && coords && source === 'gps') {
      updateLocation(coords);
    }
  }, [user?.id, coords, source, updateLocation]);

  const workerCoords = coords || { lat: null, lng: null };
  const { tasks, loading: tasksLoading } = useNearbyTasks(
    workerCoords.lat,
    workerCoords.lng,
    1500
  );

  // Check active job
  useEffect(() => {
    async function checkActiveJob() {
      if (!user?.id) return;
      try {
        const job = await api.getWorkerActiveJob(user.id);
        setActiveJob(job);
      } catch (err) {
        console.warn('Could not check active job:', err);
      }
    }
    checkActiveJob();
  }, [user?.id]);

  // Filter tasks by category
  const filteredTasks = tasks.filter((t) => {
    if (selectedCategory === 'ALL') return true;
    return getCategoryMeta(t.category).key === selectedCategory;
  });

  const isWaitingForLocation = !coords && gpsLoading;

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-5 animate-fade-in">
      {/* 1. TOP HERO BANNER matching Image 2 */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#170836] via-[#2e0854] to-[#4c1d95] text-white p-6 sm:p-7 shadow-xl flex flex-col justify-between">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-[#7c3aed]/25 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-1.5 max-w-md">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Earn. Work. <span className="text-[#a78bfa]">Grow.</span>
          </h1>
          <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed">
            Book microtasks near you, or accept tasks and get paid securely.
          </p>
        </div>

        <div className="relative z-10 pt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('available-tasks');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-5 py-2.5 rounded-full text-xs font-black bg-[#5e17eb] hover:bg-[#5013ca] text-white shadow-lg shadow-purple-900/40 flex items-center gap-2 transition-all active:scale-95"
          >
            <span>Browse Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Active Trip Hero Card (Lockout Banner) */}
      {activeJob && (
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white p-5 rounded-3xl shadow-xl border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
              <Zap className="w-6 h-6 fill-current animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-400/30">
                  Active Job in Progress!
                </span>
                <span className="text-xs text-slate-300">
                  Agreed Price: <strong className="text-white font-mono">₹{activeJob.agreed_price}</strong>
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5 line-clamp-1">{activeJob.title}</h3>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Deliver chore &amp; enter Requester&apos;s 4-digit OTP to claim escrow payout.
              </p>
            </div>
          </div>
          <Link
            to="/worker/active"
            className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 shrink-0 transform active:scale-95"
          >
            <span>Open Active Job</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Driver Live Radar Status Bar */}
      <div className="bg-white rounded-3xl border border-purple-100 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                coords ? 'bg-purple-50 text-[#5e17eb]' : 'bg-amber-50 text-amber-600'
              }`}
            >
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              {gpsLoading && !coords ? (
                <p className="text-xs font-bold text-slate-700">Detecting live GPS location...</p>
              ) : coords ? (
                <div>
                  <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{source === 'gps' ? 'Live GPS Active' : source === 'manual' ? 'Custom Area Pin' : 'Saved Area'}</span>
                    <span className="font-mono text-[10px] text-slate-400 font-normal">
                      ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Listening for jobs within strict 1.5 km PostGIS geofence
                  </p>
                </div>
              ) : (
                <p className="text-xs font-bold text-amber-800">Location required to discover nearby jobs</p>
              )}
              {gpsError && (
                <p className="text-[11px] text-amber-700 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{gpsError}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshLocation}
              disabled={gpsLoading}
              className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5e17eb] text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin text-[#5e17eb]' : ''}`} />
              <span>{gpsLoading ? 'Locating...' : 'Refresh GPS'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAreaPicker((v) => !v)}
              className="px-3 py-2 rounded-xl border border-purple-100 hover:bg-purple-50 text-slate-800 text-xs font-bold transition-colors"
            >
              {showAreaPicker ? 'Close Map' : 'Change Area'}
            </button>
          </div>
        </div>

        {showAreaPicker && (
          <div className="pt-3 border-t border-purple-100 space-y-2">
            <p className="text-xs text-slate-600">
              Tap anywhere on the map or drag the pin to set your custom work center:
            </p>
            <LocationPicker
              initialLat={coords?.lat ?? null}
              initialLng={coords?.lng ?? null}
              onChange={(pos) => {
                setCustomLocation(pos);
                if (user?.id) updateLocation(pos);
              }}
            />
          </div>
        )}
      </div>

      {/* Header & View Mode Switcher */}
      <div id="available-tasks" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-950 tracking-tight">Available Tasks Near You</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-[#5e17eb] border border-purple-200">
              {filteredTasks.length} Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Realtime micro-tasks posted within 1.5 km of your location
          </p>
        </div>

        {/* View Toggle Pill */}
        <div className="flex items-center bg-purple-50/80 border border-purple-100 p-1 rounded-2xl self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              viewMode === 'list'
                ? 'bg-white text-[#5e17eb] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              viewMode === 'map'
                ? 'bg-white text-[#5e17eb] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Map Radar</span>
          </button>
        </div>
      </div>

      {/* Category Filter Chips Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                isSelected
                  ? 'bg-[#5e17eb] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-purple-50/60 border border-purple-100'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      {viewMode === 'map' ? (
        <div className="bg-white rounded-3xl border border-purple-100 p-4 shadow-xs space-y-3">
          <LeafletMap
            center={coords}
            zoom={15}
            tasks={filteredTasks}
            userRole="WORKER"
            height="440px"
            onTaskSelect={(task) => navigate(`/worker/tasks/${task.id}`)}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {tasksLoading || isWaitingForLocation ? (
            <SkeletonGrid count={4} />
          ) : filteredTasks.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-3xl border border-purple-100 shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-[#a78bfa] flex items-center justify-center mx-auto">
                <Compass className="w-7 h-7" />
              </div>
              <p className="text-sm font-extrabold text-slate-950">No Open Jobs In Your 1.5 km Zone</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                There are no open tasks matching this filter right now. New requests will appear here live in real-time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredTasks.map((task) => {
                const distanceMeters = Math.round(task.distance_meters || task.dist_meters || 0);
                const distanceLabel =
                  distanceMeters < 1000 ? `${distanceMeters}m away` : `${(distanceMeters / 1000).toFixed(1)}km away`;
                const walkTimeEst = Math.max(1, Math.round(distanceMeters / 80));
                const meta = getCategoryMeta(task.category);
                const IconComp = meta.icon;

                // Estimated net earnings
                const rawFee = Math.max(5, Math.round(Number(task.budget) * 0.1));
                const estNet = Math.max(0, Number(task.budget) - rawFee);

                return (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/worker/tasks/${task.id}`)}
                    className="bg-white p-4 sm:p-5 rounded-3xl border border-purple-100 hover:border-[#5e17eb] hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
                  >
                    <div>
                      {/* Top Meta Pill Bar */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                            <IconComp className={`w-4 h-4 ${meta.color}`} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                            {meta.label}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 fill-current" />
                          <span>{distanceLabel} • ~{walkTimeEst}m</span>
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="font-black text-slate-950 text-sm sm:text-base mt-3 line-clamp-1 group-hover:text-[#5e17eb] transition-colors">
                        {task.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {task.description || task.address || 'Nearby chore'}
                      </p>
                    </div>

                    {/* Bottom Pricing & CTA Bar matching Image 2 */}
                    <div className="mt-4 pt-3.5 border-t border-purple-100 flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-black text-[#5e17eb] font-mono">
                            ₹{task.budget}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold">
                            (earn ~₹{estNet})
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Budget
                        </span>
                      </div>

                      <div className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#5e17eb] hover:bg-[#5013ca] text-white font-black text-xs transition-colors shadow-xs">
                        <span>Accept / Bid</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WorkerHomeScreen;
