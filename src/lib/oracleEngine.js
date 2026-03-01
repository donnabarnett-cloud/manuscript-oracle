/**
 * MANUSCRIPT ORACLE ENGINE
 * The core intelligence layer for the Publishing House AI.
 * Implements whole-manuscript analysis, AI beta readers, and fix suggested via OpenRouter.
 */

import { v4 as uuidv4 } from 'uuid';

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
  ${summaries.join('\
\
')}
  
  Respond in JSON format with specific 'issues' and 'suggestedFixes'.`;

  const response = await callOpenRouter(globalPrompt, settings);
  return parseOracleResponse(response);
}

async function callOpenRouter(prompt, settings) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${settings.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: settings.defaultModel,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await response.json();
  return data.choices[0].message.content;
}

// ... Additional core logic for fix application and beta feedback ...
