<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    protected $fillable = [
       'name',
       'type',
       'address',
       'email',
       'phone_number',
       'fax',
       'web_site',
       'logo_path',
       'industry',
       'user_id', 
    ];

    public function user(){
        return $this->belongsTo(User::class);
    }
    
    public function products(){
        return $this->hasMany(Product::class);
    }

    public function projects(){
        return $this->hasMany(Project::class);
    }
}
