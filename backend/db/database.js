const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'participants.db');
const db = new sqlite3.Database(DB_PATH);

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }
      resolve({ id: this.lastID, changes: this.changes });
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(row);
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(rows);
    });
  });

async function initializeDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_name TEXT NOT NULL,
      company TEXT NOT NULL,
      department TEXT NOT NULL,
      training_type TEXT NOT NULL,
      training_date TEXT NOT NULL,
      modules TEXT DEFAULT '[]'
    )
  `);

  await run('CREATE INDEX IF NOT EXISTS idx_participants_training_type ON participants(training_type)');
  await run('CREATE INDEX IF NOT EXISTS idx_participants_training_date ON participants(training_date)');

  const existing = await get('SELECT COUNT(*) AS count FROM participants');
  if (!existing || existing.count === 0) {
    const baseSeed = [
      ['John Smith', 'Airbus', 'Flight Operations', 'Recurrent', '2026-03-01', JSON.stringify(['Air Law', 'Navigation'])],
      ['Sara Lee', 'Boeing', 'Maintenance', 'Basic', '2026-01-15', JSON.stringify(['Aircraft Systems'])],
      ['Ali Khan', 'Emirates', 'Cabin Services', 'Recurrent', '2026-02-20', JSON.stringify(['Meteorology', 'Human Factors'])]
    ];

    for (const row of baseSeed) {
      await run(
        'INSERT INTO participants (participant_name, company, department, training_type, training_date, modules) VALUES (?, ?, ?, ?, ?, ?)',
        row
      );
    }
  }

  if (existing && existing.count < 6) {
    const extraSeed = [
      ['Priya Nair', 'IndiGo', 'HR', 'Human Factors', '2026-02-10', JSON.stringify([])],
      ['Marcus Lim', 'Singapore Airlines', 'Dispatch', 'Dispatch Graduate', '2026-01-05', JSON.stringify([])],
      ['Nora Adeyemi', 'Qatar Airways', 'Ground Operations', 'Recurrent', '2026-02-28', JSON.stringify(['Air Law', 'Human Factors'])]
    ];

    for (const row of extraSeed) {
      await run(
        'INSERT INTO participants (participant_name, company, department, training_type, training_date, modules) VALUES (?, ?, ?, ?, ?, ?)',
        row
      );
    }
  }
}

module.exports = {
  db,
  run,
  get,
  all,
  initializeDatabase
};
