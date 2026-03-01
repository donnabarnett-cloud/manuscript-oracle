// Document processing utilities for Word and PDF import/export
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, PageBreak } from 'docx';
import * as pdfjs from 'pdfjs-dist';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Initialize pdfMake with fonts
pdfMake.vfs = pdfFonts.pdfMake.vfs;

// KDP 6x9 print formatting specifications (in points: 1 inch = 72 points)
const KDP_6x9_FORMAT = {
  pageSize: {
    width: 432, // 6 inches
    height: 648, // 9 inches
  },
  pageMargins: [54, 54, 54, 54], // 0.75 inch margins all around
  styles: {
    chapterTitle: {
      fontSize: 18,
      bold: true,
      alignment: 'center',
      margin: [0, 36, 0, 18], // Top margin 0.5", bottom 0.25"
    },
    bodyText: {
      fontSize: 11,
      lineHeight: 1.5,
      alignment: 'justify',
    },
  },
};

/**
 * Count words in text
 */
export function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Calculate total word count for a novel
 */
export function calculateTotalWordCount(novelData) {
  let totalWords = 0;
  
  if (!novelData || !novelData.chapters) return 0;
  
  Object.values(novelData.chapters).forEach(chapter => {
    if (chapter.prose) {
      totalWords += countWords(chapter.prose);
    }
  });
  
  return totalWords;
}

/**
 * Calculate word count per chapter
 */
export function calculateChapterWordCounts(novelData) {
  const chapterWordCounts = {};
  
  if (!novelData || !novelData.chapters) return chapterWordCounts;
  
  Object.entries(novelData.chapters).forEach(([chapterId, chapter]) => {
    chapterWordCounts[chapterId] = {
      id: chapterId,
      title: chapter.title || 'Untitled Chapter',
      wordCount: countWords(chapter.prose || ''),
    };
  });
  
  return chapterWordCounts;
}

/**
 * Import Word document (.docx)
 */
export async function importWordDocument(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    // Split content by chapter markers or double line breaks
    const text = result.value;
    const chapters = parseChaptersFromText(text);
    
    return {
      success: true,
      chapters,
      totalWords: countWords(text),
    };
  } catch (error) {
    console.error('Error importing Word document:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Import PDF document
 */
export async function importPDFDocument(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n\n';
    }
    
    // Parse chapters from extracted text
    const chapters = parseChaptersFromText(fullText);
    
    return {
      success: true,
      chapters,
      totalWords: countWords(fullText),
    };
  } catch (error) {
    console.error('Error importing PDF:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Parse chapters from text
 * Looks for chapter markers like "Chapter 1", "Chapter One", etc.
 */
function parseChaptersFromText(text) {
  const chapters = [];
  
  // Try to split by chapter markers
  const chapterRegex = /(?:^|\n)(?:Chapter|CHAPTER)\s+([\d\w]+)[:\s]*([^\n]*)/g;
  const matches = [...text.matchAll(chapterRegex)];
  
  if (matches.length > 0) {
    // Split by detected chapters
    let lastIndex = 0;
    
    matches.forEach((match, index) => {
      if (index > 0) {
        // Add previous chapter
        const chapterText = text.substring(lastIndex, match.index).trim();
        if (chapterText) {
          chapters.push({
            title: matches[index - 1][2] || `Chapter ${matches[index - 1][1]}`,
            content: chapterText,
            wordCount: countWords(chapterText),
          });
        }
      }
      lastIndex = match.index;
    });
    
    // Add last chapter
    const lastChapterText = text.substring(lastIndex).trim();
    if (lastChapterText) {
      const lastMatch = matches[matches.length - 1];
      chapters.push({
        title: lastMatch[2] || `Chapter ${lastMatch[1]}`,
        content: lastChapterText,
        wordCount: countWords(lastChapterText),
      });
    }
  } else {
    // No chapter markers found, treat entire text as one chapter
    chapters.push({
      title: 'Imported Content',
      content: text.trim(),
      wordCount: countWords(text),
    });
  }
  
  return chapters;
}

/**
 * Export novel as Word document with KDP 6x9 formatting
 */
export async function exportAsWordDocument(novelData, novelName) {
  try {
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            width: 8640, // 6 inches in twips (1/1440 inch)
            height: 12960, // 9 inches in twips
            margin: {
              top: 1080, // 0.75 inch
              right: 1080,
              bottom: 1080,
              left: 1080,
            },
          },
        },
        children: buildDocumentContent(novelData),
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
 * Build document content from novel data
 */
function buildDocumentContent(novelData) {
  const content = [];
  
  // Add title page if present
  if (novelData.synopsis || novelData.authorName) {
    content.push(
      new Paragraph({
        text: novelData.name || 'Untitled',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: `by ${novelData.authorName || 'Unknown Author'}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
    content.push(new Paragraph({ text: '', pageBreakBefore: true }));
  }
  
  // Add chapters in order
  const actOrder = novelData.actOrder || [];
  
  actOrder.forEach((actId, actIndex) => {
    const act = novelData.acts?.[actId];
    if (!act) return;
    
    act.chapterOrder?.forEach((chapterId, chapterIndex) => {
      const chapter = novelData.chapters?.[chapterId];
      if (!chapter) return;
      
      // Add chapter title
      content.push(
        new Paragraph({
          text: chapter.title || `Chapter ${chapterIndex + 1}`,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 480, after: 240 },
        })
      );
      
      // Add chapter prose
      if (chapter.prose) {
        const paragraphs = chapter.prose.split(/\n\n+/);
        paragraphs.forEach(para => {
          if (para.trim()) {
            content.push(
              new Paragraph({
                children: [new TextRun({
                  text: para.trim(),
                  size: 22, // 11pt
                })],
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 240, line: 360 }, // 1.5 line spacing
              })
            );
          }
        });
      }
      
      // Page break after each chapter (except last)
      if (actIndex < actOrder.length - 1 || chapterIndex < (act.chapterOrder?.length || 0) - 1) {
        content.push(new Paragraph({ text: '', pageBreakBefore: true }));
      }
    });
  });
  
  return content;
}

/**
 * Export novel as PDF with KDP 6x9 formatting
 */
export async function exportAsPDF(novelData, novelName) {
  try {
    const docDefinition = {
      pageSize: KDP_6x9_FORMAT.pageSize,
      pageMargins: KDP_6x9_FORMAT.pageMargins,
      content: buildPDFContent(novelData),
      defaultStyle: {
        font: 'Times', // Use serif font for print
        fontSize: 11,
        lineHeight: 1.5,
      },
      styles: KDP_6x9_FORMAT.styles,
    };
    
    pdfMake.createPdf(docDefinition).download(`${novelName || 'manuscript'}.pdf`);
    
    return { success: true };
  } catch (error) {
    console.error('Error exporting PDF:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Build PDF content from novel data
 */
function buildPDFContent(novelData) {
  const content = [];
  
  // Add title page
  if (novelData.synopsis || novelData.authorName) {
    content.push(
      { text: novelData.name || 'Untitled', style: 'chapterTitle', fontSize: 24, margin: [0, 200, 0, 20] },
      { text: `by ${novelData.authorName || 'Unknown Author'}`, alignment: 'center', margin: [0, 0, 0, 40] },
      { text: '', pageBreak: 'after' }
    );
  }
  
  // Add chapters
  const actOrder = novelData.actOrder || [];
  
  actOrder.forEach((actId, actIndex) => {
    const act = novelData.acts?.[actId];
    if (!act) return;
    
    act.chapterOrder?.forEach((chapterId, chapterIndex) => {
      const chapter = novelData.chapters?.[chapterId];
      if (!chapter) return;
      
      // Chapter title
      content.push({
        text: chapter.title || `Chapter ${chapterIndex + 1}`,
        style: 'chapterTitle',
      });
      
      // Chapter prose
      if (chapter.prose) {
        const paragraphs = chapter.prose.split(/\n\n+/);
        paragraphs.forEach(para => {
          if (para.trim()) {
            content.push({
              text: para.trim(),
              style: 'bodyText',
              margin: [0, 0, 0, 12],
            });
          }
        });
      }
      
      // Page break after each chapter (except last)
      if (actIndex < actOrder.length - 1 || chapterIndex < (act.chapterOrder?.length || 0) - 1) {
        content.push({ text: '', pageBreak: 'after' });
      }
    });
  });
  
  return content;
}

/**
 * Helper function to trigger file download
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
