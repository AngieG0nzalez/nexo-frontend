import { useEffect, useState } from "react";
import {
  createTopicExercise,
  deleteTopicExercise,
  getTopicExercisesForTutor,
} from "../../api/topics.api.js";

const difficultyLabels = { easy: "Fácil", medium: "Media", hard: "Difícil" };
const normalize = (text) => text.split(/\s+/).join(" ").trim().toLowerCase();
const emptyOptions = () =>
  [0, 1, 2, 3].map((index) => ({ option_text: "", is_correct: index === 0 }));
const emptyForm = () => ({
  statement: "",
  difficulty: "medium",
  explanation: "",
  options: emptyOptions(),
});

export default function TutorQuestionsPanel({ topic }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [deleting, setDeleting] = useState(null);

  async function load() {
    const data = await getTopicExercisesForTutor(topic.id);
    setQuestions(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    getTopicExercisesForTutor(topic.id)
      .then((data) => active && setQuestions(Array.isArray(data) ? data : []))
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [topic.id]);

  const duplicate = form.statement.trim().length >= 5
    ? questions.find((q) => normalize(q.statement) === normalize(form.statement))
    : null;

  function setOption(index, patch) {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, i) =>
        i === index ? { ...option, ...patch } : option,
      ),
    }));
  }

  function markCorrect(index) {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, i) => ({
        ...option,
        is_correct: i === index,
      })),
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setFormError("");
    setSuccess("");
    const options = form.options.map((option) => ({
      ...option,
      option_text: option.option_text.trim(),
    }));
    if (duplicate) {
      setFormError("Ya existe una pregunta con ese enunciado en este tema.");
      return;
    }
    if (options.some((option) => !option.option_text)) {
      setFormError("Todas las opciones deben tener texto.");
      return;
    }
    if (new Set(options.map((o) => normalize(o.option_text))).size !== options.length) {
      setFormError("Las opciones no pueden repetirse.");
      return;
    }
    setSaving(true);
    try {
      await createTopicExercise(topic.id, {
        statement: form.statement.trim(),
        difficulty: form.difficulty,
        explanation: form.explanation.trim() || null,
        options,
      });
      setForm(emptyForm());
      setShowForm(false);
      setSuccess("La pregunta se agregó.");
      try {
        await load();
      } catch (refreshError) {
        setError(`Se guardó, pero no se pudo actualizar la lista: ${refreshError.message}`);
      }
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(question) {
    const confirmed = window.confirm(
      "¿Eliminar esta pregunta? Dejará de mostrarse a los estudiantes y es contenido compartido de la materia.",
    );
    if (!confirmed) return;
    setDeleting(question.id);
    setError("");
    setSuccess("");
    try {
      await deleteTopicExercise(topic.id, question.id);
      setQuestions((current) => current.filter((q) => q.id !== question.id));
      setSuccess("La pregunta se eliminó.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeleting(null);
    }
  }

  const filtered = questions.filter((q) =>
    normalize(q.statement).includes(normalize(search)),
  );

  return (
    <div className="tutor-questions">
      <div className="tutor-section-heading">
        <h4>Preguntas del tema ({questions.length})</h4>
        <button
          className="primary-button"
          type="button"
          onClick={() => setShowForm((value) => !value)}
        >
          {showForm ? "Cerrar formulario" : "Agregar pregunta"}
        </button>
      </div>
      <div className="tutor-shared-warning" role="note">
        Las preguntas son contenido compartido: las ven todos los estudiantes y tutores de la materia.
      </div>
      {loading && <p>Cargando preguntas…</p>}
      {error && <p className="error-message" role="alert">{error}</p>}
      {success && <p className="tutor-management-success" role="status">{success}</p>}

      {showForm && (
        <form className="tutor-management-form" onSubmit={submit}>
          <label>
            Enunciado
            <textarea
              required
              rows={2}
              minLength={5}
              maxLength={1000}
              value={form.statement}
              onChange={(event) => setForm({ ...form, statement: event.target.value })}
            />
          </label>
          {duplicate && (
            <p className="error-message" role="alert">
              Esta pregunta ya existe en el tema (#{duplicate.id}).
            </p>
          )}
          <label>
            Dificultad
            <select
              value={form.difficulty}
              onChange={(event) => setForm({ ...form, difficulty: event.target.value })}
            >
              {Object.entries(difficultyLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <fieldset className="tutor-question-options">
            <legend>Cuatro opciones (marca la correcta)</legend>
            {form.options.map((option, index) => (
              <div className="tutor-question-options__row" key={index}>
                <input
                  type="radio"
                  name={`correct-${topic.id}`}
                  checked={option.is_correct}
                  onChange={() => markCorrect(index)}
                  aria-label={`Opción ${index + 1} correcta`}
                />
                <input
                  required
                  maxLength={300}
                  placeholder={`Opción ${index + 1}`}
                  value={option.option_text}
                  onChange={(event) => setOption(index, { option_text: event.target.value })}
                />
              </div>
            ))}
          </fieldset>
          <label>
            Explicación (opcional)
            <textarea
              rows={2}
              maxLength={1000}
              value={form.explanation}
              onChange={(event) => setForm({ ...form, explanation: event.target.value })}
            />
          </label>
          {formError && <p className="error-message" role="alert">{formError}</p>}
          <button className="primary-button" type="submit" disabled={saving || !!duplicate}>
            {saving ? "Guardando…" : "Guardar pregunta"}
          </button>
        </form>
      )}

      {!loading && questions.length > 0 && (
        <label className="tutor-management-form__field">
          Buscar en las preguntas
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      )}
      {!loading && !error && questions.length === 0 && (
        <p className="muted">Este tema aún no tiene preguntas.</p>
      )}
      <ul className="tutor-question-list">
        {filtered.map((question) => (
          <li key={question.id}>
            <div>
              <strong>{question.statement}</strong>
              <small className="muted">
                {" "}· {difficultyLabels[question.difficulty] || question.difficulty}
              </small>
              <ul>
                {question.options.map((option) => (
                  <li key={option.id}>
                    {option.is_correct ? "✓ " : "• "}
                    {option.option_text}
                  </li>
                ))}
              </ul>
            </div>
            <button
              className="secondary-button"
              type="button"
              disabled={deleting === question.id}
              onClick={() => remove(question)}
            >
              {deleting === question.id ? "Eliminando…" : "Eliminar"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
