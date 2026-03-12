const fs = require('fs/promises');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { format, parseISO, isValid } = require('date-fns');

const templateCache = new Map();
const fontCache = new Map();

const FONT_PATH = path.join(__dirname, '..', 'fonts', 'TimesNewRoman.ttf');
const DEFAULT_MASK_COLOR = rgb(1, 1, 1);

const TEMPLATE_MAP = new Map([
  ['Dispatch Graduate', 'Dispatch_graduate.pdf'],
  ['Human Factors', 'HumanFactors.pdf'],
  ['Recurrent', 'recurrent_training_with_modules.pdf'],
  // Backwards compatibility with existing seed data.
  ['Basic', 'Dispatch_graduate.pdf']
]);

const LAYOUTS = {
  'Dispatch Graduate': {
    maskColor: DEFAULT_MASK_COLOR,
    name: {
      y: 320,
      size: 26,
      maxWidth: 380,
      minSize: 14,
      mask: { centered: true, y: 308, width: 420, height: 48 }
    },
    dateParts: {
      day: { x: 170, y: 260, size: 14 },
      month: { x: 230, y: 260, size: 14 },
      year: { x: 320, y: 260, size: 14 },
      dayMask: { x: 160, y: 252, width: 50, height: 24 },
      monthMask: { x: 220, y: 252, width: 90, height: 24 },
      yearMask: { x: 315, y: 252, width: 80, height: 24 }
    },
    company: { x: 170, y: 230, size: 14, mask: { x: 160, y: 222, width: 300, height: 24 } },
    department: { x: 170, y: 205, size: 14, mask: { x: 160, y: 197, width: 300, height: 24 } }
  },
  'Human Factors': {
    maskColor: DEFAULT_MASK_COLOR,
    name: {
      y: 320,
      size: 26,
      maxWidth: 380,
      minSize: 14,
      mask: { centered: true, y: 308, width: 420, height: 48 }
    },
    dateParts: {
      day: { x: 170, y: 260, size: 14 },
      month: { x: 230, y: 260, size: 14 },
      year: { x: 320, y: 260, size: 14 },
      dayMask: { x: 160, y: 252, width: 50, height: 24 },
      monthMask: { x: 220, y: 252, width: 90, height: 24 },
      yearMask: { x: 315, y: 252, width: 80, height: 24 }
    },
    location: { x: 170, y: 230, size: 14, mask: { x: 160, y: 222, width: 240, height: 24 } },
    company: { x: 170, y: 205, size: 14, mask: { x: 160, y: 197, width: 300, height: 24 } },
    department: { x: 170, y: 180, size: 14, mask: { x: 160, y: 172, width: 300, height: 24 } }
  },
  Recurrent: {
    maskColor: DEFAULT_MASK_COLOR,
    name: {
      y: 330,
      size: 26,
      maxWidth: 380,
      minSize: 14,
      mask: { centered: true, y: 326, width: 420, height: 48 }
    },
    dateParts: {
      day: { x: 170, y: 280, size: 14 },
      month: { x: 230, y: 280, size: 14 },
      year: { x: 320, y: 280, size: 14 },
      dayMask: { x: 160, y: 272, width: 50, height: 24 },
      monthMask: { x: 220, y: 272, width: 90, height: 24 },
      yearMask: { x: 315, y: 272, width: 80, height: 24 }
    },
    company: { x: 170, y: 300, size: 14, mask: { x: 160, y: 292, width: 300, height: 24 } },
    department: { x: 170, y: 265, size: 14, mask: { x: 160, y: 257, width: 300, height: 24 } },
    modules: {
      x: 170,
      y: 210,
      size: 12,
      lineHeight: 16,
      mask: { x: 160, y: 150, width: 280, height: 80 }
    }
  }
};

function getTemplate(trainingType) {
  return TEMPLATE_MAP.get(trainingType) || null;
}

async function loadTemplateBytes(templateName) {
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName);
  }
  const templatePath = path.join(__dirname, '..', 'templates', templateName);
  const bytes = await fs.readFile(templatePath);
  templateCache.set(templateName, bytes);
  return bytes;
}

async function loadFontBytes() {
  if (fontCache.has(FONT_PATH)) {
    return fontCache.get(FONT_PATH);
  }
  const bytes = await fs.readFile(FONT_PATH);
  fontCache.set(FONT_PATH, bytes);
  return bytes;
}

function maskArea(page, mask, color = DEFAULT_MASK_COLOR) {
  if (!mask) {
    return;
  }
  page.drawRectangle({
    x: mask.x,
    y: mask.y,
    width: mask.width,
    height: mask.height,
    color
  });
}

function resolveMask(mask, pageWidth) {
  if (!mask) {
    return null;
  }
  if (mask.centered) {
    return {
      ...mask,
      x: (pageWidth - mask.width) / 2
    };
  }
  return mask;
}

function drawMaskedText(page, value, layout, font, maskColor) {
  if (!layout) {
    return;
  }
  const resolvedMask = resolveMask(layout.mask, page.getWidth());
  maskArea(page, resolvedMask, maskColor);
  page.drawText(String(value ?? ''), { ...layout, font, color: rgb(0, 0, 0) });
}

function drawMultilineText(page, text, { x, y, size, lineHeight }, font) {
  const lines = String(text).split('\n');
  let cursorY = y;
  lines.forEach((line) => {
    page.drawText(line, { x, y: cursorY, size, font, color: rgb(0, 0, 0) });
    cursorY -= lineHeight;
  });
}

function getFittingFontSize(text, font, baseSize, maxWidth, minSize) {
  let size = baseSize;
  while (size > minSize && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 1;
  }
  return size;
}

function wrapTextToWidth(text, font, size, maxWidth) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [''];
  }
  const lines = [];
  let current = words[0];
  for (let i = 1; i < words.length; i += 1) {
    const next = `${current} ${words[i]}`;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

function drawCenteredName(page, text, layout, font) {
  const pageWidth = page.getWidth();
  const baseSize = layout.size;
  const maxWidth = layout.maxWidth;
  const minSize = layout.minSize;
  const safeText = String(text ?? '');

  let size = getFittingFontSize(safeText, font, baseSize, maxWidth, minSize);
  let lines = [safeText];

  if (font.widthOfTextAtSize(safeText, size) > maxWidth) {
    size = minSize;
    lines = wrapTextToWidth(safeText, font, size, maxWidth);
    if (lines.length > 2) {
      lines = [
        lines[0],
        lines.slice(1).join(' ')
      ];
    }
  }

  const lineHeight = size + 6;
  const startY = lines.length > 1 ? layout.y + lineHeight / 2 : layout.y;

  const resolvedMask = resolveMask(layout.mask, pageWidth);
  maskArea(page, resolvedMask, layout.maskColor ?? DEFAULT_MASK_COLOR);

  lines.forEach((line, index) => {
    const width = font.widthOfTextAtSize(line, size);
    const x = (pageWidth - width) / 2;
    const y = startY - index * lineHeight;
    page.drawText(line, { x, y, size, font, color: rgb(0, 0, 0) });
  });
}

function buildModulesText(modules) {
  const list = Array.isArray(modules) ? modules.filter(Boolean) : [];
  if (list.length === 0) {
    return 'Modules Completed:\nNone';
  }
  return ['Modules Completed:', ...list].join('\n');
}

function resolveTrainingType(trainingType) {
  const normalized = String(trainingType || '').trim().toLowerCase();
  if (!normalized) {
    return trainingType;
  }
  if (normalized.includes('recurrent')) {
    return 'Recurrent';
  }
  if (normalized.includes('human factors')) {
    return 'Human Factors';
  }
  if (normalized.includes('dispatch') || normalized.includes('graduate') || normalized.includes('basic')) {
    return 'Dispatch Graduate';
  }
  return trainingType;
}

function validateParticipantFields(participant, trainingType) {
  if (
    !participant?.participant_name ||
    !participant?.training_date ||
    !participant?.company ||
    !participant?.department ||
    !trainingType
  ) {
    return { ok: false, error: 'Incomplete participant data' };
  }
  return { ok: true };
}

async function generateCertificatePdf({ participant, modulesOverride }) {
  const trainingType = resolveTrainingType(participant.training_type);
  const templateName = getTemplate(trainingType);
  if (!templateName) {
    return { error: 'Invalid training type', status: 400 };
  }

  const validation = validateParticipantFields(participant, trainingType);
  if (!validation.ok) {
    return { error: validation.error, status: 400 };
  }

  let templateBytes;
  let fontBytes;

  try {
    templateBytes = await loadTemplateBytes(templateName);
  } catch (error) {
    return { error: 'Template not found', status: 500 };
  }

  const pdfDoc = await PDFDocument.load(templateBytes);
  let font;
  try {
    fontBytes = await loadFontBytes();
    font = await pdfDoc.embedFont(fontBytes);
  } catch (error) {
    font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  }
  const page = pdfDoc.getPages()[0];

  const layout = LAYOUTS[trainingType];
  if (!layout) {
    return { error: 'Invalid training type', status: 400 };
  }

  drawCenteredName(page, participant.participant_name, layout.name, font);

  const trainingDate = parseISO(String(participant.training_date));
  if (!isValid(trainingDate)) {
    return { error: 'Invalid training date', status: 400 };
  }

  const dateParts = {
    day: format(trainingDate, 'dd'),
    month: format(trainingDate, 'MMMM'),
    year: format(trainingDate, 'yyyy')
  };

  if (layout.dateParts) {
    const dayMask = resolveMask(layout.dateParts.dayMask, page.getWidth());
    const monthMask = resolveMask(layout.dateParts.monthMask, page.getWidth());
    const yearMask = resolveMask(layout.dateParts.yearMask, page.getWidth());
    maskArea(page, dayMask, layout.maskColor);
    maskArea(page, monthMask, layout.maskColor);
    maskArea(page, yearMask, layout.maskColor);
    page.drawText(dateParts.day, { ...layout.dateParts.day, font, color: rgb(0, 0, 0) });
    page.drawText(dateParts.month, { ...layout.dateParts.month, font, color: rgb(0, 0, 0) });
    page.drawText(dateParts.year, { ...layout.dateParts.year, font, color: rgb(0, 0, 0) });
  }

  drawMaskedText(page, participant.company, layout.company, font, layout.maskColor);
  drawMaskedText(page, participant.department, layout.department, font, layout.maskColor);

  if (trainingType === 'Human Factors') {
    drawMaskedText(page, participant.location, layout.location, font, layout.maskColor);
  }

  if (trainingType === 'Recurrent') {
    const modulesText = buildModulesText(modulesOverride ?? participant.modules);
    const resolvedMask = resolveMask(layout.modules?.mask, page.getWidth());
    maskArea(page, resolvedMask, layout.maskColor);
    drawMultilineText(page, modulesText, layout.modules, font);
  }

  const pdfBytes = await pdfDoc.save();
  return { pdfBytes };
}

module.exports = {
  getTemplate,
  generateCertificatePdf,
  loadTemplateBytes,
  resolveTrainingType
};
