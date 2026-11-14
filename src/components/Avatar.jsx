import { useState } from 'react'
import { initialsOf } from '../lib/format'

const SIZES = {
  sm: 'size-9 text-label-md',
  md: 'size-12 text-label-lg',
  lg: 'size-24 text-headline-sm',
}


export default function Avatar({ user, size = 'sm', className = '' }) {
  const url = user?.profile_pic_url
  const [brokenUrl, setBrokenUrl] = useState(null)
  const box = `${SIZES[size]} shrink-0 rounded-full ${className}`

  if (url && brokenUrl !== url) {
    return <img src={url} alt="" onError={() => setBrokenUrl(url)} className={`${box} object-cover`} />
  }
  return (
    <span
      aria-hidden="true"
      className={`${box} flex items-center justify-center bg-linear-to-br from-primary-container to-primary font-display font-bold text-white`}
    >
      {initialsOf(user?.first_name, user?.last_name)}
    </span>
  )
}