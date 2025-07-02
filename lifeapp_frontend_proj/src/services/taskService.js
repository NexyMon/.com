import apiClient from './api';

const API_ENDPOINT = '/tasks/'; // Basierend auf der Backend URL-Konfiguration /api/tasks/

const getAllTasks = () => {
  return apiClient.get(API_ENDPOINT);
};

const getTaskById = (id) => {
  return apiClient.get(`${API_ENDPOINT}${id}/`);
};

const createTask = (taskData) => {
  // taskData sollte ein Objekt sein, z.B. { title: "Neue Aufgabe", priority: 1, ... }
  // Der 'user' wird vom Backend automatisch gesetzt.
  return apiClient.post(API_ENDPOINT, taskData);
};

const updateTask = (id, taskData) => {
  return apiClient.put(`${API_ENDPOINT}${id}/`, taskData);
};

const partialUpdateTask = (id, taskData) => {
  // Für PATCH-Requests, falls nur Teile des Tasks aktualisiert werden sollen
  return apiClient.patch(`${API_ENDPOINT}${id}/`, taskData);
};

const deleteTask = (id) => {
  return apiClient.delete(`${API_ENDPOINT}${id}/`);
};

const taskService = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  partialUpdateTask,
  deleteTask,
};

export default taskService;
