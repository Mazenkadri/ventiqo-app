import { Head, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Pencil, X, Check, Search, Trash2, UserPlus } from 'lucide-react';

interface Subscription {
    status: string;
    end_date: string;
    plan_type?: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
    subscription: Subscription | null;
}

interface Props {
    users: User[];
}

export default function AdminUsers({ users }: Props) {
    const { t } = useTranslation();

    // Edit state
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', role: '', password: '', sub_status: '', sub_end_date: '' });
    const [saving, setSaving] = useState(false);

    // Create state
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', password_confirmation: '', role: 'user' });
    const [creating, setCreating] = useState(false);
    const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

    // Filter state
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterSub, setFilterSub] = useState('all');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('nav.admin'), href: '/admin/dashboard' },
        { title: t('nav.admin_users'), href: '/admin/users' },
    ];

    const openEdit = (user: User) => {
        setEditingUser(user);
        setEditForm({
            name: user.name,
            email: user.email,
            role: user.role,
            password: '',
            sub_status: user.subscription?.status ?? '',
            sub_end_date: user.subscription
                ? new Date(user.subscription.end_date).toISOString().split('T')[0]
                : '',
        });
    };

    const closeEdit = () => {
        setEditingUser(null);
        setEditForm({ name: '', email: '', role: '', password: '', sub_status: '', sub_end_date: '' });
    };

    const saveEdit = async () => {
        if (!editingUser) return;
        setSaving(true);
        try {
            await fetch(route('admin.users.update', editingUser.id), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || ''),
                },
                body: JSON.stringify(editForm),
            });
            router.reload({ only: ['users'] });
            closeEdit();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const openCreate = () => {
        setCreateForm({ name: '', email: '', password: '', password_confirmation: '', role: 'user' });
        setCreateErrors({});
        setShowCreate(true);
    };

    const closeCreate = () => {
        setShowCreate(false);
        setCreateForm({ name: '', email: '', password: '', password_confirmation: '', role: 'user' });
        setCreateErrors({});
    };

    const saveCreate = async () => {
        setCreating(true);
        setCreateErrors({});
        try {
            const response = await fetch(route('admin.users.create'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || ''),
                },
                body: JSON.stringify(createForm),
            });
            if (response.ok) {
                router.reload({ only: ['users'] });
                closeCreate();
            } else {
                const data = await response.json();
                if (data.errors) setCreateErrors(data.errors);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setCreating(false);
        }
    };

    const deleteUser = (id: number) => {
        if (confirm(t('admin.users.delete_confirm'))) {
            router.delete(route('admin.users.delete', id), {
                onSuccess: () => router.reload({ only: ['users'] }),
            });
        }
    };

    const getPlanBadge = (subscription: Subscription | null) => {
        if (!subscription) return (
            <span className="px-2 py-1 rounded-lg text-xs bg-border text-muted-foreground">
                {t('admin.users.status_badges.no_sub')}
            </span>
        );
        const plan = subscription.plan_type || 'free';
        
        if (plan === 'unlimited') return (
            <span className="px-2 py-1 rounded-lg text-xs bg-primary/20 text-primary">
                {t('admin.users.plan_badges.unlimited')}
            </span>
        );
        if (plan === 'basic') return (
            <span className="px-2 py-1 rounded-lg text-xs bg-accent/20 text-accent">
                {t('admin.users.plan_badges.basic')}
            </span>
        );
        return (
            <span className="px-2 py-1 rounded-lg text-xs bg-warning/20 text-warning">
                {t('admin.users.plan_badges.trial')}
            </span>
        );
    };

    const getPlanType = (subscription: Subscription | null) => {
        if (!subscription) return 'none';
        return subscription.plan_type || 'free';
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = search === '' ||
                user.name.toLowerCase().includes(search.toLowerCase()) ||
                user.email.toLowerCase().includes(search.toLowerCase());
            const matchesRole = filterRole === 'all' || user.role === filterRole;
            const matchesSub = filterSub === 'all' || getPlanType(user.subscription) === filterSub;
            return matchesSearch && matchesRole && matchesSub;
        });
    }, [users, search, filterRole, filterSub]);

    const inputClass = "bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors w-full";

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin — Users" />
            <div className="p-6 flex flex-col gap-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold font-heading">
                            {t('admin.users.title_1')} <span className="text-accent">{t('admin.users.title_2')}</span>
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            {filteredUsers.length} {t('admin.users.users_count_of')} {users.length} {t('admin.users.users_count_suffix')}
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                        style={{ backgroundColor: 'var(--accent)', color: '#000' }}
                    >
                        <UserPlus className="w-4 h-4" />
                        {t('admin.users.add_user')}
                    </button>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={t('admin.users.search_placeholder')}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-input border border-[var(--input-border)] rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                        />
                    </div>
                    <select
                        value={filterRole}
                        onChange={e => setFilterRole(e.target.value)}
                        className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                    >
                        <option value="all">{t('admin.users.filters.all_roles')}</option>
                        <option value="user">{t('admin.users.filters.user')}</option>
                        <option value="admin">{t('admin.users.filters.admin')}</option>
                    </select>
                    <select
                        value={filterSub}
                        onChange={e => setFilterSub(e.target.value)}
                        className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                    >
                        <option value="all">{t('admin.users.filters.all_subscriptions')}</option>
                        <option value="free">{t('admin.users.plan_badges.trial')}</option>
                        <option value="basic">{t('admin.users.plan_badges.basic')}</option>
                        <option value="unlimited">{t('admin.users.plan_badges.unlimited')}</option>
                        <option value="none">{t('admin.users.filters.no_subscription')}</option>
                    </select>
                </div>

                {/* Table */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <table className="w-full table-auto border-collapse">
                        <thead>
                            <tr className="border-b border-border text-left text-sm text-muted-foreground">
                                <th className="pb-3 font-medium">{t('admin.users.table.name')}</th>
                                <th className="pb-3 font-medium">{t('admin.users.table.email')}</th>
                                <th className="pb-3 font-medium">{t('admin.users.table.role')}</th>
                                <th className="pb-3 font-medium">{t('admin.users.table.subscription')}</th>
                                <th className="pb-3 font-medium">{t('admin.users.table.joined')}</th>
                                <th className="pb-3 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                                        {t('admin.users.table.no_users')}
                                    </td>
                                </tr>
                            ) : filteredUsers.map(user => (
                                <tr key={user.id} className="border-b border-border/50 text-sm">
                                    <td className="py-4 font-medium">{user.name}</td>
                                    <td className="py-4 text-muted-foreground">{user.email}</td>
                                    <td className="py-4">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                            user.role === 'admin'
                                                ? 'bg-accent/20 text-accent'
                                                : 'bg-border text-muted-foreground'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-4">{getPlanBadge(user.subscription)}</td>
                                    <td className="py-4 text-muted-foreground">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEdit(user)}
                                                className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-accent/10 transition-colors"
                                            >
                                                <Pencil className="w-3 h-3" />
                                                {t('admin.users.table.edit')}
                                            </button>
                                            <button
                                                onClick={() => deleteUser(user.id)}
                                                className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                {t('admin.users.table.delete')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Edit User Overlay */}
                {editingUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md flex flex-col gap-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold font-heading">
                                    {t('admin.users.edit_modal.title_1')} <span className="text-accent">{t('admin.users.edit_modal.title_2')}</span>
                                </h2>
                                <button onClick={closeEdit} className="p-1.5 rounded-lg hover:bg-accent/10 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="text-xs text-muted-foreground bg-background rounded-xl px-3 py-2 border border-border">
                                {t('admin.users.edit_modal.id_prefix')}{editingUser.id} · {t('admin.users.edit_modal.joined_prefix')} {new Date(editingUser.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">{t('admin.users.edit_modal.name_label')}</label>
                                    <input value={editForm.name} onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))} className={inputClass} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">{t('admin.users.edit_modal.email_label')}</label>
                                    <input type="email" value={editForm.email} onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))} className={inputClass} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">{t('admin.users.edit_modal.role_label')}</label>
                                    <select value={editForm.role} onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value }))} className={inputClass}>
                                        <option value="user">{t('admin.users.filters.user')}</option>
                                        <option value="admin">{t('admin.users.filters.admin')}</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">{t('admin.users.edit_modal.subscription_status_label')}</label>
                                    <select value={editForm.sub_status} onChange={e => setEditForm(prev => ({ ...prev, sub_status: e.target.value }))} className={inputClass}>
                                        <option value="">{t('admin.users.filters.no_subscription')}</option>
                                        <option value="trial">{t('admin.users.filters.trial')}</option>
                                        <option value="active">{t('admin.users.filters.active')}</option>
                                        <option value="expired">{t('admin.users.filters.expired')}</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">{t('admin.users.edit_modal.subscription_end_date_label')}</label>
                                    <input type="date" value={editForm.sub_end_date} onChange={e => setEditForm(prev => ({ ...prev, sub_end_date: e.target.value }))} className={inputClass} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">{t('admin.users.edit_modal.new_password_label')}</label>
                                    <input type="password" value={editForm.password} onChange={e => setEditForm(prev => ({ ...prev, password: e.target.value }))} placeholder={t('admin.users.edit_modal.password_placeholder')} className={inputClass} />
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end pt-2 border-t border-border">
                                <button onClick={closeEdit} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-accent/10 transition-colors">
                                    {t('common.cancel')}
                                </button>
                                <button onClick={saveEdit} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50" style={{ backgroundColor: 'var(--accent)', color: '#000' }}>
                                    <Check className="w-3 h-3" />
                                    {saving ? t('common.loading') : t('common.save')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create User Overlay */}
                {showCreate && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md flex flex-col gap-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold font-heading">
                                    {t('admin.users.create_modal.title_1')} <span className="text-accent">{t('admin.users.create_modal.title_2')}</span>
                                </h2>
                                <button onClick={closeCreate} className="p-1.5 rounded-lg hover:bg-accent/10 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">{t('admin.users.create_modal.name_label')}</label>
                                    <input
                                        value={createForm.name}
                                        onChange={e => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder={t('admin.users.create_modal.name_placeholder')}
                                        className={inputClass}
                                    />
                                    {createErrors.name && <p className="text-xs text-destructive">{createErrors.name}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">{t('admin.users.create_modal.email_label')}</label>
                                    <input
                                        type="email"
                                        value={createForm.email}
                                        onChange={e => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder={t('admin.users.create_modal.email_placeholder')}
                                        className={inputClass}
                                    />
                                    {createErrors.email && <p className="text-xs text-destructive">{createErrors.email}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">{t('admin.users.create_modal.role_label')}</label>
                                    <select
                                        value={createForm.role}
                                        onChange={e => setCreateForm(prev => ({ ...prev, role: e.target.value }))}
                                        className={inputClass}
                                    >
                                        <option value="user">{t('admin.users.filters.user')}</option>
                                        <option value="admin">{t('admin.users.filters.admin')}</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">{t('admin.users.create_modal.password_label')}</label>
                                    <input
                                        type="password"
                                        value={createForm.password}
                                        onChange={e => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                                        placeholder={t('admin.users.create_modal.password_placeholder')}
                                        className={inputClass}
                                    />
                                    {createErrors.password && <p className="text-xs text-destructive">{createErrors.password}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">{t('admin.users.create_modal.confirm_password_label')}</label>
                                    <input
                                        type="password"
                                        value={createForm.password_confirmation}
                                        onChange={e => setCreateForm(prev => ({ ...prev, password_confirmation: e.target.value }))}
                                        placeholder={t('admin.users.create_modal.confirm_password_placeholder')}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end pt-2 border-t border-border">
                                <button onClick={closeCreate} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-accent/10 transition-colors">
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={saveCreate}
                                    disabled={creating}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
                                    style={{ backgroundColor: 'var(--accent)', color: '#000' }}
                                >
                                    <UserPlus className="w-3 h-3" />
                                    {creating ? t('common.loading') : t('admin.users.create_modal.create_button')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}