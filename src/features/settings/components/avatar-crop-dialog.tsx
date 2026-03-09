'use client';

import { ImageCropDialog } from '@/components/ui/image-crop-dialog';
import { AVATAR_OUTPUT_SIZE } from '@/features/settings/config';

interface AvatarCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  mimeType: string;
  onCropComplete: (blob: Blob) => void;
}

export function AvatarCropDialog(props: AvatarCropDialogProps) {
  return <ImageCropDialog {...props} cropShape="round" outputSize={AVATAR_OUTPUT_SIZE} />;
}
