<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupportRequest extends Model
{
    protected $fillable = [
        'subject',
        'message',
        'status',
        'admin_reply',
        'user_id',
    ];

    public function user(){
        return $this->belongsTo(User::class);
    }
}
