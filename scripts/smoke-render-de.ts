import { writeFileSync } from 'fs'
import { fillTemplateSvg, renderSvgToPng } from '../packages/ai/src/image-templates/render'

async function main() {
  const svg = fillTemplateSvg(
    'banner',
    {
      headline: 'WIR STELLEN EIN',
      subhead: 'UK REMOTE-STELLEN SOFTWARE ENGINEER',
    },
    'de'
  )
  const png = await renderSvgToPng(svg, 'de')
  writeFileSync('/tmp/snapforge-de-test.png', png)
  console.log('png_bytes', png.length)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
