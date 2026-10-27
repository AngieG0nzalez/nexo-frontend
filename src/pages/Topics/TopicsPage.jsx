import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getSubjects } from "../../api/subjects.api.js";
import { getTopics } from "../../api/topics.api.js";
import { getProgress } from "../../api/progress.api.js";
import { useNavigate } from "react-router-dom";

import TopicCard from "../../components/TopicCard/TopicCard.jsx";

import "./TopicsPage.css";

export default function TopicsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsError, setTopicsError] = useState("");

  async function openSubject(subject) {
    setSelectedSubject(subject);
    setTopics([]);
    setTopicsError("");
    setTopicsLoading(true);
    try {
      const data = await getTopics(subject.id);
      const list = Array.isArray(data) ? data : data?.items || [];
      setTopics(
        list
          .filter((topic) => Number(topic.subject_id) === Number(subject.id))
          .sort((a, b) => a.order_number - b.order_number),
      );
    } catch (err) {
      setTopicsError(err.message);
    } finally {
      setTopicsLoading(false);
    }
  }

  const [practicedTopics, setPracticedTopics] = useState(new Set());

  useEffect(() => {
    getProgress()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.items || [];
        setPracticedTopics(
          new Set(
            list
              .filter((item) => Number(item.exercises_attempted) > 0)
              .map((item) => item.topic_id),
          ),
        );
      })
      .catch(() => {});
  }, []);

  // Aquí guardamos las materias que llegan desde FastAPI.
  const [subjects, setSubjects] = useState([]);

  // Aquí guardamos un posible error.
  const [error, setError] = useState("");

  // Indica si todavía estamos esperando respuesta del backend.
  const [loading, setLoading] = useState(true);

  /**
   * useEffect se ejecuta al entrar a esta página.
   */
  useEffect(() => {
    loadSubjects();
  }, []);

  /**
   * Consulta GET /subjects en FastAPI.
   */
  async function loadSubjects() {
    try {
      const data = await getSubjects();

      setSubjects(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  const visibleSubjects = subjects.filter((subject) => {
    if (user?.role === "admin") {
      return true;
    }

    if (user?.role === "tutor") {
      return true;
    }

    if (user?.role === "student") {
      return user.grade != null && Number(subject.grade) === Number(user.grade);
    }

    return false;
  });

  return (
    <section className="topics-page">
      <header className="page-header">
        <p className="eyebrow">ÁREA DE ESTUDIO</p>

        <h1>¿Qué vamos a practicar hoy?</h1>

        <p className="muted">
          Estas materias vienen realmente desde FastAPI y Supabase.
        </p>
      </header>

      {/* Mientras esperamos FastAPI */}
      {loading && <p>Cargando materias...</p>}

      {/* Si ocurrió un error */}
      {error && <div className="error-message">{error}</div>}

      {/* Materias */}
      <div className="topics-page__grid">
        {!selectedSubject && visibleSubjects.map((subject) => (
          <TopicCard key={subject.id} subject={subject} onClick={() => openSubject(subject)} />
        ))}
      </div>
      {selectedSubject && (
        <div className="nexo-card" style={{ marginTop: 20 }}>
          <button type="button" className="primary-button" onClick={() => setSelectedSubject(null)}>← Volver a materias</button>
          <h2>{selectedSubject.name} · Grado {selectedSubject.grade}°</h2>
          <p className="muted">Selecciona un tema para comenzar a practicar.</p>
          {topicsLoading && <p>Cargando temas...</p>}
          {topicsError && <div className="error-message" role="alert">{topicsError}</div>}
          {!topicsLoading && !topicsError && topics.length === 0 && <p>No se encontraron temas para esta materia.</p>}
          <div className="topics-page__grid">
            {topics.map((topic) => (
              <button key={topic.id} type="button" className="topic-card" onClick={() => navigate(`/exercise?topic_id=${topic.id}`)}>
                <div className="topic-card__information"><h3>{topic.order_number}. {topic.name}</h3><p>{practicedTopics.has(topic.id) ? "Practicado · Continuar →" : "Sin practicar · Comenzar →"}</p></div>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
