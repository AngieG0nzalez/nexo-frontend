import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  changeMyPassword,
  requestMyEmailChange,
  updateMyName,
} from "../../api/account.api.js";
import { getCurrentUser } from "../../api/auth.api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "./ProfilePage.css";
import TutorProfileCard from "./TutorProfileCard.jsx";

const roleLabels = {
  student: "Estudiante",
  tutor: "Tutor",
  admin: "Administración",
};

function getEmailError(error) {
  if (error.status === 400) return "La contraseña actual es incorrecta.";
  if (error.status === 409) return "Ese correo no está disponible.";
  if (error.status === 429)
    return "Has realizado demasiadas solicitudes. Inténtalo más tarde.";
  if (error.status === 503)
    return "El servicio de correo no está disponible en este momento.";
  return error.message || "No se pudo solicitar el cambio de correo.";
}

export default function ProfilePage() {
  const { logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");
  const [requestingEmail, setRequestingEmail] = useState(false);

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((data) => {
        if (active) {
          setProfile(data);
          setName(data.name || "");
        }
      })
      .catch((error) => {
        if (active) setProfileError(error.message);
      })
      .finally(() => {
        if (active) setLoadingProfile(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function saveName(event) {
    event.preventDefault();
    setNameError("");
    setNameSuccess("");
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setNameError("El nombre debe tener entre 2 y 100 caracteres.");
      return;
    }
    setSavingName(true);
    try {
      await updateMyName(profile.id, trimmedName);
      const updatedProfile = await refreshUser();
      setProfile(updatedProfile);
      setName(updatedProfile.name);
      setNameSuccess("Tu nombre se actualizó correctamente.");
    } catch (error) {
      setNameError(error.message || "No se pudo actualizar tu nombre.");
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    setPasswordError("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Completa todos los campos de contraseña.");
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      setPasswordError("La nueva contraseña debe tener entre 8 y 128 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas nuevas no coinciden.");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError("La nueva contraseña debe ser distinta de la actual.");
      return;
    }
    setChangingPassword(true);
    try {
      await changeMyPassword(currentPassword, newPassword, confirmPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      logout();
      navigate("/login", {
        replace: true,
        state: {
          notice: "La contraseña se actualizó. Inicia sesión nuevamente.",
        },
      });
    } catch (error) {
      setPasswordError(error.message || "No se pudo cambiar la contraseña.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setChangingPassword(false);
    }
  }

  async function submitEmailChange(event) {
    event.preventDefault();
    setEmailError("");
    setEmailSuccess("");
    const trimmedEmail = newEmail.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setEmailError("Escribe un correo electrónico válido.");
      return;
    }
    if (trimmedEmail.toLowerCase() === profile.email.toLowerCase()) {
      setEmailError("El nuevo correo debe ser diferente del actual.");
      return;
    }
    if (!emailPassword) {
      setEmailError("Ingresa tu contraseña actual.");
      return;
    }
    setRequestingEmail(true);
    try {
      await requestMyEmailChange(trimmedEmail, emailPassword);
      setEmailSuccess(
        "Si la solicitud pudo procesarse, revisa el nuevo correo y sigue el enlace de confirmación.",
      );
      setNewEmail("");
      setEmailPassword("");
    } catch (error) {
      setEmailError(getEmailError(error));
      setEmailPassword("");
    } finally {
      setRequestingEmail(false);
    }
  }

  if (loadingProfile) return <div className="screen-status">Cargando tu perfil…</div>;
  if (profileError) {
    return (
      <section className="profile-page">
        <p className="error-message" role="alert">{profileError}</p>
      </section>
    );
  }
  if (!profile) return null;

  return (
    <section className="profile-page">
      <header className="page-header">
        <p className="eyebrow">CUENTA</p>
        <h1>Mi perfil</h1>
        <p className="muted">Administra tus datos y la seguridad de tu cuenta.</p>
      </header>

      <section className="nexo-card">
        <h2>Datos personales</h2>
        <div className="profile-page__details">
          <p><span>Correo</span><strong>{profile.email}</strong></p>
          <p><span>Rol</span><strong>{roleLabels[profile.role] || "Usuario"}</strong></p>
          {profile.role === "student" && profile.grade != null && (
            <p><span>Grado</span><strong>{profile.grade}°</strong></p>
          )}
        </div>
        <form className="profile-page__form" onSubmit={saveName}>
          <label className="nexo-label profile-page__field">
            Nombre
            <input
              autoComplete="name"
              maxLength={100}
              minLength={2}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          {nameError && <p className="error-message" role="alert">{nameError}</p>}
          {nameSuccess && <p className="profile-page__success" role="status">{nameSuccess}</p>}
          <button className="primary-button" type="submit" disabled={savingName}>
            {savingName ? "Guardando…" : "Guardar nombre"}
          </button>
        </form>
      </section>

      <section className="nexo-card">
        <h2>Cambiar contraseña</h2>
        <form className="profile-page__form" onSubmit={savePassword}>
          <label className="nexo-label profile-page__field">
            Contraseña actual
            <input
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </label>
          <label className="nexo-label profile-page__field">
            Nueva contraseña
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>
          <label className="nexo-label profile-page__field">
            Confirmar nueva contraseña
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
          {passwordError && <p className="error-message" role="alert">{passwordError}</p>}
          <button className="primary-button" type="submit" disabled={changingPassword}>
            {changingPassword ? "Actualizando…" : "Cambiar contraseña"}
          </button>
        </form>
      </section>

      {profile.role === "tutor" && <TutorProfileCard />}

      <section className="nexo-card">
        <h2>Solicitar cambio de correo</h2>
        <p className="muted">Correo actual: {profile.email}</p>
        <form className="profile-page__form" onSubmit={submitEmailChange}>
          <label className="nexo-label profile-page__field">
            Nuevo correo
            <input
              type="email"
              autoComplete="email"
              required
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
            />
          </label>
          <label className="nexo-label profile-page__field">
            Contraseña actual
            <input
              type="password"
              autoComplete="current-password"
              required
              value={emailPassword}
              onChange={(event) => setEmailPassword(event.target.value)}
            />
          </label>
          {emailError && <p className="error-message" role="alert">{emailError}</p>}
          {emailSuccess && <p className="profile-page__success" role="status">{emailSuccess}</p>}
          <button className="primary-button" type="submit" disabled={requestingEmail}>
            {requestingEmail ? "Enviando solicitud…" : "Solicitar cambio"}
          </button>
        </form>
      </section>
    </section>
  );
}
