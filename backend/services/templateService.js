const fs = require('fs/promises');
const path = require('path');

const templateCache = new Map();

async function loadTemplate(templateName) {
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName);
  }

  const templatePath = path.join(__dirname, '..', 'templates', templateName);
  const content = await fs.readFile(templatePath, 'utf-8');
  templateCache.set(templateName, content);
  return content;
}

function chooseTemplate(trainingType) {
  return trainingType === 'Recurrent' ? 'recurrent.html' : 'basic.html';
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
}

function calculateValidityDate(trainingDate) {
  const validity = new Date(trainingDate);
  validity.setFullYear(validity.getFullYear() + 1);
  return validity;
}

function renderTemplate(templateHtml, participant) {
  const validityDate = calculateValidityDate(participant.training_date);
  const modules = Array.isArray(participant.modules) ? participant.modules.join(', ') : '';

  const replacements = {
    participant_name: participant.participant_name,
    company: participant.company,
    department: participant.department,
    training_type: participant.training_type,
    training_date: formatDate(participant.training_date),
    validity_date: formatDate(validityDate.toISOString()),
    modules
  };

  return Object.entries(replacements).reduce(
    (html, [key, value]) => html.replace(new RegExp(`{{${key}}}`, 'g'), String(value ?? '')),
    templateHtml
  );
}

module.exports = {
  loadTemplate,
  chooseTemplate,
  renderTemplate,
  calculateValidityDate
};
