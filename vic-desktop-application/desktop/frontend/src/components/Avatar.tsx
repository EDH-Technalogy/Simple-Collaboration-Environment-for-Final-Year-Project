import { useEffect, useState } from 'react'
import { UserRound } from 'lucide-react'

type AvatarProps = {
  src?: string | null
  alt?: string
  initials?: string
  className?: string
  sizeClass?: string
}

export default function Avatar({ src = null, alt = '', initials = '', className = '', sizeClass = '' }: AvatarProps) {
  const label = String(initials ?? '').trim().slice(0, 3).toUpperCase()
  const url = typeof src === 'string' && src.trim() ? src.trim() : null
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    setBroken(false)
  }, [url])

  const showImg = Boolean(url && !broken)

  return (
    <span className={['fp-avatar', sizeClass, className].filter(Boolean).join(' ')}>
      {showImg ? <img src={url || ''} alt={alt} onError={() => setBroken(true)} /> : null}
      {!showImg ? <span>{label && label !== '?' ? label : <UserRound size={18} strokeWidth={1.8} aria-hidden />}</span> : null}
    </span>
  )
}
