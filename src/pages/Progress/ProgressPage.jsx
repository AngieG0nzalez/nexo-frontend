import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProgress } from "../../api/progress.api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCatalog } from "../../hooks/useCatalog.js";
import {
  formatDate,
  levelLabel,
  percent,
  recommendTopic,
} from "../../utils/learning.js";
import "./ProgressPage.css";

export default function ProgressPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const catalog = useCatalog(user?.grade);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    getProgress()
      .then((result) => {
        if (live) setData(Array.isArray(result) ? result : result?.items || []);
      })
      .catch((err) => {
        if (live) setError(err.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  const topicsById = useMemo(
    () => new Map(catalog.topics.map((topic) => [topic.id, topic])),
    [catalog.topics],
  );
  const subjectsById = useMemo(
    () => new Map(catalog.subjects.map((subject) => [subject.id, subject])),
    [catalog.subjects],
  );

  // Se ocultan temas de otros grados; los que ya no están en el catálogo se muestran como no disponibles.
  const rows = useMemo(() => {
    if (catalog.loading || catalog.error) return data;
    return data.filter(
      (item) =>
        topicsById.has(item.topic_id) ||
        !catalog.knownTopicIds.has(item.topic_id),
    );
  }, [data, topicsById, catalog.loading, catalog.error, catalog.knownTopicIds]);

  const attempts = rows.reduce(
    (n, item) => n + (Number(item.exercises_attempted) || 0),
    0,
  );
  const correct = rows.reduce(
    (n, item) => n + (Number(item.exercises_correct) || 0),
    0,
  );
  const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : null;
  const practicedIds = new Set(rows.map((item) => item.topic_id));
  const unpracticed = catalog.topics.filter(
    (topic) => !practicedIds.has(topic.id),
  );
  const recommendation = recommendTopic(rows, catalog.topics, catalog.subjects);
  const busy = loading || catalog.loading;

  return (
    <section className="progress-page">
      <header className="page-header">
        <p className="eyebrow">TU APRENDIZAJE</p>
        <h1>Mi progreso</h1>
        <p className="muted">Resultados reales de tus prácticas en Nexo.</p>
      </header>
      {busy && <p>Cargando progreso…</p>}
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
      {catalog.error && (
        <div className="error-message" role="alert">
          No se pudo cargar el catálogo de temas: {catalog.error}
        </div>
      )}
      {!busy && !error && (
        <>
          <div className="progress-page__statistics">
            {[
              { label: "Temas practicados", value: rows.length },
              { label: "Ejercicios realizados", value: attempts },
              { label: "Respuestas correctas", value: correct },
              {
                label: "Precisión de respuestas",
                value: accuracy === null ? "—" : `${accuracy} %`,
              },
            ].map((stat) => (
              <article className="progress-stat" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>
          <p className="muted progress-page__note">
            La precisión mide tus respuestas correctas; el dominio de cada tema
            lo calcula el sistema adaptativo y es un valor distinto.
          </p>

          {recommendation && (
            <div className="nexo-card progress-page__recommendation">
              <p className="eyebrow">SIGUIENTE TEMA SUGERIDO</p>
              <h2>{recommendation.topic.name}</h2>
              <p className="muted">{recommendation.reason}</p>
              <button
                className="primary-button"
                type="button"
                onClick={() =>
                  navigate(`/exercise?topic_id=${recommendation.topic.id}`)
                }
              >
                Practicar este tema
              </button>
            </div>
          )}
          {!recommendation && (
            <p className="muted">Continuar explorando temas desde <Link to="/topics">Materias</Link>.</p>
          )}

          {rows.length === 0 ? (
            <p className="muted">
              Todavía no tienes intentos registrados. ¡Empieza a practicar!
            </p>
          ) : (
            <div className="nexo-list">
              {rows.map((item) => {
                const topic = topicsById.get(item.topic_id);
                const subject = topic && subjectsById.get(topic.subject_id);
                const mastery = percent(item.mastery_percentage);
                const last = formatDate(item.last_practiced_at);
                return (
                  <article
                    className="nexo-list__item progress-item"
                    key={item.id || item.topic_id}
                  >
                    <div className="progress-item__body">
                      <strong>{topic ? topic.name : "Tema no disponible"}</strong>
                      <p className="muted">
                        {subject
                          ? `${subject.name} · Grado ${subject.grade}°`
                          : "Sin información de materia"}
                      </p>
                      <p className="muted">
                        {Number(item.exercises_correct) || 0} de{" "}
                        {Number(item.exercises_attempted) || 0} correctos ·
                        Nivel {levelLabel(item.level)}
                        {last && ` · Última práctica: ${last}`}
                      </p>
                      <div
                        className="progress-bar"
                        role="progressbar"
                        aria-label="Dominio del tema"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={mastery}
                      >
                        <span style={{ width: `${mastery}%` }} />
                      </div>
                    </div>
                    <div className="progress-item__side">
                      <strong>{mastery} %</strong>
                      <small className="muted">dominio</small>
                      {topic && (
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() =>
                            navigate(`/exercise?topic_id=${topic.id}`)
                          }
                        >
                          Practicar
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {unpracticed.length > 0 && (
            <div className="nexo-card">
              <h2>Temas sin practicar</h2>
              <div className="nexo-list">
                {unpracticed.map((topic) => (
                  <article className="nexo-list__item" key={topic.id}>
                    <div>
                      <strong>{topic.name}</strong>
                      <p className="muted">
                        {subjectsById.get(topic.subject_id)?.name} · Sin
                        practicar
                      </p>
                    </div>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => navigate(`/exercise?topic_id=${topic.id}`)}
                    >
                      Practicar
                    </button>
                  </article>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
