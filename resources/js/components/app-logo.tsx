
export default function AppLogo() {
    return (
        <>
            <img src="/Ventiqo-lightmode.svg" alt="Ventiqo" className="h-8 w-auto block dark:hidden" />
            <img src="/Ventiqo-darkmode.svg" alt="Ventiqo" className="h-8 w-auto hidden dark:block" />
        </>
    );
}
