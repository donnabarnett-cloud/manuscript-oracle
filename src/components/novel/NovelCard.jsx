import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit3, BookOpen, FileText, Download } from 'lucide-react';

/**
 * NovelCard Component
 * Displays a novel's cover image (or gradient), name, word count, and action icons.
 */
const NovelCard = ({ novel, onOpenNovel, onDeleteNovel, onEditNovel, wordCount, onImportExport }) => {
  const { t } = useTranslation();
  const { id, name, coverImage } = novel;

  const handleCardClick = () => {
    onOpenNovel(id);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEditNovel(id);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDeleteNovel(id);
  };

  const handleImportExportClick = (e) => {
    e.stopPropagation();
    if (onImportExport) onImportExport(novel);
  };

  return (
    <Card className="w-full max-w-xs flex flex-col overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 group">
      <div
        className="aspect-[2/3] w-full relative overflow-hidden cursor-pointer"
        onClick={handleCardClick}
      >
        {coverImage ? (
          <img
            src={coverImage}
            alt={t('novel_card_cover_alt', { name })}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-white/40" />
          </div>
        )}
        {/* Icon buttons positioned over the image */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="destructive"
            size="icon"
            className="h-7 w-7"
            onClick={handleDeleteClick}
            title={t('delete')}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7"
            onClick={handleEditClick}
            title={t('rename')}
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7"
            onClick={handleImportExportClick}
            title="Import / Export Manuscript"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
        {/* Novel Name Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <CardTitle className="text-white text-sm font-semibold truncate">
            {name || t('novel_card_untitled_novel')}
          </CardTitle>
          {wordCount !== undefined && wordCount !== null && (
            <Badge variant="outline" className="mt-1 text-xs text-white/80 border-white/40 bg-black/30">
              {wordCount.toLocaleString()} words
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};

export default NovelCard;
