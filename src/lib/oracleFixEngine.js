/**
 * oracleFixEngine.js - Automated Manuscript Fix Logic for Manuscript Oracle
 * This engine analyzes suggestions from the Oracle Engine and applies fixes directly to chapter data in IndexedDB.
 */

import { getNovelById, updateChapterProse } from './indexedDb';
import { generateChatCompletion } from './aiContextUtils';

export const applyOracleFix = async (novelId, chapterId, fixType, originalProse, suggestion) => {
  const prompt = `
    You are a professional editor for a prestigious publishing house.
    Original Prose: "${originalProse}"
    Suggested Improvement: "${suggestion}"
    Fix Type: ${fixType}
    
    Task: Re-write the section of the chapter while incorporating the fix naturally. Maintain the author's voice but ensure "5-star" quality.
    Respond ONLY with the revised prose.
  `;

  try {
    const revisedProse = await generateChatCompletion([{ role: 'user', content: prompt }]);
    await updateChapterProse(novelId, chapterId, revisedProse);
    return { success: true, revisedProse };
  } catch (error) {
    console.error('Oracle Fix Engine Error:', error);
    return { success: false, error: error.message };
  }
};

export const autoPolishFullManuscript = async (novelId) => {
  const novel = await getNovelById(novelId);
  const results = [];
  
  for (const chapter of novel.chapters) {
    const polishPrompt = `
      Act as a Lead Editor. Polish this chapter for pacing, flow, and POV consistency.
      Chapter Title: ${chapter.title}
      Current Prose: ${chapter.prose}
      
      Respond ONLY with the polished prose.
    `;
    
    const polishedProse = await generateChatCompletion([{ role: 'user', content: polishPrompt }]);
    await updateChapterProse(novelId, chapter.id, polishedProse);
    results.push({ chapterId: chapter.id, status: 'Polished' });
  }
  
  return results;
};
