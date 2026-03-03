import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '../../context/DataContext';
import { personas, getBetaFeedback } from '../../lib/betaReaderLogic';
import Markdown from 'react-markdown';
import { AlertCircle, Loader2 } from 'lucide-react';

export const BetaReaderModal = ({ isOpen, onOpenChange }) => {
  const { currentNovelId } = useData();
  const [selectedPersona, setSelectedPersona] = useState(personas[0].name);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGetFeedback = async () => {
    setLoading(true);
    setFeedback(null);
    setError(null);
    const result = await getBetaFeedback(currentNovelId, selectedPersona);
    if (result.error) {
      setError(result.error);
    } else {
      setFeedback(result.feedback);
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            AI Beta Readers
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 mb-4">
          <Select value={selectedPersona} onValueChange={(v) => { setSelectedPersona(v); setFeedback(null); setError(null); }}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select Reader" />
            </SelectTrigger>
            <SelectContent>
              {personas.map(p => (
                <SelectItem key={p.name} value={p.name}>
                  {p.name} &mdash; {p.role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleGetFeedback} disabled={loading}>
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Reading...</>
            ) : (
              'Get Beta Feedback'
            )}
          </Button>
        </div>

        {/* Persona description */}
        <p className="text-sm text-muted-foreground mb-3 italic">
          {personas.find(p => p.name === selectedPersona)?.focus}
        </p>

        <ScrollArea className="flex-1 border rounded p-4">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Reading your manuscript...</p>
            </div>
          )}
          {!loading && error && (
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded text-destructive">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          {!loading && feedback && (
            <div className="prose dark:prose-invert max-w-none">
              <Markdown>{feedback}</Markdown>
            </div>
          )}
          {!loading && !feedback && !error && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a reader persona and click the button to get detailed feedback on your manuscript.
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
