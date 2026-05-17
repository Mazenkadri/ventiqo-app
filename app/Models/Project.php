<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $fillable = [
       'name',
       'start_date',
       'end_date',
       'company_id',
    ];

    public function company(){
        return $this->belongsTo(Company::class);
    }

    public function businessPlan(){
        return $this->hasOne(BusinessPlan::class);
    }
}
