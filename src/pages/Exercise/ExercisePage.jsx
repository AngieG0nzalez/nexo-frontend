import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getNextExercise, submitAttempt } from "../../api/adaptive.api.js";
import { getProgress } from "../../api/progress.api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCatalog } from "../../hooks/useCatalog.js";
import { levelLabel, nextTopicInSubject, percent } from "../../utils/learning.js";
import "./ExercisePage.css";

export default function ExercisePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const catalog = useCatalog(user?.grade);
  const rawTopicId = searchParams.get("topic_id");
  const [pickSubject, setPickSubject] = useState("");
  const [pickTopic, setPickTopic] = useState("");
  const [exercise, setExercise] = useState(null);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [topicProgress, setTopicProgress] = useState(null);
  const startedAt = useRef(null);

  const topic = useMemo(() => {
    if (rawTopicId === null || !/^[1-9]\d*$/.test(rawTopicId)) return null;
    return catalog.topics.find((item) => item.id === Number(rawTopicId)) || null;
  }, [rawTopicId, catalog.topics]);
  const subject = topic
    ? catalog.subjects.find((item) => item.id === topic.subject_id)
    : null;
  const followingTopic = nextTopicInSubject(topic, catalog.topics);

  useEffect(() => {
    setExercise(null);
    setSelected("");
    setResult(null);
    setTopicProgress(null);
    setError("");
    startedAt.current = null;
  }, [topic?.id]);

  async function next() {
    if (!topic) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSelected("");
    try {
      const data = await getNextExercise(topic.id);
      setExercise(data?.exercise || data);
      startedAt.current = performance.now();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function send(e) {
    e.preventDefault();
    if (!selected || !exercise?.id || result) return;
    setLoading(true);
    setError("");
    const elapsed = startedAt.current
      ? Math.round((performance.now() - startedAt.current) / 1000)
      : 0;
    try {
      const data = await submitAttempt({
        exercise_id: exercise.id,
        selected_option_id: Number(selected),
        response_time_seconds: Math.min(86400, Math.max(0, elapsed)),
      });
      setResult(data);
      try {
        const progress = await getProgress();
        const list = Array.isArray(progress) ? progress : progress?.items || [];
        setTopicProgress(list.find((item) => item.topic_id === topic.id) || null);
      } catch {
        setTopicProgress(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const options = exercise?.options || exercise?.exercise_options || [];
  const pickerTopics = catalog.topics.filter(
    (item) => String(item.subject_id) === pickSubject,
  );
  const invalidParam = rawTopicId !== null && !catalog.loading && !topic;

  return (
    <section className="exercise-page">
      <header className="page-header">
        <p className="eyebrow">PRÁCTICA ADAPTATIVA</p>
        <h1>Entrena tus habilidades</h1>
        <p className="muted">
          Nexo recomienda ejercicios según tu progreso.
        </p>
      </header>
      <div className="nexo-card">
        {catalog.loading && <p>Cargando temas…</p>}
        {catalog.error && (
          <div className="error-message" role="alert">
            {catalog.error}
          </div>
        )}

        {invalidParam && (
          <div className="error-message" role="alert">
            El tema solicitado no existe o no corresponde a tu grado.{" "}
            <Link to="/topics">Volver a materias</Link>
          </div>
        )}

        {!catalog.loading && !catalog.error && rawTopicId === null && (
          <form
            className="exercise-picker"
            onSubmit={(event) => {
              event.preventDefault();
              if (pickTopic) navigate(`/exercise?topic_id=${pickTopic}`);
            }}
          >
            <label className="nexo-label">
              Materia
              <select
                value={pickSubject}
                onChange={(e) => {
                  setPickSubject(e.target.value);
                  setPickTopic("");
                }}
              >
                <option value="">Selecciona una materia</option>
                {catalog.subjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="nexo-label">
              Tema
              <select
                value={pickTopic}
                disabled={!pickSubject}
                onChange={(e) => setPickTopic(e.target.value)}
              >
                <option value="">Selecciona un tema</option>
                {pickerTopics.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.order_number}. {item.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-button" type="submit" disabled={!pickTopic}>
              Comenzar práctica
            </button>
          </form>
        )}

        {topic && (
          <>
            <div className="exercise-topic">
              <div>
                <span className="eyebrow">
                  {subject ? `${subject.name} · Grado ${subject.grade}°` : "TEMA"}
                </span>
                <h2>{topic.name}</h2>
              </div>
              <Link to="/topics" className="secondary-button">
                Ir a otro tema
              </Link>
            </div>
            <button
              className="primary-button"
              type="button"
              onClick={next}
              disabled={loading}
            >
              {loading
                ? "Cargando…"
                : exercise
                  ? "Otro ejercicio de este tema"
                  : "Obtener ejercicio"}
            </button>
          </>
        )}

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
        {exercise && (
          <form onSubmit={send} className="nexo-exercise">
            <span className="eyebrow">
              DIFICULTAD: {exercise.difficulty || "Adaptativa"}
            </span>
            <h2>
              {exercise.statement ||
                exercise.question ||
                "Ejercicio recomendado"}
            </h2>
            {options.length ? (
              options.map((opt) => (
                <label className="nexo-option" key={opt.id}>
                  <input
                    type="radio"
                    name="option"
                    value={opt.id}
                    checked={selected === String(opt.id)}
                    disabled={!!result}
                    onChange={(e) => setSelected(e.target.value)}
                  />
                  {opt.option_text ||
                    opt.text ||
                    opt.statement ||
                    `Opción ${opt.id}`}
                </label>
              ))
            ) : (
              <p className="muted">
                El servidor no devolvió opciones para este ejercicio.
              </p>
            )}
            <button
              className="primary-button"
              type="submit"
              disabled={loading || !selected || !!result}
            >
              Enviar respuesta
            </button>
          </form>
        )}
        {result && (
          <div className="auth-message auth-message--success" role="status">
            Respuesta registrada.{" "}
            {result.is_correct ? "¡Correcta!" : "Sigue practicando."}
            {topicProgress && (
              <>
                {" "}
                Progreso actualizado: {percent(topicProgress.mastery_percentage)}
                % de dominio · {topicProgress.exercises_correct} de{" "}
                {topicProgress.exercises_attempted} correctos · Nivel{" "}
                {levelLabel(topicProgress.level)}.
              </>
            )}
          </div>
        )}
        {result && (
          <div className="exercise-next">
            <button className="primary-button" type="button" onClick={next} disabled={loading}>
              Otro ejercicio de este tema
            </button>
            {followingTopic ? (
              <button
                className="secondary-button"
                type="button"
                onClick={() => navigate(`/exercise?topic_id=${followingTopic.id}`)}
              >
                Siguiente tema: {followingTopic.name}
              </button>
            ) : (
              <Link className="secondary-button" to="/topics">
                Continuar explorando temas
              </Link>
            )}
            <small className="muted">
              El siguiente tema corresponde al orden de la materia; no depende
              de un puntaje mínimo.
            </small>
          </div>
        )}
      </div>
    </section>
  );
}
