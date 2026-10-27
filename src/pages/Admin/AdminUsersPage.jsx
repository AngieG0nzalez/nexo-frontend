import { useCallback, useEffect, useState } from "react";
import { searchUsers, updateUser } from "../../api/admin.api.js";
import "./Management.css";

const PAGE_SIZE = 20;
const roleLabels = { student: "Estudiante", tutor: "Tutor", admin: "Administrador" };

function EditForm({ user, onCancel, onSaved }) {
  const [form, setForm] = useState({
    name: user.name || "",
    grade: String(user.grade ?? ""),
    specialty: user.specialty || "",
    bio: user.bio || "",
    experience_years: String(user.experience_years ?? 0),
    tutor_is_active: user.tutor_is_active ?? true,
  });
  const [confirmGrade, setConfirmGrade] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const gradeChanged = user.role === "student" && Number(form.grade) !== user.grade;

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    setError("");
    const name = form.name.trim();
    if (name.length < 2) return setError("El nombre debe tener al menos 2 caracteres.");
    const payload = {};
    if (name !== user.name) payload.name = name;
    if (user.role === "student") {
      const grade = Number(form.grade);
      if (![9, 10, 11].includes(grade)) return setError("El grado debe ser 9, 10 u 11.");
      if (gradeChanged) {
        if (!confirmGrade)
          return setError("Confirma el cambio de grado para continuar.");
        payload.grade = grade;
      }
    }
    if (user.role === "tutor") {
      const years = Number(form.experience_years);
      if (!Number.isInteger(years) || years < 0 || years > 80)
        return setError("La experiencia debe ser un entero entre 0 y 80.");
      if (form.specialty.trim() !== (user.specialty || ""))
        payload.specialty = form.specialty.trim();
      if (form.bio.trim() !== (user.bio || "")) payload.bio = form.bio.trim();
      if (years !== (user.experience_years ?? 0)) payload.experience_years = years;
      if (form.tutor_is_active !== user.tutor_is_active)
        payload.tutor_is_active = form.tutor_is_active;
    }
    if (Object.keys(payload).length === 0) return setError("No hay cambios para guardar.");
    setSaving(true);
    try {
      const saved = await updateUser(user.id, payload);
      onSaved(saved);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="mgmt-form" onSubmit={submit}>
      <label>
        Nombre
        <input
          required
          maxLength={100}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </label>
      {user.role === "student" && (
        <>
          <label>
            Grado
            <select
              value={form.grade}
              onChange={(e) => {
                setForm({ ...form, grade: e.target.value });
                setConfirmGrade(false);
              }}
            >
              {[9, 10, 11].map((grade) => (
                <option key={grade} value={grade}>{grade}.º</option>
              ))}
            </select>
          </label>
          {gradeChanged && (
            <div className="mgmt-warning" role="note">
              Cambiar el grado no borra intentos ni progreso, pero el estudiante verá
              los temas del nuevo grado.
              <label>
                <input
                  type="checkbox"
                  checked={confirmGrade}
                  onChange={(e) => setConfirmGrade(e.target.checked)}
                  style={{ width: "auto", marginRight: 8 }}
                />
                Confirmo el cambio de grado
              </label>
            </div>
          )}
        </>
      )}
      {user.role === "tutor" && (
        <>
          <label>
            Especialidad
            <input
              maxLength={100}
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
            />
          </label>
          <label>
            Biografía
            <textarea
              rows={3}
              maxLength={1000}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </label>
          <label>
            Años de experiencia
            <input
              type="number"
              min="0"
              max="80"
              step="1"
              value={form.experience_years}
              onChange={(e) => setForm({ ...form, experience_years: e.target.value })}
            />
          </label>
          <label>
            <span>
              <input
                type="checkbox"
                checked={form.tutor_is_active}
                onChange={(e) => setForm({ ...form, tutor_is_active: e.target.checked })}
                style={{ width: "auto", marginRight: 8 }}
              />
              Perfil de tutor activo
            </span>
          </label>
        </>
      )}
      <p className="muted">
        El correo, el rol y la contraseña no se editan aquí.
      </p>
      {error && <p className="error-message" role="alert">{error}</p>}
      <div className="mgmt-actions">
        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
        <button className="secondary-button" type="button" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function AdminUsersPage() {
  const [filters, setFilters] = useState({ role: "", is_active: "", q: "" });
  const [applied, setApplied] = useState(filters);
  const [offset, setOffset] = useState(0);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState({ text: "", warning: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await searchUsers({
        ...applied,
        limit: PAGE_SIZE + 1,
        offset,
      });
      setUsers(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [applied, offset]);

  useEffect(() => {
    load();
  }, [load]);

  const hasNext = users.length > PAGE_SIZE;
  const visible = users.slice(0, PAGE_SIZE);

  return (
    <section>
      <header className="page-header">
        <p className="eyebrow">ADMINISTRACIÓN</p>
        <h1>Usuarios</h1>
        <p className="muted">Consulta, filtra y corrige los datos de estudiantes y tutores.</p>
      </header>
      <div className="nexo-card">
        <form
          className="mgmt-toolbar"
          onSubmit={(event) => {
            event.preventDefault();
            setOffset(0);
            setEditingId(null);
            setApplied({ ...filters, q: filters.q.trim() });
          }}
        >
          <label className="mgmt-field">
            Rol
            <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
              <option value="">Todos</option>
              <option value="student">Estudiantes</option>
              <option value="tutor">Tutores</option>
              <option value="admin">Administradores</option>
            </select>
          </label>
          <label className="mgmt-field">
            Estado
            <select value={filters.is_active} onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}>
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </label>
          <label className="mgmt-field mgmt-field--wide">
            Buscar por nombre o correo
            <input
              type="search"
              maxLength={100}
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
          </label>
          <button className="primary-button" type="submit">Filtrar</button>
        </form>
        {notice.text && <p className="mgmt-success" role="status">{notice.text}</p>}
        {notice.warning && <p className="mgmt-warning" role="note">{notice.warning}</p>}
        {loading && <p>Cargando usuarios…</p>}
        {error && <p className="error-message" role="alert">{error}</p>}
        {!loading && !error && visible.length === 0 && (
          <p className="muted">No hay usuarios con esos filtros.</p>
        )}
        {visible.map((user) => (
          <article className="mgmt-row" key={user.id}>
            <div>
              <strong>{user.name}</strong>{" "}
              <span className="mgmt-badge">{roleLabels[user.role] || user.role}</span>{" "}
              <span className={`mgmt-badge ${user.is_active ? "mgmt-badge--ok" : "mgmt-badge--off"}`}>
                {user.is_active ? "Activo" : "Inactivo"}
              </span>
              <p className="muted">{user.email}</p>
              {user.role === "student" && user.grade && <p>Grado: {user.grade}.º</p>}
              {user.role === "tutor" && (
                <p>
                  {user.specialty || "Sin especialidad"} · {user.experience_years ?? 0} años
                  {user.tutor_is_active === false && " · perfil de tutor inactivo"}
                </p>
              )}
            </div>
            {user.role !== "admin" && editingId !== user.id && (
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setEditingId(user.id);
                  setNotice({ text: "", warning: "" });
                }}
              >
                Editar datos
              </button>
            )}
            {editingId === user.id && (
              <div style={{ flexBasis: "100%" }}>
                <EditForm
                  user={user}
                  onCancel={() => setEditingId(null)}
                  onSaved={(saved) => {
                    setEditingId(null);
                    setNotice({
                      text: `Se actualizaron los datos de ${saved.name}.`,
                      warning: saved.warning || "",
                    });
                    load();
                  }}
                />
              </div>
            )}
          </article>
        ))}
        <div className="mgmt-pager">
          <button className="secondary-button" type="button" disabled={offset === 0 || loading}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>Anterior</button>
          <span className="muted">Página {offset / PAGE_SIZE + 1}</span>
          <button className="secondary-button" type="button" disabled={!hasNext || loading}
            onClick={() => setOffset(offset + PAGE_SIZE)}>Siguiente</button>
        </div>
      </div>
    </section>
  );
}
