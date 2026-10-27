import { apiRequest } from "./client.js";

export const getMyMessages = () => apiRequest("/messages");

export const sendMessage = (receiverId, content) =>
  apiRequest("/messages", {
    method: "POST",
    body: JSON.stringify({ receiver_id: receiverId, content }),
  });

export const getMessageContacts = () => apiRequest("/messages/contacts");

export const getTutorDirectory = () => apiRequest("/tutors/directory");
