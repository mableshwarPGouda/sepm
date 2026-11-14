// api/applications.js
// Vercel Serverless Function Handler for Worker Applications
let inMemoryApps = [
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

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { url, method, body, query } = req;

  // GET /api/applications or /api/applications?status=1
  if (method === 'GET') {
    const { userId, userEmail } = query || {};
    if (userId || userEmail) {
      const match = inMemoryApps.find(
        (a) =>
          (userId && a.userId === userId) ||
          (userEmail && a.userEmail?.toLowerCase() === userEmail.toLowerCase())
      );
      if (match) {
        return res.status(200).json({
          success: true,
          status: match.status,
          isApproved: match.status === 'APPROVED',
          workerId: match.workerId || null,
          application: match,
        });
      }
      return res.status(200).json({
        success: true,
        status: 'NONE',
        isApproved: false,
        workerId: null,
      });
    }

    return res.status(200).json({ success: true, applications: inMemoryApps });
  }

  // POST /api/applications (Submit or Review)
  if (method === 'POST') {
    const data = typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});

    // Review action
    if (data.action === 'REVIEW' || data.applicationId) {
      const { applicationId, status, workerId, reason } = data;
      const generatedId = workerId || `WKR-${Math.floor(1000 + Math.random() * 9000)}`;

      let target = null;
      inMemoryApps = inMemoryApps.map((app) => {
        if (app.id === applicationId) {
          target = {
            ...app,
            status,
            workerId: status === 'APPROVED' ? generatedId : null,
            rejectionReason: status === 'REJECTED' ? reason : null,
            reviewedAt: new Date().toISOString(),
            reviewedBy: 'Operations Administrator',
          };
          return target;
        }
        return app;
      });

      return res.status(200).json({ success: true, application: target });
    }

    // Submit action
    const existingIdx = inMemoryApps.findIndex(
      (a) =>
        (data.userId && a.userId === data.userId) ||
        (data.userEmail && a.userEmail === data.userEmail)
    );

    const newApp = {
      id: data.id || `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: data.userId,
      userEmail: data.userEmail,
      name: data.name || 'Candidate',
      phone: data.phone || '',
      rollNumber: data.rollNumber || '',
      skills: data.skills || ['ERRANDS_DELIVERY'],
      experience: data.experience || '',
      aadharImage: data.aadharImage || null,
      certificateImage: data.certificateImage || null,
      status: 'PENDING',
      appliedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      inMemoryApps[existingIdx] = { ...inMemoryApps[existingIdx], ...newApp };
    } else {
      inMemoryApps = [newApp, ...inMemoryApps];
    }

    return res.status(200).json({ success: true, application: newApp });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
