import { Maximize2 } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { BodyRegion, Status } from '@/engine/types'

const Body3D = lazy(() => import('./Body3D'))

const hasWebGL = () => {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

type Props = {
  theme: 'day' | 'night'
  statusByRegion: Record<BodyRegion, Status>
  selected: BodyRegion | null
  onSelect: (region: BodyRegion | null) => void
}

export function BodyStage({ theme, statusByRegion, selected, onSelect }: Props) {
  const [webgl] = useState(hasWebGL)

  return (
    <section aria-label="Body" className="relative h-[60svh] min-h-[22rem] w-full lg:h-full">
      {webgl ? (
        <Suspense fallback={<p className="text-muted-foreground p-6 text-sm">Loading body model…</p>}>
          <Body3D theme={theme} statusByRegion={statusByRegion} selected={selected} onSelect={onSelect} />
        </Suspense>
      ) : (
        <p className="text-muted-foreground p-6 text-sm">The 3D body needs WebGL, which this device doesn't support. Use the readings list.</p>
      )}

      {selected && (
        <Button variant="outline" size="sm" className="bg-card absolute top-4 left-4 min-h-9" onClick={() => onSelect(null)}>
          <Maximize2 size={14} aria-hidden="true" />
          Whole body
        </Button>
      )}

      <p className="text-muted-foreground pointer-events-none absolute bottom-3 left-4 hidden text-xs xl:block">Drag to rotate · scroll to zoom · select an organ</p>
      <p className="text-muted-foreground absolute right-4 bottom-3 left-4 text-right text-[11px] leading-snug xl:left-auto xl:max-w-[55%]">
        Body model:{' '}
        <a className="underline underline-offset-2" href="https://humanatlas.io/3d-reference-library" target="_blank" rel="noreferrer">
          HuBMAP Human Reference Atlas
        </a>
        ; ribs and heart vessels:{' '}
        <a className="underline underline-offset-2" href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/" target="_blank" rel="noreferrer">
          BodyParts3D © DBCLS
        </a>
        , CC BY 4.0
      </p>
    </section>
  )
}
