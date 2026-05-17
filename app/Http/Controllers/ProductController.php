<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;
use App\Models\Product;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request, $id){
        $company = Company::find($id);
        if (!$company || $company->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return response()->json($company->products);
    }

    public function store(Request $request, $id){
        $company = Company::find($id);
        if (!$company || $company->user_id !== $request->user()->id) {
            abort(403);
        }
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
        ]);
        $company->products()->create([
            'name' => $request->name,
            'description' => $request->description,
            'price' => $request->price,
            'company_id' => $company->id,
        ]);
        return redirect()->route('products');
    }

    public function update(Request $request, $id){
        $product = Product::find($id);
        if (!$product || $product->company->user_id !== $request->user()->id) {
            abort(403);
        }
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
        ]);
        $product->update([
            'name' => $request->input('name', $product->name),
            'description' => $request->input('description', $product->description),
            'price' => $request->input('price', $product->price),
        ]);
        return redirect()->route('products');
    }

    public function destroy(Request $request, $id){
        $product = Product::find($id);
        if (!$product || $product->company->user_id !== $request->user()->id) {
            abort(403);
        }
        $product->delete();
        return redirect()->route('products');
    }

    public function indexPage(Request $request){
        $companies = $request->user()->companies()->with('products')->get();
        return Inertia::render('Products/Index',[
            'companies' => $companies,
        ]);
    }
}
