import { useEffect, useState } from "react";
import {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    loginUser,
    registerUser,
    getMe,
    logoutUser,
    getToken
} from "./api";
import "./App.css";

function App() {
    // Auth state
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
    });
    const [token, setAuthToken] = useState(getToken());
    const [authMode, setAuthMode] = useState("login"); // "login" or "register"
    const [authForm, setAuthForm] = useState({
        name: "",
        email: "",
        password: ""
    });
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState("");

    // Task state
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    // Toast state
    const [toast, setToast] = useState({ message: "", type: "" });

    // Task Form state
    const [form, setForm] = useState({
        title: "",
        description: "",
        priority: "medium"
    });

    // Edit Form state
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({
        title: "",
        description: "",
        priority: "medium",
        completed: false
    });

    // Filter state
    const [filterPriority, setFilterPriority] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    // Show toast message
    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => {
            setToast({ message: "", type: "" });
        }, 3500);
    };

    // Listen for unauthorized 401 events to trigger logout
    useEffect(() => {
        const handleUnauthorized = () => {
            setUser(null);
            setAuthToken(null);
            showToast("Session expired. Please log in again.", "error");
        };

        window.addEventListener("auth:unauthorized", handleUnauthorized);
        return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
    }, []);

    // Initial check on mount: verify /me if token exists
    useEffect(() => {
        if (token) {
            getMe()
                .then((res) => {
                    setUser(res.user);
                    fetchTasks();
                })
                .catch(() => {
                    setUser(null);
                    setAuthToken(null);
                });
        }
    }, [token]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const data = await getTasks();
            setTasks(Array.isArray(data) ? data : []);
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    /* ================= AUTH HANDLERS ================= */

    const handleAuthChange = (e) => {
        setAuthForm({
            ...authForm,
            [e.target.name]: e.target.value
        });
        setAuthError("");
    };

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        setAuthError("");

        try {
            if (authMode === "register") {
                if (!authForm.name.trim() || authForm.name.trim().length < 2) {
                    throw new Error("Name must be at least 2 characters long");
                }
                if (!authForm.email.includes("@")) {
                    throw new Error("Please enter a valid email address");
                }
                if (authForm.password.length < 6) {
                    throw new Error("Password must be at least 6 characters long");
                }

                const data = await registerUser(authForm.name, authForm.email, authForm.password);
                setUser(data.user);
                setAuthToken(data.token);
                showToast(`Welcome, ${data.user.name}! Account registered.`);
            } else {
                if (!authForm.email || !authForm.password) {
                    throw new Error("Email and password are required");
                }

                const data = await loginUser(authForm.email, authForm.password);
                setUser(data.user);
                setAuthToken(data.token);
                showToast(`Welcome back, ${data.user.name}!`);
            }
            setAuthForm({ name: "", email: "", password: "" });
        } catch (err) {
            setAuthError(err.message);
            showToast(err.message, "error");
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogout = () => {
        logoutUser();
        setUser(null);
        setAuthToken(null);
        setTasks([]);
        showToast("Logged out successfully");
    };

    /* ================= TASK HANDLERS ================= */

    const handleTaskChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.description.trim()) {
            showToast("Title and description are required", "error");
            return;
        }

        try {
            setCreating(true);
            const newTask = await createTask({
                title: form.title.trim(),
                description: form.description.trim(),
                priority: form.priority
            });

            setTasks([newTask, ...tasks]);
            setForm({ title: "", description: "", priority: "medium" });
            showToast("Task created successfully!");
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setCreating(false);
        }
    };

    const handleStartEdit = (task) => {
        setEditingId(task._id);
        setEditForm({
            title: task.title,
            description: task.description,
            priority: task.priority,
            completed: task.completed
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
    };

    const handleSaveEdit = async (id) => {
        if (!editForm.title.trim() || !editForm.description.trim()) {
            showToast("Title and description cannot be empty", "error");
            return;
        }

        try {
            setUpdatingId(id);
            const updated = await updateTask(id, editForm);
            setTasks(tasks.map((t) => (t._id === id ? updated : t)));
            setEditingId(null);
            showToast("Task updated successfully!");
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleToggleComplete = async (task) => {
        try {
            setUpdatingId(task._id);
            const updated = await updateTask(task._id, {
                completed: !task.completed
            });
            setTasks(tasks.map((t) => (t._id === task._id ? updated : t)));
            showToast(
                `Task marked as ${updated.completed ? "completed" : "pending"}`
            );
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDeleteTask = async (id) => {
        if (!window.confirm("Are you sure you want to delete this task?")) return;

        try {
            setDeletingId(id);
            await deleteTask(id);
            setTasks(tasks.filter((t) => t._id !== id));
            showToast("Task deleted successfully");
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setDeletingId(null);
        }
    };

    // Filter tasks
    const filteredTasks = tasks.filter((t) => {
        const matchesPriority =
            filterPriority === "all" || t.priority === filterPriority;
        const matchesSearch =
            t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesPriority && matchesSearch;
    });

    return (
        <div className="app">
            {/* TOAST NOTIFICATION */}
            {toast.message && (
                <div className={`toast ${toast.type}`}>
                    {toast.type === "success" ? "✓ " : "⚠ "}
                    {toast.message}
                </div>
            )}

            {/* HEADER */}
            <header className="header">
                <div className="header-container">
                    <div>
                        <h1>Task Management System</h1>
                        <p className="subtitle">
                            Practical 7: JWT Authentication & Middleware Pipeline
                        </p>
                    </div>

                    {user && (
                        <div className="user-profile-bar">
                            <div className="user-badge">
                                <span className="user-avatar">
                                    {user.name ? user.name[0].toUpperCase() : "U"}
                                </span>
                                <div className="user-info-text">
                                    <strong>{user.name}</strong>
                                    <small>{user.email}</small>
                                </div>
                            </div>
                            <button className="btn logout-btn" onClick={handleLogout}>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="container">
                {!user ? (
                    /* AUTHENTICATION VIEW */
                    <div className="auth-card">
                        <div className="auth-tabs">
                            <button
                                className={`auth-tab ${authMode === "login" ? "active" : ""}`}
                                onClick={() => {
                                    setAuthMode("login");
                                    setAuthError("");
                                }}
                            >
                                Login
                            </button>
                            <button
                                className={`auth-tab ${authMode === "register" ? "active" : ""}`}
                                onClick={() => {
                                    setAuthMode("register");
                                    setAuthError("");
                                }}
                            >
                                Register
                            </button>
                        </div>

                        <h2>
                            {authMode === "login"
                                ? "Sign in with JWT"
                                : "Create a Secure Account"}
                        </h2>
                        <p className="auth-desc">
                            {authMode === "login"
                                ? "Enter your credentials to receive a signed JWT token."
                                : "Passwords are automatically hashed with bcrypt before saving."}
                        </p>

                        {authError && <div className="error-box">{authError}</div>}

                        <form onSubmit={handleAuthSubmit} className="auth-form">
                            {authMode === "register" && (
                                <div className="form-group">
                                    <label htmlFor="auth-name">Full Name</label>
                                    <input
                                        id="auth-name"
                                        type="text"
                                        name="name"
                                        placeholder="e.g. Alex Johnson"
                                        value={authForm.name}
                                        onChange={handleAuthChange}
                                        required
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="auth-email">Email Address</label>
                                <input
                                    id="auth-email"
                                    type="email"
                                    name="email"
                                    placeholder="e.g. alex@example.com"
                                    value={authForm.email}
                                    onChange={handleAuthChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="auth-password">Password</label>
                                <input
                                    id="auth-password"
                                    type="password"
                                    name="password"
                                    placeholder="Minimum 6 characters"
                                    value={authForm.password}
                                    onChange={handleAuthChange}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn primary submit-btn"
                                disabled={authLoading}
                            >
                                {authLoading
                                    ? "Authenticating..."
                                    : authMode === "login"
                                    ? "Login to Dashboard"
                                    : "Register & Generate Token"}
                            </button>
                        </form>
                    </div>
                ) : (
                    /* PROTECTED TASK DASHBOARD */
                    <div className="dashboard-grid">
                        {/* CREATE TASK CARD */}
                        <div className="card create-card">
                            <h2>+ Create New Task</h2>
                            <form onSubmit={handleCreateTask}>
                                <div className="form-group">
                                    <label htmlFor="task-title">Title</label>
                                    <input
                                        id="task-title"
                                        type="text"
                                        name="title"
                                        placeholder="e.g. Implement Auth Middleware"
                                        value={form.title}
                                        onChange={handleTaskChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="task-desc">Description</label>
                                    <textarea
                                        id="task-desc"
                                        name="description"
                                        rows="3"
                                        placeholder="Detailed task description..."
                                        value={form.description}
                                        onChange={handleTaskChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="task-priority">Priority</label>
                                    <select
                                        id="task-priority"
                                        name="priority"
                                        value={form.priority}
                                        onChange={handleTaskChange}
                                    >
                                        <option value="low">Low Priority</option>
                                        <option value="medium">Medium Priority</option>
                                        <option value="high">High Priority</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    className="btn primary"
                                    disabled={creating}
                                >
                                    {creating ? "Saving Task..." : "Add Task"}
                                </button>
                            </form>
                        </div>

                        {/* TASK LIST & CONTROLS */}
                        <div className="tasks-section">
                            <div className="filter-bar card">
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />

                                <select
                                    value={filterPriority}
                                    onChange={(e) => setFilterPriority(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="all">All Priorities</option>
                                    <option value="low">Low Priority</option>
                                    <option value="medium">Medium Priority</option>
                                    <option value="high">High Priority</option>
                                </select>

                                <button
                                    className="btn secondary refresh-btn"
                                    onClick={fetchTasks}
                                    disabled={loading}
                                >
                                    {loading ? "Refreshing..." : "↻ Refresh"}
                                </button>
                            </div>

                            <div className="section-title">
                                <h2>Your Tasks ({filteredTasks.length})</h2>
                            </div>

                            {loading ? (
                                <div className="loading card">Loading tasks securely...</div>
                            ) : filteredTasks.length === 0 ? (
                                <div className="empty card">
                                    <h3>No tasks found</h3>
                                    <p>Create your first task using the form above.</p>
                                </div>
                            ) : (
                                filteredTasks.map((task) => (
                                    <div
                                        key={task._id}
                                        className={`task-card ${
                                            task.completed ? "task-completed" : ""
                                        }`}
                                    >
                                        {editingId === task._id ? (
                                            /* EDIT TASK MODE */
                                            <div className="edit-form">
                                                <input
                                                    type="text"
                                                    value={editForm.title}
                                                    onChange={(e) =>
                                                        setEditForm({
                                                            ...editForm,
                                                            title: e.target.value
                                                        })
                                                    }
                                                />
                                                <textarea
                                                    rows="3"
                                                    value={editForm.description}
                                                    onChange={(e) =>
                                                        setEditForm({
                                                            ...editForm,
                                                            description: e.target.value
                                                        })
                                                    }
                                                />
                                                <select
                                                    value={editForm.priority}
                                                    onChange={(e) =>
                                                        setEditForm({
                                                            ...editForm,
                                                            priority: e.target.value
                                                        })
                                                    }
                                                >
                                                    <option value="low">Low</option>
                                                    <option value="medium">Medium</option>
                                                    <option value="high">High</option>
                                                </select>
                                                <div className="actions">
                                                    <button
                                                        className="btn primary"
                                                        onClick={() => handleSaveEdit(task._id)}
                                                        disabled={updatingId === task._id}
                                                    >
                                                        {updatingId === task._id ? "Saving..." : "Save"}
                                                    </button>
                                                    <button
                                                        className="btn secondary"
                                                        onClick={handleCancelEdit}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* VIEW TASK MODE */
                                            <div>
                                                <div className="task-header">
                                                    <h3
                                                        style={{
                                                            textDecoration: task.completed
                                                                ? "line-through"
                                                                : "none",
                                                            color: task.completed
                                                                ? "#9ca3af"
                                                                : "#111827"
                                                        }}
                                                    >
                                                        {task.title}
                                                    </h3>
                                                    <span className={`priority ${task.priority}`}>
                                                        {task.priority}
                                                    </span>
                                                </div>

                                                <p className="task-description">
                                                    {task.description}
                                                </p>

                                                <div className="task-footer">
                                                    <label className="checkbox">
                                                        <input
                                                            type="checkbox"
                                                            checked={Boolean(task.completed)}
                                                            onChange={() => handleToggleComplete(task)}
                                                            disabled={updatingId === task._id}
                                                        />
                                                        <span>
                                                            {task.completed
                                                                ? "Completed"
                                                                : "Mark as Completed"}
                                                        </span>
                                                    </label>

                                                    <div className="actions">
                                                        <button
                                                            className="btn secondary edit-btn"
                                                            onClick={() => handleStartEdit(task)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="btn danger"
                                                            onClick={() => handleDeleteTask(task._id)}
                                                            disabled={deletingId === task._id}
                                                        >
                                                            {deletingId === task._id
                                                                ? "Deleting..."
                                                                : "Delete"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;