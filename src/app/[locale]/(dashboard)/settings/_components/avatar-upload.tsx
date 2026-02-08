'use client';

import { useRef, useState } from 'react';

import { Upload, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { updateAvatarUrl } from '@/features/settings/actions';
import { AVATAR_ACCEPTED_TYPES, AVATAR_MAX_SIZE } from '@/features/settings/config';
import { createClient } from '@/lib/supabase/client';

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
  const t = useTranslations('settings');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!AVATAR_ACCEPTED_TYPES.includes(file.type)) {
      toast.error(t('errors.avatarInvalidType'));

      return;
    }

    if (file.size > AVATAR_MAX_SIZE) {
      toast.error(t('errors.avatarTooLarge'));

      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${ext}`;

      if (currentUrl) {
        const oldPath = currentUrl.split('/avatars/')[1];

        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        toast.error(t('errors.uploadFailed'));

        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const result = await updateAvatarUrl(publicUrl);

      if (result.error) {
        toast.error(t(result.error as Parameters<typeof t>[0]));
      } else {
        onAvatarChange(publicUrl);
        window.dispatchEvent(new Event('auth:refresh'));
        toast.success(t('profile.avatarUpdated'));
      }
    } catch {
      toast.error(t('errors.uploadFailed'));
    } finally {
      setIsUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!currentUrl) {
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();
      const oldPath = currentUrl.split('/avatars/')[1];

      if (oldPath) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      const result = await updateAvatarUrl('');

      if (result.error) {
        toast.error(t(result.error as Parameters<typeof t>[0]));
      } else {
        onAvatarChange('');
        window.dispatchEvent(new Event('auth:refresh'));
        toast.success(t('profile.avatarRemoved'));
      }
    } catch {
      toast.error(t('errors.uploadFailed'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-muted/20 flex flex-col items-center gap-4 rounded-lg border border-dashed p-5 sm:flex-row sm:items-center">
      <Avatar className="ring-offset-background ring-border/50 size-20 shrink-0 ring-2 ring-offset-2">
        <AvatarImage src={currentUrl || undefined} alt={t('profile.avatar')} />
        <AvatarFallback className="text-lg">{fallbackInitials}</AvatarFallback>
      </Avatar>

      <div className="flex flex-col items-center gap-2 sm:items-start">
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Spinner className="size-4" />
            ) : (
              <Upload className="size-4" aria-hidden="true" />
            )}

            {currentUrl ? t('profile.changeAvatar') : t('profile.uploadAvatar')}
          </Button>

          {currentUrl && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="size-4" aria-hidden="true" />
              {t('profile.removeAvatar')}
            </Button>
          )}
        </div>

        <p className="text-muted-foreground text-center text-xs sm:text-left">
          {t('profile.avatarHint')}
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={AVATAR_ACCEPTED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        aria-label={t('profile.uploadAvatar')}
      />
    </div>
  );
};

export { AvatarUpload };
