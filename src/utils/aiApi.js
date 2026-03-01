// AI API Integration for Groq and Perplexity

export const aiApi = {
  // Get API keys from localStorage
  getApiKeys() {
    return {
      groq: localStorage.getItem('manuscript_oracle_groq_api_key') || '',
      perplexity: localStorage.getItem('manuscript_oracle_perplexity_api_key') || ''
    };
  },

  // Save API keys to localStorage
  saveApiKeys(groqKey, perplexityKey) {
    if (groqKey) {
      localStorage.setItem('manuscript_oracle_groq_api_key', groqKey);
    }
    if (perplexityKey) {
      localStorage.setItem('manuscript_oracle_perplexity_api_key', perplexityKey);
    }
  },

  // Analyze text with Groq API
  async analyzeWithGroq(text, analysisType = 'comprehensive') {
    const { groq: apiKey } = this.getApiKeys();
    
    if (!apiKey) {
      throw new Error('Groq API key not configured');
    }

    const prompts = {
      developmental: 'Analyze this manuscript excerpt for story structure, plot consistency, character development, and pacing. Provide specific, actionable feedback.',
      line: 'Perform a line edit on this text. Focus on voice consistency, sentence flow, word choice, and stylistic improvements. Suggest specific revisions.',
      copy: 'Perform a copyedit on this text. Identify grammar errors, spelling mistakes, punctuation issues, and formatting problems. List all corrections needed.',
      comprehensive: 'Provide a comprehensive editorial analysis covering developmental editing, line editing, and copyediting. Break down feedback into clear sections.'
    };

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [
            {
              role: 'system',
              content: 'You are an expert manuscript editor with years of publishing experience. Provide detailed, professional feedback.'
            },
            {
              role: 'user',
              content: `${prompts[analysisType]}\n\nManuscript excerpt:\n${text.substring(0, 15000)}`
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to analyze with Groq');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      throw new Error(`Groq API error: ${error.message}`);
    }
  },

  // Research with Perplexity API
  async researchWithPerplexity(query) {
    const { perplexity: apiKey } = this.getApiKeys();
    
    if (!apiKey) {
      throw new Error('Perplexity API key not configured');
    }

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a research assistant helping authors with factual research for their manuscripts. Provide accurate, well-sourced information.'
            },
            {
              role: 'user',
              content: query
            }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to research with Perplexity');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      throw new Error(`Perplexity API error: ${error.message}`);
    }
  },

  // Generate AI suggestions for plot development
  async generatePlotSuggestions(currentPlot, genre) {
    const { groq: apiKey } = this.getApiKeys();
    
    if (!apiKey) {
      throw new Error('Groq API key not configured');
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [
            {
              role: 'system',
              content: 'You are a creative story consultant specializing in plot development. Suggest engaging plot twists and developments.'
            },
            {
              role: 'user',
              content: `Genre: ${genre}\n\nCurrent plot summary:\n${currentPlot}\n\nSuggest 3-5 potential plot developments or twists that would enhance this story.`
            }
          ],
          temperature: 0.8,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate plot suggestions');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      throw new Error(`Plot suggestions error: ${error.message}`);
    }
  },

  // Check if API keys are configured
  hasApiKeys() {
    const keys = this.getApiKeys();
    return !!(keys.groq || keys.perplexity);
  },

  // Clear API keys
  clearApiKeys() {
    localStorage.removeItem('manuscript_oracle_groq_api_key');
    localStorage.removeItem('manuscript_oracle_perplexity_api_key');
  }
};

export default aiApi;
