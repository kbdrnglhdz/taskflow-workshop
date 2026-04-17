const API_BASE = 'http://localhost:3000/api';

export async function getAllTasks() {
  const response = await fetch(`${API_BASE}/tasks`);
  return response.json();
}

export async function getTaskById(id) {
  const response = await fetch(`${API_BASE}/tasks/${id}`);
  return response.json();
}

export async function createTask(title, description = '') {
  const response = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description })
  });
  return response.json();
}

export async function updateTask(id, data) {
  const response = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}

export async function toggleTask(id) {
  const response = await fetch(`${API_BASE}/tasks/${id}/toggle`, {
    method: 'PATCH'
  });
  return response.json();
}

export async function deleteTask(id) {
  const response = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'DELETE'
  });
  return response.json();
}

export async function getFilteredTasks(status) {
  const response = await fetch(`${API_BASE}/tasks/filter/${status}`);
  return response.json();
}

export async function getStats() {
  const response = await fetch(`${API_BASE}/stats`);
  return response.json();
}

export async function searchTasks(query) {
  const response = await fetch(`${API_BASE}/tasks/search/${query}`);
  return response.json();
}

export async function clearCompleted() {
  const response = await fetch(`${API_BASE}/tasks/completed/clear`, {
    method: 'DELETE'
  });
  return response.json();
}