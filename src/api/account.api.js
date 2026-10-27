import { apiRequest } from "./client.js";

export const updateMyName = (userId, name) =>
  apiRequest(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });

export const changeMyPassword = (
  currentPassword,
  newPassword,
  confirmPassword,
) =>
  apiRequest("/account/password", {
    method: "PATCH",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  });

export const requestMyEmailChange = (newEmail, currentPassword) =>
  apiRequest("/account/email-change", {
    method: "POST",
    body: JSON.stringify({
      new_email: newEmail,
      current_password: currentPassword,
    }),
  });

export const confirmEmailChange = (token) =>
  apiRequest("/account/email-confirm", {
    method: "POST",
    body: JSON.stringify({ token }),
    auth: false,
  });
