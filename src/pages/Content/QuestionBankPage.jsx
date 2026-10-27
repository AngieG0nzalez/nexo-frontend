import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createContentExercise,
  createExerciseVersion,
  getContentCatalog,
  listContentExercises,
  setContentExerciseStatus,
  updateContentExercise,
} from "../../api/content.api.js";
import "../Admin/Management.css";

const PAGE_SIZE = 10;
const difficultyLabels = { easy: "Fácil", medium: "Media", hard: "Difícil" };
const normalize = (text) => text.split(/\s+/).join(" ").trim().toLowerCase();
const blankOptions = () =>
  [0, 1, 2, 3].map((index) => ({ option_text: "", is_correct: index === 0 }));

function QuestionForm({ mode, topics, initial, onCancel, onSaved }) {
  const [topicId, setTopicId] = useState(String(initial?.topic_id || ""));
  const [statement, setStatement] = useState(initial?.statement || "");
  const [difficulty, setDifficulty] = useState(initial?.difficulty || "medium");
  const [explanation, setExplanation] = useState(initial?.explanation || "");
  const [options, setOptions] = useState(
    initial
      ? initial.options.map((o) => ({ option_text: o.option_text, is_correct: o.is_correct }))
      : blankOptions(),
  );
  const [topicStatements, setTopicStatements] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const locked = mode === "metadata";

  useEffect(() => {
    if (!topicId || locked) return undefined;
    let active = true;
    listContentExercises({ topic_id: topicId, is_active: true, limit: 100 })
      .then((data) => active && setTopicStatements(data.items || []))
      .catch(() => active && setTopicStatements([]));
    return () => {
      active = false;
    };
  }, [topicId, locked]);

  const duplicate =
    !locked && statement.trim().length >= 5
      ? topicStatements.find(
          (item) =>
            item.id !== initial?.id && normalize(item.statement) === normalize(statement),
        )
      : null;

  function setOption(index, patch) {
    setOptions((current) => current.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  }

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    setError("");
    const cleanOptions = options.map((o) => ({ ...o, option_text: o.option_text.trim() }));
    if (!locked) {
      if (!topicId) return setError("Selecciona un tema.");
      if (duplicate) return setError("Ya existe una pregunta activa con ese enunciado en el tema.");
      if (cleanOptions.some((o) => !o.option_text))
        return setError("Las cuatro opciones deben tener texto.");
      if (new Set(cleanOptions.map((o) => normalize(o.option_text))).size !== 4)
        return setError("Las opciones no pueden repetirse.");
    }
    setSaving(true);
    try {
      let saved;
      const base = {
        statement: statement.trim(),
        difficulty,
        explanation: explanation.trim() || null,
      };
      if (mode === "create") {
        saved = await createContentExercise({
          ...base,
          topic_id: Number(topicId),
          options: cleanOptions,
        });
      } else if (mode === "version") {
        saved = await createExerciseVersion(initial.id, { ...base, options: cleanOptions });
      } else if (mode === "metadata") {
        saved = await updateContentExercise(initial.id, {
          difficulty,
          explanation: explanation.trim() || null,
        });
      } else {
        saved = await updateContentExercise(initial.id, { ...base, options: cleanOptions });
      }
      onSaved(saved, mode);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  const titles = {
    create: "Nueva pregunta",
    edit: "Editar pregunta",
    metadata: "Editar dificultad y explicación",
    version: "Nueva versión de la pregunta",
  };

  return (
    <form className="mgmt-form" onSubmit={submit}>
      <h3 style={{ margin: 0 }}>{titles[mode]}</h3>
      {mode === "version" && (
        <p className="mgmt-warning" role="note">
          La pregunta original se desactivará y conservará sus intentos. La nueva empezará sin historial.
        </p>
      )}
      {mode === "metadata" && (
        <p className="mgmt-warning" role="note">
          Esta pregunta ya tiene intentos: el enunciado y las opciones no se pueden modificar.
          Usa «Crear nueva versión» para cambiarlos.
        </p>
      )}
      <p className="muted">Las preguntas son contenido compartido por materia.</p>
      {mode === "create" && (
        <label>
          Tema
          <select required value={topicId} onChange={(e) => setTopicId(e.target.value)}>
            <option value="">Selecciona un tema</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        Enunciado
        <textarea
          required
          rows={3}
          minLength={5}
          maxLength={1000}
          value={statement}
          disabled={locked}
          onChange={(e) => setStatement(e.target.value)}
        />
      </label>
      {duplicate && (
        <p className="error-message" role="alert">
          Ya existe esta pregunta en el tema (#{duplicate.id}).
        </p>
      )}
      <label>
        Dificultad
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          {Object.entries(difficultyLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <fieldset disabled={locked} style={{ border: "1px solid var(--color-border)", borderRadius: 8 }}>
        <legend>Cuatro opciones (marca la correcta)</legend>
        <div style={{ display: "grid", gap: 8 }}>
          {options.map((option, index) => (
            <div className="mgmt-option-row" key={index}>
              <input
                type="radio"
                name="correct-option"
                checked={option.is_correct}
                onChange={() =>
                  setOptions((current) => current.map((o, i) => ({ ...o, is_correct: i === index })))
                }
                aria-label={`Opción ${index + 1} correcta`}
              />
              <input
                type="text"
                required
                maxLength={300}
                placeholder={`Opción ${index + 1}`}
                value={option.option_text}
                onChange={(e) => setOption(index, { option_text: e.target.value })}
              />
            </div>
          ))}
        </div>
      </fieldset>
      <label>
        Explicación (opcional)
        <textarea rows={2} maxLength={1000} value={explanation} onChange={(e) => setExplanation(e.target.value)} />
      </label>
      {error && <p className="error-message" role="alert">{error}</p>}
      <div className="mgmt-actions">
        <button className="primary-button" type="submit" disabled={saving || !!duplicate}>
          {saving ? "Guardando…" : "Guardar"}
        </button>
        <button className="secondary-button" type="button" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function QuestionBankPage() {
  const [catalog, setCatalog] = useState([]);
  const [catalogError, setCatalogError] = useState("");
  const [filters, setFilters] = useState({
    grade: "",
    subject_id: "",
    topic_id: "",
    difficulty: "",
    is_active: "",
    q: "",
  });
  const [applied, setApplied] = useState(filters);
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [notice, setNotice] = useState({ text: "", warning: "" });
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let active = true;
    getContentCatalog()
      .then((list) => active && setCatalog(Array.isArray(list) ? list : []))
      .catch((requestError) => active && setCatalogError(requestError.message));
    return () => {
      active = false;
    };
  }, []);

  const topicOptions = useMemo(
    () =>
      catalog.flatMap((subject) =>
        subject.topics.map((topic) => ({
          ...topic,
          subject_id: subject.id,
          grade: subject.grade,
          label: `${subject.name} ${subject.grade}.º · ${topic.name}`,
        })),
      ),
    [catalog],
  );
  const filterTopics = topicOptions.filter(
    (topic) =>
      (!filters.subject_id || String(topic.subject_id) === filters.subject_id) &&
      (!filters.grade || String(topic.grade) === filters.grade),
  );
  const visibleSubjects = catalog.filter(
    (subject) => !filters.grade || String(subject.grade) === filters.grade,
  );
  const selectedTopic = topicOptions.find((topic) => String(topic.id) === filters.topic_id);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await listContentExercises({ ...applied, limit: PAGE_SIZE, offset }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [applied, offset]);

  useEffect(() => {
    load();
  }, [load]);

  function refreshCatalog() {
    getContentCatalog().then((list) => setCatalog(Array.isArray(list) ? list : [])).catch(() => {});
  }

  async function toggleStatus(item) {
    if (busyId) return;
    if (
      item.is_active &&
      !window.confirm(
        "¿Desactivar esta pregunta? Dejará de aparecer en la práctica, pero el historial se conserva.",
      )
    )
      return;
    setBusyId(item.id);
    setError("");
    setNotice({ text: "", warning: "" });
    try {
      await setContentExerciseStatus(item.id, !item.is_active);
      setNotice({ text: item.is_active ? "Pregunta desactivada." : "Pregunta activada.", warning: "" });
      await load();
      refreshCatalog();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId(null);
    }
  }

  function formMode(item) {
    if (!item) return "create";
    return item.attempts_count > 0 ? "metadata" : "edit";
  }

  return (
    <section>
      <header className="page-header">
        <p className="eyebrow">CONTENIDO</p>
        <h1>Banco de preguntas</h1>
        <p className="muted">
          Consulta, crea y mantén las preguntas. Las preguntas son contenido compartido y
          nunca se borran: se desactivan.
        </p>
      </header>
      <div className="nexo-card">
        {catalogError && <p className="error-message" role="alert">{catalogError}</p>}
        <form
          className="mgmt-toolbar"
          onSubmit={(event) => {
            event.preventDefault();
            setOffset(0);
            setApplied({ ...filters, q: filters.q.trim() });
          }}
        >
          <label className="mgmt-field">
            Grado
            <select value={filters.grade} onChange={(e) => setFilters({ ...filters, grade: e.target.value, subject_id: "", topic_id: "" })}>
              <option value="">Todos</option>
              {[9, 10, 11].map((g) => (
                <option key={g} value={g}>{g}.º</option>
              ))}
            </select>
          </label>
          <label className="mgmt-field">
            Materia
            <select value={filters.subject_id} onChange={(e) => setFilters({ ...filters, subject_id: e.target.value, topic_id: "" })}>
              <option value="">Todas</option>
              {visibleSubjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name} {s.grade}.º</option>
              ))}
            </select>
          </label>
          <label className="mgmt-field">
            Tema
            <select value={filters.topic_id} onChange={(e) => setFilters({ ...filters, topic_id: e.target.value })}>
              <option value="">Todos</option>
              {filterTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.active_exercises})
                </option>
              ))}
            </select>
          </label>
          <label className="mgmt-field">
            Dificultad
            <select value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}>
              <option value="">Todas</option>
              {Object.entries(difficultyLabels).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </label>
          <label className="mgmt-field">
            Estado
            <select value={filters.is_active} onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}>
              <option value="">Todos</option>
              <option value="true">Activas</option>
              <option value="false">Inactivas</option>
            </select>
          </label>
          <label className="mgmt-field mgmt-field--wide">
            Texto
            <input type="search" maxLength={100} value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
          </label>
          <button className="primary-button" type="submit">Filtrar</button>
        </form>
        {selectedTopic && (
          <p className="muted">
            {selectedTopic.name}: {selectedTopic.active_exercises} activas ·{" "}
            {selectedTopic.inactive_exercises} inactivas
          </p>
        )}
        {!form && (
          <button className="primary-button" type="button" onClick={() => { setForm({ mode: "create" }); setNotice({ text: "", warning: "" }); }}>
            Nueva pregunta
          </button>
        )}
        {form && (
          <QuestionForm
            key={`${form.mode}-${form.item?.id || "new"}`}
            mode={form.mode}
            topics={topicOptions}
            initial={form.item}
            onCancel={() => setForm(null)}
            onSaved={(saved, mode) => {
              setForm(null);
              setNotice({
                text: mode === "create" ? "La pregunta se creó." : mode === "version" ? "Se creó la nueva versión." : "Cambios guardados.",
                warning: saved.warning || "",
              });
              load();
              refreshCatalog();
            }}
          />
        )}
        {notice.text && <p className="mgmt-success" role="status">{notice.text}</p>}
        {notice.warning && <p className="mgmt-warning" role="note">{notice.warning}</p>}
        {loading && <p>Cargando preguntas…</p>}
        {error && <p className="error-message" role="alert">{error}</p>}
        {!loading && !error && data.items.length === 0 && (
          <p className="muted">No hay preguntas con esos filtros.</p>
        )}
        {data.items.map((item) => (
          <article className="mgmt-row" key={item.id}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <strong className="mgmt-prewrap">{item.statement}</strong>
              <p>
                <span className="mgmt-badge">{difficultyLabels[item.difficulty] || item.difficulty}</span>{" "}
                <span className={`mgmt-badge ${item.is_active ? "mgmt-badge--ok" : "mgmt-badge--off"}`}>
                  {item.is_active ? "Activa" : "Inactiva"}
                </span>{" "}
                <small className="muted">
                  {item.subject_name} {item.grade}.º · {item.topic_name} · {item.attempts_count} intento(s)
                </small>
              </p>
              <ul className="mgmt-options">
                {item.options.map((option) => (
                  <li key={option.id}>
                    {option.is_correct ? "✓ " : "• "}
                    {option.option_text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mgmt-actions" style={{ alignSelf: "flex-start" }}>
              <button className="secondary-button" type="button" onClick={() => { setForm({ mode: formMode(item), item }); setNotice({ text: "", warning: "" }); }}>
                Editar
              </button>
              {item.attempts_count > 0 && (
                <button className="secondary-button" type="button" onClick={() => { setForm({ mode: "version", item }); setNotice({ text: "", warning: "" }); }}>
                  Crear nueva versión
                </button>
              )}
              <button className="secondary-button" type="button" disabled={busyId === item.id} onClick={() => toggleStatus(item)}>
                {item.is_active ? "Desactivar" : "Activar"}
              </button>
            </div>
          </article>
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
