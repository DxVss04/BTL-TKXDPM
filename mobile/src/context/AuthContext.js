import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import { TOKEN_KEY, REFRESH_KEY, setOnAuthFailed } from '../api/client';
import { registerPush } from '../utils/notifications';
import { connectRealtime, disconnectRealtime } from '../utils/realtime';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const userId = user?._id;

  useEffect(() => {
    if (!userId) return undefined;
    connectRealtime();
    return disconnectRealtime;
  }, [userId]);

  const clear = useCallback(async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY]);
    setUser(null);
  }, []);

  useEffect(() => {
    setOnAuthFailed(clear);
    (async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          const res = await api.getUser();
          setUser(res.user);
          registerPush();
        }
      } catch (_) {
        await clear();
      } finally {
        setBooting(false);
      }
    })();
  }, [clear]);

  const saveSession = async (data) => {
    await AsyncStorage.multiSet([[TOKEN_KEY, data.accessToken], [REFRESH_KEY, data.refreshToken]]);
    setUser(data.user);
    registerPush();
  };

  const login = async (email, password) => {
    const data = await api.login(email.trim(), password);
    await saveSession(data);
  };

  const verify = async (code, token) => {
    const data = await api.verifyEmail(code.trim(), token);
    await saveSession(data);
  };

  const logout = async () => {
    try { await api.logout(); } catch (_) { /* bỏ qua */ }
    await clear();
  };

  const refreshUser = useCallback(async () => {
    const res = await api.getUser();
    setUser(res.user);
    return res.user;
  }, []);

  return (
    <AuthContext.Provider value={{ user, booting, login, verify, logout, refreshUser, setUser, clear }}>
      {children}
    </AuthContext.Provider>
  );
}
