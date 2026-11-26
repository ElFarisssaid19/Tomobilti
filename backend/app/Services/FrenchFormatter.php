<?php

namespace App\Services;

use Carbon\CarbonInterface;
use InvalidArgumentException;
use NumberFormatter;

/**
 * French formatting shared by the PDFs (invoice, voucher) and the emails: amounts in
 * dirhams ("1 234,50 DH"), dates ("vendredi 12 décembre 2026 à 10:00") and the amount
 * written out in words, as Moroccan invoices require ("mille deux cent trente-quatre
 * dirhams et cinquante centimes").
 */
final class FrenchFormatter
{
    /**
     * Non-breaking space, so "1 234,50 DH" never wraps in a PDF cell.
     */
    private const NBSP = "\u{00A0}";

    /**
     * "1 234,50 DH" from a decimal string such as "1234.50".
     */
    public static function money(string|int|float $amount): string
    {
        return number_format((float) $amount, 2, ',', self::NBSP).self::NBSP.'DH';
    }

    /**
     * "12 décembre 2026".
     */
    public static function date(CarbonInterface $date): string
    {
        return $date->copy()->locale('fr')->translatedFormat('j F Y');
    }

    /**
     * "vendredi 12 décembre 2026 à 10:00".
     */
    public static function dateTime(CarbonInterface $date): string
    {
        return $date->copy()->locale('fr')->translatedFormat('l j F Y \à H:i');
    }

    /**
     * "ven. 12 déc. à 10:00": short form for the notifications list.
     */
    public static function shortDateTime(CarbonInterface $date): string
    {
        return $date->copy()->locale('fr')->translatedFormat('D j M \à H:i');
    }

    /**
     * A positive amount in words: "1234.50" → "mille deux cent trente-quatre dirhams
     * et cinquante centimes". Uses ICU's French spell-out rules (PHP intl).
     *
     * @throws InvalidArgumentException for a negative or malformed amount
     */
    public static function amountInWords(string $amount): string
    {
        if (! preg_match('/^\d+(\.\d{1,2})?$/', $amount)) {
            throw new InvalidArgumentException("Invalid amount: {$amount}");
        }

        [$dirhams, $centimes] = explode('.', bcadd($amount, '0', 2));
        $speller = new NumberFormatter('fr', NumberFormatter::SPELLOUT);

        $words = $speller->format((int) $dirhams).' '.((int) $dirhams > 1 ? 'dirhams' : 'dirham');

        if ((int) $centimes > 0) {
            $words .= ' et '.$speller->format((int) $centimes).' '.((int) $centimes > 1 ? 'centimes' : 'centime');
        }

        return $words;
    }
}
