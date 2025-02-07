export const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.feargamingproductions.com"
    : "http://localhost:5000";

export const API_URL = `${API_BASE_URL}/api`;
