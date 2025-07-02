import React, { useEffect, useState } from 'react';
import taskService from '../../services/taskService';
import TaskForm from './TaskForm'; // Importiere TaskForm für Bearbeitungsfunktionalität

function TaskList() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingTask, setEditingTask] = useState(null); // Task, der gerade bearbeitet wird

    const fetchTasks = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await taskService.getAllTasks();
            setTasks(response.data);
        } catch (err) {
            setError('Failed to load tasks. Please make sure you are logged in and try again.');
            console.error("Failed to fetch tasks:", err);
            if (err.response && err.response.status === 401) {
                 // Optional: Redirect to login if unauthorized
                 // navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleTaskCreated = (newTask) => {
        setTasks(prevTasks => [newTask, ...prevTasks]); // Füge neuen Task am Anfang der Liste hinzu
        // oder fetchTasks(); um die Liste komplett neu zu laden
    };

    const handleTaskUpdated = (updatedTask) => {
        setTasks(prevTasks => prevTasks.map(task => task.id === updatedTask.id ? updatedTask : task));
        setEditingTask(null); // Schließe das Bearbeitungsformular
    };

    const handleEdit = (task) => {
        setEditingTask(task);
    };

    const handleCancelEdit = () => {
        setEditingTask(null);
    };

    const handleDelete = async (taskId) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await taskService.deleteTask(taskId);
                setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
            } catch (err) {
                setError('Failed to delete task.');
                console.error("Failed to delete task:", err);
            }
        }
    };


    if (loading) return <p>Loading tasks...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div className="task-list-container">
            <h2>My Tasks</h2>

            {/* Formular zum Bearbeiten eines Tasks, wird nur angezeigt, wenn editingTask gesetzt ist */}
            {editingTask && (
                <div className="edit-task-form">
                    <TaskForm
                        taskToEdit={editingTask}
                        onTaskUpdated={handleTaskUpdated}
                        onCancelEdit={handleCancelEdit}
                    />
                    <hr />
                </div>
            )}

            {/* Optional: Formular zum Erstellen neuer Tasks immer anzeigen oder per Button einblenden */}
            {/* Für dieses Beispiel ist das Erstellformular in einer separaten Sektion oder Seite gedacht */}
            {/* <TaskForm onTaskCreated={handleTaskCreated} /> */}


            {tasks.length === 0 && !loading && <p>No tasks yet. Create one!</p>}

            <ul className="task-list">
                {tasks.map(task => (
                    <li key={task.id} className={`task-item status-${task.status} priority-${task.priority}`}>
                        <div className="task-details">
                            <h3>{task.title}</h3>
                            <p>{task.description || 'No description'}</p>
                            <small>
                                Priority: {task.priority} | Status: {task.status}
                                {task.due_date && ` | Due: ${new Date(task.due_date).toLocaleString()}`}
                                <br />
                                User: {task.user} (Created: {new Date(task.created_at).toLocaleDateString()})
                            </small>
                        </div>
                        <div className="task-actions">
                            <button onClick={() => handleEdit(task)}>Edit</button>
                            <button onClick={() => handleDelete(task.id)} style={{ marginLeft: '10px', backgroundColor: '#f44336' }}>Delete</button>
                        </div>
                    </li>
                ))}
            </ul>
            {/* Styling (Beispiel in App.css oder separater CSS-Datei)
            .task-item { border: 1px solid #ddd; margin-bottom: 10px; padding: 10px; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; }
            .task-details { flex-grow: 1; }
            .task-actions button { background-color: #4CAF50; color: white; border: none; padding: 8px 12px; cursor: pointer; border-radius: 4px; }
            .task-actions button:hover { background-color: #45a049; }
            */}
        </div>
    );
}

export default TaskList;
