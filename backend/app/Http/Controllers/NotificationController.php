<?php

namespace App\Http\Controllers;

use App\Http\Requests\NotificationIndexRequest;
use App\Http\Resources\NotificationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * The bell: the signed-in user's in-app notifications (customers and admins alike).
 * Only ever their own: another user's notification id answers 404.
 */
class NotificationController extends Controller
{
    /**
     * GET /api/notifications?status=all|unread|read&page=: newest first, 15 per page,
     * with meta.unread_count (always every unread notification, whatever the filter).
     */
    public function index(NotificationIndexRequest $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $notifications = match ($request->validated('status')) {
            'unread' => $user->unreadNotifications(),
            'read' => $user->readNotifications(),
            default => $user->notifications(),
        };

        return NotificationResource::collection(
            $notifications->paginate(config('tomobilti.notifications.per_page'))->withQueryString()
        )->additional(['meta' => ['unread_count' => $user->unreadNotifications()->count()]]);
    }

    /**
     * POST /api/notifications/{id}/read
     */
    public function read(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return response()->json([
            'data' => new NotificationResource($notification),
            'message' => __('api.notifications.read'),
            'meta' => ['unread_count' => $request->user()->unreadNotifications()->count()],
        ]);
    }

    /**
     * POST /api/notifications/read-all
     */
    public function readAll(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->json([
            'message' => __('api.notifications.all_read'),
            'meta' => ['unread_count' => 0],
        ]);
    }
}
