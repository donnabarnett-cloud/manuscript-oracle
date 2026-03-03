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

  if (!manuscript || manuscript.trim().length === 0) {
    return {
      personaName,
      feedback: null,
      error: 'No manuscript content found. Please add content to your scenes before requesting beta feedback.'
    };
  }

  const persona = personas.find(p => p.name === personaName);
  if (!persona) {
    return { personaName, feedback: null, error: `Unknown persona: ${personaName}` };
  }

  // Truncate to ~6000 chars to stay within token limits
  const excerpt = manuscript.substring(0, 6000);
  const isTruncated = manuscript.length > 6000;

  const prompt = `You are ${persona.name}, a ${persona.role} beta reader.
Focus area: ${persona.focus}.

Please read the following manuscript excerpt and provide detailed, constructive beta reader feedback from your unique perspective.
${isTruncated ? '(Note: This is an excerpt of a longer manuscript.)' : ''}

MANUSCRIPT:
${excerpt}

Provide your feedback covering:
1. Your overall impression
2. Specific strengths you noticed
3. Areas that need improvement (with examples from the text)
4. Actionable suggestions for the author

Write as ${persona.name} would speak - with your specific personality and focus on ${persona.focus}.`;

  try {
    const feedback = await callOpenRouter(prompt);
    return { personaName, feedback, error: null };
  } catch (error) {
    return { personaName, feedback: null, error: error.message };
  }
};
