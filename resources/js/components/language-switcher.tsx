import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'fr' : 'en';
        i18n.changeLanguage(newLang);
        localStorage.setItem('language', newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/20"
        >
            <span className="text-accent font-semibold">
                {i18n.language === 'en' ? 'FR' : 'EN'}
            </span>
        </button>
    );
}