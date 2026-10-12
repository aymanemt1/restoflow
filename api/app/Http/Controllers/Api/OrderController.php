<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddOrderItemsRequest;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\DiningTable;
use App\Models\MenuItem;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $orders = Order::query()
            ->with(['diningTable', 'staff', 'items.menuItem'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('dining_table_id'), fn ($q) => $q->where('dining_table_id', $request->integer('dining_table_id')))
            ->latest()
            ->paginate(50);

        return OrderResource::collection($orders);
    }

    public function show(Order $order): OrderResource
    {
        return new OrderResource($order->load(['diningTable', 'staff', 'items.menuItem']));
    }

    /** Create an order for a table; an optional initial set of items can be attached. */
    public function store(StoreOrderRequest $request): JsonResponse
    {
        $order = DB::transaction(function () use ($request) {
            $table = DiningTable::findOrFail($request->integer('dining_table_id'));

            $order = Order::create([
                'dining_table_id' => $table->id,
                'user_id' => $request->user()->id,
                'status' => Order::STATUS_PENDING,
                'notes' => $request->string('notes')->toString() ?: null,
            ]);

            // A free table becomes occupied as soon as the first order is created.
            if ($table->status === DiningTable::STATUS_FREE) {
                $table->update(['status' => DiningTable::STATUS_OCCUPIED]);
            }

            $this->attachItems($order, $request->input('items', []));

            return $order;
        });

        return (new OrderResource($order->load(['diningTable', 'staff', 'items.menuItem'])))
            ->response()->setStatusCode(201);
    }

    /** Add items to an open order (anything that isn't paid or cancelled). */
    public function addItems(AddOrderItemsRequest $request, Order $order): OrderResource
    {
        abort_if(! $order->isOpen(), 422, 'Cannot add items to a paid or cancelled order.');

        DB::transaction(fn () => $this->attachItems($order, $request->validated('items')));

        return new OrderResource($order->load(['diningTable', 'staff', 'items.menuItem']));
    }

    /**
     * Move the order along the status flow.
     * pending → preparing → served → paid (+ cancelled).
     * Marking an order paid computes the total from the line snapshots
     * and frees the table. Cancelling frees the table too.
     */
    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): OrderResource|JsonResponse
    {
        $status = $request->string('status')->toString();

        if (! $order->canTransitionTo($status)) {
            return response()->json([
                'message' => "Invalid transition from '{$order->status}' to '{$status}'.",
                'allowed' => Order::TRANSITIONS[$order->status] ?? [],
            ], 422);
        }

        DB::transaction(function () use ($order, $status) {
            $order->update([
                'status' => $status,
                'paid_at' => $status === Order::STATUS_PAID ? now() : $order->paid_at,
                // The final total is snapshotted at payment time.
                'total' => $status === Order::STATUS_PAID ? $order->computeTotal() : $order->total,
            ]);

            if (in_array($status, [Order::STATUS_PAID, Order::STATUS_CANCELLED], true)) {
                $this->freeTableIfIdle($order->dining_table_id);
            }
        });

        return new OrderResource($order->fresh()->load(['diningTable', 'staff', 'items.menuItem']));
    }

    /** Attach order lines, snapshotting each item's current menu price. */
    protected function attachItems(Order $order, array $items): void
    {
        foreach ($items as $item) {
            $menuItem = MenuItem::findOrFail($item['menu_item_id']);

            abort_if(! $menuItem->available, 422, "'{$menuItem->name}' is not available.");

            $order->items()->create([
                'menu_item_id' => $menuItem->id,
                'qty' => $item['qty'],
                'unit_price' => $menuItem->price,
            ]);
        }
    }

    /** Free the table only if no other open order still sits on it. */
    protected function freeTableIfIdle(int $diningTableId): void
    {
        $stillBusy = Order::where('dining_table_id', $diningTableId)
            ->whereNotIn('status', [Order::STATUS_PAID, Order::STATUS_CANCELLED])
            ->exists();

        if (! $stillBusy) {
            DiningTable::whereKey($diningTableId)->update(['status' => DiningTable::STATUS_FREE]);
        }
    }
}
