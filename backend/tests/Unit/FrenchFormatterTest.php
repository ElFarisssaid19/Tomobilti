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

    #[TestWith(['1234.5', '1.234,50'])]
    #[TestWith(['1840.00', '1.840'])]
    #[TestWith(['450', '450'])]
    #[TestWith(['306.67', '306,67'])]
    #[TestWith(['1250000.10', '1.250.000,10'])]
    public function test_formats_money_like_the_spa(string $amount, string $formatted): void
    {
        $this->assertSame("{$formatted}\u{00A0}DH", FrenchFormatter::money($amount));
    }

    #[TestWith(['1840.00', '1.840,00'])]
    #[TestWith(['1533.333', '1.533,33'])]
    #[TestWith(['450', '450,00'])]
    public function test_formats_invoice_amounts_with_the_centimes(string $amount, string $formatted): void
    {
        $this->assertSame("{$formatted}\u{00A0}DH", FrenchFormatter::invoiceMoney($amount));
    }

    #[TestWith(['+212524000101', '+212 5 24 00 01 01'])]
    #[TestWith(['+33612345678', '+33612345678'])]
    #[TestWith([null, ''])]
    public function test_groups_moroccan_phone_numbers_like_the_spa(?string $phone, string $formatted): void
    {
        $this->assertSame($formatted, FrenchFormatter::phone($phone));
    }
}
