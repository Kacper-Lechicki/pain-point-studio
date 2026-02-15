import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Control, UseFieldArrayReturn } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MAX_SOCIAL_LINKS } from '@/features/settings/config';
import type { UpdateProfileSchema } from '@/features/settings/types';

interface SocialLinkOption {
  value: string;
  label: string;
}

interface SocialLinksSectionProps {
  control: Control<UpdateProfileSchema>;
  fields: UseFieldArrayReturn<UpdateProfileSchema, 'socialLinks'>['fields'];
  append: UseFieldArrayReturn<UpdateProfileSchema, 'socialLinks'>['append'];
  onRemoveRequest: (index: number) => void;
  socialLinkOptions: SocialLinkOption[];
}

export function SocialLinksSection({
  control,
  fields,
  append,
  onRemoveRequest,
  socialLinkOptions,
}: SocialLinksSectionProps) {
  const t = useTranslations();

  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">{t('settings.profile.socialLinks.title')}</p>
          <p className="text-muted-foreground text-xs">
            {t('settings.profile.socialLinks.description')}
          </p>
        </div>

        {fields.length < MAX_SOCIAL_LINKS && (
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            onClick={() =>
              append({
                label: socialLinkOptions[0]?.value ?? 'website',
                url: '',
              })
            }
          >
            <Plus className="size-4" />
            {t('settings.profile.socialLinks.addLink')}
          </Button>
        )}
      </div>

      {fields.length >= MAX_SOCIAL_LINKS && (
        <p className="text-muted-foreground text-xs">
          {t('settings.profile.socialLinks.maxReached', { max: MAX_SOCIAL_LINKS })}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((field, index) => (
          <div key={field.id} className="bg-muted/20 space-y-2 rounded-lg border border-dashed p-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium">
                {t('settings.profile.socialLinks.linkLabel', { number: index + 1 })}
              </span>
              <Button
                type="button"
                variant="ghostDestructive"
                size="icon-sm"
                onClick={() => onRemoveRequest(index)}
                aria-label={t('settings.profile.socialLinks.removeLink')}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </div>

            <FormField
              control={control}
              name={`socialLinks.${index}.label`}
              render={({ field: labelField }) => (
                <FormItem className="w-full">
                  <Select
                    name={`socialLinks.${index}.label`}
                    onValueChange={labelField.onChange}
                    value={labelField.value}
                  >
                    <FormControl>
                      <SelectTrigger
                        className="w-full"
                        aria-label={t('settings.profile.socialLinks.labelPlaceholder')}
                      >
                        <SelectValue
                          placeholder={t('settings.profile.socialLinks.labelPlaceholder')}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[...socialLinkOptions]
                        .sort((a, b) => a.label.localeCompare(b.label))
                        .map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`socialLinks.${index}.url`}
              render={({ field: urlField }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <Input
                      placeholder={t('settings.profile.socialLinks.urlPlaceholder')}
                      autoComplete="url"
                      className="w-full"
                      {...urlField}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
