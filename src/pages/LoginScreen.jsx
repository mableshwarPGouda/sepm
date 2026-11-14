// src/pages/LoginScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle, MapPin, ShieldCheck, KeyRound } from 'lucide-react';

export function LoginScreen({ adminMode = false }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Admin view is ONLY shown if user explicitly navigated to /admin or with admin query param
  const isAdmin = Boolean(
    adminMode || 
    location.pathname.startsWith('/admin') || 
    location.search.includes('admin=true') || 
    location.state?.from?.pathname?.startsWith('/admin')
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      setEmail('admin@whap.local');
      setPassword('whap_admin_password_123');
    }
  }, [isAdmin]);

  const redirectAfterLogin = (userRole) => {
    const from = location.state?.from?.pathname;
    if (from && from !== '/login') {
      navigate(from, { replace: true });
      return;
    }
    if (userRole === 'ADMIN' || isAdmin) navigate('/admin', { replace: true });
    else if (userRole === 'WORKER') navigate('/worker', { replace: true });
    else navigate('/requester', { replace: true });
  };

  const handleStandardLogin = async (e) => {
    e?.preventDefault();
    const loginEmail = email.trim();
    const loginPassword = password;

    if (!loginEmail || !loginPassword) {
      setError('Please provide email and password');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await login(loginEmail, loginPassword);
      const userRole = data.user?.user_metadata?.role || (isAdmin ? 'ADMIN' : 'REQUESTER');
      if (isAdmin) {
        localStorage.setItem(`whap_role_${data.user.id}`, 'ADMIN');
      }
      redirectAfterLogin(userRole);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-14 space-y-6 animate-fade-in">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className={`w-14 h-14 rounded-3xl text-white font-black text-2xl flex items-center justify-center mx-auto shadow-xl transition-all duration-300 ${
          isAdmin 
            ? 'bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-600 shadow-indigo-950/20' 
            : 'bg-gradient-to-tr from-[#1e084a] via-[#3b0764] to-[#7c3aed] shadow-purple-950/25 ring-4 ring-purple-100'
        }`}>
          {isAdmin ? <ShieldCheck className="w-8 h-8 text-indigo-400" /> : 'W'}
        </div>
        <h1 className="text-2xl font-black text-slate-950 tracking-tight">
          {isAdmin ? 'Admin Operations Console' : 'Sign In to WHAP'}
        </h1>
        <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5 font-medium">
          <MapPin className="w-3.5 h-3.5 text-[#5e17eb]" />
          <span>{isAdmin ? 'Platform Administration & Control' : 'Hyperlocal On-Demand Tasks • 1.5 km Radar'}</span>
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Credentials Form */}
      <form
        onSubmit={handleStandardLogin}
        className="bg-white rounded-3xl border border-purple-100/80 p-6 sm:p-7 shadow-[0_8px_30px_rgb(94,23,235,0.06)] space-y-4"
      >
        {isAdmin && (
          <div className="p-3.5 bg-indigo-50/90 border border-indigo-200/90 rounded-2xl text-[11px] text-indigo-950 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Admin privileges: Platform commission, live task stream, 3-strike dispute reset & worker verification.</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
            {isAdmin ? 'Admin Account Email' : 'Email Address'}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={isAdmin ? 'admin@whap.local' : 'name@example.com'}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#5e17eb]/20 focus:border-[#5e17eb] outline-none transition-all shadow-2xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#5e17eb]/20 focus:border-[#5e17eb] outline-none transition-all shadow-2xs"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-2xl text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98 ${
              isAdmin
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25'
                : 'bg-[#5e17eb] hover:bg-[#5013ca] shadow-purple-600/25'
            }`}
          >
            {isAdmin ? <ShieldCheck className="w-4 h-4 stroke-[2.5]" /> : <LogIn className="w-4 h-4 stroke-[2.5]" />}
            <span>{loading ? 'Authenticating...' : (isAdmin ? 'Enter Admin Command Center' : 'Sign In')}</span>
          </button>
        </div>
      </form>

      {!isAdmin && (
        <div className="text-center text-xs text-slate-500">
          New to WHAP?{' '}
          <Link to="/register" className="font-bold text-[#5e17eb] hover:underline">
            Create an Account
          </Link>
        </div>
      )}
    </div>
  );
}

export default LoginScreen;
