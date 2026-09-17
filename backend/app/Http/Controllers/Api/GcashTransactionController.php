<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GcashTransaction;
use App\Services\GcashFeeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GcashTransactionController extends Controller
{
    /**
     * Get paginated GCash transactions with filters and summary statistics.
     */
    public function index(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $query = GcashTransaction::with(['user:user_id,name,email,role'])
            ->where('store_id', $storeId);

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('customer_phone', 'LIKE', "%{$search}%")
                    ->orWhere('customer_name', 'LIKE', "%{$search}%")
                    ->orWhere('reference_number', 'LIKE', "%{$search}%");
            });
        }

        if ($request->filled('transaction_type') && $request->input('transaction_type') !== 'all') {
            $query->where('transaction_type', $request->input('transaction_type'));
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->input('date'));
        }

        // Summary totals calculation for current filters (before pagination)
        $summaryQuery = clone $query;
        $totalCashIn = (clone $summaryQuery)
            ->where('transaction_type', 'cash_in')
            ->where('status', 'completed')
            ->sum('amount');

        $totalCashOut = (clone $summaryQuery)
            ->where('transaction_type', 'cash_out')
            ->where('status', 'completed')
            ->sum('amount');

        $totalFees = (clone $summaryQuery)
            ->where('status', 'completed')
            ->sum('fee');

        $perPage = (int) $request->input('per_page', 20);
        $transactions = $query->latest('created_at')->paginate($perPage);

        return response()->json([
            'data' => $transactions->items(),
            'pagination' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
            'summary' => [
                'total_cash_in_volume' => (float) $totalCashIn,
                'total_cash_out_volume' => (float) $totalCashOut,
                'total_fees_earned' => (float) $totalFees,
                'total_count' => $transactions->total(),
            ],
        ]);
    }

    /**
     * Record a new GCash Cash In or Cash Out transaction.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $storeId = $user->store_id;

        $validated = $request->validate([
            'transaction_type' => 'required|in:cash_in,cash_out',
            'customer_phone' => ['required', 'string', 'regex:/^09[0-9]{9}$/'],
            'customer_name' => 'nullable|string|max:150',
            'amount' => 'required|numeric|min:1',
            'fee' => 'nullable|numeric|min:0',
            'reference_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ], [
            'customer_phone.regex' => 'The GCash mobile number must be exactly 11 digits starting with 09 (e.g. 09171234567).',
        ]);

        $amount = (float) $validated['amount'];
        $fee = isset($validated['fee']) && $validated['fee'] !== ''
            ? (float) $validated['fee']
            : GcashFeeService::calculateFee($amount);

        // For cash_in: customer pays amount + fee in cash
        // For cash_out: principal cash handed to customer, fee collected or deducted
        $totalAmount = $validated['transaction_type'] === 'cash_in'
            ? $amount + $fee
            : $amount;

        $transaction = GcashTransaction::create([
            'store_id' => $storeId,
            'user_id' => $user->user_id,
            'transaction_type' => $validated['transaction_type'],
            'customer_name' => $validated['customer_name'] ?? null,
            'customer_phone' => $validated['customer_phone'],
            'amount' => $amount,
            'fee' => $fee,
            'total_amount' => $totalAmount,
            'reference_number' => $validated['reference_number'] ?? null,
            'status' => 'completed',
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'GCash transaction completed successfully',
            'transaction' => $transaction->load('user:user_id,name,email,role'),
        ], 201);
    }

    /**
     * Return the standard rate tiers.
     */
    public function rates(): JsonResponse
    {
        return response()->json([
            'rates' => GcashFeeService::getRates(),
        ]);
    }

    /**
     * Show single GCash transaction details.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $transaction = GcashTransaction::with(['user:user_id,name,email,role', 'store'])
            ->where('store_id', $storeId)
            ->findOrFail($id);

        return response()->json($transaction);
    }

    /**
     * Void / cancel an existing GCash transaction.
     */
    public function voidTransaction(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $storeId = $user->store_id;

        $validated = $request->validate([
            'reason' => 'required|string|max:255',
            'notes' => 'nullable|string|max:500',
        ]);

        $transaction = GcashTransaction::where('store_id', $storeId)->findOrFail($id);

        if (in_array($transaction->status, ['cancelled', 'voided'])) {
            return response()->json([
                'message' => 'This GCash transaction has already been voided.',
            ], 422);
        }

        $now = \Illuminate\Support\Carbon::now();
        $reason = $validated['reason'];
        $notes = $validated['notes'] ?? '';
        $voidNotice = "[VOIDED on {$now->toDateTimeString()} by {$user->name}: {$reason}" . ($notes ? " - {$notes}" : "") . "]";

        $transaction->status = 'voided';
        $transaction->notes = $transaction->notes ? $transaction->notes . "\n" . $voidNotice : $voidNotice;
        $transaction->save();

        return response()->json([
            'message' => 'GCash transaction voided successfully.',
            'transaction' => $transaction->load('user:user_id,name,email,role'),
        ]);
    }
}
