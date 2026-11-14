// src/components/common/Header.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NetworkStatus } from './NetworkStatus';
import {
  Wallet,
  User,
  Zap,
  ShoppingBag,
  Sparkles,
  Heart,
  Search,
  Bell,
  Clock,
} from 'lucide-react';

export function Header() {
  const { user, profile, role, switchRole, wallet, workerStatus, isWorkerApproved } = useAuth();
  const navigate = useNavigate();

  const handleSelectRole = async (targetRole) => {
    if (role === targetRole) return;
    try {
      await switchRole(targetRole);
      navigate(targetRole === 'REQUESTER' ? '/requester' : '/worker');
    } catch (err) {
      console.error('Failed to switch role:', err);
    }
  };

  const getHomePath = () => {
    if (role === 'ADMIN') return '/admin';
    if (role === 'WORKER') return '/worker';
    return '/requester';
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-purple-100/80 sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        {/* Brand & Logo matching reference image */}
        <div className="flex items-center gap-2.5">
          <Link to={getHomePath()} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#1e084a] via-[#3b0764] to-[#7c3aed] flex items-center justify-center text-white font-black shadow-md shadow-purple-900/20 group-hover:scale-105 transition-transform">
              <span className="text-lg font-black tracking-tight">W</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-[#170836] tracking-tight text-xl leading-none">
                WHAP
              </span>
            </div>
          </Link>
        </div>

        {/* Center Search Bar matching Image 1 */}
        {user && (
          <div className="hidden sm:flex items-center flex-1 max-w-xs md:max-w-md mx-2">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tasks, services..."
                className="w-full pl-9 pr-4 py-1.5 rounded-full bg-purple-50/60 border border-purple-100/90 text-xs font-medium focus:bg-white focus:border-[#5e17eb] focus:ring-2 focus:ring-[#5e17eb]/20 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
        )}

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden">
            <NetworkStatus compact={true} />
          </div>

          {user && (
            <>
              {/* Role Switcher for Approved Worker */}
              {role !== 'ADMIN' && isWorkerApproved && (
                <div
                  className="relative p-0.5 bg-purple-50 border border-purple-200 rounded-full flex items-center shadow-2xs"
                  title="Switch between Hiring and Working mode"
                >
                  <button
                    type="button"
                    onClick={() => handleSelectRole('REQUESTER')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black transition-all ${
                      role === 'REQUESTER'
                        ? 'bg-[#5e17eb] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span className="hidden md:inline">Hire</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectRole('WORKER')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black transition-all ${
                      role === 'WORKER'
                        ? 'bg-[#5e17eb] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Zap className="w-3 h-3 fill-current" />
                    <span className="hidden md:inline">Earn</span>
                  </button>
                </div>
              )}

              {/* Status for Unapproved User: Verification Pending vs Become Worker */}
              {role !== 'ADMIN' && !isWorkerApproved && workerStatus.status === 'PENDING' && (
                <Link
                  to="/requester/profile"
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all shadow-2xs"
                  title="Your application is awaiting physical verification"
                >
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>Pending</span>
                </Link>
              )}

              {role !== 'ADMIN' && !isWorkerApproved && workerStatus.status !== 'PENDING' && (
                <Link
                  to="/requester/profile?apply=worker"
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-[#5e17eb] border border-purple-200 text-xs font-bold transition-all shadow-2xs"
                  title="Apply to become a verified helper"
                >
                  <Sparkles className="w-3 h-3 text-[#5e17eb]" />
                  <span>Become Worker</span>
                </Link>
              )}

              {/* My Helpers Shortcut (for Requesters) */}
              {role === 'REQUESTER' && (
                <Link
                  to="/requester/saved-workers"
                  className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-purple-100 text-xs font-bold transition-all shadow-2xs"
                  title="My Preferred Workers"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/30" />
                  <span>My Helpers</span>
                </Link>
              )}

              {/* Wallet Balance Pill matching Image 1 */}
              <Link
                to={role === 'WORKER' ? '/worker/wallet' : '/requester/wallet'}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50/70 hover:bg-purple-100/70 text-[#170836] text-xs font-black border border-purple-200/80 shadow-2xs transition-all"
                title="Wallet Balance"
              >
                <div className="w-4 h-4 rounded-full bg-[#5e17eb] flex items-center justify-center text-white">
                  <Wallet className="w-2.5 h-2.5" />
                </div>
                <span className="font-mono tracking-tight font-extrabold">
                  ₹{Number(wallet?.balance || 0).toFixed(0)}
                </span>
              </Link>

              {/* Notification Bell with Badge matching Image 1 & 2 */}
              <button
                type="button"
                className="relative p-1.5 rounded-full text-slate-600 hover:bg-purple-50 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4 text-slate-700" />
                <span className="absolute 1 top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              </button>

              {/* User Avatar Circle matching Image 1 & 2 */}
              <Link
                to={role === 'WORKER' ? '/worker/profile' : role === 'ADMIN' ? '/admin/profile' : '/requester/profile'}
                className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-[#1e084a] via-[#3b0764] to-[#7c3aed] text-white font-bold text-xs flex items-center justify-center shadow-2xs ring-2 ring-purple-200 hover:ring-[#5e17eb] transition-all"
                title="User Profile"
              >
                {profile?.name ? profile.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
              </Link>
            </>
          )}

          {!user && (
            <Link
              to="/login"
              className="bg-[#5e17eb] hover:bg-[#5013ca] text-white text-xs font-bold px-4 py-2 rounded-full shadow-xs transition-all active:scale-95"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
