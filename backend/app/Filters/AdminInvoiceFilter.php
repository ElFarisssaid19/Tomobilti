<?php

namespace App\Filters;

use App\Models\Invoice;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

/**
 * Filters of the back-office invoices list (GET /api/admin/invoices), validated by
 * Admin\InvoiceIndexRequest. The totals of the page header use the same filters.
 *
 * GET /api/admin/invoices?status=unpaid&from=2026-12-01&to=2026-12-31&q=bennani
 *   → unpaid invoices issued in December, for a client named Bennani.
 */
final class AdminInvoiceFilter
{
    /**
     * Sortable columns.
     *
     * @var list<string>
     */
    public const SORTS = ['issued_at', 'number', 'total_ttc'];

    /**
     * @param  array<string, mixed>  $filters  validated query parameters
     */
    public function __construct(private readonly array $filters) {}

    /**
     * Every filter, without the sort (the totals reuse it).
     *
     * @param  Builder<Invoice>  $query
     * @return Builder<Invoice>
     */
    public function apply(Builder $query): Builder
    {
        if (filled($this->filters['status'] ?? null)) {
            $query->where('status', $this->filters['status']);
        }

        if (filled($this->filters['payment_method'] ?? null)) {
            $query->where('payment_method', $this->filters['payment_method']);
        }

        if (filled($this->filters['from'] ?? null)) {
            $query->where('issued_at', '>=', CarbonImmutable::parse($this->filters['from'])->startOfDay());
        }

        if (filled($this->filters['to'] ?? null)) {
            $query->where('issued_at', '<', CarbonImmutable::parse($this->filters['to'])->addDay()->startOfDay());
        }

        $this->bySearch($query);

        return $query;
    }

    /**
     * ?sort=total_ttc&direction=asc, newest first by default.
     *
     * @param  Builder<Invoice>  $query
     * @return Builder<Invoice>
     */
    public function sort(Builder $query): Builder
    {
        $sort = $this->filters['sort'] ?? 'issued_at';
        $direction = ($this->filters['direction'] ?? ($sort === 'issued_at' ? 'desc' : 'asc')) === 'desc' ? 'desc' : 'asc';

        return $query->orderBy($sort, $direction)->orderBy('id', $direction);
    }

    /**
     * ?q= → invoice number, reservation reference, or the client's name or email.
     */
    private function bySearch(Builder $query): void
    {
        $search = trim((string) ($this->filters['q'] ?? ''));

        if ($search === '') {
            return;
        }

        $like = '%'.addcslashes($search, '%_\\').'%';

        $query->where(fn (Builder $match) => $match
            ->where('number', 'like', $like)
            ->orWhereHas('reservation', fn (Builder $reservation) => $reservation
                ->where('reference', 'like', $like)
                ->orWhereHas('user', fn (Builder $user) => $user
                    ->where('name', 'like', $like)
                    ->orWhere('email', 'like', $like))));
    }
}
