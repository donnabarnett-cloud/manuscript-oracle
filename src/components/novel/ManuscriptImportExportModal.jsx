import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, Download, BookOpen, CheckCircle, AlertCircle, Loader2, FileType, X } from 'lucide-react';
import { importWordDocument, importPDFDocument, exportAsWordDocument, exportAsPDF } from '@/lib/documentProcessor';
import * as idb from '@/lib/indexedDb';

const ManuscriptImportExportModal = ({ isOpen, onClose, novel, novelData, onImportComplete }) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const importFileRef = useRef(null);

  const handleImportFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setIsProcessing(true);
    setImportPreview(null);
    
    try {
      let result;
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        result = await importWordDocument(file);
      } else if (fileName.endsWith('.pdf')) {
        result = await importPDFDocument(file);
      } else {
        throw new Error('Unsupported file format. Please use .docx or .pdf');
      }
      
      if (result.success) {
        setImportPreview({
          file: file.name,
          chapters: result.chapters,
          totalWords: result.totalWords,
        });
        toast({
          title: 'File Parsed Successfully',
          description: `Found ${result.chapters.length} chapter${result.chapters.length !== 1 ? 's' : ''} with ${result.totalWords.toLocaleString()} words total.`,
        });
      } else {
        throw new Error(result.error || 'Failed to parse file');
      }
    } catch (err) {
      toast({
        title: 'Import Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      if (importFileRef.current) importFileRef.current.value = '';
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview || !novel) return;
    
    setIsProcessing(true);
    try {
      // Get current novel data or create fresh structure
      const currentData = novelData || {};
      const actId = 'act-imported-' + Date.now();
      const actOrder = [actId];
      const acts = { [actId]: { id: actId, title: 'Imported Content', chapterOrder: [] } };
      const chapters = {};
      
      importPreview.chapters.forEach((ch, index) => {
        const chapterId = 'chapter-imported-' + Date.now() + '-' + index;
        acts[actId].chapterOrder.push(chapterId);
        chapters[chapterId] = {
          id: chapterId,
          title: ch.title || `Chapter ${index + 1}`,
          prose: ch.content || '',
          scenes: {},
          sceneOrder: [],
        };
      });
      
      const updatedData = {
        ...currentData,
        actOrder: [...(currentData.actOrder || []), ...actOrder],
        acts: { ...(currentData.acts || {}), ...acts },
        chapters: { ...(currentData.chapters || {}), ...chapters },
      };
      
      await idb.saveNovelData(novel.id, updatedData);
      
      toast({
        title: 'Import Successful',
        description: `Imported ${importPreview.chapters.length} chapters into your novel.`,
      });
      
      setImportPreview(null);
      if (onImportComplete) onImportComplete();
      onClose();
    } catch (err) {
      toast({
        title: 'Import Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportWord = async () => {
    if (!novelData) return;
    setIsProcessing(true);
    try {
      const result = await exportAsWordDocument(novelData, novel?.name || 'manuscript');
      if (result.success) {
        toast({ title: 'Word Export Complete', description: 'Your manuscript has been downloaded as a .docx file with KDP 6x9 formatting.' });
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      toast({ title: 'Export Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportPDF = async () => {
    if (!novelData) return;
    setIsProcessing(true);
    try {
      const result = await exportAsPDF(novelData, novel?.name || 'manuscript');
      if (result.success) {
        toast({ title: 'PDF Export Complete', description: 'Your manuscript has been downloaded as a PDF file with KDP 6x9 formatting.' });
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      toast({ title: 'Export Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Manuscript Import & Export
          </DialogTitle>
          <DialogDescription>
            Import from Word (.docx) or PDF. Export with KDP 6x9 print formatting.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-6 p-1">
            {/* Import Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Import Manuscript
                </CardTitle>
                <CardDescription>Upload a .docx or .pdf file to import chapters into this novel.</CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".docx,.doc,.pdf"
                  onChange={handleImportFile}
                  className="hidden"
                />
                <Button
                  onClick={() => importFileRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full"
                  variant="outline"
                >
                  {isProcessing ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-2" /> Choose Word or PDF File</>
                  )}
                </Button>

                {/* Import Preview */}
                {importPreview && (
                  <div className="mt-4 p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-medium text-sm">{importPreview.file}</span>
                      </div>
                      <button onClick={() => setImportPreview(null)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex gap-3 mb-3">
                      <Badge variant="secondary">{importPreview.chapters.length} Chapter{importPreview.chapters.length !== 1 ? 's' : ''}</Badge>
                      <Badge variant="secondary">{importPreview.totalWords.toLocaleString()} Words</Badge>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1 mb-3">
                      {importPreview.chapters.map((ch, i) => (
                        <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0">
                          <span className="truncate max-w-[60%]">{ch.title}</span>
                          <span className="text-muted-foreground text-xs">{ch.wordCount.toLocaleString()} words</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={handleConfirmImport}
                      disabled={isProcessing}
                      className="w-full"
                      size="sm"
                    >
                      {isProcessing ? (
                        <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Importing...</>
                      ) : (
                        <><BookOpen className="h-3 w-3 mr-2" /> Import {importPreview.chapters.length} Chapter{importPreview.chapters.length !== 1 ? 's' : ''} into Novel</>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Export Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Manuscript
                </CardTitle>
                <CardDescription>
                  Download your manuscript formatted for KDP Print 6x9. Includes all chapters in order with proper typography.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleExportWord}
                    disabled={isProcessing || !novelData}
                    variant="outline"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Download .docx
                  </Button>
                  <Button
                    onClick={handleExportPDF}
                    disabled={isProcessing || !novelData}
                    variant="outline"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileType className="h-4 w-4 mr-2" />
                    )}
                    Download .pdf
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  KDP 6x9 format: 6" × 9" page, 0.75" margins, 11pt Times Roman, 1.5 line spacing, justified text.
                </p>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ManuscriptImportExportModal;
