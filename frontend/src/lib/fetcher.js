"use client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";
export const API_BASE_URL = API_URL;
const CSRF_COOKIE_NAME = "csrftoken";
const CSRF_HEADER_NAME = "X-CSRFToken";
let csrfPromise;

function readCookie(name) {
  if (typeof document === "undefined") {
    return null;
  }
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split("=");
    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

async function ensureCsrfToken() {
  if (readCookie(CSRF_COOKIE_NAME)) {
    return readCookie(CSRF_COOKIE_NAME);
  }
  if (!csrfPromise) {
    csrfPromise = fetch(`${API_URL}/api/csrf/`, {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        csrfPromise = null;
        return data.csrfToken || readCookie(CSRF_COOKIE_NAME);
      })
      .catch((error) => {
        csrfPromise = null;
        throw error;
      });
  }
  return csrfPromise;
}

async function request(path, options = {}) {
  const url = `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const method = (options.method || "GET").toUpperCase();
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  if (!["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
    const token = await ensureCsrfToken();
    if (token) {
      headers[CSRF_HEADER_NAME] = token;
    }
  }

  const response = await fetch(url, {
    credentials: "include",
    headers,
    ...options,
  });

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const error = new Error(
      typeof payload === "string" ? payload : payload?.detail || "Request failed",
    );
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function get(path) {
  return request(path, { method: "GET" });
}

export function post(path, body) {
  return request(path, { method: "POST", body: JSON.stringify(body) });
}

export function postForm(path, formData) {
  return request(path, { method: "POST", body: formData });
}

export function patch(path, body) {
  return request(path, { method: "PATCH", body: JSON.stringify(body) });
}

export function patchForm(path, formData) {
  return request(path, { method: "PATCH", body: formData });
}

export function del(path) {
  return request(path, { method: "DELETE" });
}

export default request;
