import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { ScrollArea } from \"@/components/ui/scroll-area\";
import { useData } from '../../context/DataContext';
import { updateNovelMetadata, getAllNovelMetadata } from '../../lib/indexedDb';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../ui/collapsible';
import { ChevronDown, ChevronUp, Trash2, UploadCloud, WandSparkles, Download, FileText, HelpCircle } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { AISuggestionModal } from '../ai/AISuggestionModal';
import { ExportModal } from './ExportModal';
import { useSettings } from '../../context/SettingsContext';
import { generateContextWithRetry } from '../../lib/aiContextUtils';
import { countWords } from '../../lib/aiApi';

const NovelOverviewTab = () => {
  const { t } = useTranslation();
  const { 
    novelId: currentNovelIdFromAppContext,
    authorName, synopsis, coverImage,
    pointOfView, genre, timePeriod, targetAudience, themes, tone,
    updateNovelDetails, scenes
  } = useData();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    authorName: '', synopsis: '', coverImage: '',
    pointOfView: '', genre: '', timePeriod: '', targetAudience: '', themes: '', tone: ''
  });

  const totalWordCount = useMemo(() => {
    if (!scenes) return 0;
    return Object.values(scenes).reduce((acc, scene) => acc + countWords(scene.content || ''), 0);
  }, [scenes]);

  const wordCountTarget = 95000;
  const progressPercentage = Math.min(100, Math.round((totalWordCount / wordCountTarget) * 100));

  useEffect(() => {
    setFormData({
      authorName: authorName || '',
      synopsis: synopsis || '',
      coverImage: coverImage || '',
      pointOfView: pointOfView || '',
      genre: genre || '',
      timePeriod: timePeriod || '',
      targetAudience: targetAudience || '',
      themes: themes || '',
      tone: tone || ''
    });
  }, [authorName, synopsis, coverImage, pointOfView, genre, timePeriod, targetAudience, themes, tone]);

  const handleSave = async () => {
    await updateNovelDetails(formData);
    setIsEditing(false);
  };

  return (
    <ScrollArea className=\"h-full\">
      <div className=\"p-6 space-y-6\">
        <Card>
          <CardHeader>
            <div className=\"flex justify-between items-center\">
              <div>
                <CardTitle>{t('novel_overview_title')}</CardTitle>
                <CardDescription>{t('novel_overview_description')}</CardDescription>
              </div>
              <Button variant=\"outline\" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? t('cancel') : t('edit')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className=\"space-y-4\">
            <div className=\"space-y-2\">
              <div className=\"flex justify-between text-sm font-medium\">
                <span>Manuscript Progress</span>
                <span>{totalWordCount.toLocaleString()} / {wordCountTarget.toLocaleString()} words ({progressPercentage}%)</span>
              </div>
              <div className=\"w-full bg-secondary h-3 rounded-full overflow-hidden\">
                <div 
                  className=\"bg-primary h-full transition-all duration-500 ease-out\" 
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
              <div className=\"space-y-2\">
                <Label>{t('author_name')}</Label>
                {isEditing ? (
                  <Input value={formData.authorName} onChange={(e) => setFormData({...formData, authorName: e.target.value})} />
                ) : (
                  <p className=\"p-2 bg-muted rounded-md min-h-[40px]\">{authorName || 'No author specified'}</p>
                )}
              </div>
              <div className=\"space-y-2\">
                <Label>{t('genre')}</Label>
                {isEditing ? (
                  <Input value={formData.genre} onChange={(e) => setFormData({...formData, genre: e.target.value})} />
                ) : (
                  <p className=\"p-2 bg-muted rounded-md min-h-[40px]\">{genre || 'No genre specified'}</p>
                )}
              </div>
            </div>

            <div className=\"space-y-2\">
              <Label>{t('synopsis')}</Label>
              {isEditing ? (
                <Textarea 
                  value={formData.synopsis} 
                  onChange={(e) => setFormData({...formData, synopsis: e.target.value})}
                  className=\"min-h-[150px]\"
                />
              ) : (
                <div className=\"p-3 bg-muted rounded-md min-h-[100px] whitespace-pre-wrap\">
                  {synopsis || 'No synopsis added yet.'}
                </div>
              )}
            </div>

            {isEditing && (
              <div className=\"flex justify-end pt-4\">
                <Button onClick={handleSave}>{t('save_changes')}</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
};

export default NovelOverviewTab;
