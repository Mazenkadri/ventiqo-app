import { Head } from '@inertiajs/react';
import VerificationModal from '@/components/verification-modal';

export default function VerifyEmail() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Head title="Verify Email" />
            <VerificationModal
                type="verification"
                email=""
            />
        </div>
    );
}