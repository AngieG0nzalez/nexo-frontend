import { apiRequest } from "./client.js";
export const getTutorProfile = () => apiRequest("/tutor-panel/me");
export const getTutorSummary = () => apiRequest("/tutor-panel/summary");
export const getTutorClasses = () => apiRequest("/tutor-panel/classes");
export const getTutorSubjects = () => apiRequest("/tutor-panel/subjects");
export const getClassStudents = (classId) =>
  apiRequest(`/tutor-panel/classes/${classId}/students`);
export const createTutorClass = (data) =>
  apiRequest("/classes", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateTutorClass = (classId, data) =>
  apiRequest(`/classes/${classId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const updateMyTutorProfile = (tutorId, data) =>
  apiRequest(`/tutors/${tutorId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
