const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface SigninPayload {
  email: string;
  password: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiErrorShape {
  message?: string | string[];
}

async function handleJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const data = (isJson ? await response.json() : null) as
    | T
    | ApiErrorShape
    | null;

  if (!response.ok) {
    const apiError = (data ?? {}) as ApiErrorShape;
    const rawMessage = apiError.message;
    const message =
      typeof rawMessage === 'string'
        ? rawMessage
        : Array.isArray(rawMessage) && rawMessage.length > 0
        ? rawMessage[0]
        : 'Something went wrong. Please try again.';

    throw new Error(message);
  }

  return data as T;
}

export async function signup(payload: SignupPayload) {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleJsonResponse<unknown>(response);
}

export async function signin(payload: SigninPayload) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  return handleJsonResponse<{ user: User }>(response);
}

export async function getCurrentUser() {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });

  return handleJsonResponse<{ user: User }>(response);
}

export async function logout() {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  return handleJsonResponse<{ success: boolean }>(response);
}

