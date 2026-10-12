<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStaffRequest;
use App\Http\Requests\UpdateStaffRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StaffController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return UserResource::collection(User::orderBy('name')->paginate(50));
    }

    public function show(User $staff): UserResource
    {
        return new UserResource($staff);
    }

    public function store(StoreStaffRequest $request): JsonResponse
    {
        $user = User::create($request->validated());

        return (new UserResource($user))->response()->setStatusCode(201);
    }

    public function update(UpdateStaffRequest $request, User $staff): UserResource
    {
        $data = $request->validated();

        // Keep the current password when none is supplied.
        if (empty($data['password'])) {
            unset($data['password']);
        }

        $staff->update($data);

        return new UserResource($staff->fresh());
    }

    public function destroy(User $staff): JsonResponse
    {
        abort_if($staff->id === auth()->id(), 422, 'You cannot delete your own account.');

        $staff->tokens()->delete();
        $staff->delete();

        return response()->json(null, 204);
    }
}
