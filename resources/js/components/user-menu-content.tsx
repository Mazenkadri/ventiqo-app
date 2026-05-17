import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { type User } from '@/types';
import { Link } from '@inertiajs/react';
import { Languages, LogOut, Settings, Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppearance } from '@/hooks/use-appearance';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();
    const { t, i18n } = useTranslation();
    const { appearance, updateAppearance } = useAppearance();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'fr' : 'en';
        i18n.changeLanguage(newLang);
        localStorage.setItem('language', newLang);
    };

    const toggleTheme = () => {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = appearance === 'dark' || (appearance === 'system' && prefersDark);
        updateAppearance(isDark ? 'light' : 'dark');
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link className="block w-full" href={route('profile.edit')} as="button" prefetch onClick={cleanup}>
                        <Settings className="mr-2" />
                        {t('nav.settings')}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); toggleLanguage(); }} className="cursor-pointer">
                    <Languages className="mr-2 h-4 w-4" />
                    {i18n.language === 'en' ? 'Français' : 'English'}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); toggleTheme(); }} className="cursor-pointer">
                    {appearance === 'dark' || (appearance === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? (
                        <Sun className="mr-2 h-4 w-4" />
                    ) : (
                        <Moon className="mr-2 h-4 w-4" />
                    )}
                    {appearance === 'dark' || (appearance === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? t('nav.light_mode') : t('nav.dark_mode')}
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link className="block w-full" method="post" href={route('logout')} as="button" onClick={cleanup}>
                    <LogOut className="mr-2" />
                    {t('auth.logout')}
                </Link>
            </DropdownMenuItem>
        </>
    );
}