/**
 * MANUSCRIPT ORACLE ENGINE
 * The core intelligence layer for the Publishing House AI.
 * Implements whole-manuscript analysis, AI beta readers, and fix suggestions via OpenRouter.
 */
import { getNovelData } from './indexedDb';

export const getOracleSettings = () => {
  const saved = localStorage.getItem('MANUSCRIPT_ORACLE_Settings');
  if (!saved) {
    return { apiKey: '', defaultModel: 'arcee-ai/trinity-large-preview', temperature: 0.7 };
  }
  const parsed = JSON.parse(saved);
  const firstProfile = parsed.endpointProfiles?.[0] || {};
  return {
    apiKey: firstProfile.apiToken || '',
    defaultModel: firstProfile.modelName || 'arcee-ai/trinity-large-preview',
    temperature: 0.7,
      };
  };
  export const betaReaders = [
  { id: 'reader_1', name: 'The Emotional Heart', persona: 'Focuses on character chemistry, emotional stakes, and "the feels".' },
  { id: 'reader_2', name: 'The Plot Hound', persona: 'Obsessed with logic, pacing, and spotting plot holes.' },
  { id: 'reader_3', name: 'The Style Critic', persona: 'Focuses on prose quality, metaphors, and flow.' }
];

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
        if (scene && scene.content) fullText += `\n${scene.content}`;
      }
    }
  }
  return fullText.trim();
}

export async function runWholeBookAnalysis(novelId) {
  const manuscript = await getFullManuscriptContent(novelId);
  if (!manuscript) return 'No manuscript content found. Please add content to your scenes first.';
  const settings = getOracleSettings();
  if (!settings.apiKey) return 'No API key configured. Please add your OpenRouter API key in Settings.';
  const prompt = `You are a Lead Editor at a Major Publishing House.
Analyze this full manuscript and identify:
1. Plot contradictions across chapters.
2. Character arc drifts.
3. Pacing issues.
4. POV consistency problems.
5. Overall structural strengths and weaknesses.

MANUSCRIPT:
${manuscript.substring(0, 8000)}

Provide a comprehensive editorial report.`;
  try {
    return await callOpenRouter(prompt, settings);
  } catch (error) {
    return `Analysis failed: ${error.message}`;
  }
}

export async function runFullOracleAnalysis(manuscript) {
  const settings = getOracleSettings();
  if (!settings.apiKey) throw new Error('API Key required.');
  const summaries = await Promise.all(manuscript.chapters.map(async (chap) => {
    return await compressChapter(chap, settings);
  }));
  const globalPrompt = `You are a Lead Editor at a Major Publishing House.
Analyze this full manuscript summary.
Identify plot contradictions, character arc drifts, and pacing flatlines.

MANUSCRIPT SUMMARY:
${summaries.join('\n\n')}

Respond in JSON format with specific 'issues' and 'suggestedFixes'.`;
  const response = await callOpenRouter(globalPrompt, settings);
  return parseOracleResponse(response);
}

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

Respond ONLY with JSON:
{"criticalIssues": 0, "warnings": [], "suggestions": []}`;
  try {
    const response = await callOpenRouter(prompt, settings);
    const parsed = JSON.parse(response);
    return {
      criticalIssues: parsed.criticalIssues || 0,
      warnings: parsed.warnings || [],
      suggestions: parsed.suggestions || []
    };
  } catch {
    return { criticalIssues: 0, warnings: ['Analysis failed.'], suggestions: [] };
  }
}

async function compressChapter(chapter, settings) {
  const prompt = `Summarize this chapter in 2-3 sentences:\n${chapter.content || chapter.name}`;
  return await callOpenRouter(prompt, settings);
}

export async function callOpenRouter(prompt, settings) {
  const s = settings || getOracleSettings();
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${s.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: s.defaultModel,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const data = await response.json();
  return if (!data || !data.choices || !data.choices[0]) {     throw new Error('Invalid API response: ' + JSON.stringify(data));   }   return data.choices[0].message.content;
}

function parseOracleResponse(response) {
  try {
    return JSON.parse(response);
  } catch {
    return { issues: [], suggestedFixes: [], rawResponse: response };
  }
}
