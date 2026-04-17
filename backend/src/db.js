const sqlite3 = require('sqlite3').verbose();
const path = require('path');

global.dbPath = path.join(__dirname, '..', 'database.db');

global.db = new sqlite3.Database(global.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, function(err) {
  if (err) {
    console.log('DATABASE ERROR:', err.message);
  } else {
    console.log('Connected to SQLite database at:', global.dbPath);
    initializeTables();
  }
});

function initializeTables() {
  global.db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT
  )`, function(err) {
    if (err) {
      console.log('TABLE CREATE ERROR:', err.message);
    } else {
      console.log('Tasks table initialized');
    }
  });
}

global.db.query = function(sql, params, callback) {
  if (typeof params === 'function') {
    callback = params;
    params = [];
  }
  this.all(sql, params, callback);
};

global.db.runQuery = function(sql, params, callback) {
  if (typeof params === 'function') {
    callback = params;
    params = [];
  }
  this.run(sql, params, callback);
};

module.exports = global.db;