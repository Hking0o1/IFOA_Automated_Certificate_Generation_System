const { all, get, run } = require('../db/database');

function parseParticipant(row) {
  return {
    ...row,
    modules: JSON.parse(row.modules || '[]')
  };
}

async function getParticipants(req, res) {
  const search = req.query.search?.trim();
  let query = 'SELECT * FROM participants';
  const params = [];

  if (search) {
    query += ' WHERE participant_name LIKE ? OR company LIKE ? OR department LIKE ?';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  query += ' ORDER BY training_date DESC';

  const rows = await all(query, params);
  res.json(rows.map(parseParticipant));
}

async function getParticipantById(req, res) {
  const row = await get('SELECT * FROM participants WHERE id = ?', [req.params.id]);
  if (!row) {
    res.status(404).json({ error: 'Participant not found' });
    return;
  }
  res.json(parseParticipant(row));
}

async function createParticipant(req, res) {
  const { participant_name, company, department, training_type, training_date, modules } = req.body;
  const required = [participant_name, company, department, training_type, training_date];

  if (required.some((value) => !value)) {
    res.status(400).json({ error: 'Incomplete participant data' });
    return;
  }

  const safeModules = Array.isArray(modules) ? modules : [];
  const result = await run(
    `INSERT INTO participants (participant_name, company, department, training_type, training_date, modules)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [participant_name, company, department, training_type, training_date, JSON.stringify(safeModules)]
  );

  const created = await get('SELECT * FROM participants WHERE id = ?', [result.id]);
  res.status(201).json(parseParticipant(created));
}

module.exports = {
  getParticipants,
  getParticipantById,
  createParticipant
};
