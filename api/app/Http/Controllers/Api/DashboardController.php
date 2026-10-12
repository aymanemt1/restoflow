<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DiningTable;
use App\Models\Order;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $today = today();

        return response()->json([
            // Sum of the totals of paid orders created today.
            'today_revenue' => (float) Order::where('status', Order::STATUS_PAID)
                ->whereDate('created_at', $today)
                ->sum('total'),

            'active_orders_count' => Order::whereNotIn('status', [Order::STATUS_PAID, Order::STATUS_CANCELLED])->count(),
            'occupied_tables_count' => DiningTable::where('status', DiningTable::STATUS_OCCUPIED)->count(),
            'today_reservations_count' => Reservation::whereDate('date', $today)->count(),
        ]);
    }
}
