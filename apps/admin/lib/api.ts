/**
 * Basic fetch wrapper for client-side API calls.
 */

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `/api/v1${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (!response.ok) {
    let message = "An error occurred"
    try {
      const errorData = await response.json()
      message = errorData.error || errorData.message || message
    } catch {
      // If parsing fails, fall back to default
    }
    throw new Error(message)
  }

  // Not all responses have a JSON body (e.g., 204 No Content)
  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}
