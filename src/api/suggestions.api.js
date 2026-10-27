import { apiRequest } from "./client.js";

export const createSuggestion = (data) =>
  apiRequest("/suggestions", { method: "POST", body: JSON.stringify(data) });

export const getMySuggestions = (limit = 20, offset = 0) =>
  apiRequest(`/suggestions/mine?limit=${limit}&offset=${offset}`);
