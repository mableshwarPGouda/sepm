// src/pages/ProfileScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SimulatedPaymentNotice } from '../components/common/SimulatedPaymentNotice';
import { adminService } from '../services/adminService';
import { TASK_CATEGORIES } from '../constants/categories';
import {
  User,
  LogOut,
  Star,
  ArrowLeftRight,
  Shield,
  MapPin,
  Mail,
  Sparkles,
  CheckCircle2,
  Edit3,
  Copy,
  Check,
  Upload,
  AlertCircle,
  FileText,
  Award,
  IdCard,
  Clock,
  Heart,
  ChevronRight,
  Zap,
} from 'lucide-react';

export function ProfileScreen() {
  const { user, profile, role, switchRole, logout, updateProfileDetails, workerStatus, isWorkerApproved } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [copiedId, setCopiedId] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Edit profile form state
  const [editName, setEditName] = useState(profile?.name || '');
  const [editPhone, setEditPhone] = useState(profile?.phone || '');
  const [editDept, setEditDept] = useState(profile?.department || '');
  const [editBio, setEditBio] = useState(profile?.bio || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Worker application form state
  const [appPhone, setAppPhone] = useState(profile?.phone || '');
  const [appRollNumber, setAppRollNumber] = useState('');
  const [appExperience, setAppExperience] = useState('');
  const [appSkills, setAppSkills] = useState(['ERRANDS_DELIVERY', 'PRINT_DOCUMENTS']);
  const [aadharPreview, setAadharPreview] = useState(null);
  const [certPreview, setCertPreview] = useState(null);
  const [submittingApp, setSubmittingApp] = useState(false);
  const [appSuccessMessage, setAppSuccessMessage] = useState(false);

  // Check if query param ?apply=worker was passed
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('apply') === 'worker') {
      if (!isWorkerApproved && workerStatus.status !== 'PENDING') {
        setShowApplyModal(true);
      } else {
        // Remove query param to prevent modal from re-triggering
        navigate('/requester/profile', { replace: true });
      }
    }
  }, [location.search, isWorkerApproved, workerStatus.status, navigate]);

  useEffect(() => {
    if (profile) {
      setEditName(profile.name || '');
      setEditPhone(profile.phone || '');
      setEditDept(profile.department || '');
      setEditBio(profile.bio || '');
    }
  }, [profile]);

  const handleCopyUserId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleRoleToggle = async () => {
    if (!profile) return;
    const targetRole = role === 'REQUESTER' ? 'WORKER' : 'REQUESTER';
    try {
      await switchRole(targetRole);
      navigate(targetRole === 'REQUESTER' ? '/requester' : '/worker');
    } catch (err) {
      alert(err.message || 'Role switch failed');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfileDetails({
        name: editName.trim(),
        phone: editPhone.trim(),
        department: editDept.trim(),
        bio: editBio.trim(),
      });
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleToggleSkill = (skillKey) => {
    if (appSkills.includes(skillKey)) {
      setAppSkills(appSkills.filter((s) => s !== skillKey));
    } else {
      setAppSkills([...appSkills, skillKey]);
    }
  };

  const handleFileUpload = (e, setPreview) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!appPhone || !appRollNumber || appSkills.length === 0) {
      alert('Please fill in your phone number, roll/dept, and select at least one skill.');
      return;
    }

    setSubmittingApp(true);
    try {
      await adminService.submitWorkerApplication({
        userId: user?.id,
        userEmail: user?.email,
        name: profile?.name || user?.email,
        phone: appPhone,
        rollNumber: appRollNumber,
        skills: appSkills,
        experience: appExperience,
        aadharImage: aadharPreview,
        certificateImage: certPreview,
      });

      setShowApplyModal(false);
      setAppSuccessMessage(true);
      window.dispatchEvent(new Event('whap_worker_apps_updated'));
    } catch (err) {
      console.error('Failed to submit application:', err);
    } finally {
      setSubmittingApp(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const ratingAvg = Number(profile?.rating_average || 0);
  const ratingCount = Number(profile?.rating_count || 0);
  const formattedUserId = user?.id ? `USR-${user.id.slice(0, 8).toUpperCase()}` : 'USR-UNKNOWN';

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">Account &amp; Profile</h1>
          <p className="text-xs text-slate-500 mt-0.5">Verified identity &amp; account details</p>
        </div>
        <SimulatedPaymentNotice variant="pill" />
      </div>

      <SimulatedPaymentNotice variant="banner" />

      {/* Success Banner when application just submitted */}
      {appSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-3xl text-xs text-emerald-950 space-y-1 shadow-xs">
          <div className="flex items-center gap-2 font-black text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[3]" />
            <span>Worker Application Submitted Successfully!</span>
          </div>
          <p className="text-emerald-900/90 leading-relaxed text-[11px]">
            Your application has been delivered to the <strong>Admin Operations Desk</strong>. Once verified, your official Worker ID will be issued and the worker toggle will activate.
          </p>
        </div>
      )}

      {/* User Identity Card with Fixed Non-Editable User ID */}
      <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-7 shadow-xs text-center space-y-4">
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#1e084a] via-[#3b0764] to-[#7c3aed] text-white font-black text-3xl flex items-center justify-center mx-auto shadow-md shadow-purple-900/20">
          {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white">
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
          </span>
        </div>

        <div>
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-lg font-black text-slate-950">{profile?.name || 'WHAP Member'}</h2>
            <button
              onClick={() => setShowEditModal(true)}
              className="p-1 text-slate-400 hover:text-slate-900 transition-colors"
              title="Edit Profile Details"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mt-1">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{user?.email}</span>
          </div>
          {profile?.phone && (
            <p className="text-xs text-slate-600 font-medium mt-0.5">📞 {profile.phone}</p>
          )}
          {profile?.department && (
            <p className="text-[11px] text-slate-500 mt-0.5">📍 {profile.department}</p>
          )}
        </div>

        {/* Permanent Fixed Non-Editable User ID */}
        <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-center justify-between text-xs max-w-sm mx-auto">
          <div className="text-left">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
              Permanent Member ID (Fixed)
            </span>
            <span className="font-mono font-bold text-slate-900">{formattedUserId}</span>
          </div>
          <button
            onClick={handleCopyUserId}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg transition-colors"
          >
            {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copiedId ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Worker Badge if Approved */}
        {workerStatus.isApproved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs max-w-sm mx-auto">
            <div className="text-left">
              <span className="text-[10px] text-emerald-700 font-black uppercase tracking-wider block">
                Official Partner Worker ID
              </span>
              <span className="font-mono font-black text-emerald-950 text-sm">
                {workerStatus.workerId || 'WKR-VERIFIED'}
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-200 text-emerald-900">
              Verified Partner
            </span>
          </div>
        )}
      </div>

      {/* WORKER STATUS & APPLICATION SECTION */}
      {role !== 'ADMIN' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-brand-600" />
              <span>Partner Worker Status</span>
            </h3>
            {workerStatus.isApproved ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                ● Approved to Earn
              </span>
            ) : workerStatus.status === 'PENDING' ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                ⏳ Verification Pending
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-600">
                Not Applied
              </span>
            )}
          </div>

          {/* Case 1: Approved Worker -> Show Role Switch Toggle */}
          {workerStatus.isApproved ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-black text-slate-950 text-xs">
                  Active Mode: <strong className="text-emerald-700">{role === 'WORKER' ? 'Working & Earning' : 'Hiring Help'}</strong>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Toggle between posting chore tasks and finding local paid gigs.
                </p>
              </div>
              <button
                onClick={handleRoleToggle}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Switch to {role === 'REQUESTER' ? 'Worker' : 'Requester'}</span>
              </button>
            </div>
          ) : workerStatus.status === 'PENDING' ? (
            /* Case 2: Pending Application */
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700" />
                <span className="font-black">Physical Verification Required</span>
              </div>
              <p className="text-amber-900/90 text-[11px] leading-relaxed">
                Your online application has been received by Operations. Please present your original physical document at the verification desk to collect your official Partner Worker ID and enable earning mode.
              </p>
            </div>
          ) : (
            /* Case 3: Not applied yet */
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-black text-slate-950 text-xs">Want to Earn Money as a Helper?</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Submit proof of ID and skills to get verified as an authorized worker.
                </p>
              </div>
              <button
                onClick={() => setShowApplyModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 text-white font-black text-xs rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Apply to Earn</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* "My Preferred Helpers" Section (Quick Access) */}
      {role === 'REQUESTER' && (
        <Link
          to="/requester/saved-workers"
          className="p-4 bg-white hover:bg-rose-50/50 rounded-3xl border border-slate-200/90 flex items-center justify-between group shadow-xs transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-950">My Preferred Helpers</p>
              <p className="text-[11px] text-slate-500">
                View your saved workers and their live availability (Free / Busy)
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-rose-600 transition-all" />
        </Link>
      )}

      {/* Reputation & Ratings Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>Double-Blind Verified Rating</span>
        </h3>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-500">
              <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-950 font-mono leading-none">
                {ratingAvg > 0 ? ratingAvg.toFixed(1) : '5.0'}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block font-medium">
                {ratingCount} verified {ratingCount === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-500 max-w-[180px] leading-tight">
            Protected against retaliatory scoring by double-blind lock.
          </div>
        </div>
      </div>

      {/* Sign Out Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
        <button
          onClick={handleLogout}
          type="button"
          className="w-full p-4 text-left flex items-center justify-between hover:bg-red-50/50 transition-colors group text-red-600"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <LogOut className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-red-700">Sign Out</p>
              <p className="text-[11px] text-red-500/80">End active session securely</p>
            </div>
          </div>
          <span className="text-xs font-bold text-red-600 group-hover:translate-x-1 transition-transform">
            Logout →
          </span>
        </button>
      </div>

      {/* MODAL 1: Edit Profile Details */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleSaveProfile}
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <h3 className="font-black text-slate-950 text-base">Edit Profile Details</h3>

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-brand-600"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                Phone Number
              </label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-brand-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                Department / Hostel Room
              </label>
              <input
                type="text"
                value={editDept}
                onChange={(e) => setEditDept(e.target.value)}
                placeholder="e.g. CSA Dept, Hostel Block D Room 204"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-brand-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                Short Bio / Availability
              </label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Briefly describe your schedule or interests..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-brand-600 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2 rounded-xl text-xs font-black bg-slate-950 text-white shadow-xs"
              >
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: Apply for Worker Verification (Disabled if already applied/pending) */}
      {showApplyModal && workerStatus.status !== 'PENDING' && !isWorkerApproved && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <form
            onSubmit={handleSubmitApplication}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[90vh] overflow-y-auto"
          >
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-600">
                Partner Identity Verification
              </span>
              <h3 className="font-black text-slate-950 text-lg mt-0.5">
                Apply to Become a Verified Helper
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                To keep our on-demand platform safe and trusted, all helpers must submit identification details for administrative verification.
              </p>
            </div>

            {/* Contact & Roll Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  Contact Phone Number *
                </label>
                <input
                  type="text"
                  value={appPhone}
                  onChange={(e) => setAppPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-brand-600"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  Flat / House / Area Landmark *
                </label>
                <input
                  type="text"
                  value={appRollNumber}
                  onChange={(e) => setAppRollNumber(e.target.value)}
                  placeholder="e.g. Block 4, Flat 302 / Main Road"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-brand-600"
                  required
                />
              </div>
            </div>

            {/* Skills Multi-Select */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                What chores are you qualified to do? *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TASK_CATEGORIES.map((cat) => {
                  const isChecked = appSkills.includes(cat.key);
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => handleToggleSkill(cat.key)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 ${
                        isChecked
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded accent-emerald-600"
                      />
                      <span>{cat.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Document Upload 1: Aadhar / Govt ID */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Upload Aadhar / Govt ID Proof *</span>
                <span className="text-slate-400 text-[10px]">Photo / Scan</span>
              </label>
              <div className="p-3 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2 hover:border-brand-500 transition-colors">
                {aadharPreview ? (
                  <div className="relative">
                    <img
                      src={aadharPreview}
                      alt="Aadhar Proof"
                      className="h-28 mx-auto rounded-xl object-contain shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setAadharPreview(null)}
                      className="text-[10px] text-red-600 font-bold hover:underline mt-1 block mx-auto"
                    >
                      Remove &amp; Re-upload
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block py-2">
                    <IdCard className="w-7 h-7 text-slate-400 mx-auto mb-1" />
                    <span className="text-xs font-bold text-slate-700 block">
                      Choose Aadhar / College ID photo
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      PNG, JPG, or PDF snapshot
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setAadharPreview)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Document Upload 2: Certificates / Achievements (Optional) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Achievements / Skill Certificates (Optional)</span>
                <span className="text-slate-400 text-[10px]">e.g. Coding, Repairs, Sports</span>
              </label>
              <div className="p-3 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2 hover:border-brand-500 transition-colors">
                {certPreview ? (
                  <div className="relative">
                    <img
                      src={certPreview}
                      alt="Certificate Proof"
                      className="h-28 mx-auto rounded-xl object-contain shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setCertPreview(null)}
                      className="text-[10px] text-red-600 font-bold hover:underline mt-1 block mx-auto"
                    >
                      Remove &amp; Re-upload
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block py-2">
                    <Award className="w-7 h-7 text-slate-400 mx-auto mb-1" />
                    <span className="text-xs font-bold text-slate-700 block">
                      Upload Achievement / Certificate (Optional)
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Shows on your worker profile to build customer trust
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setCertPreview)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Physical Verification Notice */}
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-[11px] text-blue-950 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Physical Verification Step:</strong> Once submitted, please present your original physical document at the Operations Desk. Admin will inspect the proof and generate your unique <strong>Worker ID</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingApp}
                className="px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 text-white shadow-md active:scale-95 disabled:opacity-50"
              >
                {submittingApp ? 'Submitting Application...' : 'Submit for Admin Approval'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ProfileScreen;
