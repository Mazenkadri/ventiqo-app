import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { FileText, Pencil, Plus, Trash2, RefreshCw, Rocket } from 'lucide-react';

interface PlanSection {
    section_name: string;
    validation_status: string;
}

interface BusinessPlan {
    id: number;
    title: string;
    plan_sections: PlanSection[];
}

interface Project {
    id: number;
    name: string;
    start_date: string;
    end_date: string | null;
    company_id: number;
    business_plan: BusinessPlan | null;
}

interface Company {
    id: number;
    name: string;
    projects: Project[];
}

interface Props {
    companies: Company[];
}

const REQUIRED_SECTIONS = [
    'company_presentation',
    'market_analysis',
    'org_management',
    'strategy',
    'operational_plan',
    'financial_plan',
    'risk_opportunity',
    'appendices',
    'executive_summary',
];

function getPlanStatus(project: Project): 'none' | 'partial' | 'complete' {
    if (!project.business_plan) return 'none';
    const sections = project.business_plan.plan_sections ?? [];
    const completedSections = sections.filter(s => s.validation_status === 'completed').map(s => s.section_name);
    const allComplete = REQUIRED_SECTIONS.every(s => completedSections.includes(s));
    return allComplete ? 'complete' : 'partial';
}

export default function ProjectsIndex({ companies }: Props) {
    const { t } = useTranslation();
    const [showForm, setShowForm] = useState(false);
    const [editingProject, setEditingProject] = useState<Project & { company_name: string } | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('nav.dashboard'), href: '/dashboard' },
        { title: t('projects.title'), href: '/projects' },
    ];

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        start_date: '',
        end_date: '',
        company_id: '',
    });

    const allProjects = (companies ?? []).flatMap(company =>
        (company.projects ?? []).map(project => ({
            ...project,
            company_name: company.name,
        }))
    );

    const openCreate = () => {
        reset();
        setEditingProject(null);
        setShowForm(true);
    };

    const openEdit = (project: Project & { company_name: string }) => {
        setEditingProject(project);
        setData({
            name: project.name,
            start_date: project.start_date,
            end_date: project.end_date || '',
            company_id: project.company_id.toString(),
        });
        setShowForm(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProject) {
            put(route('projects.update', editingProject.id), {
                onSuccess: () => { setShowForm(false); reset(); }
            });
        } else {
            post(route('projects.store', { id: data.company_id }), {
                onSuccess: () => { setShowForm(false); reset(); }
            });
        }
    };

    const deleteProject = (id: number) => {
        if (confirm(t('common.confirm_delete'))) {
            router.delete(route('projects.destroy', id));
        }
    };

    const getStatusBadge = (project: Project) => {
        const status = getPlanStatus(project);
        if (status === 'complete') {
            return (
                <span className="px-2 py-1 rounded-lg text-xs font-medium bg-primary/20 text-primary">
                    {t('projects.plan_complete')}
                </span>
            );
        }
        if (status === 'partial') {
            return (
                <span className="px-2 py-1 rounded-lg text-xs font-medium bg-warning/20 text-warning">
                    {t('projects.plan_in_progress')}
                </span>
            );
        }
        return (
            <span className="px-2 py-1 rounded-lg text-xs font-medium bg-border text-muted-foreground">
                {t('projects.no_plan')}
            </span>
        );
    };

    const renderActions = (project: Project & { company_name: string }) => {
        const status = getPlanStatus(project);

        return (
            <div className="flex gap-2 flex-wrap">
                {/* Edit project */}
                <button
                    onClick={() => openEdit(project)}
                    className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-accent/10 transition-colors"
                >
                    <Pencil className="w-3 h-3" />
                    {t('common.edit')}
                </button>

                {/* Delete project */}
                <button
                    onClick={() => deleteProject(project.id)}
                    className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                >
                    <Trash2 className="w-3 h-3" />
                    {t('common.delete')}
                </button>

                {/* Plan action buttons based on status */}
                {status === 'none' && (
                    <button
                        onClick={() => router.visit(route('projects.business-plan', project.id))}
                        className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg text-black transition-colors"
                        style={{ backgroundColor: 'var(--accent)' }}
                    >
                        <Rocket className="w-3 h-3" />
                        {t('projects.generate_plan')}
                    </button>
                )}

                {status === 'partial' && (
                    <button
                        onClick={() => router.visit(route('projects.business-plan', project.id))}
                        className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-warning/10 text-warning border border-warning/30 hover:bg-warning/20 transition-colors"
                    >
                        <FileText className="w-3 h-3" />
                        {t('projects.continue_plan')}
                    </button>
                )}

                {status === 'complete' && (
                    <>
                        <button
                            onClick={() => router.visit(route('projects.business-plan', project.id))}
                            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-accent/10 transition-colors"
                        >
                            <RefreshCw className="w-3 h-3" />
                            {t('projects.regenerate')}
                        </button>
                        <button
                            onClick={() => router.visit(route('business-plan.result', project.business_plan!.id))}
                            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg text-black transition-colors"
                            style={{ backgroundColor: 'var(--accent)' }}
                        >
                            <FileText className="w-3 h-3" />
                            {t('projects.view_plan')}
                        </button>
                    </>
                )}
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('projects.title')} />
            <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold font-heading">
                        {t('projects.title_1')} <span className="text-accent">{t('projects.title_2')}</span>
                    </h1>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-black hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: 'var(--accent)' }}
                    >
                        <Plus className="w-4 h-4" />
                        {t('projects.add_project')}
                    </button>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                    {allProjects.length === 0 ? (
                        <p className="text-muted-foreground text-sm">{t('projects.no_projects')}</p>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <table className="w-full table-auto border-collapse hidden md:table">
                                <thead>
                                    <tr className="border-b border-border text-left text-sm text-muted-foreground">
                                        <th className="pb-3 font-medium">{t('projects.project_name')}</th>
                                        <th className="pb-3 font-medium">{t('projects.company')}</th>
                                        <th className="pb-3 font-medium">{t('projects.start_date')}</th>
                                        <th className="pb-3 font-medium">{t('projects.status')}</th>
                                        <th className="pb-3 font-medium"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allProjects.map(project => (
                                        <tr key={project.id} className="border-b border-border/50 text-sm">
                                            <td className="py-4 font-medium">{project.name}</td>
                                            <td className="py-4 text-muted-foreground">{project.company_name}</td>
                                            <td className="py-4 text-muted-foreground">{project.start_date}</td>
                                            <td className="py-4">{getStatusBadge(project)}</td>
                                            <td className="py-4">{renderActions(project)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Mobile Cards View */}
                            <div className="grid grid-cols-1 gap-4 md:hidden">
                                {allProjects.map(project => (
                                    <div key={project.id} className="bg-card border border-border/50 rounded-xl p-5 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold font-heading text-base text-foreground">{project.name}</h3>
                                                <p className="text-xs text-muted-foreground mt-0.5">{project.company_name}</p>
                                            </div>
                                            {getStatusBadge(project)}
                                        </div>
                                        
                                        <div className="text-xs text-muted-foreground bg-input/50 p-2.5 rounded-lg border border-border/30 flex justify-between">
                                            <span>{t('projects.start_date')}</span>
                                            <span className="font-medium text-foreground">{project.start_date}</span>
                                        </div>
                                        
                                        <div className="flex gap-2 justify-end mt-2 pt-3 border-t border-border/50">
                                            {renderActions(project)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Create/Edit Form Overlay */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg">
                            <h2 className="text-xl font-bold font-heading mb-6">
                                {editingProject ? t('projects.edit_project') : t('projects.add_project')}
                            </h2>
                            <form onSubmit={submit} className="flex flex-col gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium">{t('projects.company')}</label>
                                        <select
                                            value={data.company_id}
                                            onChange={e => setData('company_id', e.target.value)}
                                            className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent"
                                            required
                                            disabled={!!editingProject}
                                        >
                                            <option value="">{t('projects.select_company')}</option>
                                            {companies.map(company => (
                                                <option key={company.id} value={company.id}>{company.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium">{t('projects.project_name')}</label>
                                        <input
                                            type="text"
                                            value={data.name || ''}
                                            onChange={e => setData({ ...data, name: e.target.value })}
                                            className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                                            required
                                        />
                                        {errors.name && <span className="text-destructive text-xs">{errors.name}</span>}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium">{t('projects.start_date')}</label>
                                        <input
                                            type="date"
                                            value={data.start_date || ''}
                                            onChange={e => setData({ ...data, start_date: e.target.value })}
                                            className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                                            required
                                        />
                                        {errors.start_date && <span className="text-destructive text-xs">{errors.start_date}</span>}
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
                                        className="px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 text-black"
                                        style={{ backgroundColor: 'var(--accent)' }}
                                    >
                                        {t('projects.save_project')}
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