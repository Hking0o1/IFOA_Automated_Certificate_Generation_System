const { get } = require('../db/database');
const { generateCertificatePdf } = require('../services/pdfCertificateService');

function parseParticipant(row) {
  return {
    ...row,
    modules: JSON.parse(row.modules || '[]')
  };
}

async function generateCertificate(req, res) {
  console.log('Certificate request', {
    id: req.params.id,
    body: req.body
  });
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

  let pdfBytes;
  try {
    const result = await generateCertificatePdf({
      participant,
      modulesOverride: Array.isArray(selectedModules) ? selectedModules : undefined
    });

    if (result.error) {
      res.status(result.status || 400).json({ error: result.error });
      return;
    }

    pdfBytes = result.pdfBytes;
  } catch (error) {
    console.error('PDF generation failed', error);
    res.status(500).json({ error: 'PDF generation failed' });
    return;
  }

  const safeName = participant.participant_name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeName}_certificate.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(Buffer.from(pdfBytes));
}

module.exports = {
  generateCertificate
};
