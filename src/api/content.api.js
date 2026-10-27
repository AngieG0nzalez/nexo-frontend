import { apiRequest } from "./client.js";

const toQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) query.set(key, value);
  });
  const text = query.toString();
  return text ? `?${text}` : "";
};
const send = (method, body) => ({ method, body: JSON.stringify(body) });

export const getContentCatalog = () => apiRequest("/content/catalog");
export const listContentExercises = (params) =>
  apiRequest(`/content/exercises${toQuery(params)}`);
export const createContentExercise = (data) =>
  apiRequest("/content/exercises", send("POST", data));
export const updateContentExercise = (id, data) =>
  apiRequest(`/content/exercises/${id}`, send("PATCH", data));
export const setContentExerciseStatus = (id, isActive) =>
  apiRequest(`/content/exercises/${id}/status`, send("PATCH", { is_active: isActive }));
export const createExerciseVersion = (id, data) =>
  apiRequest(`/content/exercises/${id}/new-version`, send("POST", data));
