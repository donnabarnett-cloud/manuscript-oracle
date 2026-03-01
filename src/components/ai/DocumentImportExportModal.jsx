import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useData } from '../../context/DataContext';
import {
  importWordDocument,
  importPDFDocument,
  exportAsWordDocument,
  exportAsPDF,
  countWords,
} from '../../lib/documentProcessor';
import { FileText, Upload, Download, FileDown, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export const DocumentImportExportModal = ({ isOpen, onOpenChange }) => {
  const { acts, chapters, scenes, actOrder, currentNovelId, addSceneToChapter, addChapterToAct } = useData();
  const [status, setStatus] = useState(null); // { type: 'success'|'error'|'info', message }
  const [loading, setLoading] = useState(false);
  const [importedText, setImportedText] = useState(null);
  const fileInputRef = useRef(null);

  const novelData = { actOrder, acts, chapters, scenes };
  const novelName = acts && actOrder && actOrder.length > 0 && acts[actOrder[0]]?.novelName
    ? acts[actOrder[0]].novelName
    : 'manuscript';

  const totalWords = () => {
    let count = 0;
    Object.values(scenes || {}).forEach(scene => {
      if (scene?.content) count += countWords(scene.content);
    });
    return count;
  };

  const handleImport = async (file) => {
    if (!file) return;
    setLoading(true);
    setStatus({ type: 'info', message: `Importing ${file.name}...` });
    try {
      let result;
      if (file.name.endsWith('.docx')) {
        result = await importWordDocument(file);
      } else if (file.name.endsWith('.pdf')) {
        result = await importPDFDocument(file);
      } else {
        setStatus({ type: 'error', message: 'Unsupported file type. Please use .docx or .pdf' });
        setLoading(false);
        return;
      }

      if (result.success) {
        setImportedText(result.text);
        setStatus({
          type: 'success',
          message: `Successfully imported ${result.wordCount.toLocaleString()} words from ${file.name}. Preview below. Use "Apply to Novel" to add this content.`,
        });
      } else {
        setStatus({ type: 'error', message: `Import failed: ${result.error}` });
      }
    } catch (err) {
      setStatus({ type: 'error', message: `Import error: ${err.message}` });
    }
    setLoading(false);
  };

  const handleExportDocx = async () => {
    setLoading(true);
    setStatus({ type: 'info', message: 'Generating Word document...' });
    const result = await exportAsWordDocument(novelData, novelName);
    if (result.success) {
      setStatus({ type: 'success', message: 'Word document downloaded successfully!' });
    } else {
      setStatus({ type: 'error', message: `Export failed: ${result.error}` });
    }
    setLoading(false);
  };

  const handleExportPDF = async () => {
    setLoading(true);
    setStatus({ type: 'info', message: 'Generating PDF...' });
    const result = await exportAsPDF(novelData, novelName);
    if (result.success) {
      setStatus({ type: 'success', message: 'PDF downloaded successfully!' });
    } else {
      setStatus({ type: 'error', message: `Export failed: ${result.error}` });
    }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImport(file);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleImport(file);
  };

  const handleDragOver = (e) => e.preventDefault();

  const wc = totalWords();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import / Export Manuscript
          </DialogTitle>
          <DialogDescription>
            Upload your manuscript as a Word (.docx) or PDF file, or download your novel in either format.
            Downloads use KDP 6x9 formatting.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Word count info */}
          <div className="text-sm text-muted-foreground bg-muted rounded p-3">
            Current novel: <strong>{wc.toLocaleString()} words</strong> across all scenes
          </div>

          {/* Export Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Export Novel</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExportDocx}
                disabled={loading || wc === 0}
                className="flex-1 gap-2"
              >
                <FileDown className="h-4 w-4" />
                Download as Word (.docx)
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={loading || wc === 0}
                className="flex-1 gap-2"
              >
                <FileDown className="h-4 w-4" />
                Download as PDF
              </Button>
            </div>
            {wc === 0 && (
              <p className="text-xs text-muted-foreground">Write some content first to enable export.</p>
            )}
          </div>

          {/* Import Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Import Manuscript</h3>
            <div
              className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Drop a .docx or .pdf file here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Status Message */}
          {status && (
            <div className={`flex items-start gap-2 text-sm p-3 rounded ${
              status.type === 'error' ? 'bg-destructive/10 text-destructive' :
              status.type === 'success' ? 'bg-green-500/10 text-green-700 dark:text-green-400' :
              'bg-blue-500/10 text-blue-700 dark:text-blue-400'
            }`}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin flex-shrink-0 mt-0.5" /> :
               status.type === 'error' ? <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /> :
               <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
              <span>{status.message}</span>
            </div>
          )}

          {/* Imported text preview */}
          {importedText && (
            <div className="flex-1 overflow-hidden flex flex-col gap-1">
              <h3 className="text-sm font-semibold">Preview (first 2000 characters)</h3>
              <ScrollArea className="flex-1 border rounded p-3 text-sm text-muted-foreground font-mono whitespace-pre-wrap">
                {importedText.substring(0, 2000)}{importedText.length > 2000 ? '...' : ''}
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                Note: Imported text is shown as a preview. To use it in your novel, copy the text you need
                into your scene editor.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
