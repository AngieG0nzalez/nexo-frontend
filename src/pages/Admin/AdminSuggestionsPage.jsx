import { useCallback, useEffect, useState } from "react";
import { listAdminSuggestions, updateAdminSuggestion } from "../../api/admin.api.js";
import { formatDate } from "../../utils/learning.js";
import { categoryLabels, statusLabels } from "../Suggestions/SuggestionsPage.jsx";
import "./Management.css";

const PAGE_SIZE = 10;
const roleLabels = { student: "Estudiante", tutor: "Tutor" };

function SuggestionRow({ item, onSaved }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(item.status);
  const [note, setNote] = useState(item.admin_note || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const saved = await updateAdminSuggestion(item.id, {
        status,
        admin_note: note.trim() || null,
      });
      onSaved(saved);
      setOpen(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="mgmt-row">
      <div style={{ flex: 1 }}>
        <strong>{item.subject}</strong>{" "}
        <span className="mgmt-badge">{categoryLabels[item.category] || item.category}</span>{" "}
        <span className="mgmt-badge">{statusLabels[item.status] || item.status}</span>
        <p className="muted">
          {item.author_name} ({roleLabels[item.author_role] || item.author_role}) ·{" "}
          {formatDate(item.created_at)}
        </p>
        <p className="mgmt-prewrap">{item.message}</p>
        {item.admin_note && (
          <p className="mgmt-warning mgmt-prewrap"><strong>Nota:</strong> {item.admin_note}</p>
        )}
        {open && (
          <form className="mgmt-form" onSubmit={save}>
            <label>
              Estado
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label>
              Nota o respuesta (visible para el autor)
              <textarea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            {error && <p className="error-message" role="alert">{error}</p>}
            <div className="mgmt-actions">
              <button className="primary-button" type="submit" disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </button>
              <button className="secondary-button" type="button" onClick={() => setOpen(false)} disabled={saving}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
      {!open && (
        <button className="secondary-button" type="button" onClick={() => setOpen(true)}>
          Gestionar
        </button>
      )}
    </article>
  );
}

export default function AdminSuggestionsPage() {
  const [filters, setFilters] = useState({ status: "", category: "" });
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await listAdminSuggestions({ ...filters, limit: PAGE_SIZE, offset }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [filters, offset]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section>
      <header className="page-header">
        <p className="eyebrow">ADMINISTRACIÓN</p>
        <h1>Buzón de sugerencias</h1>
        <p className="muted">Revisa las sugerencias de estudiantes y tutores y cambia su estado.</p>
      </header>
      <div className="nexo-card">
        <div className="mgmt-toolbar">
          <label className="mgmt-field">
            Estado
            <select value={filters.status} onChange={(e) => { setOffset(0); setFilters({ ...filters, status: e.target.value }); }}>
              <option value="">Todos</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="mgmt-field">
            Categoría
            <select value={filters.category} onChange={(e) => { setOffset(0); setFilters({ ...filters, category: e.target.value }); }}>
              <option value="">Todas</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>
        {loading && <p>Cargando sugerencias…</p>}
        {error && <p className="error-message" role="alert">{error}</p>}
        {!loading && !error && data.items.length === 0 && (
          <p className="muted">No hay sugerencias con esos filtros.</p>
        )}
        {data.items.map((item) => (
          <SuggestionRow
            key={`${item.id}-${item.updated_at}`}
            item={item}
            onSaved={(saved) =>
              setData((current) => ({
                ...current,
                items: current.items.map((row) => (row.id === saved.id ? saved : row)),
              }))
            }
          />
        ))}
        <div className="mgmt-pager">
          <button className="secondary-button" type="button" disabled={offset === 0 || loading}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>Anterior</button>
          <span className="muted">{data.total} en total</span>
          <button className="secondary-button" type="button" disabled={offset + PAGE_SIZE >= data.total || loading}
            onClick={() => setOffset(offset + PAGE_SIZE)}>Siguiente</button>
        </div>
      </div>
    </section>
  );
}
