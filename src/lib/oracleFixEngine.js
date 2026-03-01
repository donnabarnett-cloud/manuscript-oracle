/**
 * oracleFixEngine.js - Automated Manuscript Fix Logic for Manuscript Oracle
 * This engine analyzes suggestions from the Oracle Engine and applies fixes directly to scene data in IndexedDB.
 */
import { getNovelById, updateChapterProse } from './indexedDb';
import { callOpenRouter } from './oracleEngine';

export const applyOracleFix = async (novelId, sceneId, fixType, originalProse, suggestion) => {
  const prompt = `
    You are a professional editor for a prestigious publishing house.
    Original Prose: "${originalProse}"
    Suggested Improvement: "${suggestion}"
    Fix Type: ${fixType}

    Task: Re-write the section while incorporating the fix naturally. Maintain the author's voice but ensure "5-star" quality.
    Respond ONLY with the revised prose.
  `;

  try {
    const revisedProse = await callOpenRouter(prompt);
    await updateChapterProse(novelId, sceneId, revisedProse);
    return { success: true, revisedProse };
  } catch (error) {
    console.error('Oracle Fix Engine Error:', error);
    return { success: false, error: error.message };
  }
};

export const autoPolishFullManuscript = async (novelId) => {
  const novel = await getNovelById(novelId);
  const results = [];

  if (!novel || !novel.scenes) return results;

  for (const [sceneId, scene] of Object.entries(novel.scenes)) {
    if (!scene.content) continue;
    const polishPrompt = `
      Act as a Lead Editor. Polish this scene for pacing, flow, and POV consistency.
      Scene Title: ${scene.name}
      Current Prose: ${scene.content}

      Respond ONLY with the polished prose.
    `;

    try {
      const polishedProse = await callOpenRouter(polishPrompt);
      await updateChapterProse(novelId, sceneId, polishedProse);
      results.push({ sceneId, status: 'Polished' });
    } catch (error) {
      results.push({ sceneId, status: 'Error', error: error.message });
    }
  }

  return results;
};
