<?php

namespace App\Models\Concerns;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;

/**
 * Fills a human-readable number such as "TMB-2026-000123" when a model is created.
 *
 * The sequence restarts every year. The using model must implement:
 *  - sequenceNumberColumn(): the column to fill (e.g. "reference")
 *  - sequenceNumberPrefix(): the prefix (e.g. "TMB")
 *  - sequenceNumberDate(): the date whose year is used (e.g. created_at)
 *
 * The column has a unique index, so two concurrent inserts can never share a number;
 * the booking flow (Phase 4) wraps creation in a transaction and retries on conflict.
 */
trait HasYearlySequenceNumber
{
    /**
     * Number of digits of the yearly sequence.
     */
    protected static int $sequenceNumberDigits = 6;

    /**
     * Register the creating hook.
     */
    public static function bootHasYearlySequenceNumber(): void
    {
        static::creating(function (Model $model): void {
            /** @var static $model */
            $column = $model->sequenceNumberColumn();

            if (blank($model->getAttribute($column))) {
                $model->setAttribute($column, $model->nextSequenceNumber());
            }
        });
    }

    /**
     * Compute the next free number for the model's year, e.g. "FAC-2026-000046".
     */
    public function nextSequenceNumber(): string
    {
        $column = $this->sequenceNumberColumn();
        $prefix = sprintf('%s-%d-', $this->sequenceNumberPrefix(), $this->sequenceNumberDate()->year);

        $last = static::query()
            ->where($column, 'like', $prefix.'%')
            ->max($column);

        $next = $last === null ? 1 : ((int) substr($last, strlen($prefix))) + 1;

        return $prefix.str_pad((string) $next, static::$sequenceNumberDigits, '0', STR_PAD_LEFT);
    }

    /**
     * Column that stores the generated number.
     */
    abstract protected function sequenceNumberColumn(): string;

    /**
     * Prefix of the generated number.
     */
    abstract protected function sequenceNumberPrefix(): string;

    /**
     * Date whose year is used in the generated number.
     */
    abstract protected function sequenceNumberDate(): CarbonInterface;
}
