'use client';

import { useRef, useState } from 'react';

import dynamic from 'next/dynamic';

import { Camera, Trash2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { updateProjectImage } from '@/features/projects/actions/update-project-image';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import {
  PROJECT_IMAGE_ACCEPTED_TYPES,
  PROJECT_IMAGE_DIMENSION,
  PROJECT_IMAGE_MAX_SIZE,
} from '@/features/projects/config';
import { createClient } from '@/lib/supabase/client';

const ImageCropDialog = dynamic(
  () => import('@/components/ui/image-crop-dialog').then((m) => ({ default: m.ImageCropDialog })),
  { ssr: false, loading: () => null }
);

interface ProjectImageUploadProps {
  projectId: string;
  userId: string;
  imageUrl: string | null;
  projectName: string;
  onImageChange: (url: string | null) => void;
  size?: 32 | 48 | 80;
  showButton?: boolean;
}

export function ProjectImageUpload({
  projectId,
  userId,
  imageUrl,
  projectName,
  onImageChange,
  size = 48,
  showButton,
}: ProjectImageUploadProps) {
  const t = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ src: string; type: string } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const objectUrl = URL.createObjectURL(file);

    setSelectedFile({ src: objectUrl, type: file.type });
    setCropDialogOpen(true);
  };

  const handleCropComplete = async (blob: Blob) => {
    setCropDialogOpen(false);

    if (selectedFile?.src) {
      URL.revokeObjectURL(selectedFile.src);
    }

    setSelectedFile(null);
    setIsUploading(true);

    try {
      const supabase = createClient();
      const ext = blob.type.split('/')[1] || 'jpg';
      const filePath = `${userId}/${projectId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(filePath, blob, { upsert: true, contentType: blob.type });

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

  const handleCropDialogChange = (open: boolean) => {
    setCropDialogOpen(open);

    if (!open && selectedFile?.src) {
      URL.revokeObjectURL(selectedFile.src);
      setSelectedFile(null);
    }
  };

  const handleRemove = async () => {
    if (!imageUrl) {
      return;
    }

    setCropDialogOpen(false);

    if (selectedFile?.src) {
      URL.revokeObjectURL(selectedFile.src);
    }

    setSelectedFile(null);
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

  const openFilePicker = () => fileInputRef.current?.click();

  const avatarButton = (
    <button
      type="button"
      className="group relative cursor-pointer"
      disabled={isUploading}
      aria-label={t('projects.detail.changeImage')}
    >
      <ProjectAvatar imageUrl={imageUrl} name={projectName} size={size} />

      <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity md:group-hover:opacity-100">
        {isUploading ? (
          <Spinner className="size-4 text-white" />
        ) : (
          <Camera className="size-4 text-white" aria-hidden />
        )}
      </span>
    </button>
  );

  const avatarWithDropdown = imageUrl ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{avatarButton}</DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={openFilePicker}>
          <Camera className="size-4" aria-hidden />
          {t('projects.detail.changeImage')}
        </DropdownMenuItem>

        <DropdownMenuItem variant="destructive" onClick={() => setShowRemoveConfirm(true)}>
          <Trash2 className="size-4" aria-hidden />
          {t('projects.detail.removeImage')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <button
      type="button"
      className="group relative cursor-pointer"
      onClick={openFilePicker}
      disabled={isUploading}
      aria-label={t('projects.detail.changeImage')}
    >
      <ProjectAvatar imageUrl={imageUrl} name={projectName} size={size} />

      <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity md:group-hover:opacity-100">
        {isUploading ? (
          <Spinner className="size-4 text-white" />
        ) : (
          <Camera className="size-4 text-white" aria-hidden />
        )}
      </span>
    </button>
  );

  const uploadButton = showButton ? (
    <div className="bg-muted/20 flex flex-col items-center gap-4 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center">
      {avatarWithDropdown}

      <div className="flex flex-col items-center gap-2 sm:items-start">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openFilePicker}
            disabled={isUploading}
          >
            {isUploading ? (
              <Spinner className="size-4" />
            ) : (
              <Upload className="size-4" aria-hidden="true" />
            )}
            {imageUrl ? t('projects.detail.changeImage') : t('projects.detail.uploadImage')}
          </Button>

          {imageUrl && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setShowRemoveConfirm(true)}
              disabled={isUploading}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              {t('projects.detail.removeImage')}
            </Button>
          )}
        </div>

        <p className="text-muted-foreground text-center text-xs sm:text-left">
          {t('projects.settings.projectImageHint')}
        </p>
      </div>
    </div>
  ) : (
    avatarWithDropdown
  );

  return (
    <>
      {uploadButton}

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

      {selectedFile && (
        <ImageCropDialog
          open={cropDialogOpen}
          onOpenChange={handleCropDialogChange}
          imageSrc={selectedFile.src}
          mimeType={selectedFile.type}
          cropShape="rect"
          outputSize={PROJECT_IMAGE_DIMENSION}
          onCropComplete={handleCropComplete}
          onRemove={imageUrl ? handleRemove : undefined}
          removeLabel={t('projects.detail.removeImage')}
          removeConfirmTitle={t('projects.detail.removeImageConfirmTitle')}
          removeConfirmDescription={t('projects.detail.removeImageConfirmDescription')}
        />
      )}
    </>
  );
}
