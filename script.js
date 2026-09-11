/* ============================================================
   CONFIG
   ============================================================ */
const NUM_ANEXOS = 4;
const MAX_IMG_DIMENSION = 1800; // px, downscale large photos before embedding

const state = {
  anexos: Array.from({length: NUM_ANEXOS}, () => ({
    img1: null, // {dataUrl, width, height}  (imagen original, sin recortar)
    img2: null,
    desc: ''
  }))
};

const PLACEHOLDERS = [
  'Controlé el acceso de los usuarios en los embarques del sistema de transporte y optimicé la fluidez en las intersecciones de las vías cercanas por donde transitan las unidades de los Corredores Complementarios, COSAC I y/o AERODIRECTO.',
  'Organicé los implementos viales en las instalaciones del COSAC I, vías de los  Corredores Complementarios y/o AERODIRECTO durante la prestación del servicio del sistema de transporte.',
  'Comuniqué sobre las incidencias y/o eventos presentados durante el desarrollo de la  operación del sistema de transporte.',
  'Notifiqué al centro de control las situaciones presentadas durante la operación de los Corredores Complementarios, COSAC I y/o AERODIRECTO que ocasionen retrasos, incumplimientos de programación, desvíos, buses averiados y otra información relevante.'
];


/* ============================================================
   BUILD UI
   ============================================================ */
const container = document.getElementById('anexos-container');

function slotHintSVG(){
  return `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
    <rect x="3" y="5" width="18" height="14" rx="2"/>
    <circle cx="8.5" cy="10" r="1.5"/>
    <path d="M21 15l-5-5-4 4-3-3-6 6"/>
  </svg>`;
}

state.anexos.forEach((anexo, idx) => {
  const n = idx + 1;
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="anexo-head">
      <h2>ANEXO ${n}</h2>
      <span class="anexo-status" id="status-${idx}">Incompleto</span>
    </div>
    <div class="anexo-body">
      <div class="img-row">
        <div class="slot" tabindex="0" id="slot-${idx}-0" data-idx="${idx}" data-slot="0">
          <div class="hint">${slotHintSVG()}Toca, arrastra o pega<br>una imagen (1)</div>
          <button class="remove" type="button" aria-label="Quitar imagen">&times;</button>
          <input type="file" accept="image/*" id="file-${idx}-0">
        </div>
        <div class="slot" tabindex="0" id="slot-${idx}-1" data-idx="${idx}" data-slot="1">
          <div class="hint">${slotHintSVG()}Toca, arrastra o pega<br>una imagen (2)</div>
          <button class="remove" type="button" aria-label="Quitar imagen">&times;</button>
          <input type="file" accept="image/*" id="file-${idx}-1">
        </div>
      </div>
      <div class="desc-wrap">
        <label for="desc-${idx}">Descripción</label>
        <textarea id="desc-${idx}" placeholder="${PLACEHOLDERS[idx]}"></textarea>
      </div>
    </div>
  `;
  container.appendChild(card);
});

/* ============================================================
   IMAGE HANDLING (click / drag&drop / paste)
   ============================================================ */
let activeSlotEl = null;

function loadImageIntoSlot(idx, slotNum, file){
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      // downscale via canvas to keep files light + normalize to JPEG
      // (se guarda SIN recortar; el encuadre/recorte final se calcula
      // al generar el documento, según el espacio real disponible)
      let { width, height } = img;
      const longest = Math.max(width, height);
      if (longest > MAX_IMG_DIMENSION) {
        const scale = MAX_IMG_DIMENSION / longest;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0,0,width,height);
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      const key = slotNum === 0 ? 'img1' : 'img2';
      state.anexos[idx][key] = { dataUrl, width, height };
      renderSlot(idx, slotNum);
      updateAnexoStatus(idx);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function renderSlot(idx, slotNum){
  const data = state.anexos[idx][slotNum === 0 ? 'img1' : 'img2'];
  const slotEl = document.getElementById(`slot-${idx}-${slotNum}`);
  const hint = slotEl.querySelector('.hint');
  let imgEl = slotEl.querySelector('img');
  if (data) {
    slotEl.classList.add('filled');
    if (!imgEl) {
      imgEl = document.createElement('img');
      slotEl.insertBefore(imgEl, slotEl.firstChild);
    }
    imgEl.src = data.dataUrl;
    hint.style.display = 'none';
  } else {
    slotEl.classList.remove('filled');
    if (imgEl) imgEl.remove();
    hint.style.display = '';
  }
}

function updateAnexoStatus(idx){
  const a = state.anexos[idx];
  const el = document.getElementById(`status-${idx}`);
  const complete = !!(a.img1 && a.img2);
  el.textContent = complete ? 'Completo' : 'Incompleto';
  el.classList.toggle('complete', complete);
}

// wire up each slot: click -> file input, drag&drop, remove button, focus tracking for paste
state.anexos.forEach((anexo, idx) => {
  [0, 1].forEach(slotNum => {
    const slotEl = document.getElementById(`slot-${idx}-${slotNum}`);
    const fileInput = document.getElementById(`file-${idx}-${slotNum}`);
    const removeBtn = slotEl.querySelector('.remove');

    slotEl.addEventListener('click', (e) => {
      if (e.target === removeBtn) return;
      fileInput.click();
    });
    slotEl.addEventListener('focus', () => {
      activeSlotEl = { idx, slotNum };
      document.querySelectorAll('.slot').forEach(s => s.classList.remove('active'));
      slotEl.classList.add('active');
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        loadImageIntoSlot(idx, slotNum, e.target.files[0]);
      }
    });
    slotEl.addEventListener('dragover', (e) => { e.preventDefault(); slotEl.classList.add('active'); });
    slotEl.addEventListener('dragleave', () => slotEl.classList.remove('active'));
    slotEl.addEventListener('drop', (e) => {
      e.preventDefault();
      slotEl.classList.remove('active');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        loadImageIntoSlot(idx, slotNum, e.dataTransfer.files[0]);
      }
    });
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = slotNum === 0 ? 'img1' : 'img2';
      state.anexos[idx][key] = null;
      renderSlot(idx, slotNum);
      updateAnexoStatus(idx);
    });
  });

  const descEl = document.getElementById(`desc-${idx}`);
  descEl.addEventListener('input', () => {
    state.anexos[idx].desc = descEl.value.trim();
  });
});

// global paste -> goes to last focused slot
document.addEventListener('paste', (e) => {
  if (!activeSlotEl) return;
  const items = e.clipboardData && e.clipboardData.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      loadImageIntoSlot(activeSlotEl.idx, activeSlotEl.slotNum, file);
      e.preventDefault();
      break;
    }
  }
});

/* ============================================================
   SHARED LAYOUT CONSTANTS (mirrored between DOCX and PDF builders)
   ============================================================ */
const EMU_PER_MM = 36000; // 914400 EMU/in ÷ 25.4 mm/in
const MM_TO_TWIPS = 1440 / 25.4;

const PAGE_W_TWIPS = 11906; // A4
const PAGE_H_TWIPS = 16838;
const MARGIN_TWIPS = 720; // 0.5in
const CONTENT_W_TWIPS = PAGE_W_TWIPS - MARGIN_TWIPS * 2;

const PAGE_W_MM = 210, PAGE_H_MM = 297, MARGIN_MM = 12.7;
const CONTENT_W_MM = PAGE_W_MM - MARGIN_MM * 2;

// Espacio reservado antes del primer anexo de cada página (título "ANEXOS", etc.)
const START_Y_MM = 28;
// Alto del encabezado "ANEXO n" (línea + subrayado)
const HEADER_H_MM = 4;
// Relleno interno del recuadro de imágenes / separación entre las dos fotos
const PAD_MM = 3;
const GAP_IMGS_MM = 4;
// Espacio entre el anexo 1 y el anexo 2 de una misma hoja
const GAP_BETWEEN_MM = 5;
// Tipografía de la descripción (debe coincidir en ambos documentos)
const DESC_FONT_SIZE = 11;
const DESC_LINE_H_MM = 5.0;
// Alto mínimo de imagen para evitar recuadros absurdamente chicos en casos extremos
const MIN_IMG_H_MM = 30;

function estimateDescLines(doc, label, text, fontSize, maxWidth){
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(label + ': ' + text, maxWidth);
  return lines.length;
}

/* ============================================================
   CÁLCULO DE DISEÑO COMPARTIDO (DOCX + PDF)
   Calcula, para cada anexo, cuánto espacio debe ocupar el recuadro de
   fotos para que los dos anexos de una hoja llenen exactamente la
   página. La imagen se muestra completa (nada se recorta): si no
   coincide con la proporción del recuadro, se estira para llenarlo
   (tanto Word como jsPDF hacen esto automáticamente al indicarles un
   ancho/alto distinto al tamaño natural de la imagen).
   ============================================================ */
async function computeLayout(anexos){
  const { jsPDF } = window.jspdf;
  const scratchDoc = new jsPDF({ unit: 'mm', format: 'a4' }); // solo para medir texto

  const pagePairsRaw = [];
  for (let i = 0; i < anexos.length; i += 2) {
    pagePairsRaw.push(anexos.slice(i, i + 2));
  }

  const availableH = PAGE_H_MM - MARGIN_MM - START_Y_MM;
  const innerW = CONTENT_W_MM - PAD_MM * 2;
  const imgW_mm = (innerW - GAP_IMGS_MM) / 2;

  const pages = pagePairsRaw.map((pair, p) => {
    const items = pair.map((a, localIdx) => {
      const n = p * 2 + localIdx + 1;
      const descText = (a.desc || PLACEHOLDERS[n - 1] || '').trim();
      const nLines = estimateDescLines(scratchDoc, 'DESCRIPCIÓN', descText, DESC_FONT_SIZE, innerW);
      const descBoxH = nLines * DESC_LINE_H_MM + PAD_MM * 2 - 1;
      return { n, a, descText, nLines, descBoxH };
    });

    const gapTotal = items.length === 2 ? GAP_BETWEEN_MM : 0;
    const fixedTotal = items.reduce((s, it) => s + HEADER_H_MM + PAD_MM * 2 + it.descBoxH, 0) + gapTotal;
    let remaining = availableH - fixedTotal;
    if (remaining < MIN_IMG_H_MM * items.length) remaining = MIN_IMG_H_MM * items.length;
    const imgH_mm_each = remaining / items.length;

    items.forEach(it => {
      it.imgW_mm = imgW_mm;
      it.imgH_mm = imgH_mm_each;
      it.rowH_mm = imgH_mm_each + PAD_MM * 2;
    });

    return items;
  });

  return { pages };
}

/* ============================================================
   DOCX BUILDER  (manual OOXML via JSZip, mirrors the reference document)
   ============================================================ */
function xmlEscape(str){
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}

function runProps({bold,italic,underline,sz=24}){
  let s = '<w:rPr><w:rFonts w:ascii="Arial" w:eastAsia="Arial" w:hAnsi="Arial" w:cs="Arial"/>';
  if (bold) s += '<w:b/>';
  if (italic) s += '<w:i/>';
  if (underline) s += '<w:u w:val="single"/>';
  s += `<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr>`;
  return s;
}
function textRun(text, opts){
  return `<w:r>${runProps(opts)}<w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r>`;
}
function imageDrawingXml(rId, drawingId, cx, cy){
  return `<w:r><w:rPr><w:noProof/></w:rPr><w:drawing>
    <wp:inline distT="0" distB="0" distL="0" distR="0">
      <wp:extent cx="${cx}" cy="${cy}"/>
      <wp:effectExtent l="0" t="0" r="0" b="0"/>
      <wp:docPr id="${drawingId}" name="Picture ${drawingId}"/>
      <wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>
      <a:graphic>
        <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
          <pic:pic>
            <pic:nvPicPr><pic:cNvPr id="${drawingId}" name="Picture ${drawingId}"/><pic:cNvPicPr/></pic:nvPicPr>
            <pic:blipFill><a:blip r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
            <pic:spPr>
              <a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>
              <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
            </pic:spPr>
          </pic:pic>
        </a:graphicData>
      </a:graphic>
    </wp:inline>
  </w:drawing></w:r>`;
}

function buildAnexoTableXml(item, rId1, rId2, drawIdStart){
  // Como ambas fotos ya vienen encuadradas al mismo tamaño exacto,
  // comparten el mismo cx/cy (sin deformarse).
  const cx = Math.round(item.imgW_mm * EMU_PER_MM);
  const cy = Math.round(item.imgH_mm * EMU_PER_MM);

  const imgRowXml = `<w:tr><w:trPr><w:cantSplit/></w:trPr>
    <w:tc>
      <w:tcPr><w:tcW w:w="${CONTENT_W_TWIPS}" w:type="dxa"/>
        <w:tcBorders>
          <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
          <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
          <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
          <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        </w:tcBorders>
        <w:vAlign w:val="center"/>
      </w:tcPr>
      <w:p><w:pPr><w:jc w:val="center"/></w:pPr>
        ${imageDrawingXml(rId1, drawIdStart, cx, cy)}
        <w:r>${runProps({})}<w:t xml:space="preserve">  </w:t></w:r>
        ${imageDrawingXml(rId2, drawIdStart+1, cx, cy)}
      </w:p>
    </w:tc>
  </w:tr>`;

  const descRowXml = `<w:tr>
    <w:tc>
      <w:tcPr><w:tcW w:w="${CONTENT_W_TWIPS}" w:type="dxa"/>
        <w:tcBorders>
          <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
          <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
          <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
          <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        </w:tcBorders>
        <w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/>
      </w:tcPr>
      <w:p><w:pPr><w:jc w:val="both"/></w:pPr>
        ${textRun('DESCRIPCIÓN', {bold:true, italic:true, underline:true})}
        ${textRun(': ', {bold:true, italic:true})}
        ${textRun(item.descText, {italic:true})}
      </w:p>
    </w:tc>
  </w:tr>`;

  return `<w:tbl>
    <w:tblPr><w:tblW w:w="${CONTENT_W_TWIPS}" w:type="dxa"/><w:tblBorders>
      <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
      <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
      <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
      <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
      <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
      <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
    </w:tblBorders>
    <w:tblCellMar>
      <w:top w:w="80" w:type="dxa"/>
      <w:left w:w="80" w:type="dxa"/>
      <w:bottom w:w="80" w:type="dxa"/>
      <w:right w:w="80" w:type="dxa"/>
    </w:tblCellMar>
    <w:tblLayout w:type="fixed"/></w:tblPr>
    <w:tblGrid><w:gridCol w:w="${CONTENT_W_TWIPS}"/></w:tblGrid>
    ${imgRowXml}
    ${descRowXml}
  </w:tbl>`;
}

async function buildDocxBlob(layout){
  const zip = new JSZip();
  const mediaFolder = zip.folder('word').folder('media');

  let bodyXml = `<w:p><w:pPr><w:jc w:val="center"/></w:pPr>${textRun('ANEXOS', {bold:true, italic:true, underline:true})}</w:p>`;
  let relEntries = [];
  let drawId = 100;
  let mediaIdx = 1;

  const pages = layout.pages;

  pages.forEach((items, pageIdx) => {
    items.forEach((it, localIdx) => {
      if (pageIdx === 0 && localIdx === 0) {
        bodyXml += `<w:p/>`;
      }
      bodyXml += `<w:p>${textRun('ANEXO ' + it.n, {bold:true, italic:true, underline:true})}</w:p>`;

      // Se usa la imagen ORIGINAL (completa, sin recortar). Word estira
      // la imagen al tamaño cx/cy indicado, sin importar su proporción real.
      const img1B64 = it.a.img1.dataUrl.split(',')[1];
      const img2B64 = it.a.img2.dataUrl.split(',')[1];
      const name1 = `image${mediaIdx++}.jpg`;
      const name2 = `image${mediaIdx++}.jpg`;
      mediaFolder.file(name1, img1B64, {base64:true});
      mediaFolder.file(name2, img2B64, {base64:true});

      const rId1 = `rIdImgA${it.n}_1`;
      const rId2 = `rIdImgA${it.n}_2`;
      relEntries.push({id:rId1, target:`media/${name1}`});
      relEntries.push({id:rId2, target:`media/${name2}`});

      bodyXml += buildAnexoTableXml(it, rId1, rId2, drawId);
      drawId += 2;
      bodyXml += `<w:p/>`;
    });

    if (pageIdx < pages.length - 1) {
      bodyXml += `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
    }
  });

  bodyXml += `<w:sectPr><w:pgSz w:w="${PAGE_W_TWIPS}" w:h="${PAGE_H_TWIPS}"/><w:pgMar w:top="720" w:right="${MARGIN_TWIPS}" w:bottom="720" w:left="${MARGIN_TWIPS}" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>`;

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>${bodyXml}</w:body>
</w:document>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  ${relEntries.map(r => `<Relationship Id="${r.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${r.target}"/>`).join('\n')}
</Relationships>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:eastAsia="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
</w:styles>`;

  zip.file('[Content_Types].xml', contentTypesXml);
  zip.folder('_rels').file('.rels', rootRelsXml);
  zip.folder('word').file('document.xml', documentXml);
  zip.folder('word').folder('_rels').file('document.xml.rels', relsXml);
  zip.folder('word').file('styles.xml', stylesXml);

  return zip.generateAsync({type:'blob', mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}

/* ============================================================
   PDF BUILDER (jsPDF) — mirrors the same layout as the DOCX
   ============================================================ */
function drawUnderlinedText(doc, text, x, y, fontSize, style, align){
  doc.setFont('helvetica', style);
  doc.setFontSize(fontSize);
  let drawX = x;
  const w = doc.getStringUnitWidth(text) * fontSize / doc.internal.scaleFactor;
  if (align === 'right') drawX = x - w;
  else if (align === 'center') drawX = x - w / 2;
  doc.text(text, drawX, y);
  doc.setLineWidth(0.25);
  doc.line(drawX, y + 0.9, drawX + w, y + 0.9);
  return w;
}

function drawDescriptionParagraph(doc, {label, text, x, y, maxWidth, fontSize, lineHeight}){
  doc.setFontSize(fontSize);
  const words = [{t:label, style:'bi', underline:true}, {t:':', style:'bi', underline:false}];
  text.split(/\s+/).filter(Boolean).forEach(w => words.push({t:w, style:'i', underline:false}));

  let cx = x, cy = y;
  const spaceW = doc.getStringUnitWidth(' ') * fontSize / doc.internal.scaleFactor;

  words.forEach((wd) => {
    doc.setFont('helvetica', wd.style === 'bi' ? 'bolditalic' : 'italic');
    const w = doc.getStringUnitWidth(wd.t) * fontSize / doc.internal.scaleFactor;
    if (cx + w > x + maxWidth) { cx = x; cy += lineHeight; }
    doc.text(wd.t, cx, cy);
    if (wd.underline) {
      doc.setLineWidth(0.2);
      doc.line(cx, cy + 0.8, cx + w, cy + 0.8);
    }
    cx += w + spaceW;
  });
  return cy + lineHeight;
}

function buildPdfBlob(layout){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'mm', format:'a4', orientation:'portrait'});

  drawUnderlinedText(doc, 'ANEXOS', PAGE_W_MM / 2, 18, 12, 'bolditalic', 'center');

  const pages = layout.pages;

  pages.forEach((items, pageIdx) => {
    if (pageIdx > 0) {
      doc.addPage();
    }

    let y = START_Y_MM;
    items.forEach((it, localIdx) => {
      doc.setFont('helvetica','bolditalic');
      doc.setFontSize(12);
      doc.text('ANEXO ' + it.n, MARGIN_MM, y);
      const headW = doc.getStringUnitWidth('ANEXO ' + it.n) * 12 / doc.internal.scaleFactor;
      doc.setLineWidth(0.25);
      doc.line(MARGIN_MM, y + 0.9, MARGIN_MM + headW, y + 0.9);
      y += HEADER_H_MM;

      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.rect(MARGIN_MM, y, CONTENT_W_MM, it.rowH_mm);
      // jsPDF estira la imagen al ancho/alto indicado, sin importar su
      // proporción real: se ve completa, sin recortes.
      doc.addImage(it.a.img1.dataUrl, 'JPEG', MARGIN_MM + PAD_MM, y + PAD_MM, it.imgW_mm, it.imgH_mm);
      doc.addImage(it.a.img2.dataUrl, 'JPEG', MARGIN_MM + PAD_MM + it.imgW_mm + GAP_IMGS_MM, y + PAD_MM, it.imgW_mm, it.imgH_mm);

      y += it.rowH_mm;

      doc.setFillColor(242,242,242);
      doc.rect(MARGIN_MM, y, CONTENT_W_MM, it.descBoxH, 'FD');

      drawDescriptionParagraph(doc, {
        label:'DESCRIPCIÓN', text: it.descText,
        x: MARGIN_MM + PAD_MM, y: y + PAD_MM + 3, maxWidth: CONTENT_W_MM - PAD_MM*2,
        fontSize: DESC_FONT_SIZE, lineHeight: DESC_LINE_H_MM
      });

      y += it.descBoxH;
      if (localIdx < items.length - 1) y += GAP_BETWEEN_MM;
    });
  });

  return doc.output('blob');
}

/* ============================================================
   GENERATE / DOWNLOAD
   ============================================================ */
function showMessage(text, type){
  const box = document.getElementById('status');
  box.innerHTML = `<div class="msg ${type}">${type==='info' ? '<span class="progress-dot"></span>' : ''}${text}</div>`;
}

function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

document.getElementById('generateBtn').addEventListener('click', async () => {
  const missing = [];
  state.anexos.forEach((a, idx) => {
    if (!a.img1 || !a.img2) missing.push(idx + 1);
  });
  if (missing.length) {
    showMessage(`Faltan imágenes en el Anexo ${missing.join(', ')}. Cada anexo necesita 2 imágenes.`, 'error');
    document.getElementById(`slot-${missing[0]-1}-0`).scrollIntoView({behavior:'smooth', block:'center'});
    return;
  }

  let filenameRaw = document.getElementById('filename').value.trim();
  if (!filenameRaw) {
    showMessage('Ingresa el nombre con el que se descargará el documento.', 'error');
    document.getElementById('filename').focus();
    return;
  }
  filenameRaw = filenameRaw.replace(/[\\/:*?"<>|]/g, '').trim() || 'Anexos';

  const btn = document.getElementById('generateBtn');
  btn.disabled = true;

  try {
    showMessage('Calculando el diseño de la página…', 'info');
    const layout = await computeLayout(state.anexos);

    showMessage('Generando el documento Word…', 'info');
    const docxBlob = await buildDocxBlob(layout);
    downloadBlob(docxBlob, `${filenameRaw}.docx`);

    showMessage('Generando el documento PDF…', 'info');
    await new Promise(r => setTimeout(r, 150)); // let UI paint
    const pdfBlob = buildPdfBlob(layout);
    downloadBlob(pdfBlob, `${filenameRaw}.pdf`);

    showMessage(`Listo: se descargaron <strong>${filenameRaw}.docx</strong> y <strong>${filenameRaw}.pdf</strong>.`, 'ok');
  } catch (err) {
    console.error(err);
    showMessage('Ocurrió un error al generar los archivos: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
  }
});
