// src/components/common/BottomNav.jsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  Briefcase,
  Plus,
  Wallet,
  User,
  AlertTriangle,
  Compass,
} from 'lucide-react';

export function BottomNav() {
  const { user, role } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const getNavLinks = () => {
    if (role === 'ADMIN') {
      return [
        { to: '/admin', label: 'Disputes', icon: AlertTriangle },
        { to: '/admin/profile', label: 'Profile', icon: User },
      ];
    }

    if (role === 'WORKER') {
      return [
        { to: '/worker', label: 'Home', icon: Home },
        { to: '/worker/active', label: 'My Jobs', icon: Briefcase },
        { to: '/worker/bids', label: 'Find Gigs', icon: Compass, isCenterAction: true },
        { to: '/worker/wallet', label: 'Wallet', icon: Wallet },
        { to: '/worker/profile', label: 'Profile', icon: User },
      ];
    }

    // Default: REQUESTER (matches exact reference mockup on desktop and mobile!)
    return [
      { to: '/requester', label: 'Home', icon: Home, exact: true },
      { to: '/requester?tab=tasks', label: 'My Tasks', icon: Briefcase },
      { to: '/requester/post-task', label: 'Post', icon: Plus, isCenterAction: true },
      { to: '/requester/wallet', label: 'Wallet', icon: Wallet },
      { to: '/requester/profile', label: 'Profile', icon: User },
    ];
  };

  const links = getNavLinks();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-2xl border-t border-purple-100 shadow-[0_-4px_24px_rgba(94,23,235,0.08)] py-1.5 sm:py-2.5">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between">
        {links.map((link, idx) => {
          const Icon = link.icon;
          const isCenter = link.isCenterAction;

          // Compute active state
          const isActive = link.exact
            ? location.pathname === link.to && !location.search
            : link.to.includes('?')
            ? location.search.includes('tab=tasks')
            : location.pathname.startsWith(link.to);

          return (
            <NavLink
              key={`${link.to}-${idx}`}
              to={link.to}
              onClick={() => {
                if (link.to.includes('tab=tasks')) {
                  const el = document.getElementById('tasks-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="flex-1 flex flex-col items-center justify-center relative py-1 text-center group cursor-pointer transition-transform duration-150 active:scale-95"
            >
              {isCenter ? (
                <div className="relative -top-4 sm:-top-5">
                  <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#3b0764] via-[#5e17eb] to-[#7c3aed] text-white flex items-center justify-center shadow-xl shadow-purple-600/40 border-4 border-white transform transition-all group-hover:scale-110 active:scale-90">
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8 stroke-[3]" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <Icon
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                      isActive ? 'text-[#5e17eb] stroke-[2.5]' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  <span
                    className={`text-[11px] sm:text-sm tracking-tight mt-1 transition-colors ${
                      isActive ? 'text-[#5e17eb] font-bold' : 'text-slate-500 font-semibold group-hover:text-slate-700'
                    }`}
                  >
                    {link.label}
                  </span>
                  {isActive && (
                    <span className="w-6 sm:w-10 h-0.5 sm:h-1 rounded-full bg-[#5e17eb] mt-0.5 sm:mt-1"></span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
