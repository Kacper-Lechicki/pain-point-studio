'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { ProfileData, updateProfile } from '@/features/settings/actions';
import { BIO_MAX_LENGTH, MAX_SOCIAL_LINKS } from '@/features/settings/config';
import { UpdateProfileSchema, updateProfileSchema } from '@/features/settings/types';
import type { MessageKey } from '@/i18n/types';

import { AvatarUpload } from './avatar-upload';

interface ProfileFormProps {
  profile: ProfileData;
}

const ProfileForm = ({ profile }: ProfileFormProps) => {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);

  const form = useForm<UpdateProfileSchema>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: profile.fullName,
      role: profile.role,
      bio: profile.bio,
      socialLinks: profile.socialLinks,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'socialLinks',
  });

  const bioValue = form.watch('bio') ?? '';

  const fallbackInitials = profile.fullName
    ? profile.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : profile.email.slice(0, 2).toUpperCase();

  async function onSubmit(data: UpdateProfileSchema) {
    setIsLoading(true);

    try {
      const result = await updateProfile(data);

      if (result.error) {
        toast.error(t(result.error as MessageKey));
      } else {
        toast.success(t('settings.profile.profileUpdated'));
      }
    } catch {
      toast.error(t('settings.errors.unexpected'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="space-y-8">
      <div className="border-border/40 flex flex-wrap items-start justify-between gap-3 border-b pb-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t('settings.profile.title')}</h2>
          <p className="text-muted-foreground text-sm">{t('settings.profile.description')}</p>
        </div>

        <Button type="button" variant="outline" size="sm" disabled className="shrink-0">
          <Eye className="size-4" />
          {t('settings.profile.previewProfile')}
        </Button>
      </div>

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
                    <Input placeholder={t('settings.profile.fullNamePlaceholder')} {...field} />
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

                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('settings.profile.rolePlaceholder')} />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      {profile.roleOptions.map((option) => (
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
                      count: bioValue.length,
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
                  <p className="text-muted-foreground text-sm">
                    {t('settings.profile.socialLinks.description')}
                  </p>
                </div>

                {fields.length < MAX_SOCIAL_LINKS && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
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
                      <span className="text-muted-foreground text-sm font-medium">
                        {t('settings.profile.socialLinks.linkLabel', {
                          number: index + 1,
                        })}
                      </span>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive size-8"
                        onClick={() => remove(index)}
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
                          <Select onValueChange={labelField.onChange} value={labelField.value}>
                            <FormControl>
                              <SelectTrigger className="h-9 w-full">
                                <SelectValue
                                  placeholder={t('settings.profile.socialLinks.labelPlaceholder')}
                                />
                              </SelectTrigger>
                            </FormControl>

                            <SelectContent>
                              {profile.socialLinkOptions.map((option) => (
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
                              className="h-9 w-full"
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
              <Button type="submit" form="profile-form" disabled={isLoading}>
                {isLoading && <Spinner />}
                {t('settings.profile.saveProfile')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </section>
  );
};

export { ProfileForm };
