/**
 * Get a cookie value by name
 * @param name The cookie name to retrieve
 * @returns The cookie value or empty string if not found
 */
export const getCookie = (name: string): string => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift() || '';
    return cookieValue;
  }
  return '';
};

/**
 * Set a cookie with the given name and value
 * @param name The cookie name
 * @param value The cookie value
 * @param days Optional number of days until the cookie expires
 */
export const setCookie = (name: string, value: string, days?: number): void => {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = `; expires=${date.toUTCString()}`;
  }
  document.cookie = `${name}=${value}${expires}; path=/`;
};

/**
 * Delete a cookie by name
 * @param name The cookie name to delete
 */
export const deleteCookie = (name: string): void => {
  document.cookie = `${name}=; Max-Age=-99999999; path=/`;
}; 