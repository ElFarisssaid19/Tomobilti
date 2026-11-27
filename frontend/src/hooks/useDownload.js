import useSingleFlightMutation from './useSingleFlightMutation.js'
import { toast } from 'sonner'
import { apiErrorMessage } from '../lib/auth.js'
import { downloadBlob } from '../lib/download.js'

/**
 * Download a file from the API (a PDF): `download(...args)` calls `fetcher`, which
 * returns `{ blob, filename }`, then saves it. `isPending` drives the button's
 * `loading`; a failure shows a toast with the server's reason.
 *
 * @example
 * const voucher = useDownload(downloadVoucher)
 * <Button loading={voucher.isPending} onClick={() => voucher.download(reference)}>…</Button>
 */
export default function useDownload(fetcher, errorTitle = 'Le téléchargement a échoué') {
  const mutation = useSingleFlightMutation({
    mutationFn: (args) => fetcher(...args),
    onSuccess: ({ blob, filename }) => downloadBlob(blob, filename),
    onError: async (error) => {
      // A blob response carries its JSON error as a Blob: read it for the message.
      const data = error?.response?.data
      if (data instanceof Blob) {
        try {
          error.response.data = JSON.parse(await data.text())
        } catch {
          // Not JSON: keep the generic message.
        }
      }
      toast.error(errorTitle, { description: apiErrorMessage(error) })
    },
  })

  return { download: (...args) => mutation.mutate(args), isPending: mutation.isPending }
}
