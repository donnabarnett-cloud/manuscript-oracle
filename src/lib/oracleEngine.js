/**
 * MANUSCRIPT ORACLE ENGINE
 * The core intelligence layer for the Publishing House AI.
 * Implements whole-manuscript analysis, AI beta readers, and fix suggestions via OpenRouter.
 */
import { getNovelData } from './indexedDb';

// Configuration for OpenRouter (Same as Plot Bunni settings)
export const getOracleSettings = () => {
  const saved = localStorage.getItem('manuscript_oracle_settings');
  return saved ? JSON.parse(saved) : {
    apiKey: '',
    defaultModel: 'arcee-ai/trinity-large-preview',
    temperature: 0.7,
  };
};

/**
 * AI BETA READER SYSTEM
 * Simulates human readers with specific emotional profiles.
 */
export const betaReaders = [
  { id: 'reader_1', name: 'The Emotional Heart', persona: 'Focuses on character chemistry, emotional stakes, and "the feels".' },
  { id: 'reader_2', name: 'The Plot Hound', persona: 'Obsessed with logic, pacing, and spotting plot holes.' },
  { id: 'reader_3', name: 'The Style Critic', persona: 'Focuses on prose quality, metaphors, and flow.' }
];

/**
 * Extracts all manuscript text from a novel, concatenating scenes in order.
 * @param {string} novelId - The ID of the novel.
 * @returns {Promise<string>} The full manuscript text.
 */
export async function getFullManuscriptContent(novelId) {
  const novelData = await getNovelData(novelId);
  if (!novelData) return '';

  const { acts, actOrder, chapters, scenes } = novelData;
  let fullText = '';

  const orderedActIds = actOrder || Object.keys(acts || {});
  for (const actId of orderedActIds) {
    const act = (acts || {})[actId];
    if (!act) continue;
    const orderedChapterIds = act.chapterOrder || [];
    for (const chapterId of orderedChapterIds) {
      const chapter = (chapters || {})[chapterId];
      if (!chapter) continue;
      fullText += `\n\n--- Chapter: ${chapter.name} ---\n`;
      const orderedSceneIds = chapter.sceneOrder || [];
      for (const sceneId of orderedSceneIds) {
        const scene = (scenes || {})[sceneId];
        if (scene && scene.content) {
          fullText += `\n${scene.content}`;
        }
      }
    }
  }
  return fullText.trim();
}

/**
 * WHOLE-MANUSCRIPT ANALYSIS
 * Processes all 100k+ words using hierarchical chunking.
 */
export async function runFullOracleAnalysis(manuscript) {
  const settings = getOracleSettings();
  if (!settings.apiKey) throw new Error("API Key required.");

  // Step 1: Generate Chapter Summaries (Semantic Compression)
  const summaries = await Promise.all(manuscript.chapters.map(async (chap) => {
    return await compressChapter(chap, settings);
  }));

  // Step 2: Global Context Analysis
  const globalPrompt = `You are a Lead Editor at a Major Publishing House. 
Analyze this full manuscript summary (40 chapters).
Identify:
1. Plot contradictions across chapters.
2. Character arc drifts (e.g. character knows something they shouldn't yet).
3. Pacing flatlines.

MANUSCRIPT SUMMARY:
${summaries.join('\n\n')}

Respond in JSON format with specific 'issues' and 'suggestedFixes'.`;

  const response = await callOpenRouter(globalPrompt, settings);
  return parseOracleResponse(response);
}

/**
 * Analyzes manuscript health for a given novel.
 * Returns critical issues, warnings, and suggestions.
 * @param {string} novelId - The ID of the novel.
 * @returns {Promise<{criticalIssues: number, warnings: string[], suggestions: string[]}>}
 */
export async function analyzeManuscriptHealth(novelId) {
  const settings = getOracleSettings();
  if (!settings.apiKey) {
    return { criticalIssues: 0, warnings: ['No API key configured.'], suggestions: [] };
  }

  const manuscript = await getFullManuscriptContent(novelId);
  if (!manuscript) {
    return { criticalIssues: 0, warnings: ['No manuscript content found.'], suggestions: [] };
  }

  const prompt = `You are a professional manuscript editor.
Analyze the following manuscript excerpt for health issues:

MANUSCRIPT (first 3000 chars):
${manuscript.substring(0, 3000)}

Respond ONLY with JSON in this exact format:
{
  "criticalIssues": <number>,
  "warnings": ["<warning1>", "<warning2>"],
  "suggestions": ["<suggestion1>", "<suggestion2>"]
}`;

  try {
    const response = await callOpenRouter(prompt, settings);
    const parsed = JSON.parse(response);
    return {
      criticalIssues: parsed.criticalIssues || 0,
      warnings: parsed.warnings || [],
      suggestions: parsed.suggestions || []
    };
  } catch {
    return { criticalIssues: 0, warnings: ['Analysis failed. Check API key and model.'], suggestions: [] };
  }
}

async function compressChapter(chapter, settings) {
  const prompt = `Summarize this chapter in 2-3 sentences for manuscript analysis:
${chapter.content || chapter.name}`;
  return await callOpenRouter(prompt, settings);
}

export async function callOpenRouter(prompt, settings) {
  const s = settings || getOracleSettings();
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${s.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: s.defaultModel,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await response.json();
  return data.choices[0].message.content;
}

function parseOracleResponse(response) {
  try {
    return JSON.parse(response);
  } catch {
    return { issues: [], suggestedFixes: [], rawResponse: response };
  }
}
