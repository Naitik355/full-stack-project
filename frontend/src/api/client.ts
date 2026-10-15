/**
 * API client with session cookie support and CSRF token handling.
 */

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers = {}, ...customConfig } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const csrfToken = getCookie('csrftoken');
  if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes((customConfig.method || 'GET').toUpperCase())) {
    defaultHeaders['X-CSRFToken'] = csrfToken;
  }

  const config: RequestInit = {
    method: 'GET',
    credentials: 'include', // Crucial for Django session authentication
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    ...customConfig,
  };

  try {
    const response = await fetch(url, config);

    // If redirected to login page by Django @login_required (e.g. 302 redirected to html)
    if (response.redirected && response.url.includes('/accounts/login/')) {
      throw new ApiError('Authentication required. Please log in.', 401);
    }

    // Try parsing JSON
    const contentType = response.headers.get('content-type') || '';
    let responseData: any = null;

    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      // If we received an HTML page while expecting JSON (often 404 or Django debug)
      if (text.startsWith('<!doctype') || text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
        if (!response.ok) {
          throw new ApiError(`Server returned HTML error (${response.status})`, response.status);
        }
      }
      responseData = text ? { message: text } : null;
    }

    if (!response.ok) {
      const errorMessage =
        responseData?.error ||
        responseData?.detail ||
        responseData?.message ||
        `Request failed with status ${response.status}`;
      throw new ApiError(errorMessage, response.status, responseData);
    }

    return responseData as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network request failed',
      0
    );
  }
}
