const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');

/**
 * HANDLE RESPONSE SAFELY
 */
const handleResponse = async (response) => {
  const contentType = response.headers.get("content-type");
  let data = {};

  try {
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }
  } catch (e) {
    data = { message: "Internal server payload failure" };
  }

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  if (data && data.success !== undefined) {
    return data;
  }

  return { success: true, data };
};

const baseFetchOptions = {
  credentials: "include", // Keeps legacy cookie fallback alive
  cache: "no-store",
};

const getJsonHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
  };
  const token = localStorage.getItem("token");
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

/**
 * MAIN API OBJECT
 */
export const api = {

  // ================= AUTH =================

  login: async (credentials) => {
    const res = await fetch(`${API_BASE_URL}/user/login`, {
      method: "POST",
      headers: getJsonHeaders(),
      ...baseFetchOptions,
      body: JSON.stringify(credentials),
    });
    return handleResponse(res);
  },

  register: async (userData) => {
    const res = await fetch(`${API_BASE_URL}/user/register`, {
      method: "POST",
      headers: getJsonHeaders(),
      ...baseFetchOptions,
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  getSession: async () => {
    const res = await fetch(`${API_BASE_URL}/user/session`, {
      method: "GET",
      headers: getJsonHeaders(),
      ...baseFetchOptions,
    });
    return handleResponse(res);
  },

  logout: async () => {
    return { success: true };
  },

  // ================= ADMIN AUTH =================

  adminLogin: async (credentials) => {
    const res = await fetch(`${API_BASE_URL}/admin/login`, {
      method: "POST",
      headers: getJsonHeaders(),
      ...baseFetchOptions,
      body: JSON.stringify(credentials),
    });
    return handleResponse(res);
  },

  adminRegister: async (data) => {
    const res = await fetch(`${API_BASE_URL}/admin/register`, {
      method: "POST",
      headers: getJsonHeaders(),
      ...baseFetchOptions,
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // ================= STATIONS =================

  getStations: async (lat, lng, radius) => {
    let url = `${API_BASE_URL}/stations/user/search`;

    if (lat && lng) {
      url += `?latitude=${lat}&longitude=${lng}&radius=${radius || 50}`;
    }

    const res = await fetch(url, {
      method: "GET",
      headers: getJsonHeaders(),
      ...baseFetchOptions,
    });

    return handleResponse(res);
  },

  getStationRoutes: async (srcLat, srcLng, destLat, destLng, radius = 50, limit = 50) => {
    const res = await fetch(
      `${API_BASE_URL}/stations/user/search/route?srclatitude=${srcLat}&srclongitude=${srcLng}&destlatitude=${destLat}&destlongitude=${destLng}&radius=${radius}&limit=${limit}`,
      {
        method: "GET",
        headers: getJsonHeaders(),
        ...baseFetchOptions,
      }
    );

    return handleResponse(res);
  },

  getStationDetails: async (stationId) => {
    const res = await fetch(
      `${API_BASE_URL}/stations/user/search/?externalStationId=${stationId}`,
      {
        method: "GET",
        headers: getJsonHeaders(),
        ...baseFetchOptions,
      }
    );

    return handleResponse(res);
  },

  // ================= ADMIN STATIONS =================

  adminCreateStation: async (data) => {
    const res = await fetch(`${API_BASE_URL}/admin/stations`, {
      method: "POST",
      headers: getJsonHeaders(),
      ...baseFetchOptions,
      body: JSON.stringify(data),
    });

    return handleResponse(res);
  },

  adminUpdateStation: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/admin/stations/${payload.id || ''}`, {
      method: "PUT",
      headers: getJsonHeaders(),
      ...baseFetchOptions,
      body: JSON.stringify(payload),
    });

    return handleResponse(res);
  },

  adminDeleteStation: async (externalStationId) => {
    const res = await fetch(`${API_BASE_URL}/admin/stations/ext`, {
      method: "DELETE",
      headers: getJsonHeaders(),
      ...baseFetchOptions,
      body: JSON.stringify({ externalStationId }),
    });

    return handleResponse(res);
  },

  adminGetStation: async (id) => {
    const res = await fetch(`${API_BASE_URL}/admin/stations/${id}`, {
      method: "GET",
      headers: getJsonHeaders(),
      ...baseFetchOptions,
    });

    return handleResponse(res);
  },

  adminGetAllStations: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/stations`, {
      method: "GET",
      headers: getJsonHeaders(),
      ...baseFetchOptions,
    });

    return handleResponse(res);
  },

  adminGetBookings: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/bookings`, {
      method: "GET",
      headers: getJsonHeaders(),
      ...baseFetchOptions,
    });

    return handleResponse(res);
  },

  adminGetAnalytics: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/analytics`, {
      method: "GET",
      headers: getJsonHeaders(),
      ...baseFetchOptions,
    });

    return handleResponse(res);
  },

  // ================= BOOKINGS =================

  createBooking: async (data) => {
    const res = await fetch(`${API_BASE_URL}/booking/book`, {
      method: "POST",
      headers: getJsonHeaders(),
      ...baseFetchOptions,
      body: JSON.stringify(data),
    });

    return handleResponse(res);
  },

  getUserBookings: async () => {
    const res = await fetch(`${API_BASE_URL}/booking/my-bookings`, {
      method: "GET",
      headers: getJsonHeaders(),
      ...baseFetchOptions,
    });

    return handleResponse(res);
  },

  cancelBooking: async (bookingId) => {
    const res = await fetch(`${API_BASE_URL}/booking/cancel`, {
      method: "PATCH",
      headers: getJsonHeaders(),
      ...baseFetchOptions,
      body: JSON.stringify({ bookingId }),
    });

    return handleResponse(res);
  },

  // ================= PAYMENT =================

  verifyPayment: async (paymentData) => {
    const res = await fetch(`${API_BASE_URL}/payment/verify`, {
      method: "POST",
      headers: getJsonHeaders(),
      ...baseFetchOptions,
      body: JSON.stringify(paymentData),
    });

    return handleResponse(res);
  },

  // ================= QR / STATION =================

  bootStation: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/qr/boot`, {
      method: "POST",
      headers: getJsonHeaders(),
      ...baseFetchOptions,
      body: JSON.stringify(payload),
    });

    return handleResponse(res);
  },

  confirmQR: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/qr/confirm`, {
      method: "POST",
      headers: getJsonHeaders(),
      ...baseFetchOptions,
      body: JSON.stringify(payload),
    });

    return handleResponse(res);
  },

  cancelQRByStation: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/qr/cancel`, {
      method: "POST",
      headers: getJsonHeaders(),
      ...baseFetchOptions,
      body: JSON.stringify(payload),
    });

    return handleResponse(res);
  }
};