import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../../context/DataContext';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { NotebookText, PlusCircle, ChevronsUpDown, WandSparkles } from 'lucide-react';
import { generateSceneContent } from '../../lib/aiApi';

const NovelOutlinePopover = ({
  onSceneSelect,
  onAddChapter,
  onAddScene,
  isOpen,
  onOpenChange,
}) => {
  const { t } = useTranslation();
  const { 
    acts, chapters, scenes, actOrder, 
    moveAct, moveChapter, moveScene,
    canMoveActUp, canMoveActDown,
    canMoveChapterUp, canMoveChapterDown,
    canMoveSceneUp, canMoveSceneDown,
    updateScene
  } = useData();
  
  const [showAddButtonsInOutline, setShowAddButtonsInOutline] = useState(() => {
    const storedValue = localStorage.getItem('MANUSCRIPT_ORACLE_writeview_showAddButtons');
    if (!storedValue) {
      const oldValue = localStorage.getItem('plotbunni_writeview_showAddButtons');
      if (oldValue) {
        localStorage.setItem('MANUSCRIPT_ORACLE_writeview_showAddButtons', oldValue);
      }
    }
    return storedValue ? JSON.parse(storedValue) : false;
  });
  
  const [showReorderControls, setShowReorderControls] = useState(false);
  const [generatingSceneId, setGeneratingSceneId] = useState(null);

  useEffect(() => {
    localStorage.setItem('MANUSCRIPT_ORACLE_writeview_showAddButtons', JSON.stringify(showAddButtonsInOutline));
  }, [showAddButtonsInOutline]);

  const handleGenerateScene = async (sceneId, chapterId, actId) => {
    const scene = scenes[sceneId];
    const chapter = chapters[chapterId];
    const act = acts[actId];
    
    if (!scene || !scene.synopsis) {
      alert("Please provide a synopsis for the scene before generating content.");
      return;
    }

    setGeneratingSceneId(sceneId);
    try {
      const content = await generateSceneContent(null, {
        sceneTitle: scene.name,
        synopsis: scene.synopsis,
        chapterName: chapter?.name,
        actName: act?.name,
      });
      updateScene({ id: sceneId, content });
    } catch (error) {
      console.error("Generation failed:", error);
      alert("AI Generation failed: " + error.message);
    } finally {
      setGeneratingSceneId(null);
    }
  };

  const safeCanMoveActUp = actId => canMoveActUp ? canMoveActUp(actId) : true;
  const safeCanMoveActDown = actId => canMoveActDown ? canMoveActDown(actId) : true;
  const safeCanMoveChapterUp = (chapterId, actId) => canMoveChapterUp ? canMoveChapterUp(chapterId, actId) : true;
  const safeCanMoveChapterDown = (chapterId, actId) => canMoveChapterDown ? canMoveChapterDown(chapterId, actId) : true;
  const safeCanMoveSceneUp = (sceneId, chapterId, actId) => canMoveSceneUp ? canMoveSceneUp(sceneId, chapterId, actId) : true;
  const safeCanMoveSceneDown = (sceneId, chapterId, actId) => canMoveSceneDown ? canMoveSceneDown(sceneId, chapterId, actId) : true;

  const handleMoveAct = (actId, direction) => moveAct && moveAct(actId, direction);
  const handleMoveChapter = (chapterId, actId, direction) => moveChapter && moveChapter(chapterId, actId, direction);
  const handleMoveScene = (sceneId, chapterId, actId, direction) => moveScene && moveScene(sceneId, chapterId, actId, direction);

  if (!acts || !chapters || !scenes || !actOrder) return null;

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant=\"outline\"
          size=\"icon\"
          className=\"rounded-full shadow-lg hover:bg-primary/10\"
          title={t('write_view_outline_popover_tooltip')}
        >
          <NotebookText className=\"h-5 w-5 text-primary\" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className=\"w-[350px] p-0\" side=\"right\" align=\"start\">
        <div className=\"flex justify-between items-center p-2 border-b\">
          <Button
            variant=\"ghost\"
            size=\"icon\"
            onClick={() => setShowReorderControls(!showReorderControls)}
            title={\"Toggle reorder controls\"}
            className=\"h-7 w-7\"
          >
            <ChevronsUpDown className={`h-5 w-5 ${showReorderControls ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`} />
          </Button>
          <div className=\"text-center flex-grow text-lg font-semibold\">{\"Story Outline\"}</div>
          <Button
            variant=\"ghost\"
            size=\"icon\"
            onClick={() => setShowAddButtonsInOutline(!showAddButtonsInOutline)}
            title={\"Show add buttons\"}
            className=\"h-7 w-7\"
          >
            <PlusCircle className={`h-5 w-5 ${showAddButtonsInOutline ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`} />
          </Button>
        </div>
        <ScrollArea className=\"h-[calc(500px-3.5rem)] max-h-[calc(80vh-3.5rem)] p-4\">
          {actOrder.map((actId) => {
            const act = acts[actId];
            if (!act) return null;
            return (
              <div key={actId} className=\"mb-3\">
                <div className=\"flex justify-between items-center mb-1\">
                  <div className=\"flex items-center flex-grow mr-2 min-w-0\">
                    {showReorderControls && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant=\"ghost\" size=\"icon\" className=\"h-6 w-6 p-0 mr-1 flex-shrink-0\">
                            <ChevronsUpDown className=\"h-4 w-4\" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onSelect={() => handleMoveAct(act.id, 'up')} disabled={!safeCanMoveActUp(act.id)}>Move up</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleMoveAct(act.id, 'down')} disabled={!safeCanMoveActDown(act.id)}>Move down</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    <h3 className=\"font-semibold text-sm text-foreground flex-grow truncate\" title={act.name || \"Unnamed Act\"}>{act.name || \"Unnamed Act\"}</h3>
                  </div>
                  {showAddButtonsInOutline && (
                    <Button variant=\"ghost\" size=\"icon\" className=\"h-6 w-6 p-0 flex-shrink-0\" onClick={() => onAddChapter(act.id)} title={\"Add chapter\"}>
                      <PlusCircle className=\"h-4 w-4\" />
                    </Button>
                  )}
                </div>
                {act.chapterOrder?.map((chapterId) => {
                  const chapter = chapters[chapterId];
                  if (!chapter) return null;
                  return (
                    <div key={chapterId} className=\"ml-3 mb-2\">
                      <div className=\"flex justify-between items-center mb-1\">
                        <div className=\"flex items-center flex-grow mr-2 min-w-0\">
                          {showReorderControls && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant=\"ghost\" size=\"icon\" className=\"h-6 w-6 p-0 mr-1 flex-shrink-0\">
                                  <ChevronsUpDown className=\"h-4 w-4\" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onSelect={() => handleMoveChapter(chapter.id, act.id, 'up')} disabled={!safeCanMoveChapterUp(chapter.id, act.id)}>Move up</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleMoveChapter(chapter.id, act.id, 'down')} disabled={!safeCanMoveChapterDown(chapter.id, act.id)}>Move down</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          <h4 className=\"font-medium text-xs text-muted-foreground flex-grow truncate\" title={chapter.name || \"Unnamed Chapter\"}>{chapter.name || \"Unnamed Chapter\"}</h4>
                        </div>
                        {showAddButtonsInOutline && (
                          <Button variant=\"ghost\" size=\"icon\" className=\"h-6 w-6 p-0 flex-shrink-0\" onClick={() => onAddScene(chapter.id)} title={\"Add scene\"}>
                            <PlusCircle className=\"h-4 w-4\" />
                          </Button>
                        )}
                      </div>
                      {chapter.sceneOrder?.map((sceneId) => {
                        const scene = scenes[sceneId];
                        if (!scene) return null;
                        return (
                          <div key={sceneId} className=\"ml-2 group/scene\">
                            <div className=\"flex items-center w-full\">
                              {showReorderControls && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant=\"ghost\" size=\"icon\" className=\"h-6 w-6 p-0 mr-1 flex-shrink-0\">
                                      <ChevronsUpDown className=\"h-4 w-4\" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onSelect={() => handleMoveScene(scene.id, chapter.id, act.id, 'up')} disabled={!safeCanMoveSceneUp(scene.id, chapter.id, act.id)}>Move up</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleMoveScene(scene.id, chapter.id, act.id, 'down')} disabled={!safeCanMoveSceneDown(scene.id, chapter.id, act.id)}>Move down</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                              <Button
                                variant=\"ghost\"
                                className=\"flex-grow justify-start h-auto py-1 px-2 text-xs font-normal text-left truncate min-w-0\"
                                onClick={() => onSceneSelect(sceneId)}
                                title={scene.name || \"Unnamed Scene\" }
                              >
                                {scene.name || \"Unnamed Scene\"}
                              </Button>
                              <Button
                                variant=\"ghost\"
                                size=\"icon\"
                                className={`h-6 w-6 p-0 flex-shrink-0 opacity-0 group-hover/scene:opacity-100 transition-opacity ${generatingSceneId === sceneId ? 'animate-pulse' : ''}`}
                                onClick={() => handleGenerateScene(sceneId, chapterId, actId)}
                                disabled={generatingSceneId !== null}
                                title=\"AI Write Scene\"
                              >
                                <WandSparkles className={`h-3 w-3 ${generatingSceneId === sceneId ? 'text-primary' : 'text-muted-foreground'}`} />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      {(!chapter.sceneOrder || chapter.sceneOrder.length === 0) && (
                        <p className=\"ml-2 text-xs text-muted-foreground italic\">{\"No scenes yet\"}</p>
                      )}
                    </div>
                  );
                })}
                {(!act.chapterOrder || act.chapterOrder.length === 0) && (
                  <p className=\"ml-3 text-xs text-muted-foreground italic\">{\"No chapters yet\"}</p>
                )}
              </div>
            );
          })}
          {actOrder.length === 0 && (
            <p className=\"text-sm text-muted-foreground italic\">{\"No story structure yet. Add an act in the Plan tab.\"}</p>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NovelOutlinePopover;
