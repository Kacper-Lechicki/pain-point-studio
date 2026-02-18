'use client';

import { Separator } from '@/components/ui/separator';
import { SidebarItem } from '@/features/dashboard/components/layout/sidebar-item';
import { DYNAMIC_SIDEBAR_ITEMS } from '@/features/dashboard/config/navigation';
import { usePathname } from '@/i18n/routing';

interface SidebarDynamicItemProps {
  isExpanded: boolean;
}

export function SidebarDynamicItem({ isExpanded }: SidebarDynamicItemProps) {
  const pathname = usePathname();

  const match = DYNAMIC_SIDEBAR_ITEMS.find((item) => pathname === item.path);

  if (!match) {
    return null;
  }

  return (
    <>
      <Separator className="my-1.5" />
      <div className={`flex flex-col gap-1.5 ${isExpanded ? '' : 'items-center'}`}>
        <SidebarItem
          labelKey={match.labelKey}
          icon={match.icon}
          href={match.path}
          isExpanded={isExpanded}
        />
      </div>
    </>
  );
}
