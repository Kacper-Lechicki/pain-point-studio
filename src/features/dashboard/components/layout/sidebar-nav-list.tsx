import { Separator } from '@/components/ui/separator';
import { SidebarDynamicItem } from '@/features/dashboard/components/layout/sidebar-dynamic-item';
import { SidebarItem } from '@/features/dashboard/components/layout/sidebar-item';
import { SIDEBAR_NAV } from '@/features/dashboard/config/navigation';

interface SidebarNavListProps {
  isExpanded: boolean;
}

const SidebarNavList = ({ isExpanded }: SidebarNavListProps) => {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {SIDEBAR_NAV.map((group, i) => (
        <div key={i} className="min-h-0 shrink-0">
          {i > 0 && <Separator className="my-1.5" />}

          <div className={`flex flex-col gap-1.5 ${isExpanded ? '' : 'items-center'}`}>
            {group.items.map((item) => (
              <SidebarItem
                key={item.labelKey}
                {...item}
                isExpanded={isExpanded}
                hasSubNav={!!item.subNav}
              />
            ))}
          </div>
        </div>
      ))}

      <SidebarDynamicItem isExpanded={isExpanded} />
    </div>
  );
};

export { SidebarNavList };
