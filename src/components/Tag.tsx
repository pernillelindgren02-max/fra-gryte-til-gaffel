import type { ReactNode } from 'react'
import './Tag.css'

interface TagProps {
  children: ReactNode
  variant?: 'default' | 'primus'
}

export function Tag({ children, variant = 'default' }: TagProps) {
  return <span className={`tag tag--${variant}`}>{children}</span>
}
