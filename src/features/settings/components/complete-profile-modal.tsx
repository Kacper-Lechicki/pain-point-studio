'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
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
import { LookupValue, completeProfile } from '@/features/settings/actions';
import { CompleteProfileSchema, completeProfileSchema } from '@/features/settings/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import { useRouter } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';

interface CompleteProfileModalProps {
  roleOptions: LookupValue[];
  currentFullName: string;
  currentRole: string;
}

const CompleteProfileModal = ({
  roleOptions,
  currentFullName,
  currentRole,
}: CompleteProfileModalProps) => {
  const t = useTranslations();
  const router = useRouter();

  const { isLoading, execute } = useFormAction({
    unexpectedErrorMessage: 'settings.errors.unexpected' as MessageKey,
    onSuccess: () => router.refresh(),
  });

  const form = useForm<CompleteProfileSchema>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      fullName: currentFullName,
      role: currentRole,
    },
  });

  async function onSubmit(data: CompleteProfileSchema) {
    await execute(completeProfile, data);
  }

  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t('settings.completeProfile.title')}</DialogTitle>
          <DialogDescription>{t('settings.completeProfile.description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.completeProfile.fullName')}</FormLabel>

                  <FormControl>
                    <Input
                      placeholder={t('settings.completeProfile.fullNamePlaceholder')}
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
                  <FormLabel>{t('settings.completeProfile.role')}</FormLabel>

                  <Select name="role" onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger
                        className="w-full"
                        data-testid="complete-profile-role"
                        aria-label={t('settings.completeProfile.role')}
                      >
                        <SelectValue placeholder={t('settings.completeProfile.rolePlaceholder')} />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      {[...roleOptions]
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

            <SubmitButton isLoading={isLoading} className="mt-4 w-full">
              {t('settings.completeProfile.submit')}
            </SubmitButton>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export { CompleteProfileModal };
