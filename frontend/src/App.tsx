import { useState, useEffect } from 'react';
import './index.css';
import * as api from './api';
import type { Task, TaskStats, FilterType } from './types';

function App() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [stats, setStats] = useState<TaskStats>({ total: 0, completed: 0, active: 0 });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [localStorageTasks, setLocalStorageTasks] = useState<Task[]>([]);

  useEffect(() => {
    loadTasks();
    loadStats();
    loadLocalStorage();
    const interval = setInterval(() => {
      loadLocalStorage();
    }, 5000);
    return () => clearInterval(interval);
  }, [filter]);

  useEffect(() => {
    if (filter === 'all') {
      loadTasks();
    } else if (filter === 'active') {
      loadFilteredTasks('active');
    } else if (filter === 'completed') {
      loadFilteredTasks('completed');
    }
  }, [filter]);

  function loadTasks() {
    api.getAllTasks().then(data => {
      setTasks(data);
      saveToLocalStorage(data);
    });
  }

  function loadFilteredTasks(status: string) {
    api.getFilteredTasks(status).then(data => {
      setTasks(data);
      saveToLocalStorage(data);
    });
  }

  function loadStats() {
    api.getStats().then(data => {
      setStats(data);
    });
  }

  function loadLocalStorage() {
    const saved = localStorage.getItem('taskflow_tasks');
    if (saved) {
      setLocalStorageTasks(JSON.parse(saved));
    }
  }

  function saveToLocalStorage(taskList: Task[]) {
    localStorage.setItem('taskflow_tasks', JSON.stringify(taskList));
  }

  function handleCreateTask(e: any) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    api.createTask(newTaskTitle, newTaskDescription).then(() => {
      setNewTaskTitle('');
      setNewTaskDescription('');
      setShowForm(false);
      loadTasks();
      loadStats();
      loadLocalStorage();
    });
  }

  function handleToggleTask(id: number) {
    api.toggleTask(id).then(() => {
      loadTasks();
      loadStats();
      loadLocalStorage();
    });
  }

  function handleDeleteTask(id: number) {
    api.deleteTask(id).then(() => {
      loadTasks();
      loadStats();
      loadLocalStorage();
    });
  }

  function handleEditTask(task: Task) {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
  }

  function handleSaveEdit(e: any) {
    e.preventDefault();
    if (!editingTask) return;
    api.updateTask(editingTask.id, {
      title: editTitle,
      description: editDescription
    }).then(() => {
      setEditingTask(null);
      setEditTitle('');
      setEditDescription('');
      loadTasks();
      loadStats();
      loadLocalStorage();
    });
  }

  function handleCancelEdit() {
    setEditingTask(null);
    setEditTitle('');
    setEditDescription('');
  }

  function handleSearch(e: any) {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadTasks();
      return;
    }
    api.searchTasks(searchQuery).then(data => {
      setTasks(data);
    });
  }

  function handleClearCompleted() {
    if (confirm('Are you sure you want to delete all completed tasks?')) {
      api.clearCompleted().then(() => {
        loadTasks();
        loadStats();
        loadLocalStorage();
      });
    }
  }

  function handleRefresh() {
    loadTasks();
    loadStats();
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', color: '#333', fontSize: '2.5rem', marginBottom: '10px' }}>TaskFlow</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>Personal Task Manager</p>

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div>
              <button onClick={() => setFilter('all')} style={{ marginRight: '10px', padding: '8px 16px', background: filter === 'all' ? '#007bff' : '#fff', color: filter === 'all' ? '#fff' : '#333', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>All</button>
              <button onClick={() => setFilter('active')} style={{ marginRight: '10px', padding: '8px 16px', background: filter === 'active' ? '#007bff' : '#fff', color: filter === 'active' ? '#fff' : '#333', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>Active</button>
              <button onClick={() => setFilter('completed')} style={{ padding: '8px 16px', background: filter === 'completed' ? '#007bff' : '#fff', color: filter === 'completed' ? '#fff' : '#333', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>Completed</button>
            </div>
            <button onClick={handleRefresh} style={{ padding: '8px 16px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Refresh</button>
          </div>

          <form onSubmit={handleSearch} style={{ display: 'flex', marginBottom: '15px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginRight: '10px' }}
            />
            <button type="submit" style={{ padding: '10px 20px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Search</button>
          </form>

          <button onClick={() => setShowForm(!showForm)} style={{ width: '100%', padding: '12px', background: showForm ? '#dc3545' : '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '15px' }}>
            {showForm ? 'Cancel' : 'Add New Task'}
          </button>

          {showForm && (
            <form onSubmit={handleCreateTask} style={{ padding: '15px', background: '#f8f9fa', borderRadius: '4px', marginBottom: '15px' }}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Title</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Enter task title"
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description</label>
                <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Enter task description (optional)"
                  rows={3}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
              <button type="submit" style={{ padding: '10px 20px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create Task</button>
            </form>
          )}
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>Statistics</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>{stats.total}</div>
              <div style={{ color: '#666' }}>Total</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>{stats.active}</div>
              <div style={{ color: '#666' }}>Active</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc3545' }}>{stats.completed}</div>
              <div style={{ color: '#666' }}>Completed</div>
            </div>
          </div>
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <span style={{ color: '#666' }}>Local storage backup: {localStorageTasks.length} tasks</span>
          </div>
        </div>

        {filter === 'completed' && tasks.some(t => t.completed === 1) && (
          <button onClick={handleClearCompleted} style={{ width: '100%', padding: '10px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '20px' }}>
            Clear Completed Tasks
          </button>
        )}

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>
            Tasks ({tasks.length})
          </h2>

          {tasks.length === 0 && (
            <p style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>No tasks found. Create your first task!</p>
          )}

          {tasks.map(task => (
            <div key={task.id} style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              {editingTask && editingTask.id === task.id ? (
                <form onSubmit={handleSaveEdit} style={{ width: '100%' }}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                    style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                  <div>
                    <button type="submit" style={{ padding: '8px 16px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}>Save</button>
                    <button type="button" onClick={handleCancelEdit} style={{ padding: '8px 16px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <input
                    type="checkbox"
                    checked={task.completed === 1}
                    onChange={() => handleToggleTask(task.id)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', marginTop: '5px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: '500', color: task.completed === 1 ? '#999' : '#333', textDecoration: task.completed === 1 ? 'line-through' : 'none' }}>
                      {task.title}
                    </div>
                    {task.description && (
                      <div style={{ color: '#666', marginTop: '5px' }}>{task.description}</div>
                    )}
                    <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '5px' }}>
                      Created: {new Date(task.created_at).toLocaleDateString()} {new Date(task.created_at).toLocaleTimeString()}
                      {task.updated_at && ` | Updated: ${new Date(task.updated_at).toLocaleDateString()} ${new Date(task.updated_at).toLocaleTimeString()}`}
                    </div>
                  </div>
                  <div>
                    <button onClick={() => handleEditTask(task)} style={{ padding: '6px 12px', background: '#ffc107', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>Edit</button>
                    <button onClick={() => handleDeleteTask(task.id)} style={{ padding: '6px 12px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px', padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#333' }}>Debug Info</h3>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>Current filter: {filter}</p>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>Tasks in state: {tasks.length}</p>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>LocalStorage tasks: {localStorageTasks.length}</p>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>Form visible: {showForm ? 'Yes' : 'No'}</p>
          {editingTask && <p style={{ color: '#666', fontSize: '0.9rem' }}>Editing task ID: {editingTask.id}</p>}
        </div>

        <footer style={{ textAlign: 'center', marginTop: '40px', padding: '20px', color: '#999' }}>
          <p>TaskFlow v1.0.0 | Personal Task Manager</p>
          <p>Data persisted in SQLite database + LocalStorage backup</p>
        </footer>
      </div>
    </div>
  );
}

export default App;