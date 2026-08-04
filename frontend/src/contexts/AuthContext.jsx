import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    setUser(data.data.user);
    if (data?.data?.token) {
      localStorage.setItem("ig_token", data.data.token);
    }
    return data;
  };

  const login = async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    setUser(data.data.user);
    if (data?.data?.token) {
      localStorage.setItem("ig_token", data.data.token);
    }
    return data;
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
    localStorage.removeItem("ig_token");
  };

  const refreshUser = async () => {
    await fetchMe();
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
