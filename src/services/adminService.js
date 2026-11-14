// src/services/adminService.js
// Handles Worker Verification Applications, Saved Workers, Platform Commission, and Live Work Monitoring

const APPLICATIONS_KEY = 'whap_worker_applications_v1';
const SAVED_WORKERS_KEY = 'whap_saved_workers_v1';
const PROFILE_EXT_KEY = 'whap_profiles_extended_v1';

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
    console.warn('Could not save worker applications:', err);
  }
}

export const adminService = {
  // --------------------------------------------------------------------------
  // Worker Applications Management
  // --------------------------------------------------------------------------
  getApplications: () => {
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

  submitWorkerApplication: ({
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

    saveApplications(updated);
    return newApp;
  },

  reviewApplication: ({ applicationId, status, workerId = null, reason = '' }) => {
    const apps = getStoredApplications();
    const updated = apps.map((app) => {
      if (app.id === applicationId) {
        const generatedId = workerId || `WKR-${Math.floor(1000 + Math.random() * 9000)}`;
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
    return updated.find((a) => a.id === applicationId);
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
