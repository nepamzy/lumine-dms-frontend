import api from "./client";

export async function sendContactMessage({ name, email, phone, subject, message }) {
  const { data } = await api.post("/contact", { name, email, phone, subject, message });
  return data;
}
