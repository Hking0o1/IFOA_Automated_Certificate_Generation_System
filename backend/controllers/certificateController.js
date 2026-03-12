const { get } = require('../db/database');
const { loadTemplate, chooseTemplate, renderTemplate } = require('../services/templateService');
const { generatePdfBuffer } = require('../services/pdfService');

function parseParticipant(row) {
  return {
    ...row,
    modules: JSON.parse(row.modules || '[]')
  };
}

function validateParticipant(participant) {
  const requiredFields = ['participant_name', 'company', 'department', 'training_type', 'training_date'];
  return requiredFields.every((field) => participant[field]);
}

async function generateCertificate(req, res) {
  const row = await get('SELECT * FROM participants WHERE id = ?', [req.params.id]);

  if (!row) {
    res.status(404).json({ error: 'Participant not found' });
    return;
  }

  const participant = parseParticipant(row);
  const selectedModules = req.body?.modules;

  if (participant.training_type === 'Recurrent' && Array.isArray(selectedModules) && selectedModules.length > 0) {
    participant.modules = selectedModules;
  }

  if (!validateParticipant(participant)) {
    res.status(400).json({ error: 'Incomplete participant data' });
    return;
  }

  const templateName = chooseTemplate(participant.training_type);
  const template = await loadTemplate(templateName);
  const html = renderTemplate(template, participant);
  const pdfBuffer = await generatePdfBuffer(html, 3);

  const safeName = participant.participant_name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeName}_certificate.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(pdfBuffer);
}

module.exports = {
  generateCertificate
};
