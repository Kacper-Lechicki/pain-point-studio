'use client';

import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { CircleUserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useFieldArray, useForm } from 'react-hook-form';

import { ClipboardInput } from '@/components/ui/clipboard-input';
import { Combobox } from '@/components/ui/combobox';
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
import { SubmitButton } from '@/components/ui/submit-button';
import { Textarea } from '@/components/ui/textarea';
import { ProfileData, updateProfile } from '@/features/settings/actions';
import { AvatarUpload } from '@/features/settings/components/avatar-upload';
import { SettingsSectionHeader } from '@/features/settings/components/settings-section-header';
import { SocialLinksSection } from '@/features/settings/components/social-links-section';
import { BIO_MAX_LENGTH } from '@/features/settings/config';
import { UpdateProfileSchema, updateProfileSchema } from '@/features/settings/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import { useUnsavedChangesWarning } from '@/hooks/unsaved-changes-context';
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
        icon={CircleUserRound}
        title={t('settings.profile.title')}
        description={t('settings.profile.description')}
      />

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-muted-foreground text-sm font-medium">
            {t('settings.profile.accountId')}
          </label>
          <ClipboardInput
            value={profile.id}
            readOnly
            copyLabel={t('settings.profile.copy')}
            copiedLabel={t('settings.profile.copied')}
            className="font-mono text-xs"
          />
        </div>

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

                  <FormControl>
                    <Combobox
                      options={profile.roleOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder={t('settings.profile.rolePlaceholder')}
                      searchPlaceholder={t('common.search')}
                      emptyMessage={t('common.noResults')}
                      aria-label={t('settings.profile.role')}
                    />
                  </FormControl>

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

            <SocialLinksSection
              control={form.control}
              fields={fields}
              append={append}
              onRemoveRequest={(index) => {
                const url = form.getValues(`socialLinks.${index}.url`);

                if (url.trim()) {
                  setRemoveLinkIndex(index);
                } else {
                  remove(index);
                }
              }}
              socialLinkOptions={profile.socialLinkOptions}
            />

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
