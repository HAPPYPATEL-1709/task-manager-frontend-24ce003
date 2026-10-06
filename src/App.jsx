import { useEffect, useState } from "react";
import {
    getTasks,
    createTask,
    updateTask,
    deleteTask
} from "./api";

import "./App.css";

function App() {
    const [tasks, setTasks] = useState([]);

    // Loading states
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    // Error state
    const [error, setError] = useState("");

    // Toast state
    const [toast, setToast] = useState({
        message: "",
        type: ""
    });

    // Form state
    const [form, setForm] = useState({
        title: "",
        description: "",
        priority: "medium"
    });

    // Edit state
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({
        title: "",
        description: "",
        priority: "medium",
        completed: false
    });

    // Show toast
    const showToast = (message, type = "success") => {
        setToast({
            message,
            type
        });

        setTimeout(() => {
            setToast({
                message: "",
                type: ""
            });
        }, 3000);
    };

    // Fetch tasks when page loads
    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getTasks();

            setTasks(data);
        } catch (err) {
            setError(err.message);
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // Handle form input
    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm({
            ...form,
            [name]: value
        });
    };

    // CREATE TASK
    const handleCreate = async (e) => {
        e.preventDefault();

        if (!form.title.trim() || !form.description.trim()) {
            showToast("Title and description are required", "error");
            return;
        }

        const temporaryTask = {
            _id: `temp-${Date.now()}`,
            title: form.title,
            description: form.description,
            priority: form.priority,
            completed: false
        };

        try {
            setCreating(true);
            setError("");

            // Optimistic UI
            setTasks((previousTasks) => [
                temporaryTask,
                ...previousTasks
            ]);

            const newTask = await createTask(form);

            // Replace temporary task with MongoDB task
            setTasks((previousTasks) =>
                previousTasks.map((task) =>
                    task._id === temporaryTask._id
                        ? newTask
                        : task
                )
            );

            setForm({
                title: "",
                description: "",
                priority: "medium"
            });

            showToast("Task created successfully!");
        } catch (err) {
            // Remove temporary task if API fails
            setTasks((previousTasks) =>
                previousTasks.filter(
                    (task) => task._id !== temporaryTask._id
                )
            );

            setError(err.message);
            showToast(err.message, "error");
        } finally {
            setCreating(false);
        }
    };

    // Start editing
    const startEdit = (task) => {
        setEditingId(task._id);

        setEditForm({
            title: task.title,
            description: task.description,
            priority: task.priority,
            completed: task.completed
        });
    };

    // Cancel editing
    const cancelEdit = () => {
        setEditingId(null);
    };

    // Handle edit input
    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;

        setEditForm({
            ...editForm,
            [name]: type === "checkbox" ? checked : value
        });
    };

    // UPDATE TASK
    const handleUpdate = async (id) => {
        if (
            !editForm.title.trim() ||
            !editForm.description.trim()
        ) {
            showToast("Title and description are required", "error");
            return;
        }

        try {
            setUpdatingId(id);
            setError("");

            const updatedTask = await updateTask(id, editForm);

            setTasks((previousTasks) =>
                previousTasks.map((task) =>
                    task._id === id ? updatedTask : task
                )
            );

            setEditingId(null);

            showToast("Task updated successfully!");
        } catch (err) {
            setError(err.message);
            showToast(err.message, "error");
        } finally {
            setUpdatingId(null);
        }
    };

    // DELETE TASK
    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this task?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingId(id);
            setError("");

            await deleteTask(id);

            setTasks((previousTasks) =>
                previousTasks.filter((task) => task._id !== id)
            );

            showToast("Task deleted successfully!");
        } catch (err) {
            setError(err.message);
            showToast(err.message, "error");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="app">
            {/* Toast */}
            {toast.message && (
                <div className={`toast ${toast.type}`}>
                    {toast.message}
                </div>
            )}

            <header className="header">
                <h1>Task Manager</h1>
                <p>React + Express + MongoDB</p>
            </header>

            <main className="container">

                {/* CREATE TASK */}
                <section className="card">
                    <h2>Create New Task</h2>

                    <form onSubmit={handleCreate}>

                        <div className="form-group">
                            <label>Title</label>

                            <input
                                type="text"
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                placeholder="Enter task title"
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>

                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Enter task description"
                                rows="4"
                            />
                        </div>

                        <div className="form-group">
                            <label>Priority</label>

                            <select
                                name="priority"
                                value={form.priority}
                                onChange={handleChange}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="btn primary"
                            disabled={creating}
                        >
                            {creating ? "Creating..." : "Add Task"}
                        </button>

                    </form>
                </section>

                {/* ERROR */}
                {error && (
                    <div className="error-box">
                        {error}
                    </div>
                )}

                {/* TASK LIST */}
                <section>
                    <div className="section-title">
                        <h2>Tasks</h2>

                        <button
                            className="btn secondary"
                            onClick={fetchTasks}
                            disabled={loading}
                        >
                            {loading ? "Loading..." : "Refresh"}
                        </button>
                    </div>

                    {loading ? (
                        <div className="loading">
                            Loading tasks...
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="empty">
                            No tasks found. Create your first task!
                        </div>
                    ) : (
                        <div className="task-list">

                            {tasks.map((task) => (

                                <div
                                    className="task-card"
                                    key={task._id}
                                >

                                    {editingId === task._id ? (

                                        /* EDIT FORM */

                                        <div>

                                            <input
                                                type="text"
                                                name="title"
                                                value={editForm.title}
                                                onChange={handleEditChange}
                                            />

                                            <textarea
                                                name="description"
                                                value={editForm.description}
                                                onChange={handleEditChange}
                                                rows="3"
                                            />

                                            <select
                                                name="priority"
                                                value={editForm.priority}
                                                onChange={handleEditChange}
                                            >
                                                <option value="low">
                                                    Low
                                                </option>

                                                <option value="medium">
                                                    Medium
                                                </option>

                                                <option value="high">
                                                    High
                                                </option>
                                            </select>

                                            <label className="checkbox">
                                                <input
                                                    type="checkbox"
                                                    name="completed"
                                                    checked={editForm.completed}
                                                    onChange={handleEditChange}
                                                />

                                                Completed
                                            </label>

                                            <div className="actions">

                                                <button
                                                    className="btn primary"
                                                    onClick={() =>
                                                        handleUpdate(task._id)
                                                    }
                                                    disabled={
                                                        updatingId === task._id
                                                    }
                                                >
                                                    {updatingId === task._id
                                                        ? "Updating..."
                                                        : "Save"}
                                                </button>

                                                <button
                                                    className="btn secondary"
                                                    onClick={cancelEdit}
                                                >
                                                    Cancel
                                                </button>

                                            </div>

                                        </div>

                                    ) : (

                                        /* TASK DISPLAY */

                                        <div>

                                            <div className="task-header">

                                                <h3>
                                                    {task.title}
                                                </h3>

                                                <span
                                                    className={`priority ${task.priority}`}
                                                >
                                                    {task.priority}
                                                </span>

                                            </div>

                                            <p>
                                                {task.description}
                                            </p>

                                            <div className="task-info">

                                                <span>
                                                    Status:{" "}
                                                    {task.completed
                                                        ? "Completed"
                                                        : "Pending"}
                                                </span>

                                            </div>

                                            <div className="actions">

                                                <button
                                                    className="btn secondary"
                                                    onClick={() =>
                                                        startEdit(task)
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    className="btn danger"
                                                    onClick={() =>
                                                        handleDelete(task._id)
                                                    }
                                                    disabled={
                                                        deletingId === task._id
                                                    }
                                                >
                                                    {deletingId === task._id
                                                        ? "Deleting..."
                                                        : "Delete"}
                                                </button>

                                            </div>

                                        </div>
                                    )}

                                </div>

                            ))}

                        </div>
                    )}

                </section>

            </main>
        </div>
    );
}

export default App;