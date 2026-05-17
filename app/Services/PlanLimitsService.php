<?php

namespace App\Services;

use App\Models\User;
use App\Models\BusinessPlan;

class PlanLimitsService
{
    public function getPlanType(User $user): string
    {
        $sub = $user->subscription;
        if (!$sub || $sub->status === 'expired') return 'none';
        return $sub->plan_type ?? 'free';
    }

    public function canGenerateBp(User $user): bool
    {
        $plan = $this->getPlanType($user);
        if ($plan === 'none') return false;
        if ($plan === 'unlimited') return true;

        $limit = $plan === 'basic' ? 5 : 3;

        // Only count BPs where generation was actually started (plan_sections row exists).
        // Shell BPs created at project init have zero plan_sections rows and must not count.
        $count = BusinessPlan::whereHas('project.company', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })
        ->whereHas('planSections')
        ->where('created_at', '>=', now()->startOfWeek())
        ->count();

        return $count < $limit;
    }

    public function weeklyBpCount(User $user): int
    {
        // Only count BPs where generation was actually started (plan_sections row exists).
        // Shell BPs created at project init have zero plan_sections rows and must not count.
        return BusinessPlan::whereHas('project.company', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })
        ->whereHas('planSections')
        ->where('created_at', '>=', now()->startOfWeek())
        ->count();
    }

    public function weeklyBpLimit(User $user): int|string
    {
        $plan = $this->getPlanType($user);
        if ($plan === 'unlimited') return 'unlimited';
        if ($plan === 'basic') return 5;
        return 3;
    }

    public function canExportBmc(User $user): bool
    {
        $plan = $this->getPlanType($user);
        return in_array($plan, ['basic', 'unlimited']);
    }

    public function getAllowedTemplates(User $user): array
    {
        $plan = $this->getPlanType($user);
        if (in_array($plan, ['basic', 'unlimited'])) return [1, 2, 3, 4];
        return [1];
    }

    public function canUseTemplate(User $user, int $template): bool
    {
        return in_array($template, $this->getAllowedTemplates($user));
    }
}