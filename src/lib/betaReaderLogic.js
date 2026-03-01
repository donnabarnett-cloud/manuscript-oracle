/**
 * betaReaderLogic.js - AI Beta Reader Personas for Manuscript Oracle
 */
import { callOpenRouter, getFullManuscriptContent } from './oracleEngine';

export const personas = [
  { name: 'Chloe', role: 'Plot Architect', focus: 'Pacing and Plot Holes' },
  { name: 'Marcus', role: 'Emotional Resonance', focus: 'Character Depth and Reader Engagement' },
  { name: 'Sade', role: 'World Builder', focus: 'Internal Logic and Continuity' }
];

export const getBetaFeedback = async (novelId, personaName) => {
  const manuscript = await getFullManuscriptContent(novelId);
  const persona = personas.find(p => p.name === personaName);

  const prompt = `
    You are ${persona.name}, a ${persona.role} beta reader.
    Focus: ${persona.focus}.
    Manuscript: ${manuscript}
    Task: Provide high-level feedback.
  `;

  try {
    const feedback = await callOpenRouter(prompt);
    return { personaName, feedback };
  } catch (error) {
    return { personaName, error: error.message };
  }
};
