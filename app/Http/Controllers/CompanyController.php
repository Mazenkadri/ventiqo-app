<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Company;
use Inertia\Inertia;

class CompanyController extends Controller
{
    public function index(Request $request){
        return $request->user()->companies;
    }

    public function store(Request $request){
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:255',
        ]);

        $logoPath = $request->hasFile('logo')
            ? $request->file('logo')->store('logos', 'public')
            : null;

        $request->user()->companies()->create([
            'name' => $request->name,
            'type' => $request->type,
            'address' => $request->address,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
            'fax' => $request->fax,
            'web_site' => $request->web_site,
            'logo_path' => $logoPath,
            'industry' => $request->industry,
        ]);

        return redirect()->route('companies');
    }

    public function update(Request $request, $id){
        $company = Company::find($id);
        if (!$company || $company->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|string|max:255',
        ]);
        $logoPath = $request->hasFile('logo') 
            ? $request->file('logo')->store('logos', 'public')
            : $company->logo_path;

        $company->update([
            'name' => $request->input('name', $company->name),
            'type' => $request->input('type', $company->type),
            'address' => $request->input('address', $company->address),
            'email' => $request->input('email', $company->email),
            'phone_number' => $request->input('phone_number', $company->phone_number),
            'fax' => $request->input('fax', $company->fax),
            'web_site' => $request->input('web_site', $company->web_site),
            'logo_path' => $logoPath,
            'industry' => $request->input('industry', $company->industry),
        ]);

        return redirect()->route('companies');

    }

    public function destroy(Request $request, $id){
        $company = Company::find($id);
        if (!$company || $company->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        if ($company->projects()->count()>0){
            return response()->json(['message' => 'Cannot delete company with active projects'], 422);
        }
        $company->delete();
        return redirect()->route('companies');
    }

    public function indexPage(Request $request){
        $companies = $request->user()->companies;
        return Inertia::render('Companies/Index', [
            'companies' => $companies
        ]);
    }
}
