import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useData } from '../../context/DataContext';
import { runWholeBookAnalysis } from '../../lib/oracleEngine';
import { getFixSuggestions, applyFix } from '../../lib/oracleFixEngine';
import Markdown from 'react-markdown';

export const OracleAnalysisModal = ({ isOpen, onOpenChange }) => {
  const { t } = useTranslation();
  const { currentNovelId } = useData();
  const [analysis, setAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleRunAnalysis = async () => {
    setLoading(true);
    const result = await runWholeBookAnalysis(currentNovelId);
    setAnalysis(result);
    setLoading(false);
  };

  const handleGetSuggestions = async () => {
    setLoading(true);
    const result = await getFixSuggestions(analysis);
    setSuggestions(result);
    setLoading(false);
  };

  const handleApplyFix = async (fix) => {
    setLoading(true);
    await applyFix(currentNovelId, fix);
    // Refresh or notify user
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <div className="flex items-center gap-4 mb-4">
          <Button onClick={handleRunAnalysis} disabled={loading}>
            {loading ? 'Analyzing...' : 'Run Whole-Book Analysis'}
          </Button>
          {analysis && (
            <Button onClick={handleGetSuggestions} variant="outline" disabled={loading}>
              Get Fix Suggestions
            </Button>
          )}
        </div>
        
        <div className="flex-1 flex gap-4 overflow-hidden">
          <ScrollArea className="flex-1 border rounded p-4">
            <h3 className="font-bold mb-2">Analysis Report</h3>
            {analysis ? (
              <div className="prose dark:prose-invert max-w-none">
                <Markdown>{analysis}</Markdown>
              </div>
            ) : (
              <div className="text-muted-foreground">Run analysis to see results.</div>
            )}
          </ScrollArea>
          
          {suggestions.length > 0 && (
            <ScrollArea className="w-1/3 border rounded p-4">
              <h3 className="font-bold mb-2">Suggestions</h3>
              <div className="space-y-4">
                {suggestions.map((s, i) => (
                  <div key={i} className="border p-2 rounded bg-muted/50">
                    <p className="text-sm mb-2">{s.description}</p>
                    <Button size="sm" onClick={() => handleApplyFix(s)} disabled={loading}>
                      Apply Fix
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
