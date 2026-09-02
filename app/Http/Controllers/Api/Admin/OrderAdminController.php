<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;

class OrderAdminController extends Controller
{
    public function index()
    {
        $orders = Order::with('items')->limit(200)->get();

        return OrderResource::collection($orders);
    }
}
