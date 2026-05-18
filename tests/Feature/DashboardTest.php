<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $this->get('/dashboard')->assertRedirect('/login');
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $user->subscription()->create([
        'status' => 'active',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'plan_type' => 'free',
    ]);

    $this->actingAs($user);

    $this->get('/dashboard')->assertOk();
});