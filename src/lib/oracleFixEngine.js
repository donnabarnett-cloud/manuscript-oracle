/**
 * oracleFixEngine.js - Automated Manuscript Fix Logic for Manuscript Oracle
 * This engine analyzes suggestions from the Oracle Engine and applies fixes directly to scene data in IndexedDB.
 */
import { getNovelById, updateChapterProse } from './indexedDb';
import { callOpenRouter, getFullManuscriptContent } from './oracleEngine';

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

/**
 * Alias for applyOracleFix - used by OracleAnalysisModal
 */
export const applyFix = async (novelId, fix) => {
  return applyOracleFix(novelId, fix.sceneId, fix.type, fix.originalProse, fix.suggestion);
};

/**
 * Generates fix suggestions based on an analysis result.
 * @param {string} analysis - The analysis text from runWholeBookAnalysis.
 * @returns {Promise<Array>} Array of suggestion objects.
 */
export const getFixSuggestions = async (analysis) => {
  if (!analysis) return [];

  const prompt = `Based on this manuscript analysis, provide 3-5 specific, actionable fix suggestions.
Analysis: ${analysis}

Respond ONLY with a JSON array in this format:
[{"description": "Fix description", "type": "pacing|character|plot|style", "priority": "high|medium|low"}]`;

  try {
    const response = await callOpenRouter(prompt);
    // Try to parse JSON, fallback to simple array
    try {
      return JSON.parse(response);
    } catch {
      return [{ description: response, type: 'general', priority: 'medium' }];
    }
  } catch (error) {
    return [{ description: `Error generating suggestions: ${error.message}`, type: 'error', priority: 'low' }];
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
