import { apiRequest } from "./client.js";
export const getProgress = () => apiRequest("/progress/me");
export const getTopicProgress = (id) => apiRequest(`/progress/me/${id}`);
