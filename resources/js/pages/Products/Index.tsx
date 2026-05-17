import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Pencil, Plus, Trash2 } from 'lucide-react';


interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    company_id: number;
}

interface Company {
    id: number;
    name: string;
    products: Product[];
}

interface Props {
    companies: Company[];
}

export default function ProductsIndex({ companies }: Props) {
    const { t } = useTranslation();
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product & { company_name: string } | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('nav.dashboard'), href: '/dashboard' },
        { title: t('products.title'), href: '/products' },
    ];

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        description: '',
        price: '',
        company_id: '',
    });

    const allProducts = companies.flatMap(company =>
        company.products.map(product => ({
            ...product,
            company_name: company.name,
        }))
    )

    const openCreate = () => {
        reset();
        setEditingProduct(null);
        setShowForm(true);
    };

    const openEdit = (product: Product & { company_name: string }) => {
        setEditingProduct(product);
        setData({
            name: product.name,
            description: product.description,
            price: product.price.toString(),
            company_id: product.company_id.toString(),
        });
        setShowForm(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProduct) {
            put(route('products.update', editingProduct.id), {
                onSuccess: () => { setShowForm(false); reset(); }
            });
        } else {
            post(route('products.store', { id: data.company_id }), {
                onSuccess: () => { setShowForm(false); reset(); }
            });
        }
    };

    const deleteProduct = (id: number) => {
        if (confirm(t('common.confirm_delete'))) {
            router.delete(route('products.destroy', id));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('products.title')} />
            <div className='p-6'>
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold font-heading">
                        {t('products.title')}
                    </h1>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 bg-accent text-black px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity "
                    >
                        <Plus className="w-4 h-4" />
                        {t('products.add_product')}
                    </button>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6">
                    {allProducts.length === 0 ? (
                        <p>{t('products.no_products')}</p>
                    ) : (
                        <table className="w-full table-auto border-collapse">
                            <thead>
                                <tr className='border-b border-border text-left text-sm text-muted-foreground'>
                                    <th className="pb-3 font-medium">{t('products.product_name')}</th>
                                    <th className="pb-3 font-medium">{t('products.company')}</th>
                                    <th className="pb-3 font-medium">{t('products.description')}</th>
                                    <th className="pb-3 font-medium">{t('products.price')}</th>
                                    <th className="pb-3 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {allProducts.map(product => (
                                    <tr key={product.id} className="border-b border-border/50 text-sm">
                                        <td className="py-4 font-medium">{product.name}</td>
                                        <td className="py-4 text-muted-foreground">{product.company_name}</td>
                                        <td className="py-4 text-muted-foreground max-w-[200px] truncate">{product.description || '—'}</td>
                                        <td className="py-4">${product.price}</td>
                                        <td className="py-4 flex gap-2">
                                            <button
                                                onClick={() => openEdit(product)}
                                                className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-accent/10 transition-colors">
                                                <Pencil className="w-3 h-3" />
                                                {t('common.edit')}
                                            </button>
                                            <button
                                                onClick={() => deleteProduct(product.id)}
                                                className="flex items-center gap-1 bg-red text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-red/10 text-destructive hover:bg-destructive/10 transition-colors">
                                                <Trash2 className="w-3 h-3" />
                                                {t('common.delete')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {showForm && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg">
                                <h2 className="text-xl font-bold font-heading mb-6">
                                    {editingProduct ? t('products.edit_product') : t('products.add_product')}
                                </h2>
                                <form onSubmit={submit} className="flex flex-col gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-sm font-medium">{t('products.company')}</label>
                                            <select
                                                value={data.company_id}
                                                onChange={e => setData('company_id', e.target.value)}
                                                className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent"
                                                required
                                            >
                                                <option value="">{t('products.select_company')}</option>
                                                {companies.map(company => (
                                                    <option key={company.id} value={company.id}>{company.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-sm font-medium">{t('products.product_name')}</label>
                                            <input
                                                type="text"
                                                value={data.name || ''}
                                                onChange={e => setData({ ...data, name: e.target.value })}
                                                className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors" required
                                            />
                                            {errors.name && <span className="text-destructive text-xs">{errors.name}</span>}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-sm font-medium">{t('products.description')}</label>
                                            <input
                                                type="text"
                                                value={data.description || ''}
                                                onChange={e => setData({ ...data, description: e.target.value })}
                                                className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors" required
                                            />
                                            {errors.description && <span className="text-destructive text-xs">{errors.description}</span>}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-sm font-medium">{t('products.price')}</label>
                                            <input
                                                type="number"
                                                value={data.price || ''}
                                                onChange={e => setData({ ...data, price: e.target.value })}
                                                className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors" required
                                            />
                                            {errors.price && <span className="text-destructive text-xs">{errors.price}</span>}
                                        </div>
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
                                            {t('products.save_product')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}