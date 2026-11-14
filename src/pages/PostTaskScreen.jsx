// src/pages/PostTaskScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';
import { LocationPicker } from '../components/map/LocationPicker';
import { TASK_CATEGORIES } from '../constants/categories';
import {
  ArrowRight,
  ArrowLeft,
  MapPin,
  Sparkles,
  AlertCircle,
  Zap,
  CheckCircle2,
  Clock,
  Camera,
  Image as ImageIcon,
  X,
  Upload,
} from 'lucide-react';

const BUDGET_PRESETS = [50, 80, 100, 150, 200, 250, 300];

const QUICK_SUGGESTIONS = [
  'Pick up lecture notes and photocopies',
  'Deliver courier parcel from society gate',
  'Buy groceries & essentials from store',
  'Help move study table & boxes',
];

export function PostTaskScreen() {
  const navigate = useNavigate();
  const searchLocation = useLocation();
  const { coords } = useGeolocation();

  // Read optional query param ?cat=...
  const queryParams = new URLSearchParams(searchLocation.search);
  const initialCategoryParam = queryParams.get('cat');

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskPhoto, setTaskPhoto] = useState(null);
  const [category, setCategory] = useState(
    TASK_CATEGORIES.some((c) => c.key === initialCategoryParam)
      ? initialCategoryParam
      : 'ERRANDS_DELIVERY'
  );

  const [location, setLocation] = useState(coords || null);
  const [pinTouched, setPinTouched] = useState(false);
  const [address, setAddress] = useState('');
  const [budget, setBudget] = useState(100);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync live GPS coordinates until user manually moves the pin
  useEffect(() => {
    if (coords && !pinTouched) {
      setLocation(coords);
    }
  }, [coords, pinTouched]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo must be smaller than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setTaskPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form Validations
  const validateStep1 = () => {
    if (!title.trim() || title.trim().length < 5) {
      setError('Please provide a title of at least 5 characters');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      setError('Please set a task location using GPS or by tapping the map');
      return false;
    }
    if (!address.trim()) {
      setError('Please enter an address or landmark (e.g. Block B, Gate 2)');
      return false;
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.postTask({
        title: title.trim(),
        description: description.trim() || null,
        category,
        budget: Number(budget),
        latitude: location.lat,
        longitude: location.lng,
        address: address.trim(),
      });

      const taskId = res?.task_id || res?.id;
      if (taskId && taskPhoto) {
        localStorage.setItem(`whap_task_photo_${taskId}`, taskPhoto);
      }

      if (taskId) {
        navigate(`/requester/tasks/${taskId}`);
      } else {
        navigate('/requester');
      }
    } catch (err) {
      console.error('Failed to post task:', err);
      setError(err.message || 'Failed to post task. Please check requirements.');
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetStep = (delta) => {
    setBudget((prev) => Math.min(300, Math.max(50, prev + delta)));
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
      {/* WHAP Purple Segmented Step Indicator */}
      <div className="bg-white rounded-3xl border border-purple-100 p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider mb-2.5">
          <span className={step >= 1 ? 'text-[#5e17eb] font-black' : 'text-slate-400'}>
            1. Task Details
          </span>
          <span className={step >= 2 ? 'text-[#5e17eb] font-black' : 'text-slate-400'}>
            2. Location Pin
          </span>
          <span className={step >= 3 ? 'text-[#5e17eb] font-black' : 'text-slate-400'}>
            3. Budget &amp; Escrow
          </span>
        </div>
        <div className="w-full bg-purple-50 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#5e17eb] to-[#7c3aed] h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-3 shadow-2xs animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* STEP 1: Details & Category */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border border-purple-100/80 p-5 sm:p-6 shadow-sm space-y-5">
          <div>
            <div className="flex items-center gap-2 text-[#5e17eb] text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Step 1 of 3</span>
            </div>
            <h2 className="text-xl font-black text-slate-950 mt-1">What do you need done?</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose a category, provide instructions, and attach a photo if needed.
            </p>
          </div>

          {/* Category Chips Grid */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
              Service Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TASK_CATEGORIES.map((cat) => {
                const isSelected = category === cat.key;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'border-[#5e17eb] bg-purple-50/80 ring-2 ring-[#5e17eb]/20 text-[#5e17eb]'
                        : 'border-slate-200/80 hover:border-purple-200 bg-white text-slate-700'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-[#5e17eb]' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold leading-tight">{cat.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Suggestions Pills */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Suggestions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTitle(s)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-50/60 hover:bg-purple-100/70 text-purple-900 border border-purple-100 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Task Title <span className="text-red-500">*</span></span>
              <span className="text-slate-400 text-[10px] font-normal">{title.length}/100</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pick up 5 copies of ML notes from Nesara Xerox"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#5e17eb]/20 focus:border-[#5e17eb] outline-none transition-all shadow-2xs"
              maxLength={100}
            />
          </div>

          {/* Description Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Instructions / Details (Optional)</span>
              <span className="text-slate-400 text-[10px] font-normal">{description.length}/400</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact room number, person to meet, or contact details..."
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#5e17eb]/20 focus:border-[#5e17eb] outline-none resize-none transition-all shadow-2xs"
              maxLength={400}
            />
          </div>

          {/* Task Photo Upload (New Feature) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Task Photo / Reference (Optional)</span>
              <span className="text-slate-400 text-[10px]">Max 5MB</span>
            </label>

            {taskPhoto ? (
              <div className="relative rounded-2xl border border-purple-200 overflow-hidden bg-slate-50 p-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={taskPhoto}
                    alt="Task preview"
                    className="w-16 h-16 rounded-xl object-cover border border-purple-100 shadow-2xs"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Photo attached successfully</p>
                    <p className="text-[11px] text-slate-500">Helpers will see this reference image</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTaskPhoto(null)}
                  className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors mr-2"
                  title="Remove Photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-purple-200 hover:border-[#5e17eb] rounded-2xl cursor-pointer bg-purple-50/30 hover:bg-purple-50/70 transition-all text-xs font-bold text-purple-900">
                <Camera className="w-4 h-4 text-[#5e17eb]" />
                <span>Upload or Take Task Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3.5 rounded-2xl text-xs font-black bg-[#5e17eb] hover:bg-[#5013ca] text-white flex items-center gap-2 shadow-md shadow-purple-600/20 transition-all active:scale-95"
            >
              <span>Next: Set Location Pin</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Location Pin */}
      {step === 2 && (
        <div className="bg-white rounded-3xl border border-purple-100/80 p-5 sm:p-6 shadow-sm space-y-5">
          <div>
            <div className="flex items-center gap-2 text-[#5e17eb] text-xs font-black uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5" />
              <span>Step 2 of 3</span>
            </div>
            <h2 className="text-xl font-black text-slate-950 mt-1">Pin Exact Task Location</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Drag the pin or tap the map to designate where the chore takes place.
            </p>
          </div>

          <LocationPicker
            initialLat={location?.lat ?? null}
            initialLng={location?.lng ?? null}
            onChange={(pos) => {
              setPinTouched(true);
              setLocation(pos);
            }}
          />

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#5e17eb]" />
              <span>Address / Building / Landmark <span className="text-red-500">*</span></span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Block B, Main Market / Flat 402"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#5e17eb]/20 focus:border-[#5e17eb] outline-none transition-all shadow-2xs"
            />
          </div>

          <div className="pt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3.5 rounded-2xl text-xs font-black bg-[#5e17eb] hover:bg-[#5013ca] text-white flex items-center gap-2 shadow-md shadow-purple-600/20 transition-all active:scale-95"
            >
              <span>Next: Set Budget</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Budget & Review */}
      {step === 3 && (
        <div className="bg-white rounded-3xl border border-purple-100/80 p-5 sm:p-6 shadow-sm space-y-5">
          <div>
            <div className="flex items-center gap-2 text-[#5e17eb] text-xs font-black uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>Step 3 of 3</span>
            </div>
            <h2 className="text-xl font-black text-slate-950 mt-1">Set Task Budget &amp; Review</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Platform rules require budget between ₹50 and ₹300. Workers submit offers around this price.
            </p>
          </div>

          {/* Stepper & Slider */}
          <div className="p-6 rounded-3xl bg-purple-50/40 border border-purple-100 text-center space-y-4 shadow-2xs">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Escrow Task Budget
            </span>

            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => handleBudgetStep(-10)}
                disabled={budget <= 50}
                className="w-10 h-10 rounded-2xl bg-white border border-purple-200 text-[#5e17eb] font-black text-lg flex items-center justify-center hover:bg-purple-50 disabled:opacity-30 shadow-2xs transition-all active:scale-95"
              >
                -
              </button>

              <div className="font-mono text-4xl sm:text-5xl font-black text-slate-950 tracking-tight">
                ₹{budget}
              </div>

              <button
                type="button"
                onClick={() => handleBudgetStep(10)}
                disabled={budget >= 300}
                className="w-10 h-10 rounded-2xl bg-white border border-purple-200 text-[#5e17eb] font-black text-lg flex items-center justify-center hover:bg-purple-50 disabled:opacity-30 shadow-2xs transition-all active:scale-95"
              >
                +
              </button>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={50}
              max={300}
              step={10}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-[#5e17eb]"
            />

            {/* Preset Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              {BUDGET_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setBudget(p)}
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                    budget === p
                      ? 'bg-[#5e17eb] text-white shadow-xs'
                      : 'bg-white border border-purple-100 text-slate-600 hover:bg-purple-50'
                  }`}
                >
                  ₹{p}
                </button>
              ))}
            </div>
          </div>

          {/* Summary Checklist */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Category</span>
              <strong className="text-slate-900">
                {TASK_CATEGORIES.find((c) => c.key === category)?.label}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Destination</span>
              <strong className="text-slate-900 truncate max-w-[200px]">{address}</strong>
            </div>
            {taskPhoto && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Attached Photo</span>
                <span className="text-emerald-700 font-bold">1 image attached</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-900">Escrow Locked from Wallet</span>
              <span className="font-black text-slate-950 font-mono text-sm">₹{budget}</span>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="px-7 py-3.5 rounded-2xl text-xs font-black bg-gradient-to-r from-[#5e17eb] to-[#7c3aed] hover:from-[#5013ca] hover:to-[#6d28d9] text-white flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
              <span>{loading ? 'Publishing Task...' : 'Confirm & Lock Escrow'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostTaskScreen;
