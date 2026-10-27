import { useCallback, useEffect, useState } from "react";
import {
  getUsers,
  setUserStatus,
  getRegistrationRequests,
  approveRegistrationRequest,
  rejectRegistrationRequest,
} from "../../api/admin.api.js";
import "./AdminPage.css";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const [usersResult, requestsResult] = await Promise.allSettled([
      getUsers(),
      getRegistrationRequests(),
    ]);

    if (usersResult.status === "fulfilled") {
      const data = usersResult.value;
      setUsers(Array.isArray(data) ? data : data?.items || []);
    } else {
      setError(usersResult.reason.message);
    }

    if (requestsResult.status === "fulfilled") {
      const data = requestsResult.value;
      setRequests(Array.isArray(data) ? data : data?.items || []);
    } else {
      setError((previous) =>
        [previous, requestsResult.reason.message].filter(Boolean).join(" | "),
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function runAction(key, action, successMessage) {
    setSaving(key);
    setError("");
    setMessage("");

    try {
      await action();
      setMessage(successMessage);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  }

  function approve(request) {
    if (!window.confirm(`¿Aprobar la solicitud de ${request.name}?`)) return;

    runAction(
      `request-${request.id}`,
      () => approveRegistrationRequest(request.id),
      "Solicitud aprobada correctamente.",
    );
  }

  function reject(request) {
    const reason = window.prompt("Motivo del rechazo:");

    if (reason === null) return;

    if (!reason.trim()) {
      setError("Debes indicar un motivo de rechazo.");
      return;
    }

    runAction(
      `request-${request.id}`,
      () => rejectRegistrationRequest(request.id, reason.trim()),
      "Solicitud rechazada correctamente.",
    );
  }

  function changeStatus(user) {
    const action = user.is_active ? "Desactivar" : "Activar";

    if (!window.confirm(`¿${action} la cuenta de ${user.name || user.email}?`))
      return;

    runAction(
      `user-${user.id}`,
      () => setUserStatus(user.id, !user.is_active),
      `Cuenta actualizada correctamente.`,
    );
  }

  return (
    <section>
      <header className="page-header">
        <p className="eyebrow">ADMINISTRACIÓN</p>
        <h1>Panel administrativo</h1>
        <p className="muted">
          Gestiona solicitudes de inscripción y usuarios de Nexo.
        </p>
      </header>

      {loading && <p>Cargando información…</p>}

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {message && (
        <p role="status" className="muted">
          {message}
        </p>
      )}

      <div className="nexo-card">
        <h2>Solicitudes de inscripción ({requests.length})</h2>

        {!loading && requests.length === 0 && (
          <p className="muted">No hay solicitudes pendientes.</p>
        )}

        <div className="nexo-list">
          {requests.map((request) => {
            const busy = saving === `request-${request.id}`;

            return (
              <div className="nexo-list__item" key={request.id}>
                <div>
                  <strong>
                    {request.name} {request.last_name}
                  </strong>

                  <p className="muted">{request.email}</p>

                  <p className="muted">
                    Rol solicitado:{" "}
                    {request.requested_role === "tutor"
                      ? "Tutor"
                      : "Estudiante"}
                  </p>

                  {request.grade != null && (
                    <p className="muted">Grado: {request.grade}</p>
                  )}

                  {request.specialty && (
                    <p className="muted">Especialidad: {request.specialty}</p>
                  )}

                  {request.message && (
                    <p className="muted">Mensaje: {request.message}</p>
                  )}
                </div>

                <div className="admin-actions">
                  <button
                    className="primary-button"
                    disabled={busy || saving !== null}
                    onClick={() => approve(request)}
                  >
                    {busy ? "Procesando…" : "Aprobar"}
                  </button>

                  <button
                    className="secondary-button"
                    disabled={busy || saving !== null}
                    onClick={() => reject(request)}
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="nexo-card">
        <h2>Usuarios registrados ({users.length})</h2>

        <div className="nexo-list">
          {users.map((user) => (
            <div className="nexo-list__item" key={user.id}>
              <div>
                <strong>{user.name || "Sin nombre"}</strong>

                <p className="muted">
                  {user.email} · {user.role} ·{" "}
                  {user.is_active ? "Activo" : "Inactivo"}
                </p>
              </div>

              <button
                className="secondary-button"
                disabled={saving !== null || user.role === "admin"}
                onClick={() => changeStatus(user)}
              >
                {saving === `user-${user.id}`
                  ? "Guardando…"
                  : user.is_active
                    ? "Desactivar"
                    : "Activar"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
