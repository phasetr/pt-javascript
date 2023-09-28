"use client";
import React, { useContext } from "react";

interface AuthContextType {
  login: (token: string) => void;
  logout: () => void;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = React.createContext<AuthContextType>({
  login: (token: string) => {
  },
  logout: () => {
  },
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const login = async (token: string) => {
    localStorage.setItem("auth_token", token);
  };
  const logout = () => {
    localStorage.removeItem("auth_token");
  };
  const value = {
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
