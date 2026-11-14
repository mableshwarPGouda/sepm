// src/pages/RegisterScreen.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { UserPlus, AlertCircle, MapPin, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';

export function RegisterScreen() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { coords, loading: gpsLoading, error: gpsError, refreshLocation } = useGeolocation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Everyone registers as a standard user (REQUESTER)
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role: 'REQUESTER',
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      });

      navigate('/requester');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-slate-950 via-slate-900 to-brand-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-xl shadow-slate-950/20">
          W
        </div>
        <h1 className="text-2xl font-black text-slate-950 tracking-tight">Create an Account</h1>
        <p className="text-xs text-slate-500">Join your local on-demand micro-task community</p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      <form
        onSubmit={handleRegister}
        className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-4"
      >
        {/* Member Info Badge */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-950 text-white flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-900">Standard User Account</p>
            <p className="text-[11px] text-slate-500">
              Post chores & tasks. Want to earn? Apply for verified partner status in your profile anytime!
            </p>
          </div>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 outline-none transition-all shadow-2xs"
            required
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 outline-none transition-all shadow-2xs"
            required
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
            Password (min 6 characters)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 outline-none transition-all shadow-2xs"
            required
            minLength={6}
          />
        </div>

        {/* Geolocation status pill */}
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-brand-600" />
            <span>
              {gpsLoading
                ? 'Detecting GPS...'
                : coords
                ? 'Current location captured'
                : 'Current location not detected'}
            </span>
          </div>
          <button
            type="button"
            onClick={refreshLocation}
            className="text-brand-600 font-bold hover:underline"
          >
            Refresh
          </button>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
          </button>
        </div>
      </form>

      <div className="text-center text-xs text-slate-500">
        Already registered?{' '}
        <Link to="/login" className="font-bold text-slate-950 hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default RegisterScreen;
