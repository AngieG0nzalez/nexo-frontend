import { useEffect, useState } from "react";
import { getSubjects } from "../api/subjects.api.js";
import { getTopics } from "../api/topics.api.js";

const asList = (data) => (Array.isArray(data) ? data : data?.items || []);

// Catálogo de materias y temas visibles para el grado indicado.
export function useCatalog(grade) {
  const [state, setState] = useState({
    subjects: [],
    topics: [],
    knownTopicIds: new Set(),
    loading: true,
    error: "",
  });

  useEffect(() => {
    let live = true;
    Promise.all([getSubjects(), getTopics()])
      .then(([subjectData, topicData]) => {
        if (!live) return;
        const subjects = asList(subjectData).filter(
          (subject) => grade != null && Number(subject.grade) === Number(grade),
        );
        const subjectIds = new Set(subjects.map((subject) => subject.id));
        const topics = asList(topicData)
          .filter((topic) => subjectIds.has(topic.subject_id))
          .sort((a, b) => a.order_number - b.order_number);
        const knownTopicIds = new Set(asList(topicData).map((topic) => topic.id));
        setState({ subjects, topics, knownTopicIds, loading: false, error: "" });
      })
      .catch((error) => {
        if (live)
          setState({
            subjects: [],
            topics: [],
            knownTopicIds: new Set(),
            loading: false,
            error: error.message,
          });
      });
    return () => {
      live = false;
    };
  }, [grade]);

  return state;
}
