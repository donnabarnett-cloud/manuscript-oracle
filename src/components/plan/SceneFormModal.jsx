import React, { useState, useEffect } from 'react';
import { WandSparkles, Trash2 } from 'lucide-react';
import { AISuggestionModal } from '../ai/AISuggestionModal';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useData } from '@/context/DataContext';
import { useSettings } from '../../context/SettingsContext';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateContextWithRetry } from '../../lib/aiContextUtils';
import ConfirmModal from '@/components/ui/ConfirmModal';

// SceneFormModal — lets writers add or edit a Scene within a Chapter.
// A Scene is a single story moment: a location, a character interaction, a turning point.
const SceneFormModal = ({ open, onOpenChange, sceneToEdit, chapterId }) => {
  const {
    addSceneToChapter,
    updateScene,
    deleteScene,
    concepts,
    acts,
    chapters,
    scenes,
    actOrder,
    novelSynopsis,
    genre,
    pointOfView,
    timePeriod,
    targetAudience,
    themes,
    tone,
  } = useData();
  const { taskSettings, TASK_KEYS, systemPrompt, getActiveProfile, showAiFeatures } = useSettings();

  const [name, setName] = useState('');
  const [tags, setTags] = useState('');
  const [synopsisText, setSynopsisText] = useState('');
  const [selectedContextConcepts, setSelectedContextConcepts] = useState([]);
  const [autoUpdateContext, setAutoUpdateContext] = useState(true);
  const [isAISuggestionModalOpen, setIsAISuggestionModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [aiContext, setAiContext] = useState({ contextString: "", estimatedTokens: 0, level: 0, error: null });

  const isEditing = Boolean(sceneToEdit);

  useEffect(() => {
    if (open) {
      if (isEditing && sceneToEdit) {
        setName(sceneToEdit.name || '');
        setTags(sceneToEdit.tags ? sceneToEdit.tags.join(', ') : '');
        setSynopsisText(sceneToEdit.synopsis || '');
        setSelectedContextConcepts(sceneToEdit.context || []);
        setAutoUpdateContext(sceneToEdit.autoUpdateContext === undefined ? true : sceneToEdit.autoUpdateContext);
      } else {
        setName('');
        setTags('');
        setSynopsisText('');
        setSelectedContextConcepts([]);
        setAutoUpdateContext(true);
      }
      setAiContext({ contextString: "", estimatedTokens: 0, level: 0, error: null });
    }
  }, [sceneToEdit, isEditing, open]);

  const resetForm = () => {
    setName('');
    setTags('');
    setSynopsisText('');
    setSelectedContextConcepts([]);
    setAutoUpdateContext(true);
    setAiContext({ contextString: "", estimatedTokens: 0, level: 0, error: null });
    setIsConfirmDeleteOpen(false);
  };

  const handleContextConceptChange = (conceptId) => {
    setSelectedContextConcepts(prev =>
      prev.includes(conceptId) ? prev.filter(id => id !== conceptId) : [...prev, conceptId]
    );
  };

  const handleSubmit = () => {
    if (!isEditing && !chapterId) {
      console.error('A Chapter must be selected before adding a scene.');
      return;
    }
    const sceneData = {
      name,
      tags: tags.split(',').map(s => s.trim()).filter(s => s),
      synopsis: synopsisText,
      context: selectedContextConcepts,
      autoUpdateContext,
    };
    if (isEditing && sceneToEdit) {
      updateScene({ ...sceneToEdit, ...sceneData });
    } else if (chapterId) {
      addSceneToChapter(chapterId, sceneData);
    }
    resetForm();
    onOpenChange(false);
  };

  const handleDeleteScene = () => {
    if (sceneToEdit) {
      deleteScene(sceneToEdit.id, chapterId || null);
      resetForm();
      onOpenChange(false);
      setIsConfirmDeleteOpen(false);
    }
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  const prepareAIContext = async () => {
    if (!acts || !chapters || !scenes || !concepts || !actOrder) {
      setAiContext({ contextString: "", estimatedTokens: 0, level: 0, error: 'Novel data is not yet loaded.' });
      return;
    }
    let effectiveChapterIdForContext = chapterId;
    let effectiveSceneIdForContext = null;
    if (isEditing && sceneToEdit) {
      effectiveSceneIdForContext = sceneToEdit.id;
      for (const actId of actOrder) {
        const act = acts[actId];
        if (act?.chapterOrder) {
          for (const chapId of act.chapterOrder) {
            const chapter = chapters[chapId];
            if (chapter?.sceneOrder?.includes(sceneToEdit.id)) {
              effectiveChapterIdForContext = chapId;
              break;
            }
          }
        }
        if (effectiveChapterIdForContext && acts[actId]?.chapterOrder.includes(effectiveChapterIdForContext)) break;
      }
    }
    const activeAIProfile = getActiveProfile();
    if (!activeAIProfile) {
      setAiContext({ contextString: "", estimatedTokens: 0, level: 0, error: 'No active AI profile found. Please configure one in Settings.' });
      return;
    }
    const novelDetails = { synopsis: novelSynopsis, genre, pointOfView, timePeriod, targetAudience, themes, tone };
    const contextResult = await generateContextWithRetry({
      strategy: 'novelOutline',
      baseData: { actOrder, acts, chapters, scenes, concepts, novelDetails },
      targetData: { targetChapterId: effectiveChapterIdForContext, targetSceneId: effectiveSceneIdForContext },
      aiProfile: activeAIProfile,
      systemPromptText: systemPrompt,
      userQueryText: taskSettings[TASK_KEYS.SYNOPSIS]?.prompt || '',
    });
    setAiContext(contextResult);
  };

  const handleOpenAISuggestionModal = async () => {
    await prepareAIContext();
    setIsAISuggestionModalOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Scene' : 'Add a New Scene'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? `Editing "${sceneToEdit?.name}" — update the scene details below.`
                : 'Give this scene a title and outline what happens. You can assign story concepts and get AI suggestions too.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="scene-name" className="text-right">Scene Title</Label>
              <Input
                id="scene-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="e.g. The Discovery"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="scene-tags" className="text-right">Tags</Label>
              <Input
                id="scene-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="col-span-3"
                placeholder="e.g. action, romance, flashback (comma-separated)"
              />
            </div>
            <Tabs defaultValue="outline">
              <TabsList className="w-full">
                <TabsTrigger value="outline" className="flex-1">Scene Outline</TabsTrigger>
                <TabsTrigger value="concepts" className="flex-1">Story Concepts</TabsTrigger>
              </TabsList>
              <TabsContent value="outline">
                <div className="relative mt-2">
                  <Textarea
                    id="scene-outline"
                    value={synopsisText}
                    onChange={(e) => setSynopsisText(e.target.value)}
                    placeholder="Briefly describe what happens in this scene — who is there, what changes, what’s at stake."
                    rows={6}
                    className={showAiFeatures ? "pr-10" : ""}
                  />
                  {showAiFeatures && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute bottom-2 right-2 h-7 w-7 text-slate-500 hover:text-slate-700"
                      onClick={handleOpenAISuggestionModal}
                      aria-label="Get AI suggestion for this scene outline"
                    >
                      <WandSparkles className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="concepts">
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-1">
                    <Label>Story Concepts in this Scene</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="auto-update-context"
                        checked={autoUpdateContext}
                        onCheckedChange={setAutoUpdateContext}
                      />
                      <label
                        htmlFor="auto-update-context"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Auto-update context
                      </label>
                    </div>
                  </div>
                  <ScrollArea className="h-32 rounded-md border p-2">
                    {concepts.length > 0
                      ? concepts.map(concept => (
                        <div key={concept.id} className="flex items-center space-x-2 mb-1">
                          <Checkbox
                            id={`concept-${concept.id}`}
                            checked={selectedContextConcepts.includes(concept.id)}
                            onCheckedChange={() => handleContextConceptChange(concept.id)}
                          />
                          <label
                            htmlFor={`concept-${concept.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {concept.name}
                          </label>
                        </div>
                      ))
                      : <p className="text-xs text-slate-500">No concepts yet. Add characters, locations, and more in the Concepts tab.</p>
                    }
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter className="flex justify-between w-full">
            <div className="flex items-center gap-2">
              {isEditing && sceneToEdit && chapterId && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  title="Delete this scene"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <div className="flex-grow"></div>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" onClick={handleSubmit} disabled={!name.trim()}>
                {isEditing ? 'Save Changes' : 'Create Scene'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
        {sceneToEdit && (
          <ConfirmModal
            open={isConfirmDeleteOpen}
            onOpenChange={setIsConfirmDeleteOpen}
            title="Delete this Scene?"
            description={`This will permanently delete "${sceneToEdit.name}". This cannot be undone.`}
            onConfirm={handleDeleteScene}
          />
        )}
        {isAISuggestionModalOpen && aiContext && (
          <AISuggestionModal
            isOpen={isAISuggestionModalOpen}
            onClose={() => setIsAISuggestionModalOpen(false)}
            currentText={synopsisText}
            initialQuery={taskSettings[TASK_KEYS.SYNOPSIS]?.prompt || ''}
            novelData={aiContext.contextString}
            novelDataTokens={aiContext.estimatedTokens}
            novelDataLevel={aiContext.level}
            onAccept={(suggestion) => {
              setSynopsisText(suggestion);
              setIsAISuggestionModalOpen(false);
            }}
            fieldLabel="Scene Outline Suggestion"
            taskKeyForProfile={TASK_KEYS.SYNOPSIS}
          />
        )}
      </Dialog>
    </>
  );
};

export default SceneFormModal;
