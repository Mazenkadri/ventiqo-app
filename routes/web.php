<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\BusinessPlanController;
use App\Http\Controllers\SupportRequestController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\PlanSectionController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\Auth\VerificationCodeController;
use App\Http\Controllers\StripeController;

Route::post('stripe/webhook', [StripeController::class, 'webhook'])->name('stripe.webhook');
Route::get('stripe/success', [StripeController::class, 'success'])->name('stripe.success');

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Password reset — no auth needed
Route::post('password/send-code', [VerificationCodeController::class, 'sendResetCode'])->name('password.send.code');
Route::post('password/reset-code', [VerificationCodeController::class, 'resetPassword'])->name('password.reset.code');

Route::middleware('auth')->group(function () {

    // Email verification code routes — auth but not verified
    Route::post('verification/send', [VerificationCodeController::class, 'sendVerification'])->name('verification.send.code');
    Route::post('verification/verify', [VerificationCodeController::class, 'verifyAccount'])->name('verification.verify.code');

    Route::middleware(['verified', 'subscribed'])->group(function () {

        Route::get('dashboard', function () {
            $user = request()->user();
            if ($user->role === 'admin') {
                return redirect()->route('admin.dashboard');
            }
            return Inertia::render('dashboard', [
                'stats' => [
                    'total_companies' => $user->companies()->count(),
                    'total_projects' => $user->companies()->withCount('projects')->get()->sum('projects_count'),
                    'support_requests' => $user->supportRequests()->count(),
                ],
                'subscription' => $user->subscription,
                'recent_projects' => $user->companies()
                    ->with(['projects' => fn($q) => $q->latest()->limit(4)])
                    ->get()
                    ->pluck('projects')
                    ->flatten()
                    ->take(4)
                    ->map(fn($project) => [
                        'id' => $project->id,
                        'name' => $project->name,
                        'start_date' => $project->start_date,
                        'company_name' => $project->company->name,
                        'industry' => $project->company->industry,
                    ]),
            ]);
        })->name('dashboard');

        // Companies
        Route::get('companies', [CompanyController::class, 'indexPage'])->name('companies');
        Route::post('companies', [CompanyController::class, 'store'])->name('companies.store');
        Route::put('companies/{id}', [CompanyController::class, 'update'])->name('companies.update');
        Route::delete('companies/{id}', [CompanyController::class, 'destroy'])->name('companies.destroy');

        // Products
        Route::get('products', [ProductController::class, 'indexPage'])->name('products');
        Route::post('companies/{id}/products', [ProductController::class, 'store'])->name('products.store');
        Route::put('products/{id}', [ProductController::class, 'update'])->name('products.update');
        Route::delete('products/{id}', [ProductController::class, 'destroy'])->name('products.destroy');

        // Projects
        Route::get('projects', [ProjectController::class, 'indexPage'])->name('projects');
        Route::post('companies/{id}/projects', [ProjectController::class, 'store'])->name('projects.store');
        Route::put('projects/{id}', [ProjectController::class, 'update'])->name('projects.update');
        Route::delete('projects/{id}', [ProjectController::class, 'destroy'])->name('projects.destroy');

        // Support
        Route::get('support', [SupportRequestController::class, 'indexPage'])->name('support');
        Route::post('support', [SupportRequestController::class, 'store'])->name('support.store');

        // Subscription
        Route::get('subscription', [SubscriptionController::class, 'indexPage'])->name('subscription');
        Route::post('subscription', [SubscriptionController::class, 'store'])->name('subscription.store');

        // Business Plan
        Route::get('projects/{id}/business-plan', [BusinessPlanController::class, 'showPage'])->name('projects.business-plan');
        Route::post('projects/{id}/business-plan', [BusinessPlanController::class, 'store'])->name('business-plan.store');
        Route::post('business-plans/{id}/sections', [PlanSectionController::class, 'store'])->name('sections.store');
        Route::put('sections/{id}', [PlanSectionController::class, 'update'])->name('sections.update');
        Route::get('business-plans/{id}/result', [BusinessPlanController::class, 'resultPage'])->name('business-plan.result');
        Route::get('business-plans/{id}/export', [BusinessPlanController::class, 'export'])->name('business-plan.export');
        Route::get('/business-plans/{id}/export-bmc', [BusinessPlanController::class, 'exportBmc'])->name('business-plan.export-bmc');

        // Stripe
        Route::post('stripe/checkout', [StripeController::class, 'checkout'])->name('stripe.checkout');
        
        // Admin
        Route::middleware('admin')->group(function () {
            Route::get('admin/dashboard', [AdminController::class, 'dashboard'])->name('admin.dashboard');
            Route::get('admin/users', [AdminController::class, 'usersPage'])->name('admin.users');
            Route::get('admin/support', [AdminController::class, 'supportPage'])->name('admin.support');
            Route::get('admin/business-plans', [AdminController::class, 'businessPlansPage'])->name('admin.plans');
            Route::delete('admin/users/{id}', [AdminController::class, 'deleteUser'])->name('admin.users.delete');
            Route::put('admin/users/{id}', [AdminController::class, 'updateUser'])->name('admin.users.update');
            Route::put('admin/support/{id}/reply', [AdminController::class, 'replyToSupportRequest'])->name('admin.support.reply');
            Route::put('admin/support/{id}/status', [AdminController::class, 'updateSupportRequestStatus'])->name('admin.support.status');
            Route::post('admin/users', [AdminController::class, 'createUser'])->name('admin.users.create');
        });

    });

});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';