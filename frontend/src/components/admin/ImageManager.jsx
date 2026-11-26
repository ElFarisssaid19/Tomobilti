import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2, TriangleAlert } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { uploadCarImage } from '../../api/admin.js'
import { queryKeys } from '../../api/queryKeys.js'
import { useCarImageAction } from '../../hooks/useAdmin.js'
import { imageFileError } from '../../lib/adminCars.js'
import { apiErrorMessage } from '../../lib/auth.js'
import { cn } from '../../lib/cn.js'
import { getFieldError } from '../../lib/validation.js'
import { Badge, ConfirmDialog, IconButton, Input, Tooltip } from '../ui'

/**
 * Photos of a car. Drop files (or choose them) to upload: each one is sent on its own
 * with a progress bar, then processed by the server (16:10 crop, 800 and 1600 px WebP,
 * metadata removed, credited "Tomobilti"). The first photo is the primary one, shown on
 * the catalogue cards. Order with drag and drop or the arrow buttons (keyboard).
 */
export default function ImageManager({ carId, images = [] }) {
  const queryClient = useQueryClient()
  const action = useCarImageAction(carId)
  const inputRef = useRef(null)
  const [uploads, setUploads] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [dragging, setDragging] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  function patchUpload(id, patch) {
    setUploads((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  async function addFiles(fileList) {
    const files = [...fileList]
    const accepted = []
    for (const file of files) {
      const error = imageFileError(file)
      if (error) toast.error('Photo refusée', { description: error })
      else
        accepted.push({
          id: `${file.name}-${file.size}-${Math.random()}`,
          file,
          progress: 0,
          status: 'waiting',
        })
    }
    if (accepted.length === 0) return
    setUploads((current) => [...current, ...accepted])

    let uploaded = 0
    for (const item of accepted) {
      patchUpload(item.id, { status: 'uploading' })
      try {
        const { images: next } = await uploadCarImage(carId, item.file, (progress) =>
          patchUpload(item.id, { progress, status: progress >= 100 ? 'processing' : 'uploading' }),
        )
        queryClient.setQueryData(queryKeys.admin.cars.detail(carId), (car) =>
          car ? { ...car, images: next } : car,
        )
        setUploads((current) => current.filter((upload) => upload.id !== item.id))
        uploaded += 1
      } catch (error) {
        const message = getFieldError(error, 'images.0') ?? apiErrorMessage(error)
        patchUpload(item.id, { status: 'error', error: message })
      }
    }

    if (uploaded > 0) {
      toast.success(uploaded > 1 ? `${uploaded} photos ajoutées` : 'Photo ajoutée')
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.cars.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.cars.all })
    }
  }

  function run(variables, success) {
    action.mutate(variables, {
      onSuccess: () => success && toast.success(success),
      onError: (error) =>
        toast.error('La modification a échoué', { description: apiErrorMessage(error) }),
    })
  }

  function move(index, offset) {
    const ids = images.map((image) => image.id)
    const [moved] = ids.splice(index, 1)
    ids.splice(index + offset, 0, moved)
    run({ type: 'reorder', ids }, 'Ordre des photos enregistré')
  }

  function drop(targetIndex) {
    if (dragging === null || dragging === targetIndex) return
    move(dragging, targetIndex - dragging)
    setDragging(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes('Files')) {
            event.preventDefault()
            setDragOver(true)
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          if (!event.dataTransfer.files.length) return
          event.preventDefault()
          setDragOver(false)
          addFiles(event.dataTransfer.files)
        }}
        className={cn(
          'flex flex-col items-center gap-2 rounded-card border border-dashed px-6 py-8 text-center transition-colors duration-150',
          dragOver
            ? 'border-lime bg-lime/5'
            : 'border-line-control bg-raised/30 hover:border-fg-subtle hover:bg-raised/60',
        )}
      >
        <span className="grid size-12 place-items-center rounded-full border border-line-strong bg-raised text-fg">
          <ImagePlus className="size-5" aria-hidden="true" />
        </span>
        <span className="text-base font-semibold text-fg">
          Déposez des photos ici ou choisissez-les
        </span>
        <span className="text-sm text-fg-subtle">JPG, PNG ou WebP, 5 Mo max, format 16:10</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-label="Choisir des photos"
        onChange={(event) => {
          addFiles(event.target.files)
          event.target.value = ''
        }}
      />

      {uploads.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Envois en cours">
          {uploads.map((upload) => (
            <li
              key={upload.id}
              className="flex flex-col gap-1.5 rounded-input border border-line bg-raised/40 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-fg">{upload.file.name}</span>
                <span
                  className={cn(
                    'shrink-0 tabular-nums',
                    upload.status === 'error' ? 'text-danger' : 'text-fg-muted',
                  )}
                >
                  {upload.status === 'waiting' && 'En attente'}
                  {upload.status === 'uploading' && `${upload.progress} %`}
                  {upload.status === 'processing' && 'Traitement…'}
                  {upload.status === 'error' && 'Échec'}
                </span>
              </div>
              {upload.status === 'error' ? (
                <p className="flex items-start gap-1.5 text-sm text-danger">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {upload.error}
                </p>
              ) : (
                <div
                  role="progressbar"
                  aria-label={`Envoi de ${upload.file.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={upload.progress}
                  className="h-1.5 overflow-hidden rounded-full bg-raised"
                >
                  <div
                    className="h-full origin-left rounded-full bg-lime transition-transform duration-150 ease-out"
                    style={{ transform: `scaleX(${upload.progress / 100})` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {images.length === 0 ? (
        <p className="text-sm text-fg-muted">Aucune photo : le catalogue affiche une silhouette.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Photos de la voiture">
          {images.map((image, index) => (
            <li
              key={image.id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move'
                setDragging(index)
              }}
              onDragEnd={() => setDragging(null)}
              onDragOver={(event) => dragging !== null && event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                drop(index)
              }}
              className={cn(
                'flex flex-col overflow-hidden rounded-card border bg-surface transition-opacity duration-150',
                image.is_primary ? 'border-line-strong' : 'border-line',
                dragging === index && 'opacity-50',
              )}
            >
              <div className="relative aspect-[16/10] cursor-grab bg-raised active:cursor-grabbing">
                <img
                  src={image.thumbnail_url}
                  alt=""
                  width="800"
                  height="500"
                  loading="lazy"
                  className="size-full object-cover"
                />
                <span className="absolute top-2 left-2 flex gap-1.5">
                  <Badge tone="neutral" className="bg-canvas/80 tabular-nums">
                    {index + 1}
                  </Badge>
                  {image.is_primary && (
                    <Badge tone="lime" icon={Star}>
                      Principale
                    </Badge>
                  )}
                </span>
              </div>
              <div className="flex flex-col gap-3 p-3">
                <AltField
                  image={image}
                  onSave={(alt) =>
                    run(
                      { type: 'update', imageId: image.id, patch: { alt } },
                      'Texte alternatif enregistré',
                    )
                  }
                />
                <p className="text-xs text-fg-subtle">
                  Photo : {image.author ?? 'auteur inconnu'}
                  {image.license && `, ${image.license}`}
                </p>
                <div className="flex items-center gap-1">
                  <IconButton
                    icon={ArrowLeft}
                    label={`Avancer la photo ${index + 1}`}
                    size="sm"
                    variant="ghost"
                    disabled={index === 0 || action.isPending}
                    onClick={() => move(index, -1)}
                  />
                  <IconButton
                    icon={ArrowRight}
                    label={`Reculer la photo ${index + 1}`}
                    size="sm"
                    variant="ghost"
                    disabled={index === images.length - 1 || action.isPending}
                    onClick={() => move(index, 1)}
                  />
                  {!image.is_primary && (
                    <Tooltip content="Définir comme principale">
                      <IconButton
                        icon={Star}
                        label={`Définir la photo ${index + 1} comme principale`}
                        size="sm"
                        variant="ghost"
                        disabled={action.isPending}
                        onClick={() =>
                          run(
                            { type: 'update', imageId: image.id, patch: { is_primary: true } },
                            'Photo principale modifiée',
                          )
                        }
                      />
                    </Tooltip>
                  )}
                  <IconButton
                    icon={Trash2}
                    label={`Supprimer la photo ${index + 1}`}
                    size="sm"
                    variant="ghost"
                    className="ml-auto text-danger"
                    onClick={() => setToDelete(image)}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() =>
          action.mutate(
            { type: 'delete', imageId: toDelete.id },
            {
              onSuccess: () => {
                toast.success('Photo supprimée')
                setToDelete(null)
              },
              onError: (error) =>
                toast.error('La suppression a échoué', { description: apiErrorMessage(error) }),
            },
          )
        }
        loading={action.isPending}
        tone="danger"
        title="Supprimer cette photo ?"
        description="Le fichier est effacé du serveur. Cette action est définitive."
        confirmLabel="Supprimer la photo"
      />
    </div>
  )
}

/** Alt text, saved when the field loses the focus (or on Enter) if it changed. */
function AltField({ image, onSave }) {
  const [value, setValue] = useState(image.alt ?? '')
  const [saved, setSaved] = useState(image.alt ?? '')
  if ((image.alt ?? '') !== saved) {
    setSaved(image.alt ?? '')
    setValue(image.alt ?? '')
  }

  function commit() {
    if (value.trim() !== saved) onSave(value.trim() || null)
  }

  return (
    <Input
      label="Texte alternatif"
      value={value}
      maxLength={255}
      placeholder="Marque, modèle, année, vue"
      onChange={(event) => setValue(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          commit()
        }
      }}
    />
  )
}
