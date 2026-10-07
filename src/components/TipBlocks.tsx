import type { TipBlock } from '../lib/tipsTypes'
import './TipBlocks.css'

function SafeImg({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        e.currentTarget.style.display = 'none'
      }}
    />
  )
}

export function TipBlocks({ blocks }: { blocks: TipBlock[] }) {
  if (!blocks.length) return null

  return (
    <div className="tip-blocks">
      {blocks.map((block) => {
        const p = block.payload
        switch (block.block_type) {
          case 'intro':
            return (
              <p key={block.id} className="tip-blocks__intro">
                {p.text}
              </p>
            )
          case 'text':
            return (
              <p key={block.id} className="tip-blocks__text">
                {p.text}
              </p>
            )
          case 'image':
            if (!p.url) return null
            return (
              <figure key={block.id} className="tip-blocks__figure">
                <SafeImg src={p.url} alt={p.caption || ''} />
                {p.caption ? (
                  <figcaption>{p.caption}</figcaption>
                ) : null}
              </figure>
            )
          case 'tip':
            return (
              <aside key={block.id} className="tip-blocks__callout tip-blocks__callout--tip">
                <p className="tip-blocks__callout-label">{p.title || 'Tips'}</p>
                <p>{p.text}</p>
              </aside>
            )
          case 'warning':
            return (
              <aside
                key={block.id}
                className="tip-blocks__callout tip-blocks__callout--warning"
              >
                <p className="tip-blocks__callout-label">
                  {p.title || 'Unngå'}
                </p>
                <p>{p.text}</p>
              </aside>
            )
          case 'quote':
            return (
              <blockquote key={block.id} className="tip-blocks__quote">
                <p>«{p.text}»</p>
                {p.cite ? <cite>— {p.cite}</cite> : null}
              </blockquote>
            )
          case 'steps':
          case 'checklist':
          case 'equipment':
          case 'pro_tips':
          case 'not_needed': {
            const items = p.items ?? []
            if (!items.length) return null
            const ordered = block.block_type === 'steps'
            const ListTag = ordered ? 'ol' : 'ul'
            return (
              <section
                key={block.id}
                className={`tip-blocks__list tip-blocks__list--${block.block_type}`}
              >
                {p.title ? <h2>{p.title}</h2> : null}
                <ListTag>
                  {items.map((item, i) => (
                    <li key={`${block.id}-${i}`}>{item}</li>
                  ))}
                </ListTag>
              </section>
            )
          }
          default:
            return null
        }
      })}
    </div>
  )
}
