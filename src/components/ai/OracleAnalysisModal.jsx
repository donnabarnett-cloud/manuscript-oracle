import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useData } from '../../context/DataContext';
import { runWholeBookAnalysis } from '../../lib/oracleEngine';
import { getFixSuggestions, applyFix } from '../../lib/oracleFixEngine';
import Markdown from 'react-markdown';
import { Sparkles, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export const OracleAnalysisModal = ({ isOpen, onOpenChange }) => {
  const { currentNovelId } = useData();
  const [analysis, setAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState('');
  const [error, setError] = useState(null);
  const [appliedFixes, setAppliedFixes] = useState(new Set());

  const handleRunAnalysis = async () => {
    setLoading(true);
    setLoadingAction('Analysing manuscript...');
    setError(null);
    setSuggestions([]);
    try {
      const result = await runWholeBookAnalysis(currentNovelId);
      // runWholeBookAnalysis returns error strings for common issues
      if (result.startsWith('No manuscript') || result.startsWith('No API key')) {
        setError(result);
        setAnalysis(null);
      } else if (result.startsWith('Analysis failed:')) {
        setError(result);
        setAnalysis(null);
      } else {
        setAnalysis(result);
      }
    } catch (err) {
      setError(`Analysis failed: ${err.message}`);
      setAnalysis(null);
    } finally {
      setLoading(false);
      setLoadingAction('');
    }
  };

  const handleGetSuggestions = async () => {
    setLoading(true);
    setLoadingAction('Generating fix suggestions...');
    try {
      const result = await getFixSuggestions(analysis);
      setSuggestions(result);
    } catch (err) {
      setError(`Failed to get suggestions: ${err.message}`);
    } finally {
      setLoading(false);
      setLoadingAction('');
    }
  };

  const handleApplyFix = async (fix, index) => {
    setLoading(true);
    setLoadingAction('Applying fix...');
    try {
      await applyFix(currentNovelId, fix);
      setAppliedFixes(prev => new Set([...prev, index]));
    } catch (err) {
      setError(`Failed to apply fix: ${err.message}`);
    } finally {
      setLoading(false);
      setLoadingAction('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Oracle Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 mb-2">
          <Button onClick={handleRunAnalysis} disabled={loading}>
            {loading && loadingAction === 'Analysing manuscript...' ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analysing...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Run Whole-Book Analysis</>
            )}
          </Button>
          {analysis && (
            <Button onClick={handleGetSuggestions} variant="outline" disabled={loading}>
              {loading && loadingAction === 'Generating fix suggestions...' ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                'Get Fix Suggestions'
              )}
            </Button>
          )}
          {loading && <span className="text-sm text-muted-foreground">{loadingAction}</span>}
        </div>

        {error && (
          <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded text-destructive mb-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex-1 flex gap-4 overflow-hidden">
          <ScrollArea className="flex-1 border rounded p-4">
            <h3 className="font-bold mb-3 text-base">Analysis Report</h3>
            {loading && loadingAction === 'Analysing manuscript...' && (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Analysing your manuscript — this may take a moment...</p>
              </div>
            )}
            {!loading && analysis ? (
              <div className="prose dark:prose-invert max-w-none">
                <Markdown>{analysis}</Markdown>
              </div>
            ) : !loading && !error ? (
              <div className="text-muted-foreground text-sm">
                Click <strong>Run Whole-Book Analysis</strong> to receive a comprehensive editorial report covering plot consistency, character arcs, pacing, and POV.
              </div>
            ) : null}
          </ScrollArea>

          {suggestions.length > 0 && (
            <ScrollArea className="w-1/3 border rounded p-4">
              <h3 className="font-bold mb-3 text-base">Fix Suggestions</h3>
              <div className="space-y-4">
                {suggestions.map((s, i) => (
                  <div key={i} className={`border p-3 rounded ${appliedFixes.has(i) ? 'bg-green-500/10 border-green-500/30' : 'bg-muted/50'}`}>
                    <p className="text-sm mb-2">{s.description}</p>
                    {appliedFixes.has(i) ? (
                      <div className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" /> Applied
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => handleApplyFix(s, i)} disabled={loading}>
                        Apply Fix
                      </Button>
                    )}
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
