<?php

namespace Tests\Unit\Enums;

use App\Enums\CarStatus;
use App\Enums\ExtraPricing;
use App\Enums\FuelType;
use App\Enums\InvoiceStatus;
use App\Enums\LocationType;
use App\Enums\PaymentMethod;
use App\Enums\ReservationStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Covers the shared HasOptions contract of every application enum.
 */
class EnumLabelsTest extends TestCase
{
    /**
     * @return array<string, array{class-string<\BackedEnum>}>
     */
    public static function enums(): array
    {
        return [
            'UserRole' => [UserRole::class],
            'CarStatus' => [CarStatus::class],
            'Transmission' => [Transmission::class],
            'FuelType' => [FuelType::class],
            'LocationType' => [LocationType::class],
            'ExtraPricing' => [ExtraPricing::class],
            'ReservationStatus' => [ReservationStatus::class],
            'InvoiceStatus' => [InvoiceStatus::class],
            'PaymentMethod' => [PaymentMethod::class],
        ];
    }

    /**
     * @param  class-string<\BackedEnum>  $enum
     */
    #[DataProvider('enums')]
    public function test_options_list_every_case_with_a_distinct_label(string $enum): void
    {
        $options = $enum::options();

        $this->assertSame(
            array_map(fn (\BackedEnum $case): array => ['value' => $case->value, 'label' => $case->label()], $enum::cases()),
            $options,
        );
        $this->assertSame(array_column($options, 'value'), $enum::values());

        $labels = array_column($options, 'label');
        $this->assertNotContains('', $labels);
        $this->assertSame($labels, array_unique($labels));
    }

    /**
     * @return array<string, array{\BackedEnum, string}>
     */
    public static function frenchLabels(): array
    {
        return [
            'admin' => [UserRole::Admin, 'Administrateur'],
            'out of service' => [CarStatus::OutOfService, 'Hors service'],
            'manual' => [Transmission::Manual, 'Manuelle'],
            'petrol' => [FuelType::Petrol, 'Essence'],
            'electric' => [FuelType::Electric, 'Électrique'],
            'airport' => [LocationType::Airport, 'Aéroport'],
            'per rental' => [ExtraPricing::PerRental, 'Par location'],
            'unpaid' => [InvoiceStatus::Unpaid, 'Non payée'],
            'bank transfer' => [PaymentMethod::BankTransfer, 'Virement bancaire'],
        ];
    }

    #[DataProvider('frenchLabels')]
    public function test_labels_are_in_french(\BackedEnum $case, string $label): void
    {
        $this->assertSame($label, $case->label());
    }
}
