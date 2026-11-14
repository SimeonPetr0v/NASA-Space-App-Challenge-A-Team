import { ClosingBand, HazardGrid, VitalsMarquee } from '@/components/ShowcaseSections'
import { NameOrigins } from '@/components/NameOrigins'
import { SpaceHero } from '@/components/SpaceHero'
import { Page } from '@/shell/Page'

/*
  Mission brief: the story page for judges, the demo video and first-time users.
  Kept apart from the Overview so the daily tool opens straight onto status
  and action instead of a landing page.
*/
export function Brief() {
  return (
    <>
      <SpaceHero />
      <VitalsMarquee />
      <Page className="grid grid-cols-[minmax(0,1fr)] gap-16 pt-16 pb-20">
        <HazardGrid />
        <NameOrigins />
      </Page>
      <ClosingBand />
    </>
  )
}
