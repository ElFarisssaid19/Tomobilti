import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CarFront } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import BookingSummary, { MobileBookingBar } from '../../components/reservation/BookingSummary.jsx'
import SimilarAvailableCars from '../../components/reservation/SimilarAvailableCars.jsx'
import {
  Alert,
  Breadcrumbs,
  Button,
  EmptyState,
  ErrorState,
  LoadingRegion,
  Skeleton,
  Stepper,
} from '../../components/ui'
import useBookingDraft from '../../hooks/useBookingDraft.js'
import { useCar, useExtras, useLocations } from '../../hooks/useCatalog.js'
import useDebouncedValue from '../../hooks/useDebouncedValue.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import {
  useBookingRules,
  useCreateReservation,
  useReservationQuote,
} from '../../hooks/useReservations.js'
import { apiErrorMessage } from '../../lib/auth.js'
import {
  BOOKING_STEPS,
  DEFAULT_BOOKING_RULES,
  quotePayload,
  stepErrors,
} from '../../lib/booking.js'
import { fadeIn } from '../../lib/motion.js'
import { getValidationErrors } from '../../lib/validation.js'
import BookingConfirmation from './BookingConfirmation.jsx'
import StepDates from './StepDates.jsx'
import StepExtras from './StepExtras.jsx'
import StepInformation from './StepInformation.jsx'
import StepReview from './StepReview.jsx'

const STEP_TITLES = [
  'Quand et où ?',
  'Des options pour la route ?',
  'Vos informations',
  'Vérifiez et confirmez',
]

/**
 * /reserver/:slug?start_at&end_at (signed-in users): the booking flow in 4 steps with
 * a live summary of the server's quote. Keyed by the slug, so choosing another car
 * starts a fresh booking.
 */
export default function BookingPage() {
  const { slug } = useParams()
  return <BookingFlow key={slug} slug={slug} />
}

function BookingFlow({ slug }) {
  const { data, isPending, isError, error, refetch } = useCar(slug)

  usePageMeta(
    data?.car
      ? `Réserver la ${data.car.name}`
      : error?.response?.status === 404
        ? 'Voiture introuvable'
        : 'Réservation',
    'Réservez votre voiture en ligne : dates, agences, options, et paiement à l’agence.',
  )

  if (isPending) return <FlowSkeleton />
  if (isError) {
    return (
      <div className="container-page flex flex-1 flex-col gap-6 pt-24 pb-16 md:pt-32">
        {error?.response?.status === 404 ? (
          <EmptyState
            icon={CarFront}
            title="Cette voiture n’est pas disponible"
            titleAs="h1"
            text="Elle a peut-être quitté la flotte."
            action={<Button to="/voitures">Voir les voitures</Button>}
          />
        ) : (
          <ErrorState
            title="Impossible de charger la voiture"
            titleAs="h1"
            error={error}
            onRetry={refetch}
          />
        )}
      </div>
    )
  }

  return <Booking car={data.car} />
}

function Booking({ car }) {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [savedDraft, update, clearDraft] = useBookingDraft(car.slug, {
    from: searchParams.get('start_at'),
    to: searchParams.get('end_at'),
  })
  const rules = useBookingRules().data ?? DEFAULT_BOOKING_RULES
  const locations = useLocations()
  const extras = useExtras()
  const createReservation = useCreateReservation()
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [conflict, setConflict] = useState(null)
  const [confirmed, setConfirmed] = useState(null)
  const headingRef = useRef(null)
  const stepperRef = useRef(null)

  // The car's home agency until the customer picks another one.
  const homeAgency = car.location?.slug ?? null
  const draft = useMemo(
    () => ({
      ...savedDraft,
      pickupLocation: savedDraft.pickupLocation ?? homeAgency,
      returnLocation: savedDraft.returnLocation ?? savedDraft.pickupLocation ?? homeAgency,
    }),
    [savedDraft, homeAgency],
  )
  const step = draft.step
  const shownStep = useRef(step)

  const payload = useMemo(() => quotePayload(draft), [draft])
  const debouncedPayload = useDebouncedValue(payload, 350)
  const quoteQuery = useReservationQuote(debouncedPayload)
  const quoteIsFresh =
    Boolean(payload) &&
    !quoteQuery.isPlaceholderData &&
    JSON.stringify(debouncedPayload) === JSON.stringify(payload)
  const quote = payload ? quoteQuery.data : undefined
  const freshQuote = quoteIsFresh ? quoteQuery.data : undefined
  const quoteLoading = Boolean(payload) && (!quoteIsFresh || quoteQuery.isFetching)
  const quoteError = quoteQuery.isError
    ? (Object.values(getValidationErrors(quoteQuery.error) ?? {})[0]?.[0] ??
      apiErrorMessage(quoteQuery.error))
    : null

  const errors = stepErrors(step, draft, { rules, quote: freshQuote, termsAccepted })
  const visibleErrors = showErrors || errors.availability ? errors : {}

  const locationName = (locationSlug) =>
    locations.data?.find((location) => location.slug === locationSlug)?.name ?? '—'

  // Show the progress and move focus to the new step's title (screen readers hear where they are).
  useEffect(() => {
    if (shownStep.current === step) return
    shownStep.current = step
    headingRef.current?.focus({ preventScroll: true })
    stepperRef.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })
  }, [step])

  /** Save a change; new dates also go to the URL, so the link keeps them. */
  function changeDraft(patch) {
    setConflict(null)
    const changes = typeof patch === 'function' ? patch(savedDraft) : patch
    update(changes)
    if ('from' in changes || 'to' in changes) {
      const from = 'from' in changes ? changes.from : savedDraft.from
      const to = 'to' in changes ? changes.to : savedDraft.to
      setSearchParams(from && to ? { start_at: from, end_at: to } : {}, {
        replace: true,
        preventScrollReset: true,
      })
    }
  }

  /** Change step, saving the agencies shown by default so a refresh restores them. */
  function goTo(nextStep) {
    setShowErrors(false)
    update({
      step: nextStep,
      pickupLocation: draft.pickupLocation,
      returnLocation: draft.returnLocation,
    })
  }

  function next() {
    if (quoteLoading && (step === 0 || step === 2)) return
    if (Object.keys(errors).length > 0) {
      setShowErrors(true)
      requestAnimationFrame(() =>
        document.querySelector('[aria-invalid="true"], [role="alert"]')?.focus?.(),
      )
      return
    }
    if (step < BOOKING_STEPS.length - 1) goTo(step + 1)
    else submit()
  }

  function submit() {
    setConflict(null)
    createReservation.mutate(
      { ...payload, customer_notes: draft.notes.trim() || null, terms: termsAccepted },
      {
        onSuccess: ({ reservation }) => {
          clearDraft()
          setConfirmed(reservation)
          toast.success('Réservation envoyée')
          window.scrollTo({ top: 0 })
        },
        onError: (error) => {
          const status = error.response?.status
          const body = error.response?.data
          if (status === 409) {
            setConflict(body?.message)
            queryClient.invalidateQueries({ queryKey: ['reservations', 'quote'] })
            queryClient.invalidateQueries({ queryKey: ['cars', 'availability', car.slug] })
          } else if (status === 422 && body?.code === 'not_eligible') {
            queryClient.invalidateQueries({ queryKey: ['reservations', 'quote'] })
            goTo(2)
            toast.error('Votre profil doit être complété', { description: body.message })
          } else if (status === 422) {
            const fields = getValidationErrors(error) ?? {}
            const dateField = ['start_at', 'end_at', 'pickup_location', 'return_location'].some(
              (field) => fields[field],
            )
            if (dateField) goTo(0)
            toast.error('Vérifiez votre réservation', {
              description: Object.values(fields)[0]?.[0] ?? body?.message,
            })
          } else {
            toast.error('La réservation n’a pas pu être envoyée', {
              description: apiErrorMessage(error),
            })
          }
        },
      },
    )
  }

  async function refreshEligibility() {
    await queryClient.invalidateQueries({ queryKey: ['reservations', 'quote'] })
  }

  if (confirmed) {
    return (
      <div className="container-page flex flex-1 flex-col pt-24 pb-16 md:pt-32">
        <BookingConfirmation reservation={confirmed} />
      </div>
    )
  }

  const isLastStep = step === BOOKING_STEPS.length - 1
  const actionLabel = isLastStep ? 'Confirmer la réservation' : 'Continuer'
  const actionLoading = createReservation.isPending || (quoteLoading && (step === 0 || step === 2))
  const back = `/voitures/${car.slug}${draft.from && draft.to ? `?start_at=${draft.from}&end_at=${draft.to}` : ''}`

  return (
    <div className="container-page flex flex-1 flex-col gap-8 pt-24 pb-36 md:pt-32 lg:pb-16">
      <div className="flex flex-col gap-4">
        <Breadcrumbs
          items={[
            { label: 'Voitures', to: '/voitures' },
            { label: car.name, to: back },
            { label: 'Réservation' },
          ]}
        />
        <h1 className="text-3xl font-bold text-balance text-fg md:text-4xl">
          Réserver la {car.name}
        </h1>
      </div>

      <div ref={stepperRef} className="scroll-mt-28">
        <Stepper steps={BOOKING_STEPS} current={step} className="max-w-3xl" />
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-10">
        <section aria-labelledby="booking-step" className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-fg-muted tabular-nums">
              Étape {step + 1} sur {BOOKING_STEPS.length}
            </p>
            <h2
              id="booking-step"
              ref={headingRef}
              tabIndex={-1}
              className="text-2xl font-bold text-fg focus:outline-none"
            >
              {STEP_TITLES[step]}
            </h2>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={step} variants={fadeIn} initial="hidden" animate="visible" exit="exit">
              {step === 0 && (
                <StepDates
                  car={car}
                  draft={draft}
                  update={changeDraft}
                  rules={rules}
                  locations={locations.data ?? []}
                  errors={visibleErrors}
                  quote={freshQuote}
                />
              )}
              {step === 1 && (
                <StepExtras extras={extras} draft={draft} update={changeDraft} quote={quote} />
              )}
              {step === 2 && (
                <StepInformation
                  quote={quote}
                  quoteLoading={quoteLoading}
                  refreshEligibility={refreshEligibility}
                />
              )}
              {step === 3 && (
                <StepReview
                  car={car}
                  draft={draft}
                  update={changeDraft}
                  rules={rules}
                  locationName={locationName}
                  quote={quote}
                  termsAccepted={termsAccepted}
                  onTermsChange={setTermsAccepted}
                  errors={visibleErrors}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {conflict && (
            <div className="flex flex-col gap-6">
              <Alert
                tone="danger"
                title="Cette voiture n’est plus libre"
                action={
                  <Button variant="secondary" size="sm" onClick={() => goTo(0)}>
                    Modifier les dates
                  </Button>
                }
              >
                {conflict}
              </Alert>
              <SimilarAvailableCars car={car} from={draft.from} to={draft.to} />
            </div>
          )}

          {step === 2 && showErrors && errors.eligibility && quote?.eligibility && (
            <p role="alert" tabIndex={-1} className="text-sm font-semibold text-danger">
              {errors.eligibility}
            </p>
          )}

          <div className="flex items-center gap-3 border-t border-line pt-6">
            {step > 0 ? (
              <Button variant="ghost" leftIcon={ArrowLeft} onClick={() => goTo(step - 1)}>
                Étape précédente
              </Button>
            ) : (
              <Button variant="ghost" leftIcon={ArrowLeft} to={back}>
                Retour à la voiture
              </Button>
            )}
          </div>
        </section>

        <aside aria-label="Résumé de la réservation" className="lg:sticky lg:top-28">
          <BookingSummary
            car={car}
            draft={draft}
            locationName={locationName}
            quote={quote}
            quoteLoading={quoteLoading}
            quoteError={quoteError}
            actionLabel={actionLabel}
            onAction={next}
            actionLoading={actionLoading}
          />
        </aside>
      </div>

      <MobileBookingBar
        quote={quote}
        quoteLoading={quoteLoading}
        actionLabel={actionLabel}
        onAction={next}
        actionLoading={actionLoading}
      />
    </div>
  )
}

function FlowSkeleton() {
  return (
    <LoadingRegion
      label="Chargement de la réservation…"
      className="container-page flex flex-1 flex-col gap-8 pt-24 pb-16 md:pt-32"
    >
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-10 w-80 max-w-full rounded-input" />
      </div>
      <Skeleton className="h-12 w-full max-w-3xl rounded-full" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-10">
        <Skeleton className="h-96 w-full rounded-card-lg" />
        <Skeleton className="h-80 w-full rounded-card-lg" />
      </div>
    </LoadingRegion>
  )
}
