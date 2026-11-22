import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import IconButton from './IconButton.jsx'
import { Input } from './Input.jsx'

/**
 * Password field with a show/hide toggle. Same API as <Input> (label, errors, name…).
 * The toggle is a real button with a French label and `aria-pressed`.
 *
 * @example <PasswordInput label="Mot de passe" name="password" autoComplete="current-password" errors={error} />
 */
export default function PasswordInput(props) {
  const [visible, setVisible] = useState(false)

  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      spellCheck={false}
      trailing={
        <IconButton
          icon={visible ? EyeOff : Eye}
          label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          aria-pressed={visible}
          variant="ghost"
          size="sm"
          onClick={() => setVisible((value) => !value)}
        />
      }
    />
  )
}
