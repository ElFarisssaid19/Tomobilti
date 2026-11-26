<?php

namespace Tests\Unit;

use App\Services\FrenchFormatter;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\TestWith;
use PHPUnit\Framework\TestCase;

class FrenchFormatterTest extends TestCase
{
    #[TestWith(['1234.50', 'mille deux cent trente-quatre dirhams et cinquante centimes'])]
    #[TestWith(['2750.00', 'deux mille sept cent cinquante dirhams'])]
    #[TestWith(['480.00', 'quatre cent quatre-vingts dirhams'])]
    #[TestWith(['1.01', 'un dirham et un centime'])]
    #[TestWith(['71.80', 'soixante-et-onze dirhams et quatre-vingts centimes'])]
    public function test_writes_amounts_in_french_words(string $amount, string $words): void
    {
        $this->assertSame($words, FrenchFormatter::amountInWords($amount));
    }

    public function test_refuses_a_negative_amount(): void
    {
        $this->expectException(InvalidArgumentException::class);

        FrenchFormatter::amountInWords('-10.00');
    }

    public function test_formats_money_with_non_breaking_spaces(): void
    {
        $this->assertSame("1\u{00A0}234,50\u{00A0}DH", FrenchFormatter::money('1234.5'));
    }
}
