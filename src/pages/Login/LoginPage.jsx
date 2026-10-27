import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  forgotPassword,
  requestRegistration,
  resetPassword,
} from "../../api/auth.api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "./LoginPage.css";
const FORGOT_COOLDOWN_SECONDS = 60;
const initialRegistration = {
  name: "",
  last_name: "",
  email: "",
  password: "",
  grade: "9",
  requested_role: "student",
};
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn } = useAuth();
  const [view, setView] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registration, setRegistration] = useState(initialRegistration);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSucceeded, setResetSucceeded] = useState(false);
  const [forgotCooldown, setForgotCooldown] = useState(0);
  const [forgotCount, setForgotCount] = useState(0);
  const resetToken = new URLSearchParams(location.search).get("token");
  const isResetRoute = location.pathname === "/reset-password";
  useEffect(() => {
    if (forgotCooldown <= 0) return undefined;
    const timer = setTimeout(() => setForgotCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [forgotCooldown]);
  useEffect(() => {
    if (isResetRoute) setView("reset");
  }, [isResetRoute]);
  useEffect(() => {
    if (location.state?.notice) {
      setSuccess(location.state.notice);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);
  if (user && !isResetRoute)
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
  function switchView(next) {
    setError("");
    setSuccess("");
    setResetSucceeded(false);
    if (isResetRoute) {
      navigate("/login", { replace: true });
    }
    setView(next);
  }
  async function submit(event) {
    event.preventDefault();
    if (loading || (view === "forgot" && forgotCooldown > 0)) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (view === "login") {
        const profile = await signIn(email.trim(), password);
        navigate(
          profile.role === "admin"
            ? "/admin"
            : profile.role === "tutor"
              ? "/tutor"
              : "/topics",
          { replace: true },
        );
      } else if (view === "register") {
        if (registration.password.length < 8) {
          throw new Error("La contraseña debe tener al menos 8 caracteres.");
        }
        // No se crean cuentas aquí: se solicita revisión administrativa.
        await requestRegistration({
          name: `${registration.name.trim()} ${registration.last_name.trim()}`,
          email: registration.email.trim(),
          password: registration.password,
          requested_role: registration.requested_role,
          grade:
            registration.requested_role === "student" ? Number(registration.grade) : null,
        });

        setSuccess(
          "Solicitud enviada. Un administrador revisará tu inscripción.",
        );

        setRegistration(initialRegistration);
      } else if (view === "forgot") {
        await forgotPassword(resetEmail.trim());
        setForgotCount((count) => count + 1);
        setForgotCooldown(FORGOT_COOLDOWN_SECONDS);
        setSuccess(
          "Si el correo está registrado, recibirás instrucciones para recuperar tu cuenta.",
        );
      } else if (view === "reset") {
        if (!resetToken)
          throw new Error(
            "Falta el token de recuperación. Solicita un nuevo enlace.",
          );
        if (newPassword.length < 8 || newPassword.length > 128) {
          throw new Error(
            "La contraseña debe tener entre 8 y 128 caracteres.",
          );
        }
        if (newPassword !== confirmNewPassword) {
          throw new Error("Las contraseñas no coinciden.");
        }
        await resetPassword(resetToken, newPassword, confirmNewPassword);
        setSuccess("Contraseña actualizada. Ya puedes iniciar sesión.");
        setNewPassword("");
        setConfirmNewPassword("");
        setResetSucceeded(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="login-page">
      <div className="login-page__top">
        <span className="login-page__brand">
          Ne<span>x</span>o<span className="brand-dot">.</span>
        </span>
        <span className="login-page__tag">MATEMÁTICAS · GRADOS 9°–11°</span>
      </div>
      <div className="auth-shell">
        <div
          className={`auth-shell__slider ${view === "register" ? "is-register" : ""}`}
        >
          <section className="auth-hero" aria-label="Bienvenida a Nexo">
            <div className="auth-hero__decoration auth-hero__decoration--one" />
            <div className="auth-hero__decoration auth-hero__decoration--two" />
            <div className="auth-hero__content">
              <div className="auth-hero__icon" aria-hidden="true">
                ✳
              </div>
              <span className="auth-hero__eyebrow">TU ESPACIO PARA CRECER</span>
              <h1>
                {view === "register"
                  ? "Tu siguiente gran paso empieza aquí."
                  : "Aprende a tu propio ritmo."}
              </h1>
              <p>
                Matemáticas que cobran sentido. Practica, aprende con tutores y
                descubre cuánto puedes avanzar.
              </p>
              <div className="auth-hero__highlights">
                <span>✦ Aprendizaje adaptativo</span>
                <span>✦ Acompañamiento real</span>
              </div>
            </div>
            <div className="auth-hero__bottom">
              NEXO <span>·</span> CONECTA CON TU POTENCIAL
            </div>
          </section>
          <section className="auth-panel" aria-label="Acceso a Nexo">
            <div className="auth-panel__inner">
              <div className="auth-panel__eyebrow">
                {view === "register"
                  ? "ÚNETE A NEXO"
                  : view === "forgot" || view === "reset"
                    ? "RECUPERA TU CUENTA"
                    : "BIENVENIDO A NEXO"}
              </div>
              <h2>
                {view === "register"
                  ? "Solicita tu inscripción"
                  : view === "forgot"
                    ? "¿Olvidaste tu contraseña?"
                    : view === "reset"
                      ? "Nueva contraseña"
                      : "Qué bueno verte de nuevo"}
              </h2>
              <p className="auth-panel__subtitle">
                {view === "register"
                  ? "Completa tus datos. Un administrador revisará tu solicitud."
                  : view === "forgot"
                    ? "Te enviaremos un enlace de recuperación."
                    : view === "reset"
                      ? "Elige una contraseña segura para tu cuenta."
                      : "Continúa tu camino de aprendizaje."}
              </p>
              <form className="auth-form" onSubmit={submit}>
                {view === "login" && (
                  <>
                    <label>
                      Correo electrónico
                      <input
                        type="email"
                        autoComplete="username"
                        placeholder="tu@correo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Contraseña
                      <div className="password-field">
                        <input
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder="Ingresa tu contraseña"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={
                            showPassword
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                        >
                          {showPassword ? "Ocultar" : "Ver"}
                        </button>
                      </div>
                    </label>
                    <button
                      className="auth-link auth-link--right"
                      type="button"
                      onClick={() => switchView("forgot")}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </>
                )}
                {view === "register" && (
                  <>
                    <div className="auth-form__two">
                      <label>
                        Nombre
                        <input
                          required
                          maxLength={50}
                          value={registration.name}
                          onChange={(e) =>
                            setRegistration({
                              ...registration,
                              name: e.target.value,
                            })
                          }
                          placeholder="Tu nombre"
                        />
                      </label>
                      <label>
                        Apellido
                        <input
                          required
                          maxLength={50}
                          value={registration.last_name}
                          onChange={(e) =>
                            setRegistration({
                              ...registration,
                              last_name: e.target.value,
                            })
                          }
                          placeholder="Tu apellido"
                        />
                      </label>
                    </div>
                    <label>
                      Correo electrónico
                      <input
                        type="email"
                        required
                        value={registration.email}
                        onChange={(e) =>
                          setRegistration({
                            ...registration,
                            email: e.target.value,
                          })
                        }
                        placeholder="tu@correo.com"
                      />
                    </label>
                    <label>
                      Contraseña
                      <input
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        maxLength={128}
                        required
                        placeholder="Mínimo 8 caracteres"
                        value={registration.password}
                        onChange={(e) =>
                          setRegistration({
                            ...registration,
                            password: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      Quiero registrarme como
                      <select
                        value={registration.requested_role}
                        onChange={(e) =>
                          setRegistration({
                            ...registration,
                            requested_role: e.target.value,
                          })
                        }
                      >
                        <option value="student">Estudiante</option>
                        <option value="tutor">Tutor</option>
                      </select>
                    </label>
                    {registration.requested_role === "student" ? (
                      <label>
                        Grado
                        <select
                          value={registration.grade}
                          onChange={(e) =>
                            setRegistration({
                              ...registration,
                              grade: e.target.value,
                            })
                          }
                        >
                          <option value="9">9°</option>
                          <option value="10">10°</option>
                          <option value="11">11°</option>
                        </select>
                      </label>
                    ) : (
                      <p className="auth-form__note">
                        Podrás completar tu especialidad y biografía en «Mi perfil»
                        cuando tu cuenta sea aprobada.
                      </p>
                    )}
                    <p className="auth-form__note">
                      La solicitud no crea una cuenta automáticamente. Recibirás
                      indicaciones cuando sea revisada.
                    </p>
                  </>
                )}
                {view === "forgot" && (
                  <label>
                    Correo electrónico
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="tu@correo.com"
                    />
                  </label>
                )}
                {view === "reset" && (
                  resetToken && !resetSucceeded ? (
                    <>
                      <label>
                        Nueva contraseña
                        <input
                          type="password"
                          autoComplete="new-password"
                          minLength={8}
                          maxLength={128}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 8 caracteres"
                        />
                      </label>
                      <label>
                        Confirmar contraseña
                        <input
                          type="password"
                          autoComplete="new-password"
                          minLength={8}
                          maxLength={128}
                          required
                          placeholder="Repite tu contraseña"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          aria-invalid={
                            confirmNewPassword.length > 0 &&
                            newPassword !== confirmNewPassword
                          }
                          aria-describedby={
                            confirmNewPassword &&
                            newPassword !== confirmNewPassword
                              ? "reset-password-mismatch"
                              : undefined
                          }
                        />
                        {confirmNewPassword &&
                          newPassword !== confirmNewPassword && (
                            <span
                              id="reset-password-mismatch"
                              className="error-message"
                              role="alert"
                            >
                              Las contraseñas no coinciden.
                            </span>
                          )}
                      </label>
                    </>
                  ) : !resetToken ? (
                    <p className="auth-form__note" role="alert">
                      El enlace no contiene un token de recuperación. Solicita
                      uno nuevo para continuar.
                    </p>
                  ) : null
                )}
              {error && (
                  <div
                    className="auth-message auth-message--error"
                    role="alert"
                  >
                    {error}
                  </div>
                )}
                {success && (
                  <div
                    className="auth-message auth-message--success"
                    role="status"
                  >
                    {success}
                  </div>
                )}
                {view === "forgot" && forgotCount > 1 && (
                  <div className="auth-message" role="status">
                    Has solicitado instrucciones {forgotCount} veces. Revisa tu bandeja
                    de entrada y la carpeta de spam antes de volver a intentarlo.
                  </div>
                )}
                {!(view === "reset" && (!resetToken || resetSucceeded)) && (
                  <button
                    className="auth-submit"
                    type="submit"
                    disabled={loading || (view === "forgot" && forgotCooldown > 0)}
                  >
                    {loading
                      ? "Procesando…"
                      : view === "forgot" && forgotCooldown > 0
                        ? `Reenviar en ${forgotCooldown} s`
                      : view === "login"
                        ? "Iniciar sesión →"
                        : view === "register"
                          ? "Enviar solicitud →"
                          : view === "forgot"
                            ? "Enviar instrucciones →"
                            : "Guardar contraseña →"}
                  </button>
                )}
                {view === "forgot" && (
                  <button
                    className="auth-link"
                    type="button"
                    disabled={loading}
                    onClick={() => switchView("login")}
                  >
                    Cancelar y volver al login
                  </button>
                )}
                {view === "reset" && !resetToken && (
                  <button
                    className="auth-link"
                    type="button"
                    disabled={loading}
                    onClick={() => switchView("forgot")}
                  >
                    Solicitar un nuevo enlace
                  </button>
                )}
                {view === "reset" && (resetSucceeded || !resetToken) && (
                  <button
                    className="auth-link"
                    type="button"
                    disabled={loading}
                    onClick={() => switchView("login")}
                  >
                    Iniciar sesión
                  </button>
                )}
                {view === "reset" && resetToken && !resetSucceeded && (
                  <button
                    className="auth-link"
                    type="button"
                    disabled={loading}
                    onClick={() => switchView("login")}
                  >
                    Cancelar y volver al login
                  </button>
                )}
              </form>
              <div className="auth-switch">
                {view === "login" ? (
                  <>
                    ¿Todavía no tienes cuenta?{" "}
                    <button
                      type="button"
                      onClick={() => switchView("register")}
                    >
                      Solicita tu inscripción
                    </button>
                  </>
                ) : (
                  <>
                    ¿Ya tienes una cuenta?{" "}
                    <button type="button" onClick={() => switchView("login")}>
                      Volver al inicio de sesión
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
      <footer className="login-page__footer">
        © {new Date().getFullYear()} Nexo · Educación con propósito
      </footer>
    </main>
  );
}
