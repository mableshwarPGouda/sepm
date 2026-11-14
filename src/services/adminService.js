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
   * Merges cloud registry with local cache
   */
  fetchApplicationsCloud: async () => {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('*')
        .eq('key', CONFIG_REGISTRY_KEY)
        .maybeSingle();

      if (!error && data?.value) {
        try {
          const cloudApps = JSON.parse(data.value);
          if (Array.isArray(cloudApps) && cloudApps.length > 0) {
            const local = getStoredApplications();
            // Merge by unique id
            const map = new Map();
            DEFAULT_APPLICATIONS.forEach((a) => map.set(a.id, a));
            local.forEach((a) => map.set(a.id, a));
            cloudApps.forEach((a) => map.set(a.id, a));
            const merged = Array.from(map.values());
            saveApplications(merged);
            return merged;
          }
        } catch (jsonErr) {
          console.warn('Error parsing cloud applications:', jsonErr);
        }
      }
    } catch (err) {
      console.warn('Could not fetch applications from Supabase:', err);
    }
    return getStoredApplications();
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

    // 1. Save locally for instant UI update
    saveApplications(updated);

    // 2. Sync to Supabase Cloud user_metadata
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
            experience: newApp.experience,
            appliedAt: newApp.appliedAt,
          },
        },
      });
    } catch (metaErr) {
      console.warn('Could not sync application to user_metadata:', metaErr);
    }

    // 3. Sync to Supabase Cloud central registry if admin access is available
    try {
      const { data: configRow } = await supabase
        .from('config')
        .select('*')
        .eq('key', CONFIG_REGISTRY_KEY)
        .maybeSingle();

      let cloudList = [];
      if (configRow?.value) {
        try {
          cloudList = JSON.parse(configRow.value);
        } catch {}
      }
      const mergedCloud = [newApp, ...cloudList.filter((x) => x.userId !== newApp.userId)];
      await supabase
        .from('config')
        .upsert({
          key: CONFIG_REGISTRY_KEY,
          value: JSON.stringify(mergedCloud),
          description: 'Central Worker Applications Store',
        });
    } catch (configErr) {
      // Non-admin users cannot write to config directly; their record is saved in user_metadata & local
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

    // Sync to Supabase Cloud central config registry
    try {
      await supabase.from('config').upsert({
        key: CONFIG_REGISTRY_KEY,
        value: JSON.stringify(updated),
        description: 'Central Worker Applications Store',
      });
    } catch (cErr) {
      console.warn('Could not update config registry in Supabase:', cErr);
    }

    // If approved, update worker role in public.profiles table
    if (status === 'APPROVED' && targetApp?.userId) {
      try {
        await supabase
          .from('profiles')
          .update({ role: 'WORKER' })
          .eq('id', targetApp.userId);
      } catch (pErr) {
        console.warn('Could not promote profile role in Supabase:', pErr);
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
