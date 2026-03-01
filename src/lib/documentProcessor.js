// Document processing utilities for Word and PDF import/export
// Uses dynamic imports to avoid blocking initial app load

/**
 * Count words in text
 */
export function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Collect all scene text from the novel data structure
 */
export function collectNovelText(novelData) {
  const { actOrder = [], acts = {}, chapters = {}, scenes = {} } = novelData;
  const parts = [];
  actOrder.forEach(actId => {
    const act = acts[actId];
    if (!act) return;
    if (act.name) parts.push(`\n\n## ${act.name}\n`);
    (act.chapterOrder || []).forEach(chapterId => {
      const chapter = chapters[chapterId];
      if (!chapter) return;
      if (chapter.name) parts.push(`\n### ${chapter.name}\n`);
      (chapter.sceneOrder || []).forEach(sceneId => {
        const scene = scenes[sceneId];
        if (!scene) return;
        if (scene.content) parts.push(scene.content);
      });
    });
  });
  return parts.join('\n\n');
}

/**
 * Import Word document (.docx)
 */
export async function importWordDocument(file) {
  try {
    const mammoth = (await import('mammoth')).default;
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;
    return {
      success: true,
      text,
      wordCount: countWords(text),
    };
  } catch (error) {
    console.error('Error importing Word document:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Import PDF document
 */
export async function importPDFDocument(file) {
  try {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n\n';
    }
    return {
      success: true,
      text: fullText.trim(),
      wordCount: countWords(fullText),
    };
  } catch (error) {
    console.error('Error importing PDF:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Export novel as Word document (.docx) with KDP 6x9 formatting
 */
export async function exportAsWordDocument(novelData, novelName) {
  try {
    const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = await import('docx');
    const { actOrder = [], acts = {}, chapters = {}, scenes = {} } = novelData;
    const children = [];

    children.push(
      new Paragraph({
        text: novelName || novelData.name || 'Untitled Manuscript',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      })
    );

    actOrder.forEach((actId) => {
      const act = acts[actId];
      if (!act) return;
      (act.chapterOrder || []).forEach((chapterId, chapterIndex) => {
        const chapter = chapters[chapterId];
        if (!chapter) return;
        children.push(
          new Paragraph({
            text: chapter.name || `Chapter ${chapterIndex + 1}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 480, after: 240 },
          })
        );
        (chapter.sceneOrder || []).forEach(sceneId => {
          const scene = scenes[sceneId];
          if (!scene || !scene.content) return;
          const paragraphs = scene.content.split(/\n\n+/);
          paragraphs.forEach(para => {
            if (para.trim()) {
              children.push(
                new Paragraph({
                  children: [new TextRun({ text: para.trim(), size: 22 })],
                  alignment: AlignmentType.JUSTIFIED,
                  spacing: { after: 240, line: 360 },
                })
              );
            }
          });
        });
      });
    });

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            width: 8640,
            height: 12960,
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        children,
      }],
    });

    const blob = await Packer.toBlob(doc);
    downloadFile(blob, `${novelName || 'manuscript'}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    return { success: true };
  } catch (error) {
    console.error('Error exporting Word document:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Export novel as PDF with KDP 6x9 formatting
 */
export async function exportAsPDF(novelData, novelName) {
  try {
    const pdfMakeModule = await import('pdfmake/build/pdfmake');
    const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
    const pdfMake = pdfMakeModule.default || pdfMakeModule;
    const pdfFonts = pdfFontsModule.default || pdfFontsModule;
    pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs;

    const { actOrder = [], acts = {}, chapters = {}, scenes = {} } = novelData;
    const content = [];

    content.push(
      { text: novelName || novelData.name || 'Untitled Manuscript', fontSize: 24, bold: true, alignment: 'center', margin: [0, 200, 0, 20] },
      { text: '', pageBreak: 'after' }
    );

    actOrder.forEach((actId) => {
      const act = acts[actId];
      if (!act) return;
      (act.chapterOrder || []).forEach((chapterId, chapterIndex) => {
        const chapter = chapters[chapterId];
        if (!chapter) return;
        content.push({
          text: chapter.name || `Chapter ${chapterIndex + 1}`,
          fontSize: 18,
          bold: true,
          alignment: 'center',
          margin: [0, 36, 0, 18],
        });
        (chapter.sceneOrder || []).forEach(sceneId => {
          const scene = scenes[sceneId];
          if (!scene || !scene.content) return;
          const paragraphs = scene.content.split(/\n\n+/);
          paragraphs.forEach(para => {
            if (para.trim()) {
              content.push({
                text: para.trim(),
                fontSize: 11,
                lineHeight: 1.5,
                alignment: 'justify',
                margin: [0, 0, 0, 12],
              });
            }
          });
        });
      });
    });

    const docDefinition = {
      pageSize: { width: 432, height: 648 },
      pageMargins: [54, 54, 54, 54],
      content,
      defaultStyle: { fontSize: 11, lineHeight: 1.5 },
    };

    pdfMake.createPdf(docDefinition).download(`${novelName || 'manuscript'}.pdf`);
    return { success: true };
  } catch (error) {
    console.error('Error exporting PDF:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Helper to trigger file download
 */
function downloadFile(blob, filename, mimeType) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
