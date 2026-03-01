import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Eye, EyeOff, CheckCircle } from 'lucide-react';

const STORAGE_KEY = 'manuscript_oracle_settings';

const RECOMMENDED_MODELS = [
  { value: 'arcee-ai/trinity-large-preview', label: 'Arcee Trinity Large (Free)' },
  { value: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B (Free)' },
  { value: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B (Free)' },
  { value: 'google/gemma-3-27b-it:free', label: 'Google Gemma 3 27B (Free)' },
  { value: 'deepseek/deepseek-chat-v3-0324:free', label: 'DeepSeek V3 (Free)' },
  { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (Paid)' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (Paid)' },
];

export default function OracleSettingsSection() {
  const [settings, setSettings] = useState({
    apiKey: '',
    defaultModel: 'arcee-ai/trinity-large-preview',
    temperature: 0.7,
  });
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSettings(JSON.parse(stored));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Manuscript Oracle — AI Settings
        </CardTitle>
        <CardDescription>
          Configure your OpenRouter API key and preferred model for the Oracle Analysis and Beta Reader features.
          Get a free API key at{' '}
          <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary underline">
            openrouter.ai
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="oracle-api-key">OpenRouter API Key</Label>
          <div className="flex gap-2">
            <Input
              id="oracle-api-key"
              type={showKey ? 'text' : 'password'}
              placeholder="sk-or-v1-..."
              value={settings.apiKey}
              onChange={(e) => handleChange('apiKey', e.target.value)}
              className="font-mono text-sm"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowKey(!showKey)}
              title={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Your key is stored locally in your browser and never sent anywhere except OpenRouter.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="oracle-model">AI Model</Label>
          <Select
            value={settings.defaultModel}
            onValueChange={(val) => handleChange('defaultModel', val)}
          >
            <SelectTrigger id="oracle-model">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {RECOMMENDED_MODELS.map(m => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Free models work well for most analysis. Paid models give more detailed feedback.
          </p>
        </div>

        <Button onClick={handleSave} className="w-full gap-2">
          {saved ? (
            <><CheckCircle className="h-4 w-4" /> Saved!</>
          ) : (
            <>Save Oracle Settings</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
