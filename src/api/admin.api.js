import { apiRequest } from "./client.js";

// Usuarios existentes
export const getUsers = () =>
  apiRequest("/admin/users");

export const setUserStatus = (id, is_active) =>
  apiRequest(`/admin/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ is_active }),
  });

// Solicitudes pendientes
export const getRegistrationRequests = () =>
  apiRequest("/admin/registration-requests");

// Aprobar solicitud
export const approveRegistrationRequest = (id) =>
  apiRequest(`/admin/registration-requests/${id}/approve`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });

// Rechazar solicitud
export const rejectRegistrationRequest = (id, reason) =>
  apiRequest(`/admin/registration-requests/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });

// Historial
export const getRegistrationHistory = () =>
  apiRequest("/admin/registration-requests/history");

// Entrega 4: usuarios con filtros, edición y asignación de materias
const toQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) query.set(key, value);
  });
  const text = query.toString();
  return text ? `?${text}` : "";
};

export const searchUsers = (params) => apiRequest(`/admin/users${toQuery(params)}`);

export const updateUser = (id, data) =>
  apiRequest(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(data) });

export const getTutorSubjectsAdmin = (tutorId) =>
  apiRequest(`/admin/tutors/${tutorId}/subjects`);

export const assignTutorSubject = (tutorId, subjectId) =>
  apiRequest(`/admin/tutors/${tutorId}/subjects`, {
    method: "POST",
    body: JSON.stringify({ subject_id: subjectId }),
  });

export const removeTutorSubject = (tutorId, subjectId) =>
  apiRequest(`/admin/tutors/${tutorId}/subjects/${subjectId}`, { method: "DELETE" });

export const listAdminSuggestions = (params) =>
  apiRequest(`/admin/suggestions${toQuery(params)}`);

export const updateAdminSuggestion = (id, data) =>
  apiRequest(`/admin/suggestions/${id}`, { method: "PATCH", body: JSON.stringify(data) });
