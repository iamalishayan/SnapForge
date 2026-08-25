/**
 * Must load BEFORE sharp/librsvg. fontconfig reads FONTCONFIG_PATH at init.
 * Ensures a writable fonts dir exists; TTFs are filled lazily by ensureFontsForLanguage.
 */
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

const CACHE_DIR = join(tmpdir(), 'snapforge-fonts')

if (!existsSync(CACHE_DIR)) {
  mkdirSync(CACHE_DIR, { recursive: true })
}

const confPath = join(CACHE_DIR, 'fonts.conf')
writeFileSync(
  confPath,
  `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">
<fontconfig>
  <dir>${CACHE_DIR}</dir>
  <dir>/usr/share/fonts</dir>
  <dir>/usr/local/share/fonts</dir>
  <cachedir>${join(CACHE_DIR, 'cache')}</cachedir>
</fontconfig>
`,
  'utf-8'
)

process.env.FONTCONFIG_PATH = CACHE_DIR
process.env.FONTCONFIG_FILE = confPath
