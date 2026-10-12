<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DiningTableController;
use App\Http\Controllers\Api\MenuItemController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\StaffController;
use Illuminate\Support\Facades\Route;

// Public
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Authenticated staff & admin
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Menu: read for everyone, write for staff+
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{category}', [CategoryController::class, 'show']);
    Route::get('/menu-items', [MenuItemController::class, 'index']);
    Route::get('/menu-items/{menu_item}', [MenuItemController::class, 'show']);

    // Tables
    Route::apiResource('tables', DiningTableController::class)
        ->parameters(['tables' => 'dining_table']);

    // Orders
    Route::apiResource('orders', OrderController::class)->only(['index', 'show', 'store']);
    Route::post('/orders/{order}/items', [OrderController::class, 'addItems']);
    Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);

    // Reservations
    Route::apiResource('reservations', ReservationController::class);

    // Dashboard
    Route::get('/dashboard', DashboardController::class);

    // Menu writes: staff or admin
    Route::middleware('staff')->group(function () {
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::match(['put', 'patch'], '/categories/{category}', [CategoryController::class, 'update']);
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

        Route::post('/menu-items', [MenuItemController::class, 'store']);
        Route::match(['put', 'patch'], '/menu-items/{menu_item}', [MenuItemController::class, 'update']);
        Route::delete('/menu-items/{menu_item}', [MenuItemController::class, 'destroy']);
    });

    // Admin only
    Route::middleware('admin')->group(function () {
        Route::apiResource('admin/staff', StaffController::class)->parameters(['staff' => 'staff']);
    });
});
