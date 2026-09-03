<?php

namespace App\Services;

use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Exception;

class PurchaseOrderService
{
    /**
     * Create a new purchase order in draft status.
     */
    public function createPO(array $data, int $userId, int $storeId): PurchaseOrder
    {
        return DB::transaction(function () use ($data, $userId, $storeId) {
            $today = date('Ymd');
            $count = PurchaseOrder::whereDate('created_at', today())->count() + 1;
            $poNumber = sprintf('PO-%s-%04d', $today, $count);

            $totalAmount = 0.00;
            $itemsData = $data['items'] ?? [];

            foreach ($itemsData as $item) {
                $totalAmount += round((float)$item['quantity_ordered'] * (float)$item['unit_cost'], 2);
            }

            $po = PurchaseOrder::create([
                'po_number' => $poNumber,
                'store_id' => $storeId,
                'supplier_id' => $data['supplier_id'],
                'user_id' => $userId,
                'status' => 'draft',
                'total_amount' => $totalAmount,
                'expected_delivery_date' => $data['expected_delivery_date'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($itemsData as $item) {
                $qty = (float)$item['quantity_ordered'];
                $cost = (float)$item['unit_cost'];
                PurchaseOrderItem::create([
                    'po_id' => $po->po_id,
                    'product_id' => $item['product_id'],
                    'quantity_ordered' => $qty,
                    'quantity_received' => 0.00,
                    'unit_cost' => $cost,
                    'total_cost' => round($qty * $cost, 2),
                ]);
            }

            return $po->load(['items.product', 'supplier', 'user']);
        });
    }

    /**
     * Receive goods for a purchase order, increment product stock, and log stock movement.
     */
    public function receiveGoods(int $poId, array $receivedItems, int $userId, int $storeId): PurchaseOrder
    {
        return DB::transaction(function () use ($poId, $receivedItems, $userId, $storeId) {
            $po = PurchaseOrder::with('items')->where('po_id', $poId)
                ->where('store_id', $storeId)
                ->lockForUpdate()
                ->firstOrFail();

            if (in_array($po->status, ['received', 'closed', 'cancelled'])) {
                throw new Exception("Cannot receive items for a PO with status '{$po->status}'.");
            }

            $allCompleted = true;

            foreach ($receivedItems as $rec) {
                $poItemId = $rec['po_item_id'];
                $qtyReceiving = (float)$rec['quantity_receiving'];

                if ($qtyReceiving <= 0) {
                    continue;
                }

                $poItem = PurchaseOrderItem::where('po_item_id', $poItemId)
                    ->where('po_id', $poId)
                    ->firstOrFail();

                $remainingToReceive = (float)$poItem->quantity_ordered - (float)$poItem->quantity_received;

                if ($qtyReceiving > $remainingToReceive) {
                    throw new Exception("Receiving quantity ({$qtyReceiving}) exceeds remaining quantity ordered ({$remainingToReceive}).");
                }

                $poItem->quantity_received = round((float)$poItem->quantity_received + $qtyReceiving, 2);
                $poItem->save();

                // Increment product stock and log movement
                $product = Product::where('product_id', $poItem->product_id)->lockForUpdate()->first();
                if ($product) {
                    $prevQty = (float)$product->stock_quantity;
                    $newQty = round($prevQty + $qtyReceiving, 2);
                    $product->stock_quantity = $newQty;
                    // Optionally update cost price to latest received cost
                    $product->cost_price = $poItem->unit_cost;
                    $product->save();

                    StockMovement::create([
                        'product_id' => $product->product_id,
                        'store_id' => $storeId,
                        'user_id' => $userId,
                        'type' => 'po_receive',
                        'quantity_change' => $qtyReceiving,
                        'previous_quantity' => $prevQty,
                        'new_quantity' => $newQty,
                        'reference_type' => 'purchase_order',
                        'reference_id' => $po->po_id,
                        'reason' => "Received PO {$po->po_number}",
                        'notes' => "Stock in of {$qtyReceiving} {$product->unit} from supplier",
                    ]);
                }
            }

            // Check overall status
            $po->refresh();
            $totalOrdered = $po->items->sum('quantity_ordered');
            $totalReceived = $po->items->sum('quantity_received');

            if ($totalReceived >= $totalOrdered) {
                $po->status = 'received';
            } elseif ($totalReceived > 0) {
                $po->status = 'partially_received';
            }

            $po->save();

            return $po->load(['items.product', 'supplier', 'user']);
        });
    }
}
