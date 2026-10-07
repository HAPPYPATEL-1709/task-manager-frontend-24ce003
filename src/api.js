const BASE_URL = "http://localhost:5000";

// Token storage helpers
export const getToken = () => localStorage.getItem("token");
export const setToken = (token) => localStorage.setItem("token", token);
export const removeToken = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};

// Build request headers with Auth token
const getAuthHeaders = () => {
    const token = getToken();
    const headers = {
        "Content-Type": "application/json"
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
};

// Handle API response
const handleResponse = async (response) => {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        // If 401 Unauthorized, clear stored token for clean session reset
        if (response.status === 401) {
            removeToken();
            window.dispatchEvent(new Event("auth:unauthorized"));
        }

        const errorMessage = data.details
            ? Object.values(data.details).join(", ")
            : data.error || "Something went wrong";

        throw new Error(errorMessage);
    }

    return data;
};

/* ================= AUTHENTICATION APIS ================= */

// Register new user
export const registerUser = async (name, email, password) => {
    const response = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
    });

    const data = await handleResponse(response);
    if (data.token) {
        setToken(data.token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
    }
    return data;
};

// Login user
export const loginUser = async (email, password) => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await handleResponse(response);
    if (data.token) {
        setToken(data.token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
    }
    return data;
};

// Get current user details (/auth/me)
export const getMe = async () => {
    const response = await fetch(`${BASE_URL}/auth/me`, {
        headers: getAuthHeaders()
    });

    return handleResponse(response);
};

// Logout user
export const logoutUser = () => {
    removeToken();
};

/* ================= TASK APIS (PROTECTED) ================= */

// GET all tasks
export const getTasks = async () => {
    const response = await fetch(`${BASE_URL}/tasks`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

// GET single task
export const getTask = async (id) => {
    const response = await fetch(`${BASE_URL}/tasks/${id}`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

// CREATE task
export const createTask = async (task) => {
    const response = await fetch(`${BASE_URL}/tasks`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(task)
    });

    return handleResponse(response);
};

// UPDATE task
export const updateTask = async (id, task) => {
    const response = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(task)
    });

    return handleResponse(response);
};

// DELETE task
export const deleteTask = async (id) => {
    const response = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });

    return handleResponse(response);
};