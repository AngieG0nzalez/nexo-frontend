import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import "./Sidebar.css";
export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links =
    user?.role === "admin"
      ? [
        { to: "/admin", label: "Solicitudes", end: true },
        { to: "/admin/users", label: "Usuarios" },
        { to: "/admin/assignments", label: "Asignaciones" },
        { to: "/admin/questions", label: "Banco de preguntas" },
        { to: "/admin/suggestions", label: "Sugerencias" },
      ]
      : user?.role === "tutor"
        ? [
            { to: "/tutor", label: "Panel del tutor", end: true },
            { to: "/tutor/messages", label: "Mensajes" },
            { to: "/tutor/questions", label: "Banco de preguntas" },
            { to: "/tutor/suggestions/new", label: "Enviar sugerencia" },
            { to: "/tutor/suggestions", label: "Mis sugerencias", end: true },
          ]
        : [
            { to: "/topics", label: "Materias" },
            { to: "/progress", label: "Mi progreso" },
            { to: "/exercise", label: "Practicar" },
            { to: "/messages", label: "Mensajes" },
            { to: "/suggestions/new", label: "Enviar sugerencia" },
            { to: "/suggestions", label: "Mis sugerencias", end: true },
          ];
  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar__brand">
          Ne<span>x</span>o
        </div>
        <p className="sidebar__role">
          {user?.role === "admin"
            ? "Administración"
            : user?.role === "tutor"
              ? "Tutoría"
              : "Estudiante"}
        </p>
        <nav className="sidebar__navigation">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="sidebar__footer">
        {user?.role !== "admin" && (
          <NavLink className="sidebar__profile" to="/profile">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            Mi perfil
          </NavLink>
        )}
        <p className="sidebar__identity">
          {user?.name || user?.email || "Mi cuenta"}
        </p>
        <button
          className="sidebar__logout"
          type="button"
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
