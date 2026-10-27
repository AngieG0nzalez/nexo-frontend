import { useEffect, useState } from "react";
import { getTutorProfile, updateMyTutorProfile } from "../../api/tutor.api.js";

export default function TutorProfileCard() {
  const [tutor, setTutor] = useState(null);
  const [form, setForm] = useState({ specialty: "", bio: "", experience_years: 0 });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getTutorProfile()
      .then((data) => {
        if (!active) return;
        setTutor(data);
        setForm({
          specialty: data.specialty || "",
          bio: data.bio || "",
          experience_years: data.experience_years ?? 0,
        });
      })
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, []);

  async function save(event) {
    event.preventDefault();
    if (saving || !tutor) return;
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await updateMyTutorProfile(tutor.id, {
        specialty: form.specialty.trim(),
        bio: form.bio.trim(),
        experience_years: Number(form.experience_years) || 0,
      });
      setSuccess("Perfil docente actualizado.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <section className="nexo-card">
      <h2>Perfil docente</h2>
      <p className="muted">Esta información la ven los estudiantes.</p>
      {!tutor && !error && <p className="muted">Cargando…</p>}
      {tutor && (
        <form className="profile-page__form" onSubmit={save}>
          <label>
            Especialidad
            <input maxLength={100} value={form.specialty} onChange={set("specialty")} placeholder="Ej. Álgebra y geometría" />
          </label>
          <label>
            Años de experiencia
            <input type="number" min="0" max="80" value={form.experience_years} onChange={set("experience_years")} />
          </label>
          <label>
            Biografía
            <textarea rows={4} maxLength={1000} value={form.bio} onChange={set("bio")} />
          </label>
          {success && <p className="profile-page__success" role="status">{success}</p>}
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "Guardando…" : "Guardar perfil docente"}
          </button>
        </form>
      )}
      {error && <p className="error-message" role="alert">{error}</p>}
    </section>
  );
}
