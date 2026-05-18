<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;

class VerificationCodeController extends Controller
{
    private function sendCode(User $user, string $type): void
    {
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Store in cache for 10 minutes
        Cache::put("ventiqo_{$type}_code_{$user->id}", $code, now()->addMinutes(10));

        $subject = $type === 'verification'
            ? 'Verify your Ventiqo account'
            : 'Reset your Ventiqo password';

        $n8nBase = config('services.n8n.base_url');
        $endpoint = '/webhook/send-email';
        $fullUrl = rtrim($n8nBase, '/') . $endpoint;

        \Illuminate\Support\Facades\Log::warning("Attempting to send verification email to {$user->email} via n8n webhook.", [
            'url'     => $fullUrl,
            'subject' => $subject,
            'type'    => $type,
            'code'    => $code
        ]);

        try {
            $response = Http::withHeaders([
                    'Content-Type' => 'application/json',
                ])
                ->post($fullUrl, [
                    'to'      => $user->email,
                    'subject' => $subject,
                    'code'    => $code,
                    'type'    => $type,
                ]);

            \Illuminate\Support\Facades\Log::warning("n8n email response status: {$response->status()}", [
                'body' => $response->body()
            ]);

            if (!$response->successful()) {
                \Illuminate\Support\Facades\Log::error("Failed to send email via n8n. HTTP Status: {$response->status()}", [
                    'body' => $response->body()
                ]);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Exception occurred while sending email via n8n.", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    public function sendVerification(Request $request)
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Already verified'], 200);
        }

        $this->sendCode($user, 'verification');

        return response()->json(['message' => 'Code sent'], 200);
    }

    public function sendResetCode(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if ($user) {
            $this->sendCode($user, 'reset');
        }

        return response()->json(['message' => 'Code sent if account exists'], 200);
    }

    public function verifyAccount(Request $request)
    {
        $request->validate(['code' => 'required|string|size:6']);

        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Already verified'], 200);
        }

        $cached = Cache::get("ventiqo_verification_code_{$user->id}");

        if (!$cached || $cached !== $request->code) {
            return response()->json(['message' => 'Invalid or expired code'], 422);
        }

        $user->markEmailAsVerified();
        Cache::forget("ventiqo_verification_code_{$user->id}");

        return response()->json(['message' => 'Verified', 'verified' => true], 200);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email'                 => 'required|email',
            'code'                  => 'required|string|size:6',
            'password'              => 'required|confirmed|min:8',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Invalid or expired code'], 422);
        }

        $cached = Cache::get("ventiqo_reset_code_{$user->id}");

        if (!$cached || $cached !== $request->code) {
            return response()->json(['message' => 'Invalid or expired code'], 422);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        Cache::forget("ventiqo_reset_code_{$user->id}");

        return response()->json(['message' => 'Password reset successfully'], 200);
    }
}