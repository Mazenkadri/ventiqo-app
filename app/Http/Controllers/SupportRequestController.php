<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\SupportRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupportRequestController extends Controller
{
    public function store(Request $request){
        $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
        ]);
        $request->user()->supportRequests()->create([
            'subject' => $request->subject,
            'message' => $request->message,
        ]);
        return redirect()->route('support');
    }

    public function index(Request $request){
        $supportRequests = $request->user()->supportRequests;
        return response()->json($supportRequests, 200);
    }

    public function indexPage(Request $request){
        $requests = $request->user()->supportRequests;
        return Inertia::render('Support/Index', [
            'requests' => $requests,
        ]);
    }
}
