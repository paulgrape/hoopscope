import {ShotHeatmapSandbox} from '@/components/shot-heatmap-sandbox'
import {createPageMetadata} from '@/lib/site'

export const metadata = createPageMetadata({
  title: 'Shot Heatmap Sandbox',
  description:
    'Sandbox page rendering cached NBA shot charts as hex and cloud heatmaps vs league averages.',
  path: '/sandbox/shot-heatmap',
})

export default function ShotHeatmapSandboxPage() {
  return <ShotHeatmapSandbox />
}
