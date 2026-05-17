import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Building2, CreditCard, FileText, FolderKanban, HeadphonesIcon, LayoutGrid, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { t } = useTranslation();
    const { auth } = usePage().props as any;

    const mainNavItems: NavItem[] = [
        {
            title: t('nav.dashboard'),
            url: '/dashboard',
            icon: LayoutGrid,
        },
        {
            title: t('nav.companies'),
            url: '/companies',
            icon: Building2,
        },
        {
            title: t('nav.products'),
            url: '/products',
            icon: Package,
        },
        {
            title: t('nav.projects'),
            url: '/projects',
            icon: FolderKanban,
        },
        {
            title: t('nav.support'),
            url: '/support',
            icon: HeadphonesIcon,
        },
        {
            title: t('nav.subscription'),
            url: '/subscription',
            icon: CreditCard,
        },
    ];

    const adminNavItems: NavItem[] = [
        {
            title: t('nav.admin_dashboard'),
            url: '/admin/dashboard',
            icon: LayoutGrid,
        },
        {
            title: t('nav.admin_users'),
            url: '/admin/users',
            icon: Building2,
        },
        {
            title: t('nav.admin_support'),
            url: '/admin/support',
            icon: HeadphonesIcon,
        },
        {
            title: t('nav.admin_plans'),
            url: '/admin/business-plans',
            icon: FileText,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {auth?.user?.role !== 'admin' && (
                    <NavMain items={mainNavItems} label={t('nav.platform')} />
                )}
                {auth?.user?.role === 'admin' && (
                    <NavMain items={adminNavItems} label={t('nav.admin')} />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}