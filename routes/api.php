<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\BusinessPlanController;
use App\Http\Controllers\PlanSectionController;
use App\Http\Controllers\SupportRequestController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\AdminController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->group(function(){
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/companies', [CompanyController::class, 'index']);
    Route::post('/companies', [CompanyController::class, 'store']);
    Route::put('/companies/{id}', [CompanyController::class, 'update']);
    Route::delete('/companies/{id}', [CompanyController::class, 'destroy']);
    Route::get('/companies/{id}/products', [ProductController::class, 'index']);
    Route::post('/companies/{id}/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    Route::get('/companies/{id}/projects', [ProjectController::class, 'index']);
    Route::post('/companies/{id}/projects', [ProjectController::class, 'store']);
    Route::put('/projects/{id}', [ProjectController::class, 'update']);
    Route::delete('/projects/{id}', [ProjectController::class, 'destroy']);
    Route::post('/projects/{id}/business-plan', [BusinessPlanController::class, 'store']);
    Route::get('/business-plans/{id}', [BusinessPlanController::class, 'show']);
    Route::delete('/business-plans/{id}', [BusinessPlanController::class, 'destroy']);
    Route::post('/business-plans/{id}/sections', [PlanSectionController::class, 'store']);
    Route::put('/plan-sections/{id}', [PlanSectionController::class, 'update']);
    Route::get('/support-requests', [SupportRequestController::class, 'index']);
    Route::post('/support-requests', [SupportRequestController::class, 'store']);
    Route::get('/subscription', [SubscriptionController::class, 'index']);
    Route::post('/subscription', [SubscriptionController::class, 'store']);
});
Route::middleware(['auth:sanctum', 'admin'])->group(function(){
        Route::get('/admin/users', [AdminController::class, 'getUsers']);
        Route::delete('/admin/users/{id}', [AdminController::class, 'deleteUser']);
        Route::put('/admin/users/{id}', [AdminController::class, 'updateUserRole']);
        Route::get('/admin/support-requests', [AdminController::class, 'getSupportRequests']);
        Route::put('/admin/support-requests/{id}/reply', [AdminController::class, 'replyToSupportRequest']);
        Route::put('/admin/support-requests/{id}/status', [AdminController::class, 'updateSupportRequestStatus']);
        Route::get('/admin/business-plans', [AdminController::class, 'getBusinessPlans']);
        Route::get('/admin/stats', [AdminController::class, 'getStats']);
    });
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
