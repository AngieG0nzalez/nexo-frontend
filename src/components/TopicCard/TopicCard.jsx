import "./TopicCard.css";


export default function TopicCard({ subject, onClick }) {

  const description =
    subject.description ||
    "Materia disponible en Nexo";


  return (
    <button type="button" className="topic-card" onClick={onClick} aria-label={`Ver temas de ${subject.name}, grado ${subject.grade}`}>

      {/* Luego este círculo mostrará el progreso real */}
      <div className="topic-card__progress">
        —
      </div>


      <div className="topic-card__information">

        <h3>
          {subject.name}
        </h3>

        <p>
          Grado {subject.grade}°
        </p>

        <small>
          {description}
        </small>

      </div>


      <span className="topic-card__status">
        Disponible
      </span>

    </button>
  );

}
