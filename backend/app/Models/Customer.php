<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $table = 'tbl_customers';
    protected $primaryKey = 'customer_id';

    protected $fillable = [
        'store_id',
        'name',
        'phone',
        'email',
        'senior_pwd_id',
        'address',
        'loyalty_points',
        'is_active',
    ];

    protected $casts = [
        'loyalty_points' => 'integer',
        'is_active' => 'boolean',
    ];

    public function store()
    {
        return $this->belongsTo(Store::class, 'store_id', 'store_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'customer_id', 'customer_id');
    }
}
