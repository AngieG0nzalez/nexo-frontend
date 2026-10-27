import { apiRequest } from "./client.js";
export const getNextExercise = (topicId) =>
  apiRequest(`/adaptive/topics/${topicId}/next`);
export const submitAttempt = (data) =>
  apiRequest("/attempts", { method: "POST", body: JSON.stringify(data) });
