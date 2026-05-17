import { Head, router, useForm } from '@inertiajs/react';
import { Building2, Mail, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface Company {
    id: number;
    name: string;
    type: string;
    industry: string | null;
    email: string | null;
    phone_number: string | null;
    fax: string | null;
    web_site: string | null;
    address: string | null;
    logo_path: string | null;
}

interface Props {
    companies: Company[];
}

export default function CompaniesIndex({ companies }: Props) {
    const { t } = useTranslation();
    const [showForm, setShowForm] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('nav.dashboard'), href: '/dashboard' },
        { title: t('companies.title'), href: '/companies' },
    ];

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        type: '',
        industry: '',
        email: '',
        phone_number: '',
        fax: '',
        web_site: '',
        address: '',
        logo: null as File | null,
    });

    const openCreate = () => {
        reset();
        setEditingCompany(null);
        setShowForm(true);
    };

    const openEdit = (company: Company) => {
        setEditingCompany(company);
        setData({
            name: company.name,
            type: company.type,
            industry: company.industry || '',
            email: company.email || '',
            phone_number: company.phone_number || '',
            fax: company.fax || '',
            web_site: company.web_site || '',
            address: company.address || '',
            logo: null,
        });
        setShowForm(true);
    };

    
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCompany) {
            put(route('companies.update', editingCompany.id), {
                onSuccess: () => { setShowForm(false); reset(); }
            });
        } else {
            post(route('companies.store'), {
                onSuccess: () => { setShowForm(false); reset(); }
            });
        }
    };

    const deleteCompany = (id: number) => {
        if (confirm(t('common.confirm_delete'))) {
            router.delete(`/api/companies/${id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('companies.title')} />
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold font-heading">
                        {t('companies.title')}
                    </h1>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 bg-accent text-black px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity "
                    >
                        <Plus className="w-4 h-4" />
                        {t('companies.add_company')}
                    </button>
                </div>

                {/* Company Cards Grid */}
                {companies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                        <Building2 className="w-12 h-12 mb-4 opacity-30" />
                        <p className="text-lg">{t('companies.no_companies')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {companies.map((company) => (
                            <div
                                key={company.id}
                                className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4"
                            >
                                {/* Logo + Name */}
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                                        {company.logo_path ? (
                                            <img src={`/storage/${company.logo_path}`} className="w-10 h-10 rounded-lg object-cover" />
                                        ) : (
                                            <Building2 className="w-6 h-6 text-accent" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold font-heading text-lg">{company.name}</h3>
                                        <p className="text-muted-foreground text-sm">{company.type}</p>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                    {company.industry && <span>{company.industry}</span>}
                                    {company.email && (
                                        <span className="flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            {company.email}
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 mt-auto pt-4 border-t border-border">
                                    <button
                                        onClick={() => openEdit(company)}
                                        className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-accent/10 transition-colors"
                                    >
                                        <Pencil className="w-3 h-3" />
                                        {t('common.edit')}
                                    </button>
                                    <button
                                        onClick={() => deleteCompany(company.id)}
                                        className="flex items-center gap-1 bg-red text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-red/10 text-destructive hover:bg-destructive/10 transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        {t('common.delete')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal Form */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg">
                            <h2 className="text-xl font-bold font-heading mb-6">
                                {editingCompany ? t('companies.edit_company') : t('companies.add_company')}
                            </h2>
                            <form onSubmit={submit} className="flex flex-col gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium">{t('companies.company_name')}</label>
                                        <input
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                                            required
                                        />
                                        {errors.name && <span className="text-destructive text-xs">{errors.name}</span>}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium">{t('companies.company_type')}</label>
                                        <input
                                            value={data.type}
                                            onChange={e => setData('type', e.target.value)}
                                            className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium">{t('companies.industry')}</label>
                                        <input
                                            value={data.industry}
                                            onChange={e => setData('industry', e.target.value)}
                                            className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium">{t('companies.email')}</label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium">{t('companies.phone')}</label>
                                        <input
                                            value={data.phone_number}
                                            onChange={e => setData('phone_number', e.target.value)}
                                            className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium">{t('companies.website')}</label>
                                        <input
                                            value={data.web_site}
                                            onChange={e => setData('web_site', e.target.value)}
                                            className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className='grid grid-cols-2 gap-4'>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium">{t('companies.address')}</label>
                                        <input
                                            value={data.address}
                                            onChange={e => setData('address', e.target.value)}
                                            className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium">{t('companies.fax')}</label>
                                        <input
                                            value={data.fax}
                                            onChange={e => setData('fax', e.target.value)}
                                            className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">{t('companies.logo')}</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => setData('logo', e.target.files?.[0] || null)}
                                        className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none"
                                    />
                                </div>
                                <div className="flex gap-3 justify-end mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-accent/10 transition-colors"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-4 py-2 rounded-xl bg-accent text-black text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                    >
                                        {t('companies.save_company')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}