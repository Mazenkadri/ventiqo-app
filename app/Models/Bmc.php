<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bmc extends Model
{
    protected $table = 'bmc';
    
    protected $fillable = [
        'key_partners',
        'key_activities',
        'value_propositions',
        'customer_relationships',
        'customer_segments',
        'key_resources',
        'channels',
        'cost',
        'revenue_streams',
        'business_plan_id',
    ];

    public function businessPlan(){
        return $this->belongsTo(BusinessPlan::class);
    }
}