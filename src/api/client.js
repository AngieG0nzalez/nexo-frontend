export const API_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

export async function apiRequest(path, options = {}) {
  const { auth = true, ...requestOptions } = options;
  const token = sessionStorage.getItem("access_token");
  const headers = {
    ...(requestOptions.body ? { "Content-Type": "application/json" } : {}),
    ...requestOptions.headers,
  };
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...requestOptions, headers });
  } catch {
    throw new Error(
      "No se pudo conectar con Nexo. Comprueba que FastAPI esté encendido.",
    );
  }
  const payload =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && auth) {
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("nexo_user");
      window.dispatchEvent(new Event("nexo-session-expired"));
    }
    const detail = payload?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((item) => item.msg).join("; ")
          : `Error HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return payload;
}
