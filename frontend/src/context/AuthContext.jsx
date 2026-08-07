import { createContext, useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useGetMe } from "../hooks/useAuth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { data, isLoading } = useGetMe();
  const user = data?.data?.user ?? data?.user ?? null;

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export const GuestRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

if (user) {
    return <Navigate to={user.isOnBoarded ? "/dashboard" : "/onboarding"} replace />;
  }

  return children;
};
