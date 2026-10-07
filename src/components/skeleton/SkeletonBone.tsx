import type { CSSProperties } from 'react'
import './Skeleton.css'

type SkeletonBoneProps = {
  className?: string
  style?: CSSProperties
  round?: boolean
  media?: boolean
}

export function SkeletonBone({
  className = '',
  style,
  round = false,
  media = false,
}: SkeletonBoneProps) {
  const classes = [
    'sk-bone',
    round ? 'sk-bone--round' : '',
    media ? 'sk-bone--media' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <span className={classes} style={style} aria-hidden="true" />
}
