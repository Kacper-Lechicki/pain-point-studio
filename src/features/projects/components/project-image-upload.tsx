'use client';

import { useRef, useState } from 'react';

import { Camera, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Spinner } from '@/components/ui/spinner';
import { updateProjectImage } from '@/features/projects/actions/update-project-image';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import {
  PROJECT_IMAGE_ACCEPTED_TYPES,
  PROJECT_IMAGE_DIMENSION,
  PROJECT_IMAGE_MAX_SIZE,
} from '@/features/projects/config';
import { createClient } from '@/lib/supabase/client';

interface ProjectImageUploadProps {
  projectId: string;
  userId: string;
  imageUrl: string | null;
  projectName: string;
  onImageChange: (url: string | null) => void;
}

function resizeImage(file: File, dim: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = dim;
      canvas.height = dim;
      const ctx = canvas.getContext('2d')!;

      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;

      ctx.drawImage(img, sx, sy, side, side, 0, 0, dim, dim);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob returned null'));
          }
        },
        file.type,
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export function ProjectImageUpload({
  projectId,
  userId,
  imageUrl,
  projectName,
  onImageChange,
}: ProjectImageUploadProps) {
  const t = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (!file) {
      return;
    }

    if (!PROJECT_IMAGE_ACCEPTED_TYPES.includes(file.type)) {
      toast.error(t('projects.detail.imageInvalidType'));

      return;
    }

    if (file.size > PROJECT_IMAGE_MAX_SIZE) {
      toast.error(t('projects.detail.imageTooLarge'));

      return;
    }

    setIsUploading(true);

    try {
      const resized = await resizeImage(file, PROJECT_IMAGE_DIMENSION);
      const supabase = createClient();
      const ext = file.type.split('/')[1] || 'jpg';
      const filePath = `${userId}/${projectId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(filePath, resized, { upsert: true, contentType: file.type });

      if (uploadError) {
        toast.error(t('projects.detail.imageUploadFailed'));

        return;
      }

      if (imageUrl) {
        const oldPath = imageUrl.split('/project-images/')[1];

        if (oldPath) {
          await supabase.storage.from('project-images').remove([oldPath]);
        }
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('project-images').getPublicUrl(filePath);

      const result = await updateProjectImage({ projectId, imageUrl: publicUrl });

      if (result.error) {
        toast.error(t('projects.detail.imageUploadFailed'));
      } else {
        onImageChange(publicUrl);
      }
    } catch {
      toast.error(t('projects.detail.imageUploadFailed'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!imageUrl) {
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();
      const oldPath = imageUrl.split('/project-images/')[1];

      if (oldPath) {
        await supabase.storage.from('project-images').remove([oldPath]);
      }

      const result = await updateProjectImage({ projectId, imageUrl: '' });

      if (result.error) {
        toast.error(t('projects.detail.imageUploadFailed'));
      } else {
        onImageChange(null);
      }
    } catch {
      toast.error(t('projects.detail.imageUploadFailed'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="group relative cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        aria-label={t('projects.detail.changeImage')}
      >
        <ProjectAvatar imageUrl={imageUrl} name={projectName} size={48} />

        <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          {isUploading ? (
            <Spinner className="size-4 text-white" />
          ) : (
            <Camera className="size-4 text-white" aria-hidden />
          )}
        </span>
      </button>

      {imageUrl && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground"
          onClick={() => setShowRemoveConfirm(true)}
          disabled={isUploading}
          aria-label={t('projects.detail.removeImage')}
        >
          <Trash2 className="size-3.5" aria-hidden />
        </Button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={PROJECT_IMAGE_ACCEPTED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="sr-only"
        tabIndex={-1}
      />

      <ConfirmDialog
        open={showRemoveConfirm}
        onOpenChange={setShowRemoveConfirm}
        onConfirm={handleRemove}
        title={t('projects.detail.removeImageConfirmTitle')}
        description={t('projects.detail.removeImageConfirmDescription')}
        confirmLabel={t('projects.detail.removeImage')}
      />
    </>
  );
}
