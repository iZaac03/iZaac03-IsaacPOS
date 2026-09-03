<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RefundItem extends Model
{
    use HasFactory;

    protected $table = 'tbl_refund_items';
    protected $primaryKey = 'refund_item_id';

    protected $fillable = [
        'refund_id',
        'order_item_id',
        'product_id',
        'quantity',
        'unit_price',
        'refund_amount',
        'restock_item',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'restock_item' => 'boolean',
    ];

    public function refund()
    {
        return $this->belongsTo(Refund::class, 'refund_id', 'refund_id');
    }

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class, 'order_item_id', 'order_item_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }
}
