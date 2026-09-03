<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Store extends Model
{
    use HasFactory;

    protected $table = 'tbl_stores';
    protected $primaryKey = 'store_id';

    protected $fillable = [
        'store_name',
        'logo_url',
        'branch_code',
        'address',
        'phone',
        'email',
        'vat_tin',
        'receipt_header',
        'receipt_footer',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function users()
    {
        return $this->hasMany(User::class, 'store_id', 'store_id');
    }

    public function products()
    {
        return $this->hasMany(Product::class, 'store_id', 'store_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'store_id', 'store_id');
    }

    public function suppliers()
    {
        return $this->hasMany(Supplier::class, 'store_id', 'store_id');
    }
}
