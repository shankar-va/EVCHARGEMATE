const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to handle fetch responses and extract JSON data or errors
const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again later.');
  }
  return data;
};

// Config for sending JSON payloads securely with cookies
const getJsonHeaders = () => {
  return {
    'Content-Type': 'application/json'
  };
};

export const api = {
  // --- AUTH ROUTES ---
  login: async (credentials) => {
    const res = await fetch(`${API_BASE_URL}/user/login`, {
      method: 'POST',
      headers: getJsonHeaders(),
      credentials: 'include', // vital for receiving HttpOnly cookie
      body: JSON.stringify(credentials),
    });
    return handleResponse(res);
  },

  register: async (userData) => {
    const res = await fetch(`${API_BASE_URL}/user/register`, {
      method: 'POST',
      headers: getJsonHeaders(),
      credentials: 'include',
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  getSession: async () => {
    const res = await fetch(`${API_BASE_URL}/user/session`, {
      method: 'GET',
      headers: getJsonHeaders(),
      credentials: 'include', // vital for reading HttpOnly Google OAuth cookie
    });
    return handleResponse(res);
  },
  logout: async () => {
    // A secure system would call a backend endpoint to clear the HttpOnly cookie.
    // Assuming backend clear doesn't exist yet, we just remove client state.
    // If you add a `/user/logout` route later, call it here.
    return { success: true };
  },

  // --- STATION ROUTES ---
  getStations: async (lat, lng, radius) => {
    // using the valid user/search route defined in backend
    let url = `${API_BASE_URL}/stations/user/search`;
    if (lat && lng) {
      url += `?latitude=${lat}&longitude=${lng}&radius=${radius || 50}`;
    }
    const res = await fetch(url, {
      method: 'GET',
      headers: getJsonHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  getStationRoutes: async (srcLat, srcLng, destLat, destLng, radius = 50, limit = 50) => {
    console.log("🚀 FRONTEND REQUEST:", {
      srcLat, srcLng, destLat, destLng, radius, limit
    });
    if (
      srcLat === undefined || srcLng === undefined ||
      destLat === undefined || destLng === undefined
    ) {
      throw new Error("Invalid coordinates from frontend");
    }

    const res = await fetch(
      `${API_BASE_URL}/stations/user/search/route?srclatitude=${srcLat}&srclongitude=${srcLng}&destlatitude=${destLat}&destlongitude=${destLng}&radius=${radius}&limit=${limit}`,
      {
        method: 'GET',
        headers: getJsonHeaders(),
        credentials: 'include'
      }
    );

    return handleResponse(res);
  },

  getStationDetails: async (stationId) => {
    const res = await fetch(`${API_BASE_URL}/stations/user/search/?externalStationId=${stationId}`, {
      method: 'GET',
      headers: getJsonHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // --- BOOKING ROUTES ---
  createBooking: async (bookingData) => {
    const res = await fetch(`${API_BASE_URL}/booking/book`, {
      method: 'POST',
      headers: getJsonHeaders(),
      credentials: 'include',
      body: JSON.stringify(bookingData),
    });
    return handleResponse(res);
  },

  getUserBookings: async () => {
    const res = await fetch(`${API_BASE_URL}/booking/my-bookings`, {
      method: 'GET',
      headers: getJsonHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // --- PAYMENT ROUTES ---
  verifyPayment: async (paymentData) => {
    const res = await fetch(`${API_BASE_URL}/payment/verify`, {
      method: 'POST',
      headers: getJsonHeaders(),
      credentials: 'include',
      body: JSON.stringify(paymentData),
    });
    return handleResponse(res);
  }
};
