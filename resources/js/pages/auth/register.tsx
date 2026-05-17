import { useEffect } from 'react';
import { router } from '@inertiajs/react';

export default function Register() {
    useEffect(() => {
        router.visit(route('login'));
    }, []);
    return null;
}