<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Company;
use App\Models\Project;
use Inertia\Inertia;


class ProjectController extends Controller
{
    public function index(Request $request, $id){
        $company = Company::find($id);
        if (!$company || $company->user_id !== $request->user()->id){
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return response()->json($company->projects);
    }

    public function store(Request $request){
        $request->validate([
            'name' => 'required|string|max:255',
            'company_id' => 'required|exists:companies,id',
            'start_date' => 'required|date',
        ]);
        $company = Company::find($request->company_id);
        if (!$company || $company->user_id !== $request->user()->id) {
            abort(403);
        }
        $company->projects()->create([
            'name' => $request->name,
            'start_date' => $request->start_date,
        ]);
        return redirect()->route('projects');
    }

    public function update(Request $request, $id){
        $project = Project::find($id);
        if (!$project || $project->company->user_id !== $request->user()->id) {
            abort(403);
        }
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'start_date' => 'sometimes|date',
        ]);
        $project->update([
            'name' => $request->input('name', $project->name),
            'start_date' => $request->input('start_date', $project->start_date),
        ]);
        return redirect()->route('projects');
    }

    public function destroy(Request $request, $id){
        $project = Project::find($id);
        if (!$project || $project->company->user_id !== $request->user()->id) {
            abort(403);
        }
        $project->delete();
        return redirect()->route('projects');
    }

    public function indexPage(Request $request){
        $companies = $request->user()->companies()->with([
            'projects.businessPlan.planSections'
        ])->get();
        
        return Inertia::render('Projects/Index', [
            'companies' => $companies,
        ]);
    }
}