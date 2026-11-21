<?php

namespace Tests\Unit\Enums;

use App\Enums\ReservationStatus;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class ReservationStatusTest extends TestCase
{
    /**
     * @return array<string, array{ReservationStatus, string}>
     */
    public static function frenchLabels(): array
    {
        return [
            'pending' => [ReservationStatus::Pending, 'En attente'],
            'confirmed' => [ReservationStatus::Confirmed, 'Confirmée'],
            'active' => [ReservationStatus::Active, 'En cours'],
            'completed' => [ReservationStatus::Completed, 'Terminée'],
            'cancelled' => [ReservationStatus::Cancelled, 'Annulée'],
            'rejected' => [ReservationStatus::Rejected, 'Refusée'],
        ];
    }

    #[DataProvider('frenchLabels')]
    public function test_returns_the_french_label(ReservationStatus $status, string $label): void
    {
        $this->assertSame($label, $status->label());
    }

    /**
     * @return array<string, array{ReservationStatus, bool}>
     */
    public static function availabilityBlocking(): array
    {
        return [
            'pending blocks' => [ReservationStatus::Pending, true],
            'confirmed blocks' => [ReservationStatus::Confirmed, true],
            'active blocks' => [ReservationStatus::Active, true],
            'completed does not block' => [ReservationStatus::Completed, false],
            'cancelled does not block' => [ReservationStatus::Cancelled, false],
            'rejected does not block' => [ReservationStatus::Rejected, false],
        ];
    }

    #[DataProvider('availabilityBlocking')]
    public function test_only_pending_confirmed_and_active_block_availability(ReservationStatus $status, bool $blocks): void
    {
        $this->assertSame($blocks, $status->blocksAvailability());
    }

    /**
     * @return array<string, array{ReservationStatus, list<ReservationStatus>}>
     */
    public static function transitions(): array
    {
        return [
            'pending' => [ReservationStatus::Pending, [ReservationStatus::Confirmed, ReservationStatus::Rejected, ReservationStatus::Cancelled]],
            'confirmed' => [ReservationStatus::Confirmed, [ReservationStatus::Active, ReservationStatus::Cancelled]],
            'active' => [ReservationStatus::Active, [ReservationStatus::Completed]],
            'completed' => [ReservationStatus::Completed, []],
            'cancelled' => [ReservationStatus::Cancelled, []],
            'rejected' => [ReservationStatus::Rejected, []],
        ];
    }

    /**
     * @param  list<ReservationStatus>  $allowed
     */
    #[DataProvider('transitions')]
    public function test_allows_only_the_documented_transitions(ReservationStatus $from, array $allowed): void
    {
        foreach (ReservationStatus::cases() as $to) {
            $this->assertSame(
                in_array($to, $allowed, true),
                $from->canTransitionTo($to),
                "{$from->value} -> {$to->value}",
            );
        }

        $this->assertSame($allowed === [], $from->isFinal());
    }

    /**
     * @return array<string, array{ReservationStatus, bool}>
     */
    public static function cancellable(): array
    {
        return [
            'pending' => [ReservationStatus::Pending, true],
            'confirmed' => [ReservationStatus::Confirmed, true],
            'active' => [ReservationStatus::Active, false],
            'completed' => [ReservationStatus::Completed, false],
            'cancelled' => [ReservationStatus::Cancelled, false],
            'rejected' => [ReservationStatus::Rejected, false],
        ];
    }

    #[DataProvider('cancellable')]
    public function test_can_be_cancelled_only_before_pick_up(ReservationStatus $status, bool $expected): void
    {
        $this->assertSame($expected, $status->canBeCancelled());
    }
}
