import { apiRequest } from "./client.js";
export const getTopics = (subjectId) =>
  apiRequest(`/topics${subjectId ? `?subject_id=${subjectId}` : ""}`);
export const createTopic = (data) =>
  apiRequest("/topics", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateTopic = (topicId, data) =>
  apiRequest(`/topics/${topicId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const getTopicExercises = (topicId) =>
  apiRequest(`/topics/${topicId}/exercises`);
export const getTopicExercisesForTutor = (topicId) =>
  apiRequest(`/topics/${topicId}/exercises/manage`);
export const createTopicExercise = (topicId, data) =>
  apiRequest(`/topics/${topicId}/exercises`, {
    method: "POST",
    body: JSON.stringify(data),
  });
export const deleteTopicExercise = (topicId, exerciseId) =>
  apiRequest(`/topics/${topicId}/exercises/${exerciseId}`, {
    method: "DELETE",
  });
