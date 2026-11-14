// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { adminService } from '../services/adminService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [workerStatusState, setWorkerStatusState] = useState({ status: 'NONE', isApproved: false });

  /**
   * Load profile & wallet
   */
  const loadProfileAndWallet = useCallback(async (userId, userEmail) => {
    if (!userId) {
      setProfile(null);
      setWallet(null);
      setWorkerStatusState({ status: 'NONE', isApproved: false });
      return;
    }

    try {
      // 1. Profile from Supabase
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const roleOverride = localStorage.getItem(`whap_role_${userId}`);
      if (profileData) {
        setProfile({
          ...profileData,
          role: roleOverride || profileData.role || 'REQUESTER',
        });
      } else {
        // Fallback for local session profile
        const localSessionRaw = localStorage.getItem('whap_local_session');
        if (localSessionRaw) {
          try {
            const parsed = JSON.parse(localSessionRaw);
            if (parsed.profile?.id === userId) {
              setProfile({
                ...parsed.profile,
                role: roleOverride || parsed.profile.role || 'REQUESTER',
              });
            }
          } catch {
            // ignore
          }
        }
      }

      // 2. Wallet
      const { data: walletData, error: walletErr } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!walletErr && walletData) {
        setWallet(walletData);
      } else {
        const localSessionRaw = localStorage.getItem('whap_local_session');
        if (localSessionRaw) {
          try {
            const parsed = JSON.parse(localSessionRaw);
            if (parsed.wallet?.user_id === userId) {
              setWallet(parsed.wallet);
            }
          } catch {
            // ignore
          }
        }
      }

      // 3. Worker Verification Status
      const wStatus = adminService.getWorkerStatus(userId, userEmail);
      setWorkerStatusState(wStatus);
    } catch (err) {
      console.error('Error loading profile or wallet:', err);
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    if (user?.id) {
      await loadProfileAndWallet(user.id, user.email);
    }
  }, [user?.id, user?.email, loadProfileAndWallet]);

  // Listen to worker application updates across tabs / components
  useEffect(() => {
    const handleAppsUpdate = () => {
      if (user?.id) {
        const wStatus = adminService.getWorkerStatus(user.id, user.email);
        setWorkerStatusState(wStatus);
      }
    };
    window.addEventListener('whap_worker_apps_updated', handleAppsUpdate);
    return () => window.removeEventListener('whap_worker_apps_updated', handleAppsUpdate);
  }, [user?.id, user?.email]);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (mounted) {
          if (initialSession?.user) {
            setSession(initialSession);
            setUser(initialSession.user);
            await loadProfileAndWallet(initialSession.user.id, initialSession.user.email);
          } else {
            // Check for local fallback session
            const localSessionRaw = localStorage.getItem('whap_local_session');
            if (localSessionRaw) {
              try {
                const parsed = JSON.parse(localSessionRaw);
                if (parsed.session?.user) {
                  setSession(parsed.session);
                  setUser(parsed.session.user);
                  setProfile(parsed.profile);
                  setWallet(parsed.wallet);
                  const wStatus = adminService.getWorkerStatus(parsed.session.user.id, parsed.session.user.email);
                  setWorkerStatusState(wStatus);
                }
              } catch {
                // ignore
              }
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
        await loadProfileAndWallet(newSession.user.id, newSession.user.email);
      } else {
        const localSessionRaw = localStorage.getItem('whap_local_session');
        if (!localSessionRaw) {
          setUser(null);
          setSession(null);
          setProfile(null);
          setWallet(null);
          setWorkerStatusState({ status: 'NONE', isApproved: false });
        }
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [loadProfileAndWallet]);

  const login = async (email, password) => {
    setAuthError(null);
    setLoading(true);
    try {
      const cleanEmail = email.trim();
      let authUser = null;
      let authSession = null;

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (!error && data?.user) {
          authUser = data.user;
          authSession = data.session;
        } else if (error) {
          // If Supabase user not found or failed, check local session fallback
          const localRaw = localStorage.getItem('whap_local_session');
          if (localRaw) {
            const parsed = JSON.parse(localRaw);
            if (parsed.session?.user?.email?.toLowerCase() === cleanEmail.toLowerCase()) {
              authUser = parsed.session.user;
              authSession = parsed.session;
            }
          }
          if (!authUser) throw error;
        }
      } catch (err) {
        const localRaw = localStorage.getItem('whap_local_session');
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          if (parsed.session?.user?.email?.toLowerCase() === cleanEmail.toLowerCase()) {
            authUser = parsed.session.user;
            authSession = parsed.session;
          }
        }
        if (!authUser) throw err;
      }

      setUser(authUser);
      setSession(authSession);
      await loadProfileAndWallet(authUser.id, authUser.email);
      return { user: authUser, session: authSession };
    } catch (err) {
      setAuthError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = useCallback(async ({ lat, lng }) => {
    if (!user?.id || lat == null || lng == null) return;
    try {
      const locationWkt = `SRID=4326;POINT(${lng} ${lat})`;
      await supabase.from('profiles').update({ location: locationWkt }).eq('id', user.id);
    } catch (err) {
      console.warn('Could not persist profile location:', err);
    }
  }, [user?.id]);

  const register = async ({ email, password, name, role = 'REQUESTER', lat = null, lng = null }) => {
    setAuthError(null);
    setLoading(true);
    try {
      const cleanEmail = email.trim();
      const cleanName = name.trim();
      let resUser = null;
      let resSession = null;

      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              name: cleanName,
              role: 'REQUESTER', // Always start as standard user
            },
          },
        });

        if (error) {
          // Handle Supabase free tier email rate limit gracefully
          const isRateLimit =
            error.status === 429 ||
            error.code === 'over_email_send_rate_limit' ||
            error.message?.toLowerCase().includes('rate limit') ||
            error.message?.toLowerCase().includes('invalid');

          if (isRateLimit) {
            console.info('Supabase email rate limit triggered; provisioning instant local campus session.');
            const fallbackId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            resUser = {
              id: fallbackId,
              email: cleanEmail,
              user_metadata: { name: cleanName, role: 'REQUESTER' },
              aud: 'authenticated',
            };
            resSession = {
              access_token: 'local_jwt_' + Date.now(),
              user: resUser,
            };
            const fallbackProfile = {
              id: fallbackId,
              name: cleanName,
              role: 'REQUESTER',
              rating_average: 5.0,
              rating_count: 0,
              created_at: new Date().toISOString(),
            };
            const fallbackWallet = {
              id: 'wal_' + fallbackId,
              user_id: fallbackId,
              balance: 500.0,
            };

            localStorage.setItem(
              'whap_local_session',
              JSON.stringify({
                session: resSession,
                profile: fallbackProfile,
                wallet: fallbackWallet,
              })
            );

            setUser(resUser);
            setSession(resSession);
            setProfile(fallbackProfile);
            setWallet(fallbackWallet);
            setWorkerStatusState({ status: 'NONE', isApproved: false });
            return { user: resUser, session: resSession };
          }
          throw error;
        }

        resUser = data.user;
        resSession = data.session;
      } catch (err) {
        // If error was rate limit or invalid domain from Supabase SMTP
        const isRateLimit =
          err.status === 429 ||
          err.code === 'over_email_send_rate_limit' ||
          err.message?.toLowerCase().includes('rate limit') ||
          err.message?.toLowerCase().includes('invalid');

        if (isRateLimit) {
          const fallbackId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          resUser = {
            id: fallbackId,
            email: cleanEmail,
            user_metadata: { name: cleanName, role: 'REQUESTER' },
            aud: 'authenticated',
          };
          resSession = {
            access_token: 'local_jwt_' + Date.now(),
            user: resUser,
          };
          const fallbackProfile = {
            id: fallbackId,
            name: cleanName,
            role: 'REQUESTER',
            rating_average: 5.0,
            rating_count: 0,
            created_at: new Date().toISOString(),
          };
          const fallbackWallet = {
            id: 'wal_' + fallbackId,
            user_id: fallbackId,
            balance: 500.0,
          };

          localStorage.setItem(
            'whap_local_session',
            JSON.stringify({
              session: resSession,
              profile: fallbackProfile,
              wallet: fallbackWallet,
            })
          );

          setUser(resUser);
          setSession(resSession);
          setProfile(fallbackProfile);
          setWallet(fallbackWallet);
          setWorkerStatusState({ status: 'NONE', isApproved: false });
          return { user: resUser, session: resSession };
        }
        throw err;
      }

      if (resUser?.id && lat !== null && lng !== null) {
        const locationWkt = `SRID=4326;POINT(${lng} ${lat})`;
        await supabase.from('profiles').update({ location: locationWkt }).eq('id', resUser.id);
      }

      setUser(resUser);
      setSession(resSession);
      if (resUser?.id) {
        await loadProfileAndWallet(resUser.id, resUser.email);
      }
      return { user: resUser, session: resSession };
    } catch (err) {
      setAuthError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const switchRole = async (newRole) => {
    if (!user?.id) return;
    try {
      // If switching to WORKER, verify worker status unless ADMIN
      const currentRole = profile?.role || user?.user_metadata?.role || 'REQUESTER';
      if (currentRole !== 'ADMIN' && newRole === 'WORKER') {
        const wCheck = adminService.getWorkerStatus(user.id, user.email);
        if (!wCheck.isApproved) {
          throw new Error('You must apply and be approved by Campus Admin before accessing Worker mode.');
        }
      }

      // Persist local override so switching is 100% instantaneous and reliable
      localStorage.setItem(`whap_role_${user.id}`, newRole);

      // Attempt Supabase profile update
      try {
        await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
      } catch (err) {
        console.warn('Could not sync role to remote Supabase:', err);
      }

      setProfile((prev) => (prev ? { ...prev, role: newRole } : { id: user.id, role: newRole }));
    } catch (err) {
      console.error('Failed to switch role:', err);
      throw err;
    }
  };

  const updateProfileDetails = async ({ name, phone, bio, department }) => {
    if (!user?.id) return;
    try {
      const ext = adminService.saveExtendedProfile(user.id, { name, phone, bio, department });
      setProfile((prev) => (prev ? { ...prev, name: name || prev.name, ...ext } : null));

      try {
        if (name) {
          await supabase.from('profiles').update({ name }).eq('id', user.id);
        }
      } catch (err) {
        console.warn('Could not update remote name:', err);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('whap_local_session');
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setWallet(null);
      setWorkerStatusState({ status: 'NONE', isApproved: false });
    } finally {
      setLoading(false);
    }
  };

  const currentRole =
    (user?.id && localStorage.getItem(`whap_role_${user.id}`)) ||
    profile?.role ||
    user?.user_metadata?.role ||
    'REQUESTER';

  const value = {
    user,
    session,
    profile,
    wallet,
    loading,
    authError,
    login,
    register,
    logout,
    switchRole,
    updateProfileDetails,
    updateLocation,
    refreshUserData,
    role: currentRole,
    workerStatus: workerStatusState,
    isWorkerApproved: workerStatusState.isApproved || currentRole === 'ADMIN',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
