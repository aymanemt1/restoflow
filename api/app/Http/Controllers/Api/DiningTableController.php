<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDiningTableRequest;
use App\Http\Requests\UpdateDiningTableRequest;
use App\Http\Resources\DiningTableResource;
use App\Models\DiningTable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DiningTableController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $tables = DiningTable::query()
            ->withCount('activeOrders as active_orders_count')
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->orderBy('number')
            ->paginate(50);

        return DiningTableResource::collection($tables);
    }

    public function show(DiningTable $dining_table): DiningTableResource
    {
        return new DiningTableResource($dining_table->loadCount('activeOrders as active_orders_count'));
    }

    public function store(StoreDiningTableRequest $request): JsonResponse
    {
        $table = DiningTable::create($request->validated())->refresh(); // pick up DB defaults

        return (new DiningTableResource($table))->response()->setStatusCode(201);
    }

    public function update(UpdateDiningTableRequest $request, DiningTable $dining_table): DiningTableResource
    {
        $dining_table->update($request->validated());

        return new DiningTableResource($dining_table->fresh());
    }

    public function destroy(DiningTable $dining_table): JsonResponse
    {
        abort_if($dining_table->activeOrders()->exists(), 422, 'Cannot delete a table with active orders.');

        $dining_table->delete();

        return response()->json(null, 204);
    }
}
