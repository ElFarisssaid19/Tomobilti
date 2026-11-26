<?php

namespace App\Http\Controllers\Admin;

use App\Enums\InvoiceStatus;
use App\Filters\AdminInvoiceFilter;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\InvoiceIndexRequest;
use App\Http\Requests\Admin\MarkInvoicePaidRequest;
use App\Http\Resources\Admin\AdminInvoiceResource;
use App\Models\Invoice;
use App\Services\ReservationDocuments;
use App\Services\ReservationNotifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

/**
 * The agency's invoices (found by number): list with totals, PDF, mark as paid,
 * send again to the customer.
 */
class InvoiceController extends Controller
{
    /**
     * GET /api/admin/invoices: filters (status, payment_method, from, to on the issue
     * date, q), sort, 15 per page, and meta.totals for the whole filtered list:
     * count, total, paid ("encaissé") and unpaid ("à encaisser"), TTC.
     */
    public function index(InvoiceIndexRequest $request): AnonymousResourceCollection
    {
        Gate::authorize('manage', Invoice::class);

        $filter = new AdminInvoiceFilter($request->validated());

        $invoices = $filter->sort($filter->apply(Invoice::query()->with(AdminInvoiceResource::RELATIONS)))
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        $totals = $filter->apply(Invoice::query())
            ->toBase()
            ->selectRaw('count(*) as count, coalesce(sum(total_ttc), 0) as total')
            ->selectRaw('coalesce(sum(case when status = ? then total_ttc else 0 end), 0) as paid', [InvoiceStatus::Paid->value])
            ->first();

        return AdminInvoiceResource::collection($invoices)->additional(['meta' => ['totals' => [
            'count' => (int) $totals->count,
            'total' => $this->decimal($totals->total),
            'paid' => $this->decimal($totals->paid),
            'unpaid' => bcsub($this->decimal($totals->total), $this->decimal($totals->paid), 2),
        ]]]);
    }

    /**
     * GET /api/admin/invoices/{number}/pdf
     */
    public function pdf(Invoice $invoice, ReservationDocuments $documents): Response
    {
        Gate::authorize('manage', Invoice::class);

        return $documents->invoice($invoice)->download($invoice->pdfFilename());
    }

    /**
     * POST /api/admin/invoices/{number}/mark-paid { payment_method }: unpaid only (403).
     */
    public function markPaid(MarkInvoicePaidRequest $request, Invoice $invoice): JsonResponse
    {
        DB::transaction(function () use ($request, $invoice): void {
            $locked = Invoice::query()->whereKey($invoice->getKey())->lockForUpdate()->firstOrFail();

            Gate::authorize('markPaid', $locked);

            $locked->markPaid($request->paymentMethod());
        });

        return $this->respond($invoice->refresh(), 'marked_paid');
    }

    /**
     * POST /api/admin/invoices/{number}/send: emails the invoice to the customer again.
     */
    public function send(Invoice $invoice, ReservationNotifier $notifier): JsonResponse
    {
        Gate::authorize('manage', Invoice::class);

        $notifier->invoiceIssued($invoice, resent: true);

        return $this->respond($invoice, 'sent');
    }

    private function respond(Invoice $invoice, string $message): JsonResponse
    {
        return (new AdminInvoiceResource($invoice->load(AdminInvoiceResource::RELATIONS)))
            ->additional(['message' => __("api.invoices.{$message}")])
            ->response();
    }

    /**
     * SUM() comes back as a string (MySQL) or a number (SQLite): "1234.50".
     */
    private function decimal(mixed $value): string
    {
        return number_format((float) ($value ?? 0), 2, '.', '');
    }
}
