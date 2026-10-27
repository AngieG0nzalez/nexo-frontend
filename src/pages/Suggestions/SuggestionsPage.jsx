import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createSuggestion, getMySuggestions } from "../../api/suggestions.api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { formatDate } from "../../utils/learning.js";
import "../Admin/Management.css";

export const categoryLabels = {
  content: "Contenido",
  usability: "Usabilidad",
  bug: "Error",
  other: "Otro",
};
export const statusLabels = {
  new: "Nueva",
  in_review: "En revisión",
  resolved: "Resuelta",
  rejected: "Rechazada",
};
const PAGE_SIZE = 10;

export default function SuggestionsPage({ mode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const base = user?.role === "tutor" ? "/tutor/suggestions" : "/suggestions";
  const [form, setForm] = useState({ category: "content", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(mode === "mine");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMySuggestions(PAGE_SIZE, offset);
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [offset]);

  useEffect(() => {
    if (mode === "mine") load();
  }, [mode, load]);

  async function submit(event) {
    event.preventDefault();
    if (sending) return;
    setFormError("");
    const subject = form.subject.trim();
    const message = form.message.trim();
    if (subject.length < 3 || message.length < 10) {
      setFormError("El asunto necesita 3 caracteres y el mensaje al menos 10.");
      return;
    }
    setSending(true);
    try {
      await createSuggestion({ category: form.category, subject, message });
      navigate(base, { state: { sent: true } });
    } catch (requestError) {
      setFormError(requestError.message);
      setSending(false);
    }
  }

  return (
    <section>
      <header className="page-header">
        <p className="eyebrow">TU OPINIÓN</p>
        <h1>{mode === "new" ? "Enviar sugerencia" : "Mis sugerencias"}</h1>
        <p className="muted">
          Cuéntanos qué mejorar. El equipo administrativo las revisa; no se envían correos de
          notificación.
        </p>
      </header>
      <div className="nexo-card">
        {mode === "new" ? (
          <form className="mgmt-form" onSubmit={submit}>
            <label>
              Categoría
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label>
              Asunto
              <input
                required
                minLength={3}
                maxLength={150}
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </label>
            <label>
              Mensaje
              <textarea
                required
                rows={6}
                minLength={10}
                maxLength={2000}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
              <small className="muted">{form.message.length}/2000</small>
            </label>
            {formError && <p className="error-message" role="alert">{formError}</p>}
            <div className="mgmt-actions">
              <button className="primary-button" type="submit" disabled={sending}>
                {sending ? "Enviando…" : "Enviar sugerencia"}
              </button>
              <Link to={base}>Ver mis sugerencias</Link>
            </div>
          </form>
        ) : (
          <>
            <SentNotice />
            {loading && <p>Cargando sugerencias…</p>}
            {error && <p className="error-message" role="alert">{error}</p>}
            {!loading && !error && items.length === 0 && (
              <p className="muted">
                Aún no has enviado sugerencias. <Link to={`${base}/new`}>Enviar una</Link>
              </p>
            )}
            {items.map((item) => (
              <article className="mgmt-row" key={item.id}>
                <div style={{ flex: 1 }}>
                  <strong>{item.subject}</strong>{" "}
                  <span className="mgmt-badge">{categoryLabels[item.category] || item.category}</span>{" "}
                  <span className="mgmt-badge">{statusLabels[item.status] || item.status}</span>
                  <p className="mgmt-prewrap">{item.message}</p>
                  {item.admin_note && (
                    <p className="mgmt-warning mgmt-prewrap">
                      <strong>Respuesta del equipo:</strong> {item.admin_note}
                    </p>
                  )}
                  <small className="muted">Enviada: {formatDate(item.created_at)}</small>
                </div>
              </article>
            ))}
            <div className="mgmt-pager">
              <button className="secondary-button" type="button" disabled={offset === 0 || loading}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>Anterior</button>
              <span className="muted">{total} en total</span>
              <button className="secondary-button" type="button" disabled={offset + PAGE_SIZE >= total || loading}
                onClick={() => setOffset(offset + PAGE_SIZE)}>Siguiente</button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function SentNotice() {
  const { state } = useLocation();
  return state?.sent ? (
    <p className="mgmt-success" role="status">Tu sugerencia fue enviada. ¡Gracias!</p>
  ) : null;
}
