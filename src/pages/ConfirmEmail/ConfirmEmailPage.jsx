import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { confirmEmailChange } from "../../api/account.api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "./ConfirmEmailPage.css";

export default function ConfirmEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const token = new URLSearchParams(location.search).get("token");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  async function confirm(event) {
    event.preventDefault();
    if (!token || loading || confirmed) return;
    setLoading(true);
    setError("");
    try {
      await confirmEmailChange(token);
      logout();
      setConfirmed(true);
      setSuccess("Correo confirmado. Inicia sesión nuevamente.");
    } catch (requestError) {
      setError(
        requestError.status === 400 || requestError.status === 409
          ? requestError.message
          : requestError.message || "No se pudo confirmar el correo.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="confirm-email-page">
      <section className="nexo-card confirm-email-page__card">
        <p className="eyebrow">SEGURIDAD DE LA CUENTA</p>
        <h1>Confirmar correo</h1>
        {!token && (
          <p className="error-message" role="alert">
            El enlace no contiene un token válido. Solicita un nuevo cambio de correo.
          </p>
        )}
        {error && <p className="error-message" role="alert">{error}</p>}
        {success && <p className="confirm-email-page__success" role="status">{success}</p>}
        {token && !confirmed && (
          <form onSubmit={confirm}>
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Confirmando…" : "Confirmar correo"}
            </button>
          </form>
        )}
        {(!token || error) && (
          <button
            className="secondary-button"
            type="button"
            onClick={() => navigate("/login", { replace: true })}
          >
            Volver al login
          </button>
        )}
        {confirmed && (
          <button
            className="primary-button"
            type="button"
            onClick={() => navigate("/login", { replace: true })}
          >
            Ir a iniciar sesión
          </button>
        )}
      </section>
    </main>
  );
}
