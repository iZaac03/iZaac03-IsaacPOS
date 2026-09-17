<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TimeLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class TimeLogController extends Controller
{
    /**
     * Get current clock-in status for the authenticated user.
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        $storeId = $user->store_id;

        $activeLog = TimeLog::where('store_id', $storeId)
            ->where('user_id', $user->user_id)
            ->where('status', 'timed_in')
            ->latest('time_in')
            ->first();

        $todayLogs = TimeLog::where('store_id', $storeId)
            ->where('user_id', $user->user_id)
            ->whereDate('time_in', Carbon::today())
            ->orderBy('time_in', 'desc')
            ->get();

        return response()->json([
            'is_timed_in' => $activeLog !== null,
            'current_log' => $activeLog,
            'today_logs' => $todayLogs,
        ]);
    }

    /**
     * Clock in.
     */
    public function timeIn(Request $request): JsonResponse
    {
        $user = $request->user();
        $storeId = $user->store_id;

        $request->validate([
            'notes' => 'nullable|string|max:500',
        ]);

        // Check if already timed in
        $existing = TimeLog::where('store_id', $storeId)
            ->where('user_id', $user->user_id)
            ->where('status', 'timed_in')
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'You are already clocked in.',
                'time_log' => $existing,
            ], 200);
        }

        $log = TimeLog::create([
            'store_id' => $storeId,
            'user_id' => $user->user_id,
            'time_in' => Carbon::now(),
            'status' => 'timed_in',
            'notes' => $request->input('notes'),
        ]);

        return response()->json([
            'message' => 'Clocked in successfully at ' . $log->time_in->format('h:i A'),
            'time_log' => $log,
        ], 201);
    }

    /**
     * Clock out.
     */
    public function timeOut(Request $request): JsonResponse
    {
        $user = $request->user();
        $storeId = $user->store_id;

        $request->validate([
            'notes' => 'nullable|string|max:500',
        ]);

        $activeLog = TimeLog::where('store_id', $storeId)
            ->where('user_id', $user->user_id)
            ->where('status', 'timed_in')
            ->latest('time_in')
            ->first();

        if (!$activeLog) {
            return response()->json([
                'message' => 'No active clock-in found. Please clock in first.',
            ], 422);
        }

        $now = Carbon::now();
        $timeIn = Carbon::parse($activeLog->time_in);
        $minutes = max(1, $timeIn->diffInMinutes($now));
        $hours = round($minutes / 60, 2);

        $closingNotes = $request->input('notes');
        $updatedNotes = $activeLog->notes;
        if ($closingNotes) {
            $updatedNotes = $updatedNotes ? ($updatedNotes . ' | Out note: ' . $closingNotes) : $closingNotes;
        }

        $activeLog->update([
            'time_out' => $now,
            'total_hours' => $hours,
            'status' => 'timed_out',
            'notes' => $updatedNotes,
        ]);

        return response()->json([
            'message' => 'Clocked out successfully at ' . $now->format('h:i A') . " (Duration: {$hours} hrs)",
            'time_log' => $activeLog,
        ]);
    }

    /**
     * List attendance logs for store.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $storeId = $user->store_id;

        $query = TimeLog::with(['user:user_id,name,email,role'])
            ->where('store_id', $storeId);

        // If cashier, can only view own logs
        if ($user->role === 'cashier') {
            $query->where('user_id', $user->user_id);
        } elseif ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        if ($request->filled('date')) {
            $query->whereDate('time_in', $request->input('date'));
        }

        $logs = $query->latest('time_in')->paginate($request->input('per_page', 25));

        return response()->json($logs);
    }
}
