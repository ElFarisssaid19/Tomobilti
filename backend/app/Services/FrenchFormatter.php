<?php

namespace App\Services;

use Carbon\CarbonInterface;
use InvalidArgumentException;
use NumberFormatter;

/**
 * French formatting shared by the PDFs (invoice, voucher) and the emails: amounts in
 * dirhams ("1.234,50 DH", like the SPA), dates ("vendredi 12 décembre 2026 à 10:00") and the amount
 * written out in words, as Moroccan invoices require ("mille deux cent trente-quatre
 * dirhams et cinquante centimes").
 */
final class FrenchFormatter
{
    /**
     * Non-breaking space, so "1.234,50 DH" never wraps in a PDF cell.
     */
    private const NBSP = "\u{00A0}";

    /**
     * "1.234,50 DH" from a decimal string such as "1234.50", and "1.840 DH" for a whole
     * amount: the same format as `formatPrice` in the SPA (fr-MA: dot for thousands,
     * comma for decimals, centimes only when there are some), so a price reads the same
     * on the site, in the emails and in the PDFs.
     */
    public static function money(string|int|float $amount): string
    {
        $centimes = (int) round((float) $amount * 100);
        $decimals = $centimes % 100 === 0 ? 0 : 2;

        return number_format($centimes / 100, $decimals, ',', '.').self::NBSP.'DH';
    }

    /**
     * "1.840,00 DH": an invoice amount, always with the centimes (the invoice PDF and the
     * /admin/factures page, `formatInvoiceAmount` in the SPA). Everything else uses money().
     */
    public static function invoiceMoney(string|int|float $amount): string
    {
        $centimes = (int) round((float) $amount * 100);

        return number_format($centimes / 100, 2, ',', '.').self::NBSP.'DH';
    }

    /**
     * "+212524000101" → "+212 5 24 00 01 01": a Moroccan number stored in E.164, grouped
     * like the SPA (`formatPhone`). Other numbers are returned as they are.
     */
    public static function phone(?string $phone): string
    {
        if ($phone === null) {
            return '';
        }

        if (! preg_match('/^\+212(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/', $phone, $parts)) {
            return $phone;
        }

        return '+212 '.implode(' ', array_slice($parts, 1));
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
