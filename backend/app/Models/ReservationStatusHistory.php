<?php

namespace App\Models;

use App\Enums\ReservationStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One step of a reservation's life: its creation (from_status null) or a status
 * change, with who made it (customer, admin, or null for the scheduler) and an
 * optional note (the reason of a refusal or a cancellation).
 *
 * Rows are only ever inserted (ReservationWorkflow, ReservationBooker), never edited.
 */
#[Fillable(['reservation_id', 'from_status', 'to_status', 'user_id', 'note', 'created_at'])]
class ReservationStatusHistory extends Model
{
    /**
     * History rows are immutable: no updated_at column.
     */
    public const UPDATED_AT = null;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'from_status' => ReservationStatus::class,
            'to_status' => ReservationStatus::class,
            'created_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Reservation, $this>
     */
    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    /**
     * Who made the change (null: the scheduler).
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
