const BASE_URL = "http://localhost:5000";

// Handle API response
const handleResponse = async (response) => {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
    }

    return data;
};

// GET all tasks
export const getTasks = async () => {
    const response = await fetch(`${BASE_URL}/tasks`);
    return handleResponse(response);
};

// GET single task
export const getTask = async (id) => {
    const response = await fetch(`${BASE_URL}/tasks/${id}`);
    return handleResponse(response);
};

// CREATE task
export const createTask = async (task) => {
    const response = await fetch(`${BASE_URL}/tasks`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(task)
    });

    return handleResponse(response);
};

// UPDATE task
export const updateTask = async (id, task) => {
    const response = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(task)
    });

    return handleResponse(response);
};

// DELETE task
export const deleteTask = async (id) => {
    const response = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: "DELETE"
    });

    return handleResponse(response);
};