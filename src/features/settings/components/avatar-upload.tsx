'use client';

import { useRef, useState } from 'react';

import dynamic from 'next/dynamic';

import { Camera, Trash2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { updateAvatarUrl } from '@/features/settings/actions';
import {
  AVATAR_ACCEPTED_TYPES,
  AVATAR_MAX_SIZE,
  AVATAR_OUTPUT_SIZE,
} from '@/features/settings/config';
import { proxyImageUrl } from '@/lib/common/utils';
import { createClient } from '@/lib/supabase/client';

const ImageCropDialog = dynamic(
  () => import('@/components/ui/image-crop-dialog').then((m) => ({ default: m.ImageCropDialog })),
  { ssr: false, loading: () => null }
);

interface AvatarUploadProps {
  userId: string;
  currentUrl: string;
  fallbackInitials: string;
  onAvatarChange: (url: string) => void;
}

const AvatarUpload = ({
  userId,
  currentUrl,
  fallbackInitials,
  onAvatarChange,
}: AvatarUploadProps) => {
  const t = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ src: string; type: string } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!AVATAR_ACCEPTED_TYPES.includes(file.type)) {
      toast.error(t('settings.errors.avatarInvalidType'));

      return;
    }

    if (file.size > AVATAR_MAX_SIZE) {
      toast.error(t('settings.errors.avatarTooLarge'));

      return;
    }

    const objectUrl = URL.createObjectURL(file);

    setSelectedFile({ src: objectUrl, type: file.type });
    setCropDialogOpen(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      const filePath = `${userId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, blob, {
        upsert: true,
        contentType: blob.type,
      });

      if (uploadError) {
        toast.error(t('settings.errors.uploadFailed'));

        return;
      }

      if (currentUrl) {
        const oldPath = currentUrl.split('/avatars/')[1];

        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const result = await updateAvatarUrl({ avatarUrl: publicUrl });

      if (result.error) {
        toast.error(t(`settings.${result.error}` as Parameters<typeof t>[0]));
      } else {
        onAvatarChange(publicUrl);
        window.dispatchEvent(new Event('auth:refresh'));
      }
    } catch {
      toast.error(t('settings.errors.uploadFailed'));
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
    if (!currentUrl) {
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
      const oldPath = currentUrl.split('/avatars/')[1];

      if (oldPath) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      const result = await updateAvatarUrl({ avatarUrl: '' });

      if (result.error) {
        toast.error(t(`settings.${result.error}` as Parameters<typeof t>[0]));
      } else {
        onAvatarChange('');
        window.dispatchEvent(new Event('auth:refresh'));
      }
    } catch {
      toast.error(t('settings.errors.uploadFailed'));
    } finally {
      setIsUploading(false);
    }
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const avatarElement = (
    <Avatar className="ring-offset-background ring-border/50 size-20 shrink-0 ring-2 ring-offset-2">
      <AvatarImage
        src={proxyImageUrl(currentUrl || undefined)}
        alt={t('settings.profile.avatar')}
      />

      <AvatarFallback className="text-lg">{fallbackInitials}</AvatarFallback>
    </Avatar>
  );

  return (
    <div className="bg-muted/20 flex flex-col items-center gap-4 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center">
      {currentUrl ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="cursor-pointer" disabled={isUploading}>
              {avatarElement}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={openFilePicker}>
              <Camera className="size-4" aria-hidden />
              {t('settings.profile.changeAvatar')}
            </DropdownMenuItem>

            <DropdownMenuItem variant="destructive" onClick={() => setShowRemoveConfirm(true)}>
              <Trash2 className="size-4" aria-hidden />
              {t('settings.profile.removeAvatar')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        avatarElement
      )}

      <div className="flex flex-col items-center gap-2 sm:items-start">
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

          {currentUrl ? t('settings.profile.changeAvatar') : t('settings.profile.uploadAvatar')}
        </Button>

        <p className="text-muted-foreground text-center text-xs sm:text-left">
          {t('settings.profile.avatarHint')}
        </p>
      </div>

      <input
        id="avatar-upload"
        name="avatar"
        ref={fileInputRef}
        type="file"
        accept={AVATAR_ACCEPTED_TYPES.join(',')}
        onChange={handleFileSelect}
        aria-label={t('settings.profile.uploadAvatar')}
        className="sr-only"
        tabIndex={-1}
      />

      <ConfirmDialog
        open={showRemoveConfirm}
        onOpenChange={setShowRemoveConfirm}
        onConfirm={handleRemove}
        title={t('settings.profile.removeAvatarConfirmTitle')}
        description={t('settings.profile.removeAvatarConfirmDescription')}
        confirmLabel={t('settings.profile.removeAvatar')}
      />

      {selectedFile && (
        <ImageCropDialog
          open={cropDialogOpen}
          onOpenChange={handleCropDialogChange}
          imageSrc={selectedFile.src}
          mimeType={selectedFile.type}
          cropShape="round"
          outputSize={AVATAR_OUTPUT_SIZE}
          onCropComplete={handleCropComplete}
          onRemove={currentUrl ? handleRemove : undefined}
          removeLabel={t('settings.profile.removeAvatar')}
          removeConfirmTitle={t('settings.profile.removeAvatarConfirmTitle')}
          removeConfirmDescription={t('settings.profile.removeAvatarConfirmDescription')}
        />
      )}
    </div>
  );
};

export { AvatarUpload };
