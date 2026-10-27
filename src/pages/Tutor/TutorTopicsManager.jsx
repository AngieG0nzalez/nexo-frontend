import { useRef, useState } from "react";
import {
  createTopic,
  getTopics,
  updateTopic,
} from "../../api/topics.api.js";
import TutorQuestionsPanel from "./TutorQuestionsPanel.jsx";

const asList = (value) => (Array.isArray(value) ? value : value?.items || []);
const emptyForm = { name: "", description: "", order_number: "1" };

export default function TutorTopicsManager({ subjects }) {
  const [subjectId, setSubjectId] = useState("");
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [confirmedSharedEdit, setConfirmedSharedEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [questionsTopicId, setQuestionsTopicId] = useState(null);
  const requestId = useRef(0);

  async function selectSubject(nextId) {
    const request = ++requestId.current;
    setSubjectId(nextId);
    setTopics([]);
    setSearch("");
    setError("");
    setFormError("");
    setSuccess("");
    setEditingId(null);
    setQuestionsTopicId(null);
    setForm(emptyForm);
    if (!nextId) return;
    setLoading(true);
    try {
      const data = await getTopics(nextId);
      if (request === requestId.current)
        setTopics(asList(data).sort((a, b) => a.order_number - b.order_number));
    } catch (requestError) {
      if (request === requestId.current) setError(requestError.message);
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  }

  async function saveTopic(event) {
    event.preventDefault();
    setFormError("");
    setSuccess("");
    if (editingId && !confirmedSharedEdit) {
      setFormError("Confirma que comprendes que el tema es compartido.");
      return;
    }
    const name = form.name.trim();
    const orderNumber = Number(form.order_number);
    if (
      name.length < 2 ||
      name.length > 150 ||
      !Number.isInteger(orderNumber) ||
      orderNumber < 1
    ) {
      setFormError(
        "El nombre debe tener 2–150 caracteres y el orden debe ser un entero positivo.",
      );
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        description: form.description.trim() || null,
        order_number: orderNumber,
      };
      if (editingId) {
        await updateTopic(editingId, payload);
      } else {
        await createTopic({ ...payload, subject_id: Number(subjectId) });
      }
      const savedMessage = editingId ? "El tema se actualizó." : "El tema se creó.";
      setEditingId(null);
      setForm(emptyForm);
      setConfirmedSharedEdit(false);
      setSuccess(savedMessage);
      try {
        const data = await getTopics(subjectId);
        setTopics(asList(data).sort((a, b) => a.order_number - b.order_number));
      } catch (refreshError) {
        setError(
          `El tema se guardó, pero no se pudo actualizar la lista: ${refreshError.message}`,
        );
      }
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="nexo-card tutor-topics">
      <h2>Temas de mis materias</h2>
      {subjects.length === 0 ? (
        <p className="muted">Aún no tienes materias asignadas.</p>
      ) : (
        <>
          <label className="tutor-management-form__field">
            Materia
            <select
              value={subjectId}
              onChange={(event) => selectSubject(event.target.value)}
            >
              <option value="">Selecciona una materia</option>
              {subjects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · Grado {item.grade}°
                </option>
              ))}
            </select>
          </label>
          {subjectId && (
            <>
              <label className="tutor-management-form__field">
                Buscar tema
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              {loading && <p>Cargando temas…</p>}
              {error && <p className="error-message" role="alert">{error}</p>}
              {!loading && !error && topics.length === 0 && (
                <p className="muted">Esta materia aún no tiene temas.</p>
              )}
              {topics
                .filter((item) =>
                  item.name.toLowerCase().includes(search.trim().toLowerCase()),
                )
                .map((item) => (
                  <article className="tutor-topic-row" key={item.id}>
                    <div>
                      <strong>{item.order_number}. {item.name}</strong>
                      {item.description && <p className="muted">{item.description}</p>}
                    </div>
                    <div className="tutor-management-form__actions">
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() =>
                          setQuestionsTopicId(questionsTopicId === item.id ? null : item.id)
                        }
                      >
                        {questionsTopicId === item.id ? "Ocultar preguntas" : "Ver preguntas"}
                      </button>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => {
                          setEditingId(item.id);
                          setForm({
                            name: item.name,
                            description: item.description || "",
                            order_number: String(item.order_number),
                          });
                          setConfirmedSharedEdit(false);
                          setFormError("");
                          setSuccess("");
                        }}
                      >
                        Editar tema
                      </button>
                    </div>
                    {questionsTopicId === item.id && (
                      <TutorQuestionsPanel topic={item} />
                    )}
                  </article>
                ))}
              <form className="tutor-management-form" onSubmit={saveTopic}>
                <h3>{editingId ? "Editar tema" : "Crear tema"}</h3>
                {editingId && (
                  <div className="tutor-shared-warning" role="note">
                    Los cambios serán visibles para otros estudiantes y tutores de esta materia.
                    <label>
                      <input
                        type="checkbox"
                        checked={confirmedSharedEdit}
                        onChange={(event) => setConfirmedSharedEdit(event.target.checked)}
                      />
                      Entiendo que este contenido es compartido
                    </label>
                  </div>
                )}
                <label>
                  Nombre del tema
                  <input
                    required
                    minLength={2}
                    maxLength={150}
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                  />
                </label>
                <label>
                  Descripción
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(event) =>
                      setForm({ ...form, description: event.target.value })
                    }
                  />
                </label>
                <label>
                  Orden
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={form.order_number}
                    onChange={(event) =>
                      setForm({ ...form, order_number: event.target.value })
                    }
                  />
                </label>
                {formError && <p className="error-message" role="alert">{formError}</p>}
                {success && <p className="tutor-management-success" role="status">{success}</p>}
                <div className="tutor-management-form__actions">
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={saving || (editingId && !confirmedSharedEdit)}
                  >
                    {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Crear tema"}
                  </button>
                  {editingId && (
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setForm(emptyForm);
                        setConfirmedSharedEdit(false);
                        setFormError("");
                      }}
                    >
                      Cancelar edición
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </>
      )}
    </section>
  );
}
