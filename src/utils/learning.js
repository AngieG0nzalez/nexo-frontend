const levelLabels = {
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
  beginner: "Inicial",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

export const levelLabel = (level) =>
  levelLabels[String(level).toLowerCase()] || level || "—";

export function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

export const percent = (value) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.min(100, Math.max(0, Math.round(number)))
    : 0;
};

// Siguiente tema por orden dentro de la misma materia.
export function nextTopicInSubject(topic, topics) {
  if (!topic) return null;
  return (
    topics
      .filter(
        (item) =>
          item.subject_id === topic.subject_id &&
          item.order_number > topic.order_number,
      )
      .sort((a, b) => a.order_number - b.order_number)[0] || null
  );
}

/*
 * Recomendación orientativa, sin umbrales de dominio:
 * 1. Sin práctica: primer tema por orden de la primera materia.
 * 2. Con práctica: el tema siguiente por orden al practicado más recientemente.
 * 3. Si ese tema ya no existe: primer tema aún sin practicar.
 */
export function recommendTopic(progress, topics, subjects) {
  if (!topics.length) return null;
  const byId = new Map(topics.map((topic) => [topic.id, topic]));
  const practiced = progress.filter(
    (item) => byId.has(item.topic_id) && Number(item.exercises_attempted) > 0,
  );
  const practicedIds = new Set(practiced.map((item) => item.topic_id));
  const subjectOrder = new Map(subjects.map((s, index) => [s.id, index]));
  const ordered = [...topics].sort(
    (a, b) =>
      (subjectOrder.get(a.subject_id) ?? 0) -
        (subjectOrder.get(b.subject_id) ?? 0) ||
      a.order_number - b.order_number,
  );

  if (!practiced.length)
    return {
      topic: ordered[0],
      reason: "Es el primer tema del catálogo y aún no has practicado.",
    };

  const latest = [...practiced].sort(
    (a, b) =>
      new Date(b.last_practiced_at || b.updated_at || 0) -
      new Date(a.last_practiced_at || a.updated_at || 0),
  )[0];
  const next = nextTopicInSubject(byId.get(latest.topic_id), topics);
  if (next && !practicedIds.has(next.id))
    return {
      topic: next,
      reason: `Sigue en el orden de la materia después de «${byId.get(latest.topic_id).name}», tu práctica más reciente.`,
    };

  const pending = ordered.find((topic) => !practicedIds.has(topic.id));
  if (pending)
    return {
      topic: pending,
      reason: "Es el primer tema que todavía no has practicado.",
    };
  return null;
}
