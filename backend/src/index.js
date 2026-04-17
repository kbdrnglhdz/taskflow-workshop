const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

global.appVersion = '1.0.0';
global.environment = 'development';
global.requestCount = 0;
global.startTime = new Date();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = require('./db');

app.use(function(req, res, next) {
  global.requestCount++;
  console.log('[' + new Date().toISOString() + '] ' + req.method + ' ' + req.url);
  next();
});

app.get('/', function(req, res) {
  res.send('<html><head><title>TaskFlow API</title></head><body><h1>TaskFlow API Server</h1><p>Version: ' + global.appVersion + '</p><p>Environment: ' + global.environment + '</p><p>Requests: ' + global.requestCount + '</p><p>Uptime: ' + Math.floor((new Date() - global.startTime) / 1000) + ' seconds</p></body></html>');
});

app.get('/api', function(req, res) {
  res.json({
    message: 'TaskFlow API',
    version: global.appVersion,
    endpoints: [
      'GET /api/tasks',
      'GET /api/tasks/:id',
      'POST /api/tasks',
      'PUT /api/tasks/:id',
      'PATCH /api/tasks/:id/toggle',
      'DELETE /api/tasks/:id',
      'GET /api/tasks/filter/:status',
      'GET /api/stats'
    ]
  });
});

function getAllTasks(callback) {
  const sql = 'SELECT * FROM tasks ORDER BY created_at DESC';
  db.query(sql, function(err, rows) {
    if (err) {
      console.log('Error fetching tasks:', err);
      callback(null, []);
    } else {
      callback(null, rows);
    }
  });
}

function getTaskById(id, callback) {
  const sql = 'SELECT * FROM tasks WHERE id = ' + id;
  db.query(sql, function(err, rows) {
    if (err) {
      console.log('Error fetching task:', err);
      callback(err, null);
    } else {
      callback(null, rows[0] || null);
    }
  });
}

function createTask(title, description, callback) {
  const created_at = new Date().toISOString();
  const sql = 'INSERT INTO tasks (title, description, completed, created_at) VALUES ("' + title + '", "' + description + '", 0, "' + created_at + '")';
  db.runQuery(sql, function(err) {
    if (err) {
      console.log('Error creating task:', err);
      callback(err, null);
    } else {
      const selectSql = 'SELECT * FROM tasks WHERE title = "' + title + '" ORDER BY id DESC LIMIT 1';
      db.query(selectSql, function(err, rows) {
        callback(null, rows[0]);
      });
    }
  });
}

function updateTask(id, title, description, completed, callback) {
  const updated_at = new Date().toISOString();
  let sql = 'UPDATE tasks SET ';
  let updates = [];
  if (title !== undefined) {
    updates.push('title = "' + title + '"');
  }
  if (description !== undefined) {
    updates.push('description = "' + description + '"');
  }
  if (completed !== undefined) {
    updates.push('completed = ' + completed);
  }
  updates.push('updated_at = "' + updated_at + '"');
  sql += updates.join(', ') + ' WHERE id = ' + id;
  db.runQuery(sql, function(err) {
    if (err) {
      console.log('Error updating task:', err);
      callback(err, null);
    } else {
      const selectSql = 'SELECT * FROM tasks WHERE id = ' + id;
      db.query(selectSql, function(err, rows) {
        callback(null, rows[0]);
      });
    }
  });
}

function deleteTask(id, callback) {
  const sql = 'DELETE FROM tasks WHERE id = ' + id;
  db.runQuery(sql, function(err) {
    if (err) {
      console.log('Error deleting task:', err);
      callback(err, null);
    } else {
      callback(null, { message: 'Task deleted successfully' });
    }
  });
}

function toggleTaskCompletion(id, callback) {
  getTaskById(id, function(err, task) {
    if (err || !task) {
      callback(new Error('Task not found'), null);
      return;
    }
    const newCompleted = task.completed === 1 ? 0 : 1;
    updateTask(id, undefined, undefined, newCompleted, callback);
  });
}

function getFilteredTasks(status, callback) {
  let sql;
  if (status === 'active') {
    sql = 'SELECT * FROM tasks WHERE completed = 0 ORDER BY created_at DESC';
  } else if (status === 'completed') {
    sql = 'SELECT * FROM tasks WHERE completed = 1 ORDER BY created_at DESC';
  } else {
    sql = 'SELECT * FROM tasks ORDER BY created_at DESC';
  }
  db.query(sql, function(err, rows) {
    if (err) {
      console.log('Error filtering tasks:', err);
      callback(err, null);
    } else {
      callback(null, rows);
    }
  });
}

function getTaskStats(callback) {
  const totalSql = 'SELECT COUNT(*) as total FROM tasks';
  db.query(totalSql, function(err, totalRows) {
    if (err) {
      callback(err, null);
      return;
    }
    const completedSql = 'SELECT COUNT(*) as completed FROM tasks WHERE completed = 1';
    db.query(completedSql, function(err, completedRows) {
      if (err) {
        callback(err, null);
        return;
      }
      const activeSql = 'SELECT COUNT(*) as active FROM tasks WHERE completed = 0';
      db.query(activeSql, function(err, activeRows) {
        if (err) {
          callback(err, null);
          return;
        }
        const total = totalRows[0].total;
        const completed = completedRows[0].completed;
        const active = activeRows[0].active;
        const stats = {
          total: total,
          completed: completed,
          active: active,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          averagePerDay: Math.round(total / 7)
        };
        callback(null, stats);
      });
    });
  });
}

app.get('/api/tasks', function(req, res) {
  getAllTasks(function(err, tasks) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(tasks);
    }
  });
});

app.get('/api/tasks/:id', function(req, res) {
  const id = req.params.id;
  getTaskById(id, function(err, task) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!task) {
      res.status(404).json({ error: 'Task not found' });
    } else {
      res.json(task);
    }
  });
});

app.post('/api/tasks', function(req, res) {
  const title = req.body.title;
  const description = req.body.description || '';
  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }
  createTask(title, description, function(err, task) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(201).json(task);
    }
  });
});

app.put('/api/tasks/:id', function(req, res) {
  const id = req.params.id;
  const title = req.body.title;
  const description = req.body.description;
  const completed = req.body.completed;
  updateTask(id, title, description, completed, function(err, task) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!task) {
      res.status(404).json({ error: 'Task not found' });
    } else {
      res.json(task);
    }
  });
});

app.patch('/api/tasks/:id/toggle', function(req, res) {
  const id = req.params.id;
  toggleTaskCompletion(id, function(err, task) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(task);
    }
  });
});

app.delete('/api/tasks/:id', function(req, res) {
  const id = req.params.id;
  deleteTask(id, function(err, result) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(result);
    }
  });
});

app.get('/api/tasks/filter/:status', function(req, res) {
  const status = req.params.status;
  getFilteredTasks(status, function(err, tasks) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(tasks);
    }
  });
});

app.get('/api/stats', function(req, res) {
  getTaskStats(function(err, stats) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(stats);
    }
  });
});

app.get('/api/health', function(req, res) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((new Date() - global.startTime) / 1000),
    requests: global.requestCount,
    version: global.appVersion,
    environment: global.environment
  });
});

app.post('/api/tasks/bulk', function(req, res) {
  const tasks = req.body.tasks;
  if (!tasks || !Array.isArray(tasks)) {
    res.status(400).json({ error: 'Tasks array is required' });
    return;
  }
  const createdTasks = [];
  let processed = 0;
  tasks.forEach(function(taskData) {
    const title = taskData.title;
    const description = taskData.description || '';
    createTask(title, description, function(err, task) {
      if (err) {
        console.log('Error creating bulk task:', err);
      } else {
        createdTasks.push(task);
      }
      processed++;
      if (processed === tasks.length) {
        res.status(201).json({ created: createdTasks.length, tasks: createdTasks });
      }
    });
  });
});

app.delete('/api/tasks/completed/clear', function(req, res) {
  const sql = 'DELETE FROM tasks WHERE completed = 1';
  db.runQuery(sql, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: 'All completed tasks deleted' });
    }
  });
});

app.put('/api/tasks/:id/complete', function(req, res) {
  const id = req.params.id;
  updateTask(id, undefined, undefined, 1, function(err, task) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(task);
    }
  });
});

app.put('/api/tasks/:id/active', function(req, res) {
  const id = req.params.id;
  updateTask(id, undefined, undefined, 0, function(err, task) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(task);
    }
  });
});

app.get('/api/tasks/search/:query', function(req, res) {
  const query = req.params.query;
  const sql = 'SELECT * FROM tasks WHERE title LIKE "%' + query + '%" OR description LIKE "%' + query + '%" ORDER BY created_at DESC';
  db.query(sql, function(err, rows) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.get('/api/tasks/recent/:limit', function(req, res) {
  const limit = req.params.limit || 10;
  const sql = 'SELECT * FROM tasks ORDER BY created_at DESC LIMIT ' + limit;
  db.query(sql, function(err, rows) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

function calculateTaskAnalytics(callback) {
  getAllTasks(function(err, tasks) {
    if (err) {
      callback(err, null);
      return;
    }
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    let lastWeekCount = 0;
    let lastMonthCount = 0;
    let completedLastWeek = 0;
    let completedLastMonth = 0;
    tasks.forEach(function(task) {
      const createdDate = new Date(task.created_at);
      if (createdDate >= sevenDaysAgo) {
        lastWeekCount++;
      }
      if (createdDate >= thirtyDaysAgo) {
        lastMonthCount++;
      }
      if (task.completed === 1) {
        const updatedDate = new Date(task.updated_at || task.created_at);
        if (updatedDate >= sevenDaysAgo) {
          completedLastWeek++;
        }
        if (updatedDate >= thirtyDaysAgo) {
          completedLastMonth++;
        }
      }
    });
    callback(null, {
      tasksLastWeek: lastWeekCount,
      tasksLastMonth: lastMonthCount,
      completedLastWeek: completedLastWeek,
      completedLastMonth: completedLastMonth
    });
  });
}

app.get('/api/analytics', function(req, res) {
  calculateTaskAnalytics(function(err, analytics) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(analytics);
    }
  });
});

app.use(function(req, res) {
  res.status(404).send('<html><head><title>404 Not Found</title></head><body><h1>404 - Page Not Found</h1><p>The requested URL ' + req.url + ' was not found on this server.</p></body></html>');
});

app.use(function(err, req, res, next) {
  console.error('Error occurred:', err);
  res.status(500).send('<html><head><title>500 Internal Server Error</title></head><body><h1>500 - Internal Server Error</h1><p>An error occurred while processing your request.</p><pre>' + err.stack + '</pre></body></html>');
});

const server = app.listen(PORT, function() {
  console.log('========================================');
  console.log('TaskFlow API Server Started');
  console.log('========================================');
  console.log('Port: ' + PORT);
  console.log('Environment: ' + global.environment);
  console.log('Version: ' + global.appVersion);
  console.log('Database: ' + global.dbPath);
  console.log('========================================');
  console.log('Available endpoints:');
  console.log('  GET  /api/tasks');
  console.log('  GET  /api/tasks/:id');
  console.log('  POST /api/tasks');
  console.log('  PUT  /api/tasks/:id');
  console.log('  PATCH /api/tasks/:id/toggle');
  console.log('  DELETE /api/tasks/:id');
  console.log('  GET  /api/tasks/filter/:status');
  console.log('  GET  /api/stats');
  console.log('  GET  /api/analytics');
  console.log('  GET  /api/health');
  console.log('========================================');
});

process.on('SIGINT', function() {
  console.log('\nShutting down gracefully...');
  db.close(function() {
    console.log('Database connection closed');
    server.close(function() {
      console.log('Server closed');
      process.exit(0);
    });
  });
});

process.on('SIGTERM', function() {
  console.log('\nSIGTERM received, shutting down...');
  db.close(function() {
    console.log('Database connection closed');
    server.close(function() {
      console.log('Server closed');
      process.exit(0);
    });
  });
});

module.exports = app;