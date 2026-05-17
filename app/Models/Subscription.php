<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    protected $fillable = [
        'start_date',
        'end_date',
        'status',
        'plan_type',
        'user_id',
    ];

    public function user(){
        return $this->belongsTo(User::class);
    }
}
