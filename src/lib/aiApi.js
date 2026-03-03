/**
 * aiApi.js - Central AI API utilities for Manuscript Oracle
 * Provides scene generation, rewriting, and other content-generation functions.
 */
import { callOpenRouter, getOracleSettings, getFullManuscriptContent } from './oracleEngine';
import { getNovelData } from './indexedDb';

/**
 * Count words in a string.
 */
export function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Get word count for a single scene by ID.
 */
export async function getSceneWordCount(novelId, sceneId) {
  const data = await getNovelData(novelId);
  if (!data || !data.scenes) return 0;
  const scene = data.scenes[sceneId];
  return countWords(scene?.content || '');
}

/**
 * Get total manuscript word count for a novel.
 */
export async function getTotalWordCount(novelId) {
  const data = await getNovelData(novelId);
  if (!data || !data.scenes) return 0;
  return Object.values(data.scenes).reduce((sum, scene) => {
    return sum + countWords(scene?.content || '');
  }, 0);
}

/**
 * Generate scene content using AI.
 * @param {string} novelId - The novel ID
 * @param {object} sceneContext - Context about the scene to write
 * @param {string} sceneContext.sceneTitle - Title/name of the scene
 * @param {string} sceneContext.synopsis - What should happen in this scene
 * @param {string} sceneContext.chapterName - Chapter this scene belongs to
 * @param {string} sceneContext.actName - Act this scene belongs to
 * @param {string} sceneContext.characters - Relevant characters
 * @param {string} sceneContext.previousContent - Brief summary of what came before
 * @param {number} sceneContext.targetWordCount - Approximate target word count (default 500)
 * @returns {Promise<string>} The generated scene content
 */
export async function generateSceneContent(novelId, sceneContext) {
  const settings = getOracleSettings();
  if (!settings.apiKey) {
    throw new Error('No API key configured. Please add your OpenRouter API key in Settings.');
  }

  const {
    sceneTitle = 'Untitled Scene',
    synopsis = '',
    chapterName = '',
    actName = '',
    characters = '',
    previousContent = '',
    targetWordCount = 500
  } = sceneContext;

  if (!synopsis) {
    throw new Error('Please provide a scene synopsis so the AI knows what to write.');
  }

  const prompt = `You are a professional novelist.
Write a scene for a novel with the following details:

Act: ${actName}
Chapter: ${chapterName}
Scene Title: ${sceneTitle}
Key Characters: ${characters || 'As appropriate to the story'}

Scene Synopsis (what must happen):
${synopsis}

${previousContent ? `Context from previous scenes:
${previousContent}

` : ''}Instructions:
- Write approximately ${targetWordCount} words
- Write in prose narrative style (not a summary)
- Show, don't tell - use dialogue, action, and description
- Maintain consistent POV and voice throughout
- End the scene in a way that creates forward momentum
- Do NOT include scene titles, chapter headers, or any metadata - only the prose itself

Begin writing the scene now:`;

  return await callOpenRouter(prompt, settings);
}

/**
 * Rewrite/improve existing scene content using AI.
 * @param {string} existingContent - The current scene text
 * @param {string} instruction - What to improve or change
 * @returns {Promise<string>} The rewritten scene content
 */
export async function rewriteSceneContent(existingContent, instruction) {
  const settings = getOracleSettings();
  if (!settings.apiKey) {
    throw new Error('No API key configured. Please add your OpenRouter API key in Settings.');
  }

  if (!existingContent) {
    throw new Error('No existing content to rewrite.');
  }

  const prompt = `You are a professional editor and novelist.
Please rewrite the following scene according to this instruction:

Instruction: ${instruction || 'Improve the prose quality, pacing, and clarity'}

Original scene:
${existingContent}

Rewritten scene (same approximate length, improved quality):`;  

  return await callOpenRouter(prompt, settings);
}

/**
 * Generate a chapter summary from scene content.
 */
export async function generateChapterSummary(chapterContent, chapterName) {
  const settings = getOracleSettings();
  if (!settings.apiKey) {
    throw new Error('No API key configured.');
  }

  const prompt = `Summarize the following chapter content in 2-3 concise sentences suitable for a chapter outline:

Chapter: ${chapterName}
${chapterContent.substring(0, 4000)}`;

  return await callOpenRouter(prompt, settings);
}
