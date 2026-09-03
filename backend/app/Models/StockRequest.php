<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockRequest extends Model
{
    use HasFactory;

    protected $table = 'tbl_stock_requests';
    protected $primaryKey = 'request_id';

    protected $fillable = [
        'store_id',
        'product_id',
        'requested_by',
        'requested_quantity',
        'urgency',
        'status',
        'notes',
        'approved_by',
        'po_id',
    ];

    protected $casts = [
        'requested_quantity' => 'decimal:2',
    ];

    public function store()
    {
        return $this->belongsTo(Store::class, 'store_id', 'store_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by', 'user_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by', 'user_id');
    }

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class, 'po_id', 'po_id');
    }
}
