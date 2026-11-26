import { INVOICE_STATUS, PAYMENT_METHOD } from './labels.js'

/** URL parameters of /admin/factures (same names as GET /api/admin/invoices). */
export const INVOICE_FILTERS = Object.freeze({
  status: { type: 'enum', values: Object.keys(INVOICE_STATUS) },
  payment_method: { type: 'enum', values: Object.keys(PAYMENT_METHOD) },
  from: { type: 'date' },
  to: { type: 'date' },
  q: { type: 'string' },
  sort: { type: 'enum', values: ['issued_at', 'number', 'total_ttc'] },
  direction: { type: 'enum', values: ['asc', 'desc'] },
  page: { type: 'page' },
})
