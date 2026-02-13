'use client';

import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useFieldArray, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SubmitButton } from '@/components/ui/submit-button';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/config';
import { ProfileData, updateProfile } from '@/features/settings/actions';
import { AvatarUpload } from '@/features/settings/components/avatar-upload';
import { SettingsSectionHeader } from '@/features/settings/components/settings-section-header';
import { BIO_MAX_LENGTH, MAX_SOCIAL_LINKS } from '@/features/settings/config';
import { UpdateProfileSchema, updateProfileSchema } from '@/features/settings/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import { useUnsavedChangesWarning } from '@/hooks/unsaved-changes-context';
import { Link } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';
import { getInitials } from '@/lib/common/utils';

interface ProfileFormProps {
  profile: ProfileData;
}

const ProfileForm = ({ profile }: ProfileFormProps) => {
  const t = useTranslations();
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [removeLinkIndex, setRemoveLinkIndex] = useState<number | null>(null);

  const { isLoading, execute } = useFormAction({
    successMessage: 'settings.profile.profileUpdated' as MessageKey,
    unexpectedErrorMessage: 'settings.errors.unexpected' as MessageKey,
  });

  const form = useForm<UpdateProfileSchema>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: profile.fullName,
      role: profile.role,
      bio: profile.bio,
      socialLinks: profile.socialLinks,
    },
  });

  useEffect(() => {
    form.reset({
      fullName: profile.fullName,
      role: profile.role,
      bio: profile.bio,
      socialLinks: profile.socialLinks,
    });
  }, [profile.fullName, profile.role, profile.bio, profile.socialLinks, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'socialLinks',
  });

  useUnsavedChangesWarning('profile-form', form.formState.isDirty);

  const fallbackInitials = getInitials(profile.fullName, profile.email);

  async function onSubmit(data: UpdateProfileSchema) {
    await execute(updateProfile, data);
  }

  return (
    <section className="space-y-8">
      <SettingsSectionHeader
        title={t('settings.profile.title')}
        description={t('settings.profile.description')}
        action={
          <Button type="button" variant="outline" asChild className="shrink-0">
            <Link href={ROUTES.profile.preview}>
              <Eye className="size-4" />
              {t('settings.profile.previewProfile')}
            </Link>
          </Button>
        }
      />

      <div className="space-y-6">
        <AvatarUpload
          userId={profile.id}
          currentUrl={avatarUrl}
          fallbackInitials={fallbackInitials}
          onAvatarChange={setAvatarUrl}
        />

        <Form {...form}>
          <form id="profile-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.profile.fullName')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('settings.profile.fullNamePlaceholder')}
                      autoComplete="name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.profile.role')}</FormLabel>
                  <Select name="role" onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full" aria-label={t('settings.profile.role')}>
                        <SelectValue placeholder={t('settings.profile.rolePlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[...profile.roleOptions]
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
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.profile.bio')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('settings.profile.bioPlaceholder')}
                      className="min-h-[180px] resize-none"
                      rows={8}
                      maxLength={BIO_MAX_LENGTH}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('settings.profile.bioCounter', {
                      count: (field.value ?? '').length,
                      max: BIO_MAX_LENGTH,
                    })}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        label: profile.socialLinkOptions[0]?.value ?? 'website',
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
                  <div
                    key={field.id}
                    className="bg-muted/20 space-y-2 rounded-lg border border-dashed p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs font-medium">
                        {t('settings.profile.socialLinks.linkLabel', { number: index + 1 })}
                      </span>
                      <Button
                        type="button"
                        variant="ghostDestructive"
                        size="icon-sm"
                        onClick={() => setRemoveLinkIndex(index)}
                        aria-label={t('settings.profile.socialLinks.removeLink')}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>

                    <FormField
                      control={form.control}
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
                              {[...profile.socialLinkOptions]
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
                      control={form.control}
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

            <div className="flex justify-end">
              <SubmitButton isLoading={isLoading} form="profile-form">
                {t('settings.profile.saveProfile')}
              </SubmitButton>
            </div>
          </form>
        </Form>
      </div>

      <ConfirmDialog
        open={removeLinkIndex !== null}
        onOpenChange={(open) => !open && setRemoveLinkIndex(null)}
        onConfirm={() => {
          if (removeLinkIndex !== null) {
            remove(removeLinkIndex);
            setRemoveLinkIndex(null);
          }
        }}
        title={t('settings.profile.socialLinks.removeLinkConfirmTitle')}
        description={t('settings.profile.socialLinks.removeLinkConfirmDescription')}
        confirmLabel={t('settings.profile.socialLinks.removeLink')}
      />
    </section>
  );
};

export { ProfileForm };
