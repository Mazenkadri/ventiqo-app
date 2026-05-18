<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Stripe\Stripe;
use Stripe\Customer;
use Stripe\Checkout\Session;
use Stripe\Webhook;

class StripeController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    public function checkout(Request $request)
    {
        $request->validate([
            'plan_type' => 'required|in:basic,unlimited',
        ]);

        $user = $request->user();
        $planType = $request->plan_type;

        $priceId = $planType === 'basic'
            ? config('services.stripe.basic_price_id')
            : config('services.stripe.unlimited_price_id');

        // Create or retrieve Stripe customer
        if (!$user->stripe_customer_id) {
            $customer = Customer::create([
                'email' => $user->email,
                'name'  => $user->name,
                'metadata' => ['user_id' => $user->id],
            ]);
            $user->update(['stripe_customer_id' => $customer->id]);
        }

        // Create Checkout Session
        $session = Session::create([
            'customer'            => $user->stripe_customer_id,
            'payment_method_types' => ['card'],
            'line_items'          => [[
                'price'    => $priceId,
                'quantity' => 1,
            ]],
            'mode'               => 'subscription',
            'success_url'        => route('stripe.success') . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url'         => route('subscription'),
            'metadata'           => [
                'user_id'   => $user->id,
                'plan_type' => $planType,
            ],
            'subscription_data'  => [
                'metadata' => [
                    'user_id'   => $user->id,
                    'plan_type' => $planType,
                ],
            ],
        ]);

        return response()->json(['url' => $session->url]);
    }

    public function success(Request $request)
    {
        return redirect()->route('subscription')->with('success', 'Subscription activated successfully!');
    }

    public function webhook(Request $request)
    {
        $payload   = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $secret    = config('services.stripe.webhook_secret');

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $secret);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }

        match ($event->type) {
            'checkout.session.completed'        => $this->handleCheckoutCompleted($event->data->object),
            'invoice.payment_succeeded'         => $this->handlePaymentSucceeded($event->data->object),
            'customer.subscription.deleted'     => $this->handleSubscriptionCancelled($event->data->object),
            default                             => null,
        };

        return response()->json(['status' => 'ok']);
    }

    private function handleCheckoutCompleted($session): void
    {
        $userId   = $session->metadata->user_id;
        $planType = $session->metadata->plan_type;
        $user     = User::find($userId);

        if (!$user) return;

        $sub = $user->subscription;
        if ($sub) {
            $sub->update([
                'status'     => 'active',
                'plan_type'  => $planType,
                'start_date' => now(),
                'end_date'   => now()->addMonth(),
            ]);
        }

        // Send confirmation email via n8n
        $this->sendConfirmationEmail($user, $planType);
    }

    private function handlePaymentSucceeded($invoice): void
    {
        $customerId = $invoice->customer;
        $user = User::where('stripe_customer_id', $customerId)->first();
        if (!$user) return;

        $sub = $user->subscription;
        if ($sub) {
            $sub->update([
                'status'   => 'active',
                'end_date' => now()->addMonth(),
            ]);
        }
    }

    private function handleSubscriptionCancelled($subscription): void
    {
        $customerId = $subscription->customer;
        $user = User::where('stripe_customer_id', $customerId)->first();
        if (!$user) return;

        $user->subscription?->update(['status' => 'expired']);
    }

    private function sendConfirmationEmail(User $user, string $planType): void
    {
        $planName = $planType === 'basic' ? 'Basic' : 'Unlimited';
        $price    = $planType === 'basic' ? '$19.99' : '$49.99';

        $n8nBase = config('services.n8n.base_url');
        $endpoint = '/webhook/send-email';
        $fullUrl = rtrim($n8nBase, '/') . $endpoint;

        \Illuminate\Support\Facades\Log::error("Attempting to send payment confirmation email to {$user->email} via n8n webhook.", [
            'url'       => $fullUrl,
            'plan_name' => $planName,
            'price'     => $price
        ]);

        try {
            $response = Http::withHeaders([
                    'Content-Type' => 'application/json',
                ])
                ->post($fullUrl, [
                    'to'        => $user->email,
                    'subject'   => 'Welcome to Ventiqo ' . $planName . '!',
                    'type'      => 'subscription',
                    'plan_name' => $planName,
                    'price'     => $price,
                    'code'      => '',
                ]);

            \Illuminate\Support\Facades\Log::error("n8n payment confirmation email response status: {$response->status()}", [
                'url'  => $fullUrl,
                'body' => $response->body()
            ]);

            if (!$response->successful()) {
                \Illuminate\Support\Facades\Log::error("Failed to send payment confirmation email via n8n. HTTP Status: {$response->status()}", [
                    'url'  => $fullUrl,
                    'body' => $response->body()
                ]);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Exception occurred while sending payment confirmation email via n8n.", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}