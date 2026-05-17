<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlanSection extends Model
{
    protected $fillable = [
        'section_name',
        'input_json',
        'generated_text',
        'chart_data',
        'validation_status',
        'edited',
        'business_plan_id',
    ];

    protected $casts=[
        'input_json' => 'array',
        'chart_data' => 'array',
    ];

    public function businessPlan(){
        return $this->belongsTo(BusinessPlan::class);
    }
}
