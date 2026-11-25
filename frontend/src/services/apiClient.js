
const API_BASE_URL = 'http://127.0.0.1:3000';

export { API_BASE_URL };


export async function apiRequest(
  path,
  {
    token,
    method = 'GET',
    body,
    signal,
  } = {},
) {
  if (
    typeof path !== 'string' ||
    !path.startsWith('/') ||
    path.startsWith('//')
  ) {
    throw new Error('Invalid API endpoint path.');
  }

  const headers = {
    Accept: 'application/json',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        method,
        headers,
        signal,
        ...(body === undefined
          ? {}
          : { body: JSON.stringify(body) }),
      },
    );
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error;
    }

    throw new Error(
      'Cannot connect to FoBeGoodFlow backend. ' +
      'Make sure NestJS is running on port 3000.',
    );
  }

  const rawResponse = await response.text();

  let data = null;

  if (rawResponse) {
    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = rawResponse;
    }
  }

  if (!response.ok) {
    const serverMessage = data?.message;

    const message = Array.isArray(serverMessage)
      ? serverMessage.join(', ')
      : typeof serverMessage === 'string'
        ? serverMessage
        : `Request failed with HTTP ${response.status}`;

    const error = new Error(message);
    error.status = response.status;

    throw error;
  }

  return data;
}
