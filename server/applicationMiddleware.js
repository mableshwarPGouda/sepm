// server/applicationMiddleware.js
import fs from 'fs';
import path from 'path';

const dataDir = path.resolve(process.cwd(), 'data');
const appsFile = path.resolve(dataDir, 'worker_applications.json');

// In-memory cache for speed
let memoryApps = [];

function loadApps() {
  try {
    if (fs.existsSync(appsFile)) {
      const raw = fs.readFileSync(appsFile, 'utf8');
      memoryApps = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Could not read applications file:', err.message);
  }
  return memoryApps;
}

function persistApps(apps) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(appsFile, JSON.stringify(apps, null, 2), 'utf8');
    memoryApps = apps;
  } catch (err) {
    console.warn('Could not write applications file:', err.message);
  }
}

// Initial load
loadApps();

export function applicationApiPlugin() {
  return {
    name: 'whap-application-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Handle CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = url.pathname;

        // GET /api/applications
        if (pathname === '/api/applications' && req.method === 'GET') {
          const current = loadApps();
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, applications: current }));
          return;
        }

        // GET /api/applications/status
        if (pathname === '/api/applications/status' && req.method === 'GET') {
          const userId = url.searchParams.get('userId');
          const userEmail = url.searchParams.get('userEmail');
          const current = loadApps();

          const match = current.find(
            (a) =>
              (userId && a.userId === userId) ||
              (userEmail && a.userEmail?.toLowerCase() === userEmail.toLowerCase())
          );

          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          if (match) {
            res.end(
              JSON.stringify({
                success: true,
                status: match.status,
                isApproved: match.status === 'APPROVED',
                workerId: match.workerId || null,
                application: match,
              })
            );
          } else {
            res.end(
              JSON.stringify({
                success: true,
                status: 'NONE',
                isApproved: false,
                workerId: null,
              })
            );
          }
          return;
        }

        // POST /api/applications
        if (pathname === '/api/applications' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}');
              const current = loadApps();

              const existingIdx = current.findIndex(
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

              let updated;
              if (existingIdx >= 0) {
                updated = [...current];
                updated[existingIdx] = { ...updated[existingIdx], ...newApp };
              } else {
                updated = [newApp, ...current];
              }

              persistApps(updated);
              console.log(`[Vite API] Received worker application for: ${newApp.name} (${newApp.phone})`);

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, application: newApp }));
            } catch (parseErr) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: parseErr.message }));
            }
          });
          return;
        }

        // POST /api/applications/review
        if (pathname === '/api/applications/review' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const { applicationId, status, workerId, reason } = JSON.parse(body || '{}');
              const current = loadApps();
              const generatedId = workerId || `WKR-${Math.floor(1000 + Math.random() * 9000)}`;

              let target = null;
              const updated = current.map((app) => {
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

              persistApps(updated);
              console.log(`[Vite API] Reviewed application ${applicationId}: status=${status}`);

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, application: target }));
            } catch (parseErr) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: parseErr.message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}
