import { useRef, useState, type FormEvent } from 'react'
import { ArrowRight, Camera, CheckCircle2, ImagePlus, Info, Loader2, ShieldCheck, Trash2 } from 'lucide-react'
import type { Collection, LocationRef, WasteCategory } from '../types'
import { useStore } from '../state/AppStore'
import { useToast } from '../state/toast'
import { CATEGORIES, MAX_KG_PER_SUBMISSION, PHOTO_BONUS, calculatePoints, categoryInfo } from '../lib/scoring'
import { addDays, formatDate, formatNumber, toISODate, todayISO } from '../lib/dates'
import { MAX_PHOTO_BYTES, compressImage } from '../lib/image'
import { formatLocation, isValidLocation } from '../data/locations'
import { CATEGORY_ICONS } from '../components/icons'
import { LocationSelect } from '../components/LocationSelect'
import { FieldError, PageHeader, StatusPill } from '../components/ui'
import { LeafSprig } from '../components/Botanical'

const MAX_BACKDATE_DAYS = 30
const QUICK_WEIGHTS = [1, 2.5, 5, 10, 20]

interface FormState {
  category?: WasteCategory
  weight: string
  location: LocationRef
  date: string
  photo?: string
  notes: string
}

type Errors = Partial<Record<'category' | 'weight' | 'location' | 'date' | 'photo' | 'notes', string>>

function validateSubmission(f: FormState): Errors {
  const errors: Errors = {}
  if (!f.category) errors.category = 'Choose what kind of waste you collected.'
  const kg = Number(f.weight)
  if (!f.weight.trim()) errors.weight = 'Enter the weight in kilograms.'
  else if (!Number.isFinite(kg) || kg <= 0) errors.weight = 'Weight must be a positive number.'
  else if (kg < 0.1) errors.weight = 'Minimum is 0.1 kg.'
  else if (kg > MAX_KG_PER_SUBMISSION) errors.weight = `Maximum ${MAX_KG_PER_SUBMISSION} kg per submission — split larger loads.`
  else if (!/^\d+([.,]\d)?$/.test(f.weight.trim())) errors.weight = 'Use at most one decimal place (e.g. 3.5).'
  if (!isValidLocation(f.location)) errors.location = 'Choose a valid oblast, rayon and city.'
  const today = todayISO()
  const earliest = toISODate(addDays(new Date(), -MAX_BACKDATE_DAYS))
  if (!f.date) errors.date = 'Pick the collection date.'
  else if (f.date > today) errors.date = 'The date cannot be in the future.'
  else if (f.date < earliest) errors.date = `Submissions must be within the last ${MAX_BACKDATE_DAYS} days.`
  if (f.notes.length > 280) errors.notes = 'Notes are limited to 280 characters.'
  return errors
}

export function Collect() {
  const { currentUser, submit } = useStore()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const blank = (): FormState => ({ weight: '', location: currentUser.home, date: todayISO(), notes: '' })
  const [form, setForm] = useState<FormState>(blank)
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [submitted, setSubmitted] = useState<Collection | null>(null)

  const update = (patch: Partial<FormState>) => {
    const next = { ...form, ...patch }
    setForm(next)
    if (touched) setErrors(validateSubmission(next))
  }

  const kg = Number(form.weight)
  const estimate = form.category && kg > 0 && kg <= MAX_KG_PER_SUBMISSION ? calculatePoints(form.category, kg, !!form.photo) : 0

  async function onPhoto(file?: File) {
    if (!file) return
    if (!file.type.startsWith('image/')) return setErrors((e) => ({ ...e, photo: 'Please choose an image file (JPG, PNG, HEIC…).' }))
    if (file.size > MAX_PHOTO_BYTES) return setErrors((e) => ({ ...e, photo: 'Photo must be smaller than 10 MB.' }))
    setPhotoBusy(true)
    try {
      const photo = await compressImage(file)
      setErrors((e) => ({ ...e, photo: undefined }))
      setForm((f) => ({ ...f, photo }))
    } catch {
      setErrors((e) => ({ ...e, photo: 'Could not read this image. Try another one.' }))
    } finally {
      setPhotoBusy(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    const errs = validateSubmission(form)
    setErrors(errs)
    if (Object.keys(errs).length) {
      toast({ tone: 'error', title: 'Please fix the highlighted fields' })
      return
    }
    const r = submit({
      userId: currentUser.id,
      category: form.category!,
      claimedKg: Number(form.weight),
      location: form.location,
      date: form.date,
      photo: form.photo,
      notes: form.notes,
    })
    if (!r.ok) {
      toast({ tone: 'error', title: 'Could not save submission', description: r.error })
      return
    }
    toast({ tone: 'success', title: 'Submission received', description: 'It is now pending verification.' })
    setSubmitted(r.collection)
  }

  function reset() {
    setForm(blank())
    setErrors({})
    setTouched(false)
    setSubmitted(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  if (submitted) return <SubmittedCard c={submitted} onAnother={reset} />

  return (
    <div>
      <PageHeader
        eyebrow="Collect waste"
        title="Log a collection"
        description="Tell us what you gathered and sorted. A moderator verifies each submission before points are added to your account."
      />

      <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Category */}
          <fieldset className="card p-6">
            <legend className="sr-only">Waste category</legend>
            <h2 className="text-xl font-semibold">1. What did you collect?</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {CATEGORIES.map((c) => {
                const Icon = CATEGORY_ICONS[c.id]
                const active = form.category === c.id
                return (
                  <label
                    key={c.id}
                    className={`relative flex cursor-pointer flex-col gap-2 rounded-2xl border p-4 transition hover:-translate-y-0.5 ${
                      active ? 'border-forest-700 bg-white shadow-md ring-2 ring-moss-300' : 'border-forest-900/10 bg-white/50 hover:bg-white'
                    }`}
                  >
                    <input type="radio" name="category" value={c.id} checked={active} onChange={() => update({ category: c.id })} className="sr-only" />
                    <span className="inline-flex size-10 items-center justify-center rounded-xl" style={{ background: `color-mix(in oklab, ${c.color} 18%, white)`, color: c.color }}>
                      <Icon className="size-5" />
                    </span>
                    <span className="font-semibold">{c.label}</span>
                    <span className="text-xs text-forest-600/80">{c.pointsPerKg} pts / kg</span>
                    {active && <CheckCircle2 className="absolute top-3 right-3 size-5 text-moss-600" />}
                  </label>
                )
              })}
            </div>
            {form.category && <p className="mt-3 text-sm text-forest-600/80">{categoryInfo(form.category).hint}</p>}
            <FieldError message={errors.category} />
          </fieldset>

          {/* Weight & date */}
          <div className="card grid gap-6 p-6 sm:grid-cols-2">
            <div>
              <h2 className="mb-4 text-xl font-semibold">2. How much?</h2>
              <label className="label" htmlFor="weight">
                Weight (kg)
              </label>
              <div className="relative">
                <input
                  id="weight"
                  inputMode="decimal"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max={MAX_KG_PER_SUBMISSION}
                  placeholder="e.g. 4.5"
                  className={`field pr-12 ${errors.weight ? 'field-error' : ''}`}
                  value={form.weight}
                  onChange={(e) => update({ weight: e.target.value })}
                  aria-invalid={!!errors.weight}
                />
                <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-forest-500">kg</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {QUICK_WEIGHTS.map((w) => (
                  <button type="button" key={w} onClick={() => update({ weight: String(w) })} className="chip cursor-pointer bg-forest-900/5 text-forest-700 hover:bg-forest-900/10">
                    {w} kg
                  </button>
                ))}
              </div>
              <FieldError message={errors.weight} />
            </div>
            <div>
              <h2 className="mb-4 text-xl font-semibold">3. When?</h2>
              <label className="label" htmlFor="date">
                Collection date
              </label>
              <input
                id="date"
                type="date"
                className={`field ${errors.date ? 'field-error' : ''}`}
                value={form.date}
                max={todayISO()}
                min={toISODate(addDays(new Date(), -MAX_BACKDATE_DAYS))}
                onChange={(e) => update({ date: e.target.value })}
                aria-invalid={!!errors.date}
              />
              <p className="mt-2 text-xs text-forest-600/70">Up to {MAX_BACKDATE_DAYS} days back.</p>
              <FieldError message={errors.date} />
            </div>
          </div>

          {/* Location */}
          <div className="card p-6">
            <h2 className="mb-4 text-xl font-semibold">4. Where?</h2>
            <LocationSelect value={form.location} onChange={(location) => update({ location })} />
            <FieldError message={errors.location} />
          </div>

          {/* Photo & notes */}
          <div className="card grid gap-6 p-6 sm:grid-cols-2">
            <div>
              <h2 className="mb-1 text-xl font-semibold">5. Photo</h2>
              <p className="mb-4 text-sm text-forest-600/80">Optional · +{PHOTO_BONUS} bonus points and faster review.</p>
              <input ref={fileRef} type="file" accept="image/*" className="sr-only" id="photo" onChange={(e) => onPhoto(e.target.files?.[0])} />
              {form.photo ? (
                <div className="relative overflow-hidden rounded-2xl">
                  <img src={form.photo} alt="Collection preview" className="aspect-[4/3] w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, photo: undefined }))
                      if (fileRef.current) fileRef.current.value = ''
                    }}
                    className="btn absolute top-3 right-3 bg-white/90 px-3 py-1.5 text-clay-600 hover:bg-white"
                  >
                    <Trash2 className="size-4" /> Remove
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="photo"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    onPhoto(e.dataTransfer.files?.[0])
                  }}
                  className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-forest-900/15 bg-white/40 text-forest-600 transition hover:border-moss-400 hover:bg-moss-50"
                >
                  {photoBusy ? <Loader2 className="size-7 animate-spin" /> : <ImagePlus className="size-7" />}
                  <span className="font-medium">{photoBusy ? 'Processing…' : 'Click or drop a photo'}</span>
                  <span className="text-xs text-forest-500">JPG / PNG up to 10 MB</span>
                </label>
              )}
              <FieldError message={errors.photo} />
            </div>
            <div className="flex flex-col">
              <h2 className="mb-1 text-xl font-semibold">6. Notes</h2>
              <p className="mb-4 text-sm text-forest-600/80">Optional context for the moderator.</p>
              <textarea
                id="notes"
                rows={6}
                className={`field flex-1 resize-none ${errors.notes ? 'field-error' : ''}`}
                placeholder="e.g. Clean-up along the Alamedin river with my neighbours"
                value={form.notes}
                onChange={(e) => update({ notes: e.target.value })}
              />
              <p className={`mt-1 text-right text-xs ${form.notes.length > 280 ? 'text-clay-600' : 'text-forest-500'}`}>{form.notes.length}/280</p>
              <FieldError message={errors.notes} />
            </div>
          </div>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="relative overflow-hidden rounded-3xl bg-forest-900 p-6 text-cream-50 shadow-xl shadow-forest-900/25">
            <LeafSprig className="pointer-events-none absolute -right-6 -bottom-6 h-44 text-moss-400/20" />
            <p className="text-xs font-semibold tracking-[0.2em] text-sun-200 uppercase">Estimated reward</p>
            <p className="mt-2 font-display text-6xl font-semibold">
              {formatNumber(estimate)}
              <span className="ml-2 text-xl text-moss-200">pts</span>
            </p>
            <dl className="relative mt-6 space-y-2 text-sm">
              <Row label="Category" value={form.category ? categoryInfo(form.category).label : '—'} />
              <Row label="Weight" value={kg > 0 ? `${formatNumber(kg, 1)} kg` : '—'} />
              <Row label="Rate" value={form.category ? `${categoryInfo(form.category).pointsPerKg} pts/kg` : '—'} />
              <Row label="Photo bonus" value={form.photo ? `+${PHOTO_BONUS}` : '—'} />
              <Row label="Location" value={formatLocation(form.location, true)} />
            </dl>
            <div className="relative mt-6 flex gap-2 rounded-2xl bg-white/8 p-3 text-xs text-cream-100/80">
              <Info className="size-4 shrink-0 text-sun-200" />
              Points are awarded only after a moderator approves the submission. The verified weight may be adjusted.
            </div>
            <button type="submit" className="btn-sun relative mt-6 w-full py-3 text-base" disabled={photoBusy}>
              <Camera className="size-4" /> Submit for verification
            </button>
          </div>
        </aside>
      </form>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-cream-100/60">{label}</dt>
      <dd className="truncate text-right font-medium">{value}</dd>
    </div>
  )
}

function SubmittedCard({ c, onAnother }: { c: Collection; onAnother: () => void }) {
  const info = categoryInfo(c.category)
  return (
    <div className="mx-auto max-w-xl animate-rise py-10 text-center">
      <span className="mx-auto inline-flex size-20 items-center justify-center rounded-full bg-moss-100 text-moss-600 ring-8 ring-moss-50">
        <CheckCircle2 className="size-10" />
      </span>
      <h1 className="mt-6 text-4xl font-semibold">Thank you — rahmat!</h1>
      <p className="mt-3 text-lg text-forest-700/80">
        Your {formatNumber(c.claimedKg, 1)} kg of {info.label.toLowerCase()} from {c.location.city} on {formatDate(c.date)} is waiting for verification.
      </p>
      <div className="card mx-auto mt-8 flex items-center justify-between gap-4 p-5 text-left">
        <div>
          <p className="text-sm text-forest-600/80">Status</p>
          <StatusPill status={c.status} />
        </div>
        <div className="text-right">
          <p className="text-sm text-forest-600/80">Potential points</p>
          <p className="font-display text-2xl font-semibold">{formatNumber(calculatePoints(c.category, c.claimedKg, !!c.photo))}</p>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={onAnother} className="btn-primary">
          Log another
        </button>
        <a href="#/admin" className="btn-ghost">
          <ShieldCheck className="size-4" /> Review in Admin Panel
        </a>
        <a href="#/dashboard" className="btn-ghost">
          Dashboard <ArrowRight className="size-4" />
        </a>
      </div>
    </div>
  )
}
