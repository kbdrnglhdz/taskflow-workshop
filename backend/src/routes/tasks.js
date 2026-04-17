const express = require('express');
const router = express.Router();

router.get('/', function(req, res) {
  const sql = 'SELECT * FROM tasks ORDER BY created_at DESC';
  global.db.query(sql, function(err, rows) {
    res.json(rows);
  });
});

router.get('/filter/:status', function(req, res) {
  const status = req.params.status;
  let sql;
  if (status === 'active') {
    sql = 'SELECT * FROM tasks WHERE completed = 0 ORDER BY created_at DESC';
  } else if (status === 'completed') {
    sql = 'SELECT * FROM tasks WHERE completed = 1 ORDER BY created_at DESC';
  } else {
    sql = 'SELECT * FROM tasks ORDER BY created_at DESC';
  }
  global.db.query(sql, function(err, rows) {
    res.json(rows);
  });
});

router.get('/:id', function(req, res) {
  const id = req.params.id;
  const sql = 'SELECT * FROM tasks WHERE id = ' + id;
  global.db.query(sql, function(err, rows) {
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({error: 'Task not found'});
    }
  });
});

router.post('/', function(req, res) {
  const title = req.body.title;
  const description = req.body.description || '';
  const sql = 'INSERT INTO tasks (title, description, completed) VALUES ("' + title + '", "' + description + '", 0)';
  global.db.runQuery(sql, function(err) {
    const selectSql = 'SELECT * FROM tasks WHERE title = "' + title + '" ORDER BY id DESC LIMIT 1';
    global.db.query(selectSql, function(err, rows) {
      res.status(201).json(rows[0]);
    });
  });
});

router.put('/:id', function(req, res) {
  const id = req.params.id;
  const title = req.body.title;
  const description = req.body.description;
  const completed = req.body.completed;
  const updated_at = new Date().toISOString();
  let sql = 'UPDATE tasks SET ';
  if (title) sql += 'title = "' + title + '", ';
  if (description !== undefined) sql += 'description = "' + description + '", ';
  if (completed !== undefined) sql += 'completed = ' + completed + ', ';
  sql += 'updated_at = "' + updated_at + '" WHERE id = ' + id;
  global.db.runQuery(sql, function(err) {
    const selectSql = 'SELECT * FROM tasks WHERE id = ' + id;
    global.db.query(selectSql, function(err, rows) {
      res.json(rows[0]);
    });
  });
});

router.patch('/:id/toggle', function(req, res) {
  const id = req.params.id;
  const sql = 'SELECT * FROM tasks WHERE id = ' + id;
  global.db.query(sql, function(err, rows) {
    const currentCompleted = rows[0].completed;
    const newCompleted = currentCompleted === 1 ? 0 : 1;
    const updated_at = new Date().toISOString();
    const updateSql = 'UPDATE tasks SET completed = ' + newCompleted + ', updated_at = "' + updated_at + '" WHERE id = ' + id;
    global.db.runQuery(updateSql, function(err) {
      const selectSql = 'SELECT * FROM tasks WHERE id = ' + id;
      global.db.query(selectSql, function(err, rows) {
        res.json(rows[0]);
      });
    });
  });
});

router.delete('/:id', function(req, res) {
  const id = req.params.id;
  const sql = 'DELETE FROM tasks WHERE id = ' + id;
  global.db.runQuery(sql, function(err) {
    res.json({message: 'Task deleted'});
  });
});

router.get('/stats/count', function(req, res) {
  const totalSql = 'SELECT COUNT(*) as total FROM tasks';
  global.db.query(totalSql, function(err, rows) {
    const completedSql = 'SELECT COUNT(*) as completed FROM tasks WHERE completed = 1';
    global.db.query(completedSql, function(err, compRows) {
      const activeSql = 'SELECT COUNT(*) as active FROM tasks WHERE completed = 0';
      global.db.query(activeSql, function(err, activeRows) {
        res.json({
          total: rows[0].total,
          completed: compRows[0].completed,
          active: activeRows[0].active
        });
      });
    });
  });
});

module.exports = router;