import { useEffect, useState } from "react";
import {
  createTutorClass,
  getClassStudents,
  getTutorClasses,
  getTutorProfile,
  getTutorSubjects,
  getTutorSummary,
  updateTutorClass,
} from "../../api/tutor.api.js";
import { formatDate } from "../../utils/learning.js";
import TutorTopicsManager from "./TutorTopicsManager.jsx";
import "./TutorPage.css";

const asList = (value) => (Array.isArray(value) ? value : value?.items || []);

const statusLabels = {
  scheduled: "Programada",
  completed: "Completada",
  cancelled: "Cancelada",
  pending: "Pendiente",
  confirmed: "Confirmada",
  active: "Activa",
};
const statusLabel = (value) => statusLabels[value] || value || "—";

const summaryFields = [
  ["total_classes", "Clases totales"],
  ["scheduled_classes", "Programadas"],
  ["completed_classes", "Completadas"],
  ["cancelled_classes", "Canceladas"],
  ["total_enrollments", "Inscripciones"],
  ["total_subjects", "Materias asignadas"],
];

const emptyClassForm = {
  subject_id: "",
  title: "",
  description: "",
  date_time: "",
  duration_minutes: "60",
  price: "0",
};

function localDateTimeValue(value) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function TutorPage() {
  const [tab, setTab] = useState("summary");
  const [profile, setProfile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [openClass, setOpenClass] = useState(null);
  const [students, setStudents] = useState({ loading: false, error: "", list: [] });
  const [classForm, setClassForm] = useState(emptyClassForm);
  const [editingClass, setEditingClass] = useState(null);
  const [classSaving, setClassSaving] = useState(false);
  const [classFormError, setClassFormError] = useState("");
  const [classFormSuccess, setClassFormSuccess] = useState("");

  useEffect(() => {
    let live = true;
    Promise.allSettled([
      getTutorProfile(),
      getTutorClasses(),
      getTutorSummary(),
      getTutorSubjects(),
    ])
      .then(([p, c, s, sub]) => {
        if (!live) return;
        const next = {};
        if (p.status === "fulfilled") setProfile(p.value);
        else next.profile = p.reason.message;
        if (c.status === "fulfilled") setClasses(asList(c.value));
        else next.classes = c.reason.message;
        if (s.status === "fulfilled") setSummary(s.value);
        else next.summary = s.reason.message;
        if (sub.status === "fulfilled") setSubjects(asList(sub.value));
        else next.subjects = sub.reason.message;
        setErrors(next);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  const subjectsById = new Map(subjects.map((item) => [item.id, item]));

  async function refreshPanelData() {
    const [classResult, summaryResult] = await Promise.all([
      getTutorClasses(),
      getTutorSummary(),
    ]);
    setClasses(asList(classResult));
    setSummary(summaryResult);
  }

  function startClassEdit(item) {
    setEditingClass(item.id);
    setClassForm({
      subject_id: String(item.subject_id),
      title: item.title || "",
      description: item.description || "",
      date_time: localDateTimeValue(item.date_time),
      duration_minutes: String(item.duration_minutes),
      price: String(item.price),
    });
    setClassFormError("");
    setClassFormSuccess("");
  }

  function cancelClassEdit() {
    setEditingClass(null);
    setClassForm(emptyClassForm);
    setClassFormError("");
  }

  async function submitClass(event) {
    event.preventDefault();
    setClassFormError("");
    setClassFormSuccess("");
    if (!profile || subjects.length === 0) return;
    if (!classForm.subject_id || !classForm.date_time) {
      setClassFormError("Selecciona una materia y una fecha para la clase.");
      return;
    }
    const date = new Date(classForm.date_time);
    const duration = Number(classForm.duration_minutes);
    const price = Number(classForm.price);
    if (
      Number.isNaN(date.getTime()) ||
      !Number.isInteger(duration) ||
      duration <= 0 ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      setClassFormError("Revisa la fecha, duración y precio ingresados.");
      return;
    }
    setClassSaving(true);
    const payload = {
      subject_id: Number(classForm.subject_id),
      title: classForm.title.trim(),
      description: classForm.description.trim() ||
        (editingClass ? "" : null),
      date_time: date.toISOString(),
      duration_minutes: duration,
      price,
    };
    try {
      if (editingClass) {
        await updateTutorClass(editingClass, payload);
      } else {
        await createTutorClass({
          ...payload,
          tutor_id: profile.id,
        });
      }
      const savedMessage = editingClass
        ? "La clase se actualizó."
        : "La clase se creó.";
      cancelClassEdit();
      setClassFormSuccess(savedMessage);
      try {
        await refreshPanelData();
      } catch (refreshError) {
        setClassFormError(
          `La operación se guardó, pero no se pudo actualizar la lista: ${refreshError.message}`,
        );
      }
    } catch (error) {
      setClassFormError(error.message);
    } finally {
      setClassSaving(false);
    }
  }

  async function toggleStudents(classId) {
    if (openClass === classId) {
      setOpenClass(null);
      return;
    }
    setOpenClass(classId);
    setStudents({ loading: true, error: "", list: [] });
    try {
      const data = await getClassStudents(classId);
      setStudents({ loading: false, error: "", list: asList(data) });
    } catch (err) {
      setStudents({
        loading: false,
        error:
          err.status === 404
            ? "No se encontró esta clase entre tus clases."
            : err.message,
        list: [],
      });
    }
  }

  return (
    <section className="tutor-page">
      <header className="page-header">
        <p className="eyebrow">ESPACIO DEL TUTOR</p>
        <h1>Tu panel de tutoría</h1>
        <p className="muted">
          Consulta tus estadísticas, materias, clases y estudiantes inscritos.
        </p>
      </header>
      <nav className="tutor-tabs" role="tablist" aria-label="Secciones del panel">
        {[
          ["summary", "Resumen"],
          ["classes", "Clases"],
          ["content", "Temas y preguntas"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>
      {loading && <p>Cargando panel…</p>}
      {errors.profile && (
        <div className="error-message" role="alert">
          {errors.profile}
        </div>
      )}

      {tab === "summary" && profile && (
        <div className="nexo-card">
          <h2>{profile.name}</h2>
          <p className="muted">{profile.bio || "Tutor de matemáticas"}</p>
          <p>
            <strong>Especialidad:</strong> {profile.specialty || "Sin especificar"}
          </p>
          <p>
            <strong>Experiencia:</strong> {profile.experience_years ?? "—"} años
          </p>
        </div>
      )}

      {tab === "summary" && !loading && (
        <section aria-labelledby="tutor-summary">
          <h2 id="tutor-summary" className="tutor-page__heading">Resumen</h2>
          {errors.summary && (
            <div className="error-message" role="alert">
              No se pudo cargar el resumen: {errors.summary}
            </div>
          )}
          {summary && (
            <div className="tutor-page__stats">
              {summaryFields
                .filter(([key]) => summary[key] !== undefined && summary[key] !== null)
                .map(([key, label]) => (
                  <article className="progress-stat" key={key}>
                    <strong>{summary[key]}</strong>
                    <span>{label}</span>
                  </article>
                ))}
            </div>
          )}
        </section>
      )}

      {tab === "summary" && !loading && (
        <div className="nexo-card">
          <h2>Materias asignadas</h2>
          {errors.subjects && (
            <div className="error-message" role="alert">
              {errors.subjects}
            </div>
          )}
          {!errors.subjects && subjects.length === 0 && (
            <p className="muted">Aún no tienes materias asignadas.</p>
          )}
          <ul className="tutor-page__subjects">
            {subjects.map((item) => (
              <li key={item.id}>
                {item.name} · Grado {item.grade}°
              </li>
            ))}
          </ul>
          <p className="muted tutor-page__note">
            La asignación de materias la gestiona administración.
          </p>
        </div>
      )}

      {tab === "classes" && !loading && (
        <div className="nexo-card">
          <div className="tutor-section-heading">
            <h2>Mis clases ({classes.length})</h2>
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                cancelClassEdit();
                setClassFormSuccess("");
                document.getElementById("tutor-class-form")?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }}
              disabled={!subjects.length}
            >
              Crear clase
            </button>
          </div>
          {!subjects.length && (
            <p className="muted">
              No puedes crear clases hasta que administración te asigne materias.
            </p>
          )}
          {classFormSuccess && (
            <p className="tutor-management-success" role="status">{classFormSuccess}</p>
          )}
          <form id="tutor-class-form" className="tutor-management-form" onSubmit={submitClass}>
            <h3>{editingClass ? "Editar clase" : "Crear clase"}</h3>
            <label>
              Materia
              <select
                required
                value={classForm.subject_id}
                onChange={(event) =>
                  setClassForm({ ...classForm, subject_id: event.target.value })
                }
                disabled={!subjects.length}
              >
                <option value="">Selecciona una materia asignada</option>
                {subjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · Grado {item.grade}°
                  </option>
                ))}
              </select>
            </label>
            <label>
              Título
              <input
                required
                minLength={1}
                maxLength={100}
                value={classForm.title}
                onChange={(event) =>
                  setClassForm({ ...classForm, title: event.target.value })
                }
              />
            </label>
            <label>
              Descripción
              <textarea
                rows={2}
                value={classForm.description}
                onChange={(event) =>
                  setClassForm({ ...classForm, description: event.target.value })
                }
              />
            </label>
            <label>
              Fecha y hora
              <input
                type="datetime-local"
                required
                value={classForm.date_time}
                onChange={(event) =>
                  setClassForm({ ...classForm, date_time: event.target.value })
                }
              />
            </label>
            <label>
              Duración (minutos)
              <input
                type="number"
                min="1"
                step="1"
                required
                value={classForm.duration_minutes}
                onChange={(event) =>
                  setClassForm({ ...classForm, duration_minutes: event.target.value })
                }
              />
            </label>
            <label>
              Precio
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={classForm.price}
                onChange={(event) =>
                  setClassForm({ ...classForm, price: event.target.value })
                }
              />
            </label>
            {classFormError && <p className="error-message" role="alert">{classFormError}</p>}
            <div className="tutor-management-form__actions">
              <button
                className="primary-button"
                type="submit"
                disabled={classSaving || !subjects.length}
              >
                {classSaving ? "Guardando…" : editingClass ? "Guardar cambios" : "Crear clase"}
              </button>
              {editingClass && (
                <button className="secondary-button" type="button" onClick={cancelClassEdit}>
                  Cancelar edición
                </button>
              )}
            </div>
          </form>
          {errors.classes && (
            <div className="error-message" role="alert">
              {errors.classes}
            </div>
          )}
          {!errors.classes && classes.length === 0 && (
            <p className="muted">No hay clases para mostrar.</p>
          )}
          {classes.map((item) => {
            const subject = subjectsById.get(item.subject_id);
            const date = formatDate(item.date_time);
            const isOpen = openClass === item.id;
            return (
              <div className="tutor-class" key={item.id}>
                <div className="nexo-list__item">
                  <div>
                    <strong>{item.title}</strong>
                    <p className="muted">
                      {statusLabel(item.status)}
                      {date && ` · ${date}`}
                      {item.duration_minutes ? ` · ${item.duration_minutes} min` : ""}
                      {subject && ` · ${subject.name} ${subject.grade}°`}
                    </p>
                  </div>
                  <button
                    className="secondary-button"
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => toggleStudents(item.id)}
                  >
                    {isOpen ? "Ocultar estudiantes" : "Ver estudiantes"}
                  </button>
                  {item.status === "scheduled" && (
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => startClassEdit(item)}
                    >
                      Editar
                    </button>
                  )}
                </div>
                {isOpen && (
                  <div className="tutor-class__students">
                    {students.loading && <p>Cargando estudiantes…</p>}
                    {students.error && (
                      <div className="error-message" role="alert">
                        {students.error}
                      </div>
                    )}

                    {!students.loading &&
                      !students.error &&
                      students.list.length === 0 && (
                        <p className="muted">Esta clase aún no tiene estudiantes inscritos.</p>
                      )}
                    <ul>
                      {students.list.map((student) => (
                        <li key={student.enrollment_id}>
                          <strong>{student.name}</strong>
                          <span className="muted">
                            {" "}
                            · Inscripción: {statusLabel(student.enrollment_status)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="muted tutor-page__note">
                      El progreso académico individual estará disponible cuando
                      exista un endpoint autorizado.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {tab === "content" && !loading && <TutorTopicsManager subjects={subjects} />}
    </section>
  );
}
