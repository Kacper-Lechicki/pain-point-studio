'use client';

import { useState } from 'react';

import { ZoomIn, ZoomOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Spinner } from '@/components/ui/spinner';
import { type CropArea, cropImage } from '@/features/settings/utils/crop-image';

interface AvatarCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  mimeType: string;
  onCropComplete: (blob: Blob) => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.01;

const AvatarCropDialog = ({
  open,
  onOpenChange,
  imageSrc,
  mimeType,
  onCropComplete,
}: AvatarCropDialogProps) => {
  const t = useTranslations('settings.profile');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<CropArea | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  function handleCropComplete(_: Area, croppedAreaPixels: Area) {
    setCroppedArea(croppedAreaPixels);
  }

  const handleConfirm = async () => {
    if (!croppedArea) {
      return;
    }

    setIsProcessing(true);

    try {
      const blob = await cropImage(imageSrc, croppedArea, mimeType);
      onCropComplete(blob);
    } catch {
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedArea(null);
    }

    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('cropAvatar')}</DialogTitle>
          <DialogDescription>{t('cropAvatarDescription')}</DialogDescription>
        </DialogHeader>

        <div className="bg-muted relative aspect-square w-full overflow-hidden rounded-md">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            cropShape="round"
            showGrid={false}
          />
        </div>

        <div className="flex items-center gap-3 px-1">
          <ZoomOut className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />

          <Slider
            value={[zoom]}
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={ZOOM_STEP}
            onValueChange={([value]) => value !== undefined && setZoom(value)}
            aria-label={t('cropZoom')}
          />

          <ZoomIn className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isProcessing}
          >
            {t('cropCancel')}
          </Button>

          <Button type="button" onClick={handleConfirm} disabled={isProcessing || !croppedArea}>
            {isProcessing && <Spinner className="size-4" />}
            {t('cropConfirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { AvatarCropDialog };
