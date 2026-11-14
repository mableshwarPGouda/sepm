// src/pages/MyBidsScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useRealtime } from '../context/RealtimeContext';
import { Clock, CheckCircle2, XCircle, ChevronRight, Briefcase, Zap, ArrowRight } from 'lucide-react';

export function MyBidsScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('PENDING'); // 'PENDING' | 'ACCEPTED' | 'REJECTED'
  const { registerPolling } = useRealtime();

  const fetchBids = async () => {
    if (!user?.id) return;
    try {
      const data = await api.getWorkerBids(user.id);
      setBids(data || []);
    } catch (err) {
      console.warn('Error fetching worker bids:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();
    const unregister = registerPolling(fetchBids);
    return () => unregister();
  }, [user?.id, registerPolling]);

  const pendingBids = bids.filter((b) => b.status === 'PENDING');
  const acceptedBids = bids.filter((b) => b.status === 'ACCEPTED');
  const rejectedBids = bids.filter((b) => b.status === 'REJECTED');

  const getActiveTabBids = () => {
    if (tab === 'ACCEPTED') return acceptedBids;
    if (tab === 'REJECTED') return rejectedBids;
    return pendingBids;
  };

  const currentList = getActiveTabBids();

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-950 tracking-tight">My Reverse Offers</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Track the live status of all task offers you&apos;ve submitted
        </p>
      </div>

      {/* Uber / Swiggy Style Segmented Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl w-fit shadow-2xs">
        <button
          onClick={() => setTab('PENDING')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
            tab === 'PENDING'
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Pending ({pendingBids.length})</span>
        </button>

        <button
          onClick={() => setTab('ACCEPTED')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
            tab === 'ACCEPTED'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Accepted ({acceptedBids.length})</span>
        </button>

        <button
          onClick={() => setTab('REJECTED')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
            tab === 'REJECTED'
              ? 'bg-white text-slate-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Closed ({rejectedBids.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
          Loading your bids...
        </div>
      ) : currentList.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Clock className="w-6 h-6" />
          </div>
          <p className="text-sm font-extrabold text-slate-900">
            No {tab.toLowerCase()} offers
          </p>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {tab === 'PENDING'
              ? 'You have no open bids waiting for requester review.'
              : tab === 'ACCEPTED'
              ? 'No bids have been accepted yet. Keep bidding on nearby gigs!'
              : 'No closed or declined offers.'}
          </p>
          <Link
            to="/worker"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-2xs mt-2"
          >
            <span>Explore Local Gigs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
          {currentList.map((bid) => {
            const isAccepted = bid.status === 'ACCEPTED';
            const isPending = bid.status === 'PENDING';

            return (
              <div
                key={bid.id}
                onClick={() => {
                  if (bid.task?.id) {
                    navigate(isAccepted ? '/worker/active' : `/worker/tasks/${bid.task.id}`);
                  }
                }}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isAccepted
                        ? 'bg-emerald-50 text-emerald-600'
                        : isPending
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isAccepted ? (
                      <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <Zap className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-950 line-clamp-1 group-hover:text-brand-600 transition-colors">
                      {bid.task?.title || 'Chore Assignment'}
                    </h3>
                    {bid.message && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 italic">
                        &ldquo;{bid.message}&rdquo;
                      </p>
                    )}
                    <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                      Submitted {new Date(bid.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-base sm:text-lg font-black font-mono text-slate-950">
                      ₹{bid.price}
                    </p>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider ${
                        isAccepted
                          ? 'text-emerald-700'
                          : isPending
                          ? 'text-amber-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {bid.status}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-brand-600 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyBidsScreen;
