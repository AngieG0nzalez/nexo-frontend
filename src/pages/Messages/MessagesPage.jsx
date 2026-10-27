import { useEffect, useMemo, useRef, useState } from "react";
import {
  getMessageContacts,
  getMyMessages,
  getTutorDirectory,
  sendMessage,
} from "../../api/messages.api.js";
import { getClassStudents, getTutorClasses } from "../../api/tutor.api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "./MessagesPage.css";

const MAX_LENGTH = 5000;

// El tutor identifica a sus estudiantes solo a partir de sus propias clases.
async function loadTutorContacts() {
  const classes = await getTutorClasses();
  const lists = await Promise.all(
    (Array.isArray(classes) ? classes : []).map((item) =>
      getClassStudents(item.id).catch(() => []),
    ),
  );
  const byUser = new Map();
  // Estudiantes con conversación previa, aunque no estén en sus clases.
  const known = await getMessageContacts().catch(() => []);
  known.forEach((c) =>
    byUser.set(c.user_id, { user_id: c.user_id, name: c.name, specialty: null }),
  );
  lists.flat().forEach((student) => {
    if (!byUser.has(student.user_id))
      byUser.set(student.user_id, {
        user_id: student.user_id,
        name: student.name,
        specialty: null,
      });
  });
  return [...byUser.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function sendErrorMessage(error) {
  if (error.status === 403) return "No se puede enviar el mensaje a este destinatario (puede estar inactivo).";
  if (error.status === 404) return "El destinatario seleccionado ya no está disponible.";
  return error.message || "No se pudo enviar el mensaje.";
}

export default function MessagesPage() {
  const { user } = useAuth();
  const isTutor = user.role === "tutor";
  const [tutors, setTutors] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tutorId, setTutorId] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const sendingRef = useRef(false);
  const endRef = useRef(null);

  useEffect(() => {
    let live = true;
    Promise.all([
      isTutor ? loadTutorContacts() : getTutorDirectory(),
      getMyMessages(),
    ])
      .then(([contactList, messageList]) => {
        if (!live) return;
        const messageItems = Array.isArray(messageList) ? messageList : [];
        const contacts = Array.isArray(contactList) ? [...contactList] : [];
        if (isTutor) {
          // Conversaciones con estudiantes que no están en tus clases: etiqueta neutra.
          const known = new Set(contacts.map((c) => c.user_id));
          let unknown = 0;
          messageItems.forEach((m) => {
            const other = m.sender_id === user.id ? m.receiver_id : m.sender_id;
            if (!known.has(other)) {
              known.add(other);
              unknown += 1;
              contacts.push({
                user_id: other,
                name: `Estudiante sin identificar ${unknown}`,
                specialty: null,
              });
            }
          });
        }
        setTutors(contacts);
        setMessages(messageItems);
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
  }, [isTutor, user.id]);

  const tutor = tutors.find((item) => String(item.user_id) === tutorId) || null;

  const conversation = useMemo(() => {
    if (!tutor) return [];
    return messages
      .filter(
        (m) =>
          (m.sender_id === user.id && m.receiver_id === tutor.user_id) ||
          (m.sender_id === tutor.user_id && m.receiver_id === user.id),
      )
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }, [messages, tutor, user.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [conversation.length, tutorId]);

  async function submit(event) {
    event.preventDefault();
    if (sendingRef.current || !tutor) return;
    const text = content.trim();
    if (text.length < 1 || text.length > MAX_LENGTH) {
      setSendError(`El mensaje debe tener entre 1 y ${MAX_LENGTH} caracteres.`);
      return;
    }
    sendingRef.current = true;
    setSending(true);
    setSendError("");
    try {
      const created = await sendMessage(tutor.user_id, text);
      setMessages((current) =>
        current.some((m) => m.id === created.id) ? current : [created, ...current],
      );
      setContent("");
    } catch (err) {
      setSendError(sendErrorMessage(err));
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  return (
    <section className="messages-page">
      <header className="page-header">
        <p className="eyebrow">COMUNICACIÓN</p>
        <h1>Mensajes</h1>
        <p className="muted">
          {isTutor
            ? "Responde a tus estudiantes y consulta tus conversaciones."
            : "Escribe a un tutor de Nexo y consulta tu conversación."}
        </p>
      </header>

      {loading && <p>Cargando mensajes…</p>}
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="nexo-card messages-page__card">
          {tutors.length === 0 ? (
            <p className="muted">
              {isTutor
                ? "Aún no tienes estudiantes ni conversaciones."
                : "Todavía no hay tutores disponibles."}
            </p>
          ) : (
            <label className="nexo-label messages-page__select">
              {isTutor ? "Estudiante" : "Tutor"}
              <select value={tutorId} onChange={(e) => { setTutorId(e.target.value); setSendError(""); }}>
                <option value="">{isTutor ? "Selecciona un estudiante" : "Selecciona un tutor"}</option>
                {tutors.map((item) => (
                  <option key={item.user_id} value={item.user_id}>
                    {item.name}
                    {item.specialty ? ` · ${item.specialty}` : ""}
                  </option>
                ))}
              </select>
            </label>
          )}

          {tutor && (
            <>
              <div className="messages-page__thread" aria-live="polite">
                {conversation.length === 0 ? (
                  <p className="muted">Aún no tienes mensajes con {tutor.name}.</p>
                ) : (
                  conversation.map((m) => {
                    const mine = m.sender_id === user.id;
                    return (
                      <article
                        key={m.id}
                        className={`messages-page__bubble ${mine ? "is-mine" : ""}`}
                      >
                        <strong>{mine ? "Tú" : tutor.name}</strong>
                        <p>{m.content}</p>
                        <time dateTime={m.created_at}>
                          {new Date(m.created_at).toLocaleString("es-CO", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </time>
                      </article>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>
              <form className="messages-page__form" onSubmit={submit}>
                <label className="nexo-label messages-page__field">
                  Mensaje
                  <textarea
                    rows={3}
                    maxLength={MAX_LENGTH}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`Escribe a ${tutor.name}`}
                  />
                </label>
                <small className="muted">
                  {content.length}/{MAX_LENGTH}
                </small>
                {sendError && (
                  <p className="error-message" role="alert">
                    {sendError}
                  </p>
                )}
                <button
                  className="primary-button"
                  type="submit"
                  disabled={sending || !content.trim()}
                >
                  {sending ? "Enviando…" : "Enviar mensaje"}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </section>
  );
}
