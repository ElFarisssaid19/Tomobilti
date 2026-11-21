<?php

namespace App\Enums\Concerns;

/**
 * Shared helpers for the application's string-backed enums.
 *
 * The using enum must define a `label(): string` method returning its French label.
 */
trait HasOptions
{
    /**
     * List every case as a value/label pair, ready for a frontend select.
     *
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $case): array => ['value' => $case->value, 'label' => $case->label()],
            self::cases(),
        );
    }

    /**
     * List every backed value, e.g. for an `in:` validation rule.
     *
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
