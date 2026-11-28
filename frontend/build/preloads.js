/*
 * Vite build plugin, two early fetches the hashed file names make impossible to write
 * in index.html by hand:
 *
 * 1. The main font file (Plus Jakarta Sans, latin subset, every weight in one variable
 *    file): preloaded on every page, so the text does not wait for the CSS to name it.
 *
 * 2. The home hero photo (the LCP image) before
 * React renders it. A static <link rel="preload"> in index.html would download it on
 * every route (the SPA serves the same HTML everywhere), so the build emits a tiny
 * same-origin script, loaded async from <head>, that adds the preload on "/" only.
 * Same-origin and external: allowed by a strict `script-src 'self'` CSP.
 */
const HERO = /^hero-(mobile|1280|1920|2400)$/
const MAIN_FONT = /^plus-jakarta-sans-latin-wght-normal\.woff2$/

export default function preloads() {
  let fileName = null
  let fontFile = null

  return {
    name: 'tomobilti-preloads',
    apply: 'build',
    generateBundle: {
      order: 'pre',
      handler(_options, bundle) {
        const files = {}
        for (const output of Object.values(bundle)) {
          if (output.type !== 'asset') continue
          const name = output.names?.[0] ?? output.name ?? ''
          const match = HERO.exec(name.replace(/\.webp$/, ''))
          if (match) files[match[1]] = `/${output.fileName}`
          if (MAIN_FONT.test(name)) fontFile = `/${output.fileName}`
        }
        if (!files.mobile || !files['1280']) return

        const desktop = ['1280', '1920', '2400']
          .filter((size) => files[size])
          .map((size) => `${files[size]} ${size}w`)
          .join(', ')
        const source = `(function(){if(location.pathname!=='/')return;function p(a){var l=document.createElement('link');l.rel='preload';l.as='image';l.type='image/webp';l.fetchPriority='high';for(var k in a)l.setAttribute(k,a[k]);document.head.appendChild(l)}p({href:${JSON.stringify(files.mobile)},media:'(max-width: 767.98px)'});p({imagesrcset:${JSON.stringify(desktop)},imagesizes:'100vw',media:'(min-width: 768px)'})})();\n`
        const reference = this.emitFile({ type: 'asset', name: 'hero-preload.js', source })
        fileName = this.getFileName(reference)
      },
    },
    transformIndexHtml: {
      order: 'post',
      handler() {
        return [
          fontFile && {
            tag: 'link',
            attrs: {
              rel: 'preload',
              as: 'font',
              type: 'font/woff2',
              href: fontFile,
              crossorigin: '',
            },
            injectTo: 'head',
          },
          fileName && {
            tag: 'script',
            attrs: { src: `/${fileName}`, async: true },
            injectTo: 'head',
          },
        ].filter(Boolean)
      },
    },
  }
}
