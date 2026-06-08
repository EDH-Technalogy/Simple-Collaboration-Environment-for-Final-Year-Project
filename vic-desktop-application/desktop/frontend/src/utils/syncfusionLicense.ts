import { registerLicense } from '@syncfusion/ej2-base'

const key =
  import.meta.env.VITE_SYNCFUSION_LICENSE_KEY ||
  import.meta.env.VITE_DOCS_API_KEY ||
  ''

if (String(key).trim()) {
  registerLicense(String(key).trim())
} else {
  console.warn('[syncfusion] Set VITE_SYNCFUSION_LICENSE_KEY or VITE_DOCS_API_KEY.')
}
