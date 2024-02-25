const axios = require('axios');

// Axios instance with interceptor for automatic token refresh
const apiClient = axios.create();

// Placeholder for storing the access token
let accessToken =
  'BQCBI_e3tPKszBak89BdASwTFPzHx0KbjWuJHw4j9KmZuluqUQyIqMspGPI6rmUOTy0js3krQtb-d7W0maIohidgl7A5MbY6i1Eto5owNWbYdvU3amc';

// Function to get a new access token
async function refreshAccessToken() {
  try {
    const response = await axios.post(
      process.env.SPOTIFY_TOKEN_API,
      {
        grant_type: 'client_credentials',
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    accessToken = response.data.access_token;
    return accessToken;
  } catch (error) {
    console.error('Error refreshing access token:', error.response);
    throw error;
  }
}

apiClient.interceptors.request.use((config) => {
  // Automatically add token to all requests
  config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

apiClient.interceptors.response.use(undefined, async (error) => {
  // Check if we need to refresh the token
  const originalRequest = error.config;

  if (
    error.response.status === 401 &&
    (error.response.data.error.message === 'The access token expired' ||
      error.response.data.error.message === 'No token provided')
  ) {
    try {
      const newAccessToken = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest); // Retry the request with the new token
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }

  return Promise.reject(error);
});

module.exports = apiClient;
