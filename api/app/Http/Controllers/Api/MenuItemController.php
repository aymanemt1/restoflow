<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMenuItemRequest;
use App\Http\Requests\UpdateMenuItemRequest;
use App\Http\Resources\MenuItemResource;
use App\Models\MenuItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MenuItemController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $items = MenuItem::query()
            ->with('category')
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->integer('category_id')))
            ->when($request->filled('available'), fn ($q) => $q->where('available', $request->boolean('available')))
            ->when($request->filled('search'), fn ($q) => $q->where('name', 'like', '%'.$request->string('search').'%'))
            ->orderBy('name')
            ->paginate(50);

        return MenuItemResource::collection($items);
    }

    public function show(MenuItem $menu_item): MenuItemResource
    {
        return new MenuItemResource($menu_item->load('category'));
    }

    public function store(StoreMenuItemRequest $request): JsonResponse
    {
        $item = MenuItem::create($request->validated());

        return (new MenuItemResource($item->load('category')))->response()->setStatusCode(201);
    }

    public function update(UpdateMenuItemRequest $request, MenuItem $menu_item): MenuItemResource
    {
        $menu_item->update($request->validated());

        return new MenuItemResource($menu_item->fresh()->load('category'));
    }

    public function destroy(MenuItem $menu_item): JsonResponse
    {
        $menu_item->delete();

        return response()->json(null, 204);
    }
}
