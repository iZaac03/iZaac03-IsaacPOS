<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Refund;
use App\Models\RefundItem;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Exception;

class RefundService
{
    public const APPROVAL_THRESHOLD = 1000.00;

    /**
     * Process partial or full refund request.
     */
    public function processRefund(array $data, int $userId, int $storeId, ?int $approverId = null): Refund
    {
        return DB::transaction(function () use ($data, $userId, $storeId, $approverId) {
            $orderId = $data['order_id'];
            $items = $data['items'] ?? [];
            $reasonCode = $data['reason_code'];
            $notes = $data['notes'] ?? null;

            $order = Order::where('order_id', $orderId)
                ->where('store_id', $storeId)
                ->lockForUpdate()
                ->firstOrFail();

            if ($order->payment_status === 'refunded') {
                throw new Exception('This order has already been fully refunded.');
            }

            if (empty($items)) {
                throw new Exception('Please select at least one item to refund.');
            }

            $totalRefundAmount = 0.00;
            $refundLineCalculations = [];

            foreach ($items as $itemData) {
                $orderItemId = $itemData['order_item_id'];
                $quantityToRefund = (float)$itemData['quantity'];
                $restock = (bool)($itemData['restock_item'] ?? true);

                $orderItem = OrderItem::where('order_item_id', $orderItemId)
                    ->where('order_id', $orderId)
                    ->firstOrFail();

                // Check already refunded quantity for this item
                $alreadyRefundedQty = (float)RefundItem::where('order_item_id', $orderItemId)
                    ->whereHas('refund', function ($q) {
                        $q->whereIn('status', ['approved', 'completed']);
                    })
                    ->sum('quantity');

                $refundableQty = (float)$orderItem->quantity - $alreadyRefundedQty;

                if ($quantityToRefund <= 0 || $quantityToRefund > $refundableQty) {
                    throw new Exception("Invalid refund quantity for {$orderItem->product_name}. Maximum refundable: {$refundableQty}");
                }

                // Calculate item refund amount proportional to unit price
                $itemRefundAmount = round($quantityToRefund * (float)$orderItem->unit_price, 2);
                $totalRefundAmount += $itemRefundAmount;

                $refundLineCalculations[] = [
                    'order_item' => $orderItem,
                    'quantity' => $quantityToRefund,
                    'unit_price' => (float)$orderItem->unit_price,
                    'refund_amount' => $itemRefundAmount,
                    'restock_item' => $restock,
                ];
            }

            // High-value refund approval check
            $requiresApproval = ($totalRefundAmount >= self::APPROVAL_THRESHOLD) && empty($approverId);
            $status = $requiresApproval ? 'pending' : 'completed';

            $today = date('Ymd');
            $refundCount = Refund::whereDate('created_at', today())->count() + 1;
            $refundNumber = sprintf('REF-%s-%04d', $today, $refundCount);

            $refund = Refund::create([
                'refund_number' => $refundNumber,
                'order_id' => $orderId,
                'store_id' => $storeId,
                'user_id' => $userId,
                'approved_by' => $approverId,
                'total_amount' => $totalRefundAmount,
                'reason_code' => $reasonCode,
                'requires_approval' => $requiresApproval,
                'status' => $status,
                'notes' => $notes,
            ]);

            foreach ($refundLineCalculations as $line) {
                RefundItem::create([
                    'refund_id' => $refund->refund_id,
                    'order_item_id' => $line['order_item']->order_item_id,
                    'product_id' => $line['order_item']->product_id,
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                    'refund_amount' => $line['refund_amount'],
                    'restock_item' => $line['restock_item'],
                ]);

                // If completed immediately, restock inventory
                if ($status === 'completed' && $line['restock_item']) {
                    $product = Product::where('product_id', $line['order_item']->product_id)
                        ->lockForUpdate()
                        ->first();

                    if ($product) {
                        $prevQty = (float)$product->stock_quantity;
                        $newQty = round($prevQty + $line['quantity'], 2);
                        $product->stock_quantity = $newQty;
                        $product->save();

                        StockMovement::create([
                            'product_id' => $product->product_id,
                            'store_id' => $storeId,
                            'user_id' => $userId,
                            'type' => 'refund',
                            'quantity_change' => $line['quantity'],
                            'previous_quantity' => $prevQty,
                            'new_quantity' => $newQty,
                            'reference_type' => 'refund',
                            'reference_id' => $refund->refund_id,
                            'reason' => "Refund {$refund->refund_number} ({$reasonCode})",
                            'notes' => "Restocked {$line['quantity']} {$product->unit}",
                        ]);
                    }
                }
            }

            if ($status === 'completed') {
                // Check if full or partial refund
                $totalRefundedOnOrder = (float)Refund::where('order_id', $orderId)
                    ->whereIn('status', ['approved', 'completed'])
                    ->sum('total_amount');

                if ($totalRefundedOnOrder >= (float)$order->total_amount) {
                    $order->payment_status = 'refunded';
                } else {
                    $order->payment_status = 'partially_refunded';
                }
                $order->save();
            }

            return $refund->load(['items.product', 'order', 'user', 'approver']);
        });
    }

    /**
     * Approve a pending high-value refund by Manager / Admin.
     */
    public function approveRefund(int $refundId, int $approverId, int $storeId): Refund
    {
        return DB::transaction(function () use ($refundId, $approverId, $storeId) {
            $refund = Refund::with('items')->where('refund_id', $refundId)
                ->where('store_id', $storeId)
                ->lockForUpdate()
                ->firstOrFail();

            if ($refund->status !== 'pending') {
                throw new Exception("Refund {$refund->refund_number} is already {$refund->status}.");
            }

            $refund->status = 'completed';
            $refund->approved_by = $approverId;
            $refund->save();

            // Execute restock for approved items
            foreach ($refund->items as $item) {
                if ($item->restock_item) {
                    $product = Product::where('product_id', $item->product_id)->lockForUpdate()->first();
                    if ($product) {
                        $prevQty = (float)$product->stock_quantity;
                        $newQty = round($prevQty + (float)$item->quantity, 2);
                        $product->stock_quantity = $newQty;
                        $product->save();

                        StockMovement::create([
                            'product_id' => $product->product_id,
                            'store_id' => $storeId,
                            'user_id' => $approverId,
                            'type' => 'refund',
                            'quantity_change' => (float)$item->quantity,
                            'previous_quantity' => $prevQty,
                            'new_quantity' => $newQty,
                            'reference_type' => 'refund',
                            'reference_id' => $refund->refund_id,
                            'reason' => "Approved Refund {$refund->refund_number}",
                            'notes' => "Restocked {$item->quantity} {$product->unit}",
                        ]);
                    }
                }
            }

            $order = Order::find($refund->order_id);
            $totalRefunded = (float)Refund::where('order_id', $order->order_id)
                ->where('status', 'completed')
                ->sum('total_amount');

            if ($totalRefunded >= (float)$order->total_amount) {
                $order->payment_status = 'refunded';
            } else {
                $order->payment_status = 'partially_refunded';
            }
            $order->save();

            return $refund->load(['items.product', 'order', 'approver']);
        });
    }
}
