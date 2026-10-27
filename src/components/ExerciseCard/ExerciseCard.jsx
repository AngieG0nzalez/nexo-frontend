import "./ExerciseCard.css";

const options = [
  "A. x = 3, y = 4",
  "B. x = 4, y = 2",
  "C. x = 2, y = 6",
  "D. x = 5, y = 0",
];

export default function ExerciseCard() {
  return (
    <section className="exercise-card">
      <div className="exercise-card__chips">
        <span>Sistemas de ecuaciones</span>

        <span>Nivel: Bajo</span>
      </div>

      <p className="exercise-card__question">
        Resuelve el sistema:
        <br />
        2x + y = 10
        <br />x − y = 2
      </p>

      <div className="exercise-card__options">
        {options.map((option) => (
          <button key={option} type="button">
            {option}
          </button>
        ))}
      </div>
    </section>
  );
}
