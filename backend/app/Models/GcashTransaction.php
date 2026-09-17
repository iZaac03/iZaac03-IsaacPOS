<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GcashTransaction extends Model
{
    use HasFactory;

    protected $table = 'tbl_gcash_transactions';
    protected $primaryKey = 'gcash_transaction_id';

    protected $fillable = [
        'store_id',
        'user_id',
        'transaction_type',
        'customer_name',
        'customer_phone',
        'amount',
        'fee',
        'total_amount',
        'reference_number',
        'status',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'fee' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    public function store()
    {
        return $this->belongsTo(Store::class, 'store_id', 'store_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
