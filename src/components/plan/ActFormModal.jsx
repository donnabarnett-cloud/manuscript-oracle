import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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

const ActFormModal = ({ open, onOpenChange, actToEdit }) => {
  const { t } = useTranslation();
  const { addAct, updateAct, deleteAct } = useData();
  const [name, setName] = useState('');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const isEditing = Boolean(actToEdit);

  useEffect(() => {
    if (open) {
      if (isEditing && actToEdit) {
        setName(actToEdit.name || '');
      } else {
        setName('');
      }
    }
  }, [actToEdit, isEditing, open]);

  const resetForm = () => setName('');

  const handleSubmit = () => {
    if (isEditing && actToEdit) {
      updateAct(actToEdit.id, { name });
    } else {
      addAct({ name });
    }
    resetForm();
    onOpenChange(false);
  };

  const handleDeleteAct = () => {
    if (actToEdit) {
      deleteAct(actToEdit.id);
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
              {isEditing ? 'Edit Act' : 'Add a New Act'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the name of this act.'
                : 'Acts are the major sections of your story (e.g. Act 1: The Beginning).'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="act-name" className="text-right">Act Name</Label>
              <Input
                id="act-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="e.g. Act 1: The Beginning"
                onKeyDown={(e) => e.key === 'Enter' && name.trim() && handleSubmit()}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between w-full">
            <div className="flex items-center gap-2">
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  title="Delete this act"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">{t('cancel')}</Button>
              </DialogClose>
              <Button type="submit" onClick={handleSubmit} disabled={!name.trim()}>
                {isEditing ? t('save_changes_button') : 'Create Act'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {actToEdit && (
        <ConfirmModal
          open={isConfirmDeleteOpen}
          onOpenChange={setIsConfirmDeleteOpen}
          title="Delete this Act?"
          description={`Are you sure you want to permanently delete "${actToEdit.name}" and everything inside it? This cannot be undone.`}
          onConfirm={handleDeleteAct}
        />
      )}
    </>
  );
};

export default ActFormModal;
