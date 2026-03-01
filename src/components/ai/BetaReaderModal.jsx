import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '../../context/DataContext';
import { personas, getBetaFeedback } from '../../lib/betaReaderLogic';
import Markdown from 'react-markdown';

export const BetaReaderModal = ({ isOpen, onOpenChange }) => {
  const { t } = useTranslation();
  const { currentNovelId } = useData();
  const [selectedPersona, setSelectedPersona] = useState(personas[0].name);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGetFeedback = async () => {
    setLoading(true);
    const result = await getBetaFeedback(currentNovelId, selectedPersona);
    setFeedback(result);
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <div className="flex items-center gap-4 mb-4">
          <Select value={selectedPersona} onValueChange={setSelectedPersona}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Persona" />
            </SelectTrigger>
            <SelectContent>
              {personas.map(p => (
                <SelectItem key={p.name} value={p.name}>{p.name} ({p.role})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleGetFeedback} disabled={loading}>
            {loading ? 'Reading...' : 'Get Beta Feedback'}
          </Button>
        </div>
        
        <ScrollArea className="flex-1 border rounded p-4">
          {feedback ? (
            <div className="prose dark:prose-invert max-w-none">
              <Markdown>{feedback.feedback}</Markdown>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a persona and click the button to get feedback on your manuscript.
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
