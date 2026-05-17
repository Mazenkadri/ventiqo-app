<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusinessPlan extends Model
{
    protected $fillable = [
        'title',
        'language',
        'project_id',
        'total_tokens',
        'total_tokens_input',
        'total_tokens_output',
    ];

    public function project(){
        return $this->belongsTo(Project::class);
    }
    
    public function bmc(){
        return $this->hasOne(Bmc::class);
    }
    public function planSections(){
        return $this->hasMany(PlanSection::class);
    }
}
