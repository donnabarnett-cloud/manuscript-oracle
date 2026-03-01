import React, { useState, useEffect } from 'react';
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
import { useData } from '@/context/DataContext';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Trash2 } from 'lucide-react';

// ChapterFormModal — lets writers add or rename a Chapter within an Act.
// Chapters are the individual numbered sections that make up each Act.
const ChapterFormModal = ({ open, onOpenChange, chapterToEdit, actId }) => {
  const { addChapterToAct, updateChapter, deleteChapter } = useData();
  const [name, setName] = useState('');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const isEditing = Boolean(chapterToEdit);

  useEffect(() => {
    if (open) {
      setName(isEditing && chapterToEdit ? chapterToEdit.name || '' : '');
    }
  }, [chapterToEdit, isEditing, open]);

  const resetForm = () => setName('');

  const handleSubmit = () => {
    if (!isEditing && !actId) {
      console.error('An Act must be selected before adding a chapter.');
      return;
    }
    if (isEditing && chapterToEdit) {
      updateChapter(chapterToEdit.id, { name });
    } else if (actId) {
      addChapterToAct(actId, { name });
    }
    resetForm();
    onOpenChange(false);
  };

  const handleDeleteChapter = () => {
    if (chapterToEdit) {
      deleteChapter(chapterToEdit.id, actId || null);
      resetForm();
      onOpenChange(false);
      setIsConfirmDeleteOpen(false);
    }
  };

  useEffect(() => {
    if (!open) {
      resetForm();
      setIsConfirmDeleteOpen(false);
    }
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Rename Chapter' : 'Add a New Chapter'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? `Rename "${chapterToEdit?.name}" — the chapter title will update everywhere it appears.`
                : actId
                  ? 'Give this chapter a title. You can add scenes inside it once it\'s created.'
                  : 'Give this chapter a title. You can add scenes inside it once it\'s created.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="chapter-name" className="text-right">Chapter Title</Label>
              <Input
                id="chapter-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="e.g. Chapter 1: A New Dawn"
                onKeyDown={(e) => e.key === 'Enter' && name.trim() && handleSubmit()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between w-full">
            <div className="flex items-center gap-2">
              {isEditing && chapterToEdit && actId && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  title="Delete this chapter and all its scenes"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" onClick={handleSubmit} disabled={!name.trim()}>
                {isEditing ? 'Save Changes' : 'Create Chapter'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {chapterToEdit && (
        <ConfirmModal
          open={isConfirmDeleteOpen}
          onOpenChange={setIsConfirmDeleteOpen}
          title="Delete this Chapter?"
          description={`This will permanently delete "${chapterToEdit.name}" and all the scenes inside it. This cannot be undone.`}
          onConfirm={handleDeleteChapter}
        />
      )}
    </>
  );
};

export default ChapterFormModal;
