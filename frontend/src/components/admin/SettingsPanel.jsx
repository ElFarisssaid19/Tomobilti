import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useDeleteSetting, useSaveSetting, useSettings } from '../../hooks/useAdmin.js'
import { apiErrorMessage, focusFirstInvalid, isValidationError } from '../../lib/auth.js'
import { ICON_NAMES } from '../../lib/icons.js'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  Modal,
  Select,
  Switch,
  Table,
  Textarea,
} from '../ui'
import ApiIcon from './ApiIcon.jsx'

/**
 * One settings list (categories, brands, agencies or options): a table, a modal form
 * to add or edit, and a delete that the server refuses (409, French reason in a
 * toast) while the item is still in use.
 *
 * `config`: { resource, title, singular, addLabel, emptyText, deleteHint, columns, fields, empty, toForm, toPayload }
 * `fields`: [{ name, label, type: 'text'|'textarea'|'number'|'select'|'switch'|'icon', options?, hint?, info?, required?, suffix? }]
 * (`info`: a rule or consequence, shown in a tooltip next to the label)
 */
export default function SettingsPanel({ config }) {
  const { data, isPending, isError, error, refetch } = useSettings(config.resource)
  const save = useSaveSetting(config.resource)
  const remove = useDeleteSetting(config.resource)
  const [editing, setEditing] = useState(null)
  const [values, setValues] = useState(config.empty)
  const [deleting, setDeleting] = useState(null)

  function open(item) {
    save.reset()
    setEditing(item ?? 'new')
    setValues(item ? config.toForm(item) : config.empty)
  }

  function submit(event) {
    event.preventDefault()
    const form = event.currentTarget
    save.mutate(
      { id: editing === 'new' ? null : editing.id, payload: config.toPayload(values) },
      {
        onSuccess: ({ message }) => {
          toast.success(message)
          setEditing(null)
        },
        onError: (saveError) => {
          if (isValidationError(saveError)) focusFirstInvalid(form)
          else toast.error('L’enregistrement a échoué', { description: apiErrorMessage(saveError) })
        },
      },
    )
  }

  const columns = [
    ...config.columns,
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      // Stays visible while a narrow screen scrolls the table sideways.
      className: 'sticky right-0 bg-surface',
      render: (item) => (
        <span className="inline-flex gap-1">
          <IconButton
            icon={Pencil}
            label={`Modifier ${item.name}`}
            size="sm"
            variant="ghost"
            onClick={() => open(item)}
          />
          <IconButton
            icon={Trash2}
            label={`Supprimer ${item.name}`}
            size="sm"
            variant="ghost"
            className="text-danger"
            onClick={() => setDeleting(item)}
          />
        </span>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button leftIcon={Plus} onClick={() => open(null)}>
          {config.addLabel}
        </Button>
      </div>

      {isError ? (
        <ErrorState
          title={`Impossible de charger : ${config.title.toLowerCase()}`}
          error={error}
          onRetry={refetch}
        />
      ) : (
        <Table
          caption={config.title}
          columns={columns}
          rows={data ?? []}
          loading={isPending}
          empty={
            <EmptyState
              title={config.emptyText}
              glow={false}
              action={
                <Button leftIcon={Plus} onClick={() => open(null)}>
                  {config.addLabel}
                </Button>
              }
            />
          }
        />
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => !save.isPending && setEditing(null)}
        title={editing === 'new' ? config.addLabel : `Modifier ${editing?.name ?? ''}`}
        size="lg"
        onSubmit={submit}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={save.isPending}>
              Retour
            </Button>
            <Button type="submit" loading={save.isPending}>
              {editing === 'new' ? config.addLabel : 'Enregistrer'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {config.fields.map((field) => (
            <SettingField
              key={field.name}
              field={field}
              value={values[field.name]}
              errors={save.error}
              onChange={(value) => setValues((current) => ({ ...current, [field.name]: value }))}
            />
          ))}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        loading={remove.isPending}
        tone="danger"
        title={`Supprimer ${deleting?.name ?? ''} ?`}
        description={config.deleteHint}
        confirmLabel={`Supprimer ${config.singular}`}
        onConfirm={() =>
          remove.mutate(deleting.id, {
            onSuccess: ({ message }) => {
              toast.success(message)
              setDeleting(null)
            },
            onError: (deleteError) => {
              toast.error('Suppression impossible', {
                description: apiErrorMessage(deleteError),
                duration: 8000,
              })
              setDeleting(null)
            },
          })
        }
      />
    </div>
  )
}

function SettingField({ field, value, errors, onChange }) {
  const wide = field.type === 'textarea' || field.wide
  const common = {
    label: field.label,
    name: field.name,
    hint: field.hint,
    info: field.info,
    required: field.required,
    errors,
  }

  if (field.type === 'switch') {
    return (
      <Switch
        label={field.label}
        hint={field.hint}
        info={field.info}
        checked={Boolean(value)}
        onChange={onChange}
        className="sm:col-span-2"
      />
    )
  }
  if (field.type === 'select' || field.type === 'icon') {
    const options =
      field.type === 'icon'
        ? [
            { value: '', label: 'Aucune' },
            ...ICON_NAMES.map((name) => ({ value: name, label: name })),
          ]
        : field.options
    return (
      <div className="flex items-end gap-3">
        <Select
          {...common}
          options={options}
          value={value ?? ''}
          onChange={onChange}
          className="flex-1"
        />
        {field.type === 'icon' && value && (
          <span className="mb-1 grid size-10 shrink-0 place-items-center rounded-full border border-line bg-raised text-fg">
            <ApiIcon name={value} className="size-[1.125rem]" />
          </span>
        )}
      </div>
    )
  }
  if (field.type === 'textarea') {
    return (
      <Textarea
        {...common}
        rows={3}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="sm:col-span-2"
      />
    )
  }
  return (
    <Input
      {...common}
      type={field.type === 'number' ? 'number' : 'text'}
      inputMode={field.inputMode}
      suffix={field.suffix}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
      className={wide ? 'sm:col-span-2' : undefined}
    />
  )
}
