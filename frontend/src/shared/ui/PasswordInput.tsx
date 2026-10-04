import { useState, type ComponentProps } from 'react'

export function PasswordInput(props: Omit<ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false)
  return <div className="password-input">
    <input {...props} type={visible ? 'text' : 'password'} />
    <button type="button" aria-controls={props.id} aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${props.id?.includes('confirmation') ? 'confirmación de contraseña' : 'contraseña'}`} aria-pressed={visible} onClick={() => setVisible(!visible)}>
      <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{visible && <path d="m3 3 18 18"/>}</svg>
    </button>
  </div>
}
