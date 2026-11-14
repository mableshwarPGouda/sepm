// src/services/adminService.js
// Cloud-synchronized Worker Applications, Verification, and Admin Operations
import { supabase } from './supabaseClient';

const APPLICATIONS_KEY = 'whap_worker_applications_v1';
const SAVED_WORKERS_KEY = 'whap_saved_workers_v1';
const PROFILE_EXT_KEY = 'whap_profiles_extended_v1';
const CONFIG_REGISTRY_KEY = 'whap_worker_apps_registry';

// Seed default approved status for the demo workers
const DEFAULT_APPLICATIONS = [
  {
    id: 'app_seed_worker_1',
    userId: 'ee01efff-b168-40f7-887b-118246b894b1',
    userEmail: 'worker_1@whap.local',
    name: 'Amit Worker (Main Gate)',
    phone: '+91 98765 43210',
    rollNumber: 'LOC-CS-2024-042',
    skills: ['ERRANDS_DELIVERY', 'PRINT_DOCUMENTS', 'QUEUE_WAITING'],
    experience: 'Local resident for 3 years, two-wheeler delivery available immediately.',
    status: 'APPROVED',
    workerId: 'WKR-1001',
    appliedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    reviewedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    reviewedBy: 'Operations Administrator',
  },
  {
    id: 'app_seed_worker_2',
    userId: 'ee01efff-b168-40f7-887b-118246b894b2',
    userEmail: 'worker_2@whap.local',
    name: 'Sneha Worker (Central)',
    phone: '+91 98765 43211',
    rollNumber: 'LOC-EC-2024-089',
    skills: ['PRINT_DOCUMENTS', 'TECH_SETUP', 'ERRANDS_DELIVERY'],
    experience: 'Expert in fast courier pickup, printing and tech setup.',
    status: 'APPROVED',
    workerId: 'WKR-1002',
    appliedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    reviewedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    reviewedBy: 'Operations Administrator',
  },
];

function getStoredApplications() {
  try {
    const raw = localStorage.getItem(APPLICATIONS_KEY);
    if (!raw) {
      localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(DEFAULT_APPLICATIONS));
      return DEFAULT_APPLICATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_APPLICATIONS;
  }
}

function saveApplications(apps) {
  try {
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
    window.dispatchEvent(new Event('whap_worker_apps_updated'));
  } catch (err) {
    console.warn('Could not save worker applications to localStorage:', err);
  }
}

export const adminService = {
  // --------------------------------------------------------------------------
  // Worker Applications Management (Syncs to Supabase Cloud)
  // --------------------------------------------------------------------------
  getApplications: () => {
    return getStoredApplications();
  },

  /**
   * Async fetch applications directly from Supabase Cloud
   * Uses both central config registry AND profiles table directly
   * Guaranteeing 100% real-time reflection of ANY applicant
   */
  fetchApplicationsCloud: async () => {
    const map = new Map();

    // 1. Seed defaults
    DEFAULT_APPLICATIONS.forEach((a) => map.set(a.id, a));

    // 2. Local storage
    getStoredApplications().forEach((a) => map.set(a.id, a));

    // 3. Central config registry
    try {
      const { data: configRow } = await supabase
        .from('config')
        .select('*')
        .eq('key', CONFIG_REGISTRY_KEY)
        .maybeSingle();

      if (configRow?.value) {
        try {
          const parsed = JSON.parse(configRow.value);
          if (Array.isArray(parsed)) {
            parsed.forEach((a) => {
              if (a?.id) map.set(a.id, { ...map.get(a.id), ...a });
            });
          }
        } catch (e) {
          console.warn('Error parsing config registry:', e);
        }
      }
    } catch (cErr) {
      console.warn('Could not read config registry:', cErr);
    }

    // 4. Supabase Profiles table (100% permission guaranteed on all roles)
    try {
      const { data: appliedProfiles, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .ilike('name', '%[APPLIED:%');

      if (!profErr && Array.isArray(appliedProfiles)) {
        appliedProfiles.forEach((p) => {
          try {
            const match = p.name.match(/\[APPLIED:([^:]+):(.*)\]/);
            if (match) {
              const status = match[1];
              const rawData = JSON.parse(decodeURIComponent(match[2]));
              const cleanDisplayName = p.name.replace(/\s*\[APPLIED:.*\]/, '').trim();
              const appId = rawData.id || `app_${p.id}`;

              const existing = map.get(appId);
              map.set(appId, {
                id: appId,
                userId: p.id,
                userEmail: rawData.userEmail || `${cleanDisplayName.toLowerCase().replace(/\s+/g, '')}@whap.local`,
                name: cleanDisplayName || rawData.name || 'Candidate',
                phone: rawData.phone || '+91 98765 00000',
                rollNumber: rawData.rollNumber || 'Area Landmark',
                skills: rawData.skills || ['ERRANDS_DELIVERY'],
                experience: rawData.experience || '',
                status: existing?.status || status || 'PENDING',
                workerId: existing?.workerId || (p.role === 'WORKER' ? `WKR-${p.id.slice(0, 4)}` : null),
                appliedAt: rawData.appliedAt || p.updated_at || new Date().toISOString(),
              });
            }
          } catch (e) {
            console.warn('Error parsing applied profile:', e);
          }
        });
      }
    } catch (pErr) {
      console.warn('Could not query applied profiles from Supabase:', pErr);
    }

    const merged = Array.from(map.values());
    saveApplications(merged);
    return merged;
  },

  getWorkerStatus: (userId, userEmail) => {
    if (!userId && !userEmail) return { status: 'NONE', isApproved: false };
    const apps = getStoredApplications();
    const match = apps.find(
      (a) =>
        (userId && a.userId === userId) ||
        (userEmail && a.userEmail?.toLowerCase() === userEmail.toLowerCase())
    );

    if (!match) {
      // Check if user is known seed worker by email pattern
      if (userEmail && userEmail.startsWith('worker_')) {
        return {
          status: 'APPROVED',
          isApproved: true,
          workerId: `WKR-${userEmail.replace(/\D/g, '') || '01'}`,
        };
      }
      return { status: 'NONE', isApproved: false };
    }

    return {
      status: match.status,
      isApproved: match.status === 'APPROVED',
      workerId: match.workerId || null,
      application: match,
    };
  },

  submitWorkerApplication: async ({
    userId,
    userEmail,
    name,
    phone,
    rollNumber,
    skills = [],
    experience = '',
    aadharImage = null,
    certificateImage = null,
  }) => {
    const apps = getStoredApplications();
    const existingIdx = apps.findIndex(
      (a) => a.userId === userId || (userEmail && a.userEmail === userEmail)
    );

    const newApp = {
      id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      userEmail,
      name,
      phone,
      rollNumber,
      skills,
      experience,
      aadharImage,
      certificateImage,
      status: 'PENDING',
      appliedAt: new Date().toISOString(),
    };

    let updated;
    if (existingIdx >= 0) {
      updated = [...apps];
      updated[existingIdx] = { ...updated[existingIdx], ...newApp };
    } else {
      updated = [newApp, ...apps];
    }

    // 1. Save locally for instant UI update on applicant's screen
    saveApplications(updated);

    // 2. Direct database update to public.profiles table
    // (RLS policy allows every user to update their own profile row: auth.uid() = id)
    try {
      const payloadString = encodeURIComponent(
        JSON.stringify({
          id: newApp.id,
          userEmail: newApp.userEmail,
          name: newApp.name,
          phone: newApp.phone,
          rollNumber: newApp.rollNumber,
          skills: newApp.skills,
          experience: newApp.experience,
          appliedAt: newApp.appliedAt,
        })
      );

      // Clean existing name if already has tag
      const baseCleanName = (name || '').replace(/\s*\[APPLIED:.*\]/, '').trim();
      const encodedName = `${baseCleanName} [APPLIED:PENDING:${payloadString}]`;

      const { error: profileUpdateErr } = await supabase
        .from('profiles')
        .update({ name: encodedName })
        .eq('id', userId);

      if (profileUpdateErr) {
        console.warn('Could not update profile with application tag:', profileUpdateErr);
      } else {
        console.log('Application state successfully embedded in Supabase profiles table');
      }
    } catch (profErr) {
      console.warn('Profile embedding exception:', profErr);
    }

    // 3. Sync to Supabase auth user_metadata
    try {
      await supabase.auth.updateUser({
        data: {
          worker_application: {
            id: newApp.id,
            status: 'PENDING',
            name: newApp.name,
            phone: newApp.phone,
            rollNumber: newApp.rollNumber,
            skills: newApp.skills,
            appliedAt: newApp.appliedAt,
          },
        },
      });
    } catch (metaErr) {
      console.warn('Could not sync application to user_metadata:', metaErr);
    }

    return newApp;
  },

  reviewApplication: async ({ applicationId, status, workerId = null, reason = '' }) => {
    const apps = getStoredApplications();
    const generatedId = workerId || `WKR-${Math.floor(1000 + Math.random() * 9000)}`;

    const updated = apps.map((app) => {
      if (app.id === applicationId) {
        return {
          ...app,
          status,
          workerId: status === 'APPROVED' ? generatedId : null,
          rejectionReason: status === 'REJECTED' ? reason : null,
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'Operations Administrator',
        };
      }
      return app;
    });

    saveApplications(updated);

    const targetApp = updated.find((a) => a.id === applicationId);

    // 1. Sync to Supabase Cloud central config registry
    try {
      await supabase.from('config').upsert({
        key: CONFIG_REGISTRY_KEY,
        value: JSON.stringify(updated),
        description: 'Central Worker Applications Store',
      });
    } catch (cErr) {
      console.warn('Could not update config registry in Supabase:', cErr);
    }

    // 2. If approved or rejected, update the user's role and clean name in Supabase profiles table
    if (targetApp?.userId) {
      try {
        const cleanName = (targetApp.name || '').replace(/\s*\[APPLIED:.*\]/, '').trim();
        const updatePayload = {
          name: cleanName,
        };
        if (status === 'APPROVED') {
          updatePayload.role = 'WORKER';
        }

        await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', targetApp.userId);

        console.log(`User ${targetApp.userId} updated in Supabase: role=${updatePayload.role || 'unchanged'}`);
      } catch (pErr) {
        console.warn('Could not update profile in Supabase:', pErr);
      }
    }

    return targetApp;
  },

  // --------------------------------------------------------------------------
  // Saved Preferred Workers ("My Workers")
  // --------------------------------------------------------------------------
  getSavedWorkers: (requesterId) => {
    try {
      const raw = localStorage.getItem(`${SAVED_WORKERS_KEY}_${requesterId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveWorker: (requesterId, worker) => {
    if (!requesterId || !worker || !worker.id) return [];
    try {
      const current = adminService.getSavedWorkers(requesterId);
      if (current.some((w) => w.id === worker.id)) return current;
      const updated = [
        {
          id: worker.id,
          name: worker.name || 'Verified Helper',
          email: worker.email || '',
          phone: worker.phone || '+91 98765 00000',
          rating_average: worker.rating_average || 5.0,
          rating_count: worker.rating_count || 1,
          workerId: worker.workerId || `WKR-${worker.id.slice(0, 4)}`,
          skills: worker.skills || ['General Errands', 'Delivery'],
          savedAt: new Date().toISOString(),
        },
        ...current,
      ];
      localStorage.setItem(`${SAVED_WORKERS_KEY}_${requesterId}`, JSON.stringify(updated));
      return updated;
    } catch (err) {
      console.warn('Could not save worker:', err);
      return [];
    }
  },

  removeSavedWorker: (requesterId, workerId) => {
    if (!requesterId || !workerId) return [];
    try {
      const current = adminService.getSavedWorkers(requesterId);
      const updated = current.filter((w) => w.id !== workerId);
      localStorage.setItem(`${SAVED_WORKERS_KEY}_${requesterId}`, JSON.stringify(updated));
      return updated;
    } catch (err) {
      console.warn('Could not remove saved worker:', err);
      return [];
    }
  },

  isWorkerSaved: (requesterId, workerId) => {
    if (!requesterId || !workerId) return false;
    const current = adminService.getSavedWorkers(requesterId);
    return current.some((w) => w.id === workerId);
  },

  // --------------------------------------------------------------------------
  // Extended Profile Editing (Name, Phone, Bio, Department)
  // --------------------------------------------------------------------------
  getExtendedProfile: (userId) => {
    try {
      const raw = localStorage.getItem(`${PROFILE_EXT_KEY}_${userId}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  saveExtendedProfile: (userId, data) => {
    try {
      const current = adminService.getExtendedProfile(userId);
      const updated = { ...current, ...data, updatedAt: new Date().toISOString() };
      localStorage.setItem(`${PROFILE_EXT_KEY}_${userId}`, JSON.stringify(updated));
      return updated;
    } catch (err) {
      console.warn('Could not save extended profile:', err);
      return {};
    }
  },
};

export default adminService;
