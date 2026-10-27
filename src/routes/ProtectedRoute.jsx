import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return <div className="screen-status">Comprobando tu sesión…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role))
    return (
      <Navigate
        to={
          user.role === "admin"
            ? "/admin"
            : user.role === "tutor"
              ? "/tutor"
              : "/topics"
        }
        replace
      />
    );
  return <Outlet />;
}
