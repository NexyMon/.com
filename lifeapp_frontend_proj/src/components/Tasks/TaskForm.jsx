import React, { useState } from 'react';
import taskService from '../../services/taskService';

// Die Prioritäts- und Statusoptionen sollten mit denen im Backend (Task-Modell) übereinstimmen
const PRIORITY_CHOICES = [
    { value: 1, label: 'Sehr Hoch (Sofort)' },
    { value: 2, label: 'Hoch' },
    { value: 3, label: 'Mittel' },
    { value: 4, label: 'Niedrig' },
    { value: 5, label: 'Sehr Niedrig (Später)' },
];

const STATUS_CHOICES = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
];

function TaskForm({ taskToEdit, onTaskCreated, onTaskUpdated, onCancelEdit }) {
    const [title, setTitle] = useState(taskToEdit ? taskToEdit.title : '');
    const [description, setDescription] = useState(taskToEdit ? taskToEdit.description : '');
    const [priority, setPriority] = useState(taskToEdit ? taskToEdit.priority : 3);
    const [dueDate, setDueDate] = useState(taskToEdit && taskToEdit.due_date ? taskToEdit.due_date.substring(0, 16) : ''); // Format für datetime-local
    const [status, setStatus] = useState(taskToEdit ? taskToEdit.status : 'todo');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const taskData = {
            title,
            description,
            priority: parseInt(priority), // Sicherstellen, dass es eine Zahl ist
            due_date: dueDate || null, // Leeren String als null senden, falls nicht gesetzt
            status,
        };

        try {
            if (taskToEdit) {
                const updatedTask = await taskService.updateTask(taskToEdit.id, taskData);
                if (onTaskUpdated) onTaskUpdated(updatedTask.data);
                setSuccess('Task successfully updated!');
            } else {
                const newTask = await taskService.createTask(taskData);
                if (onTaskCreated) onTaskCreated(newTask.data);
                setSuccess('Task successfully created!');
                // Formular zurücksetzen nach erfolgreicher Erstellung
                setTitle('');
                setDescription('');
                setPriority(3);
                setDueDate('');
                setStatus('todo');
            }
            // Optional: Erfolgsmeldung nach kurzer Zeit ausblenden oder Form schließen
            setTimeout(() => setSuccess(''), 3000);

        } catch (err) {
            let errorMessages = 'Operation failed.';
            if (err.response && err.response.data) {
                const errorData = err.response.data;
                errorMessages = Object.keys(errorData)
                    .map(key => `${key}: ${Array.isArray(errorData[key]) ? errorData[key].join(', ') : errorData[key]}`)
                    .join(' ');
            }
            setError(errorMessages);
            console.error("Task operation failed:", err);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="task-form">
            <h3>{taskToEdit ? 'Edit Task' : 'Create New Task'}</h3>
            {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
            {success && <p className="success-message" style={{ color: 'green' }}>{success}</p>}

            <div>
                <label htmlFor="title">Title:</label>
                <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="description">Description (optional):</label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>
            <div>
                <label htmlFor="priority">Priority:</label>
                <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                >
                    {PRIORITY_CHOICES.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="dueDate">Due Date (optional):</label>
                <input
                    type="datetime-local" // Erlaubt Auswahl von Datum und Zeit
                    id="dueDate"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                />
            </div>
            <div>
                <label htmlFor="status">Status:</label>
                <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                >
                    {STATUS_CHOICES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                </select>
            </div>
            <button type="submit">{taskToEdit ? 'Update Task' : 'Create Task'}</button>
            {taskToEdit && onCancelEdit && (
                <button type="button" onClick={onCancelEdit} style={{ marginLeft: '10px' }}>
                    Cancel Edit
                </button>
            )}
        </form>
    );
}

export default TaskForm;
