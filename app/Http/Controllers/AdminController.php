<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\SupportRequest;
use App\Models\BusinessPlan;
use Inertia\Inertia;
use App\Models\PlanSection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class AdminController extends Controller
{
    public function getUsers(Request $request){
        $users = User::with('subscription')->get();
        return response()->json($users, 200);
    }

    public function deleteUser($id){
        $user = User::find($id);
        if(!$user){
            abort(404, 'User not found');
        }
        $user->delete();
        return redirect()->route('admin.users')->with('success', 'User deleted successfully');
    }

    public function createUser(Request $request){
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role'     => 'sometimes|in:user,admin',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $request->role ?? 'user',
        ]);

        $user->subscription()->create([
            'status' => 'trial',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(30)->toDateString(),
        ]);

        return response()->json($user, 201);
    }
    public function getSupportRequests(){
        $requests = SupportRequest::with('user')->get();
        return response()->json($requests, 200);
    }

    public function replyToSupportRequest(Request $request, $id){
        $supportRequest = SupportRequest::find($id);
        if(!$supportRequest){
            return response()->json(['message' => 'Support request not found'], 404);
        }
        $request->validate([
            'admin_reply' => 'required|string',
        ]);
        $supportRequest->admin_reply = $request->input('admin_reply');
        $supportRequest->status = 'in_progress';
        $supportRequest->save();
        return response()->json($supportRequest, 200);
    }

    public function getBusinessPlans(){
        $plans = BusinessPlan::with('planSections')->get();
        return response()->json($plans, 200);
    }

    public function getStats(){
        return response()->json([
            'total_users' => User::count(),
            'active_subscriptions' => User::whereHas('subscription', function($q){
                $q->where('status', 'active');
            })->count(),
            'total_support_requests' => SupportRequest::count(),
            'total_business_plans' => BusinessPlan::count(),
            'average_plan_sections' => BusinessPlan::withCount('planSections')->get()->avg('plan_sections_count'),
        ], 200);
    }

    public function updateUser(Request $request, $id){
        $user = User::find($id);
        if(!$user){
            return response()->json(['message' => 'User not found'], 404);
        }
        $request->validate([
            'name'             => 'sometimes|string|max:255',
            'email'            => 'sometimes|email|unique:users,email,' . $id,
            'role'             => 'sometimes|in:user,admin',
            'password'         => 'sometimes|nullable|string|min:8',
            'sub_status'       => 'sometimes|in:trial,active,expired',
            'sub_end_date'     => 'sometimes|nullable|date',
        ]);

        // Update user fields
        $userData = $request->only(['name', 'email', 'role']);
        if ($request->filled('password')) {
            $userData['password'] = bcrypt($request->password);
        }
        $user->update($userData);

        // Update or create subscription
        if ($request->has('sub_status')) {
            $user->subscription()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'status'   => $request->sub_status,
                    'end_date' => $request->sub_end_date,
                    'start_date' => $user->subscription?->start_date ?? now(),
                ]
            );
        }

        return response()->json($user->load('subscription'), 200);
    }

    public function updateSupportRequestStatus(Request $request, $id){
        $supportRequest = SupportRequest::find($id);
        if(!$supportRequest){
            return response()->json(['message' => 'Support request not found'], 404);
        }
        $request->validate([
            'status' => 'required|in:in_progress,solved',
        ]);
        $supportRequest->status = $request->input('status');
        $supportRequest->save();
        return response()->json($supportRequest, 200);
    }

    public function dashboard(Request $request)
    {
        // Plans per month (last 6 months)
        $plansPerMonth = BusinessPlan::selectRaw('DATE_FORMAT(created_at, "%b %Y") as month, COUNT(*) as count')
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('month')
            ->orderByRaw('MIN(created_at)')
            ->get();

        // Section success vs failure rate
        $sectionStats = PlanSection::selectRaw('validation_status, COUNT(*) as count')
            ->groupBy('validation_status')
            ->get()
            ->keyBy('validation_status');

        // Users per month (last 6 months)
        $usersPerMonth = User::selectRaw('DATE_FORMAT(created_at, "%b %Y") as month, COUNT(*) as count')
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('month')
            ->orderByRaw('MIN(created_at)')
            ->get();

        // Subscription breakdown
        $subscriptionStats = \App\Models\Subscription::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_users'          => User::count(),
                'active_subscriptions' => \App\Models\Subscription::where('status', 'active')->count(),
                'total_plans'          => BusinessPlan::count(),
                'failed_sections'      => PlanSection::where('validation_status', 'failed')->count(),
                'support_requests'     => SupportRequest::count(),
                'in_progress_requests' => SupportRequest::where('status', 'in_progress')->count(),
                'total_tokens'         => BusinessPlan::sum('total_tokens'),
                'avg_tokens_per_plan'  => (int) BusinessPlan::where('total_tokens', '>', 0)->avg('total_tokens'),
            ],
            'charts' => [
                'plans_per_month' => $plansPerMonth,
                'section_stats' => $sectionStats,
                'users_per_month' => $usersPerMonth,
                'subscription_stats' => $subscriptionStats,
                'tokens_per_month'  => BusinessPlan::selectRaw('DATE_FORMAT(created_at, "%b %Y") as month, SUM(total_tokens) as tokens')
                                        ->where('created_at', '>=', now()->subMonths(6))
                                        ->where('total_tokens', '>', 0)
                                        ->groupBy('month')
                                        ->orderByRaw('MIN(created_at)')
                                        ->get(),
                'tokens_per_section' => PlanSection::selectRaw('section_name, AVG(tokens_total) as avg_tokens')
                                        ->where('tokens_total', '>', 0)
                                        ->groupBy('section_name')
                                        ->orderByRaw('AVG(tokens_total) DESC')
                                        ->get(),
                'most_active_users' => BusinessPlan::selectRaw('
                                            users.name,
                                            users.email,
                                            COUNT(business_plans.id) as total_plans
                                        ')
                                        ->join('projects', 'business_plans.project_id', '=', 'projects.id')
                                        ->join('companies', 'projects.company_id', '=', 'companies.id')
                                        ->join('users', 'companies.user_id', '=', 'users.id')
                                        ->groupBy('users.id', 'users.name', 'users.email')
                                        ->orderByDesc('total_plans')
                                        ->limit(10)
                                        ->get(),

                                    'plans_per_user_distribution' => collect([
                                        '1 plan'  => BusinessPlan::selectRaw('companies.user_id')
                                                        ->join('projects', 'business_plans.project_id', '=', 'projects.id')
                                                        ->join('companies', 'projects.company_id', '=', 'companies.id')
                                                        ->groupBy('companies.user_id')
                                                        ->havingRaw('COUNT(business_plans.id) = 1')
                                                        ->get()->count(),
                                        '2 plans' => BusinessPlan::selectRaw('companies.user_id')
                                                        ->join('projects', 'business_plans.project_id', '=', 'projects.id')
                                                        ->join('companies', 'projects.company_id', '=', 'companies.id')
                                                        ->groupBy('companies.user_id')
                                                        ->havingRaw('COUNT(business_plans.id) = 2')
                                                        ->get()->count(),
                                        '3+ plans' => BusinessPlan::selectRaw('companies.user_id')
                                                        ->join('projects', 'business_plans.project_id', '=', 'projects.id')
                                                        ->join('companies', 'projects.company_id', '=', 'companies.id')
                                                        ->groupBy('companies.user_id')
                                                        ->havingRaw('COUNT(business_plans.id) >= 3')
                                                        ->get()->count(),
                                    ])->map(fn($count, $label) => ['label' => $label, 'count' => $count])->values(),

                                    'language_distribution' => BusinessPlan::selectRaw('language, COUNT(*) as count')
                                                        ->groupBy('language')
                                                        ->get(),
            ],
        ]);
    }

    public function usersPage(Request $request)
    {
        $users = User::with('subscription')->latest()->get();
        return Inertia::render('Admin/Users', [
            'users' => $users,
        ]);
    }

    public function supportPage(Request $request)
    {
        $requests = SupportRequest::with('user')->latest()->get();
        return Inertia::render('Admin/Support', [
            'requests' => $requests,
        ]);
    }

    public function businessPlansPage(Request $request)
    {
        $plans = BusinessPlan::with(['planSections', 'project.company.user'])
            ->latest()
            ->get();
        return Inertia::render('Admin/BusinessPlans', [
            'plans' => $plans,
        ]);
    }
}
