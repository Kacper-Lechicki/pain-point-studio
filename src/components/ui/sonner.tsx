'use client';

import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = (props: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      richColors
      closeButton
      position="bottom-right"
      visibleToasts={3}
      gap={8}
      toastOptions={{
        style: {
          marginBottom: '0px',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
