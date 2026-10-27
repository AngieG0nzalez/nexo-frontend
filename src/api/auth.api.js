import { apiRequest } from "./client.js";
export const login = (email, password) =>
  apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    auth: false,
  });
export const getCurrentUser = () => apiRequest("/users/me");
export const forgotPassword = (email) =>
  apiRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
    auth: false,
  });
export const resetPassword = (token, newPassword, confirmNewPassword) =>
  apiRequest("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      token,
      new_password: newPassword,
      confirm_password: confirmNewPassword,
    }),
    auth: false,
  });
// Confirmar la ruta y los campos del esquema real de FastAPI antes de habilitar solicitudes.
export const requestRegistration = (data) =>
  apiRequest(
    import.meta.env.VITE_REGISTRATION_PATH || "/auth/register-request",
    { method: "POST", body: JSON.stringify(data), auth: false },
  );
