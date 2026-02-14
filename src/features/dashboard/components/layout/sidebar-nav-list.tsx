import { Separator } from '@/components/ui/separator';
import { SIDEBAR_NAV } from '@/features/dashboard/config/navigation';

import { SidebarItem } from './sidebar-item';

interface SidebarNavListProps {
  isExpanded: boolean;
}

const SidebarNavList = ({ isExpanded }: SidebarNavListProps) => {
  return (
    <>
      {SIDEBAR_NAV.map((group, i) => (
        <div key={i}>
          {i > 0 && <Separator className="my-1.5" />}

          <div className={`flex flex-col gap-1.5 ${isExpanded ? '' : 'items-center'}`}>
            {group.items.map((item) => (
              <SidebarItem
                key={item.href}
                {...item}
                isExpanded={isExpanded}
                hasSubNav={!!item.subNav}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
};

export { SidebarNavList };
