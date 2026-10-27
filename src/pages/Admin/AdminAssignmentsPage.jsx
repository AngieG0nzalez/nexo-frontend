import { useEffect, useState } from "react";
import {
  assignTutorSubject,
  getTutorSubjectsAdmin,
  removeTutorSubject,
  searchUsers,
} from "../../api/admin.api.js";
import { getSubjects } from "../../api/subjects.api.js";
import "./Management.css";

const asList = (value) => (Array.isArray(value) ? value : value?.items || []);

export default function AdminAssignmentsPage() {
  const [tutors, setTutors] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [tutorId, setTutorId] = useState("");
  const [assigned, setAssigned] = useState([]);
  const [newSubject, setNewSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([searchUsers({ role: "tutor", limit: 100 }), getSubjects()])
      .then(([users, subjectList]) => {
        if (!active) return;
        setTutors(asList(users).filter((user) => user.tutor_id));
        setSubjects(asList(subjectList));
      })
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!tutorId) {
      setAssigned([]);
      return undefined;
    }
    let active = true;
    setLoadingAssigned(true);
    setError("");
    getTutorSubjectsAdmin(tutorId)
      .then((data) => active && setAssigned(asList(data)))
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoadingAssigned(false));
    return () => {
      active = false;
    };
  }, [tutorId]);

  const assignedIds = new Set(assigned.map((item) => item.subject_id));
  const available = subjects.filter((item) => !assignedIds.has(item.id));

  async function reload() {
    setAssigned(asList(await getTutorSubjectsAdmin(tutorId)));
  }

  async function add(event) {
    event.preventDefault();
    if (!newSubject || busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await assignTutorSubject(tutorId, Number(newSubject));
      setNewSubject("");
      setSuccess("Materia asignada.");
      await reload();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(item) {
    if (busy) return;
    if (!window.confirm(`¿Retirar «${item.name} · ${item.grade}.º» a este tutor? No se borrará contenido.`))
      return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await removeTutorSubject(tutorId, item.subject_id);
      setSuccess("Materia retirada.");
      await reload();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <header className="page-header">
        <p className="eyebrow">ADMINISTRACIÓN</p>
        <h1>Asignación de materias</h1>
        <p className="muted">
          Define qué materias puede gestionar cada tutor. Retirar una materia no borra temas,
          clases ni preguntas.
        </p>
      </header>
      <div className="nexo-card">
        {loading && <p>Cargando…</p>}
        {!loading && (
          <label className="mgmt-field">
            Tutor
            <select
              value={tutorId}
              onChange={(e) => {
                setTutorId(e.target.value);
                setSuccess("");
                setError("");
                setNewSubject("");
              }}
            >
              <option value="">Selecciona un tutor</option>
              {tutors.map((tutor) => (
                <option key={tutor.tutor_id} value={tutor.tutor_id}>
                  {tutor.name}
                  {tutor.tutor_is_active === false ? " (inactivo)" : ""}
                </option>
              ))}
            </select>
          </label>
        )}
        {error && <p className="error-message" role="alert">{error}</p>}
        {success && <p className="mgmt-success" role="status">{success}</p>}
        {tutorId && (
          <>
            <h2 style={{ marginTop: 20 }}>Materias asignadas</h2>
            {loadingAssigned && <p>Cargando materias…</p>}
            {!loadingAssigned && assigned.length === 0 && (
              <p className="muted">Este tutor no tiene materias asignadas.</p>
            )}
            <div>
              {assigned.map((item) => (
                <span className="mgmt-subject-chip mgmt-badge" key={item.subject_id}>
                  {item.name} · {item.grade}.º
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={busy}
                    onClick={() => remove(item)}
                    aria-label={`Retirar ${item.name} ${item.grade}`}
                  >
                    Retirar
                  </button>
                </span>
              ))}
            </div>
            <form className="mgmt-toolbar" onSubmit={add}>
              <label className="mgmt-field mgmt-field--wide">
                Agregar materia
                <select value={newSubject} onChange={(e) => setNewSubject(e.target.value)}>
                  <option value="">Selecciona una materia</option>
                  {available.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {item.grade}.º
                    </option>
                  ))}
                </select>
              </label>
              <button className="primary-button" type="submit" disabled={!newSubject || busy}>
                {busy ? "Procesando…" : "Asignar"}
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
