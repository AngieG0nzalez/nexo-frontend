import { apiRequest } from "./client.js";


/**
 * Consulta todas las materias disponibles.
 */
export function getSubjects() {

  return apiRequest(
    "/subjects",
  );

}
