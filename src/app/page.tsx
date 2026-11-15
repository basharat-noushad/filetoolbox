import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight, ArrowUpRight, Check, Minus, Monitor, MousePointerClick, Plus, Server, Download, Search,
  GraduationCap, Briefcase, IdCard, Palette,
} from 'lucide-react'
import { tools } from '@/lib/toolsRegistry'
import { BLOG_POSTS } from '@/lib/blogPosts'
import { MotionRoot } from '@/components/home-v2/MotionRoot'
import { Reveal } from '@/components/home-v2/Reveal'
import { CountUp } from '@/components/home-v2/CountUp'
import { HeroDemo } from '@/components/home-v2/HeroDemo'
import { PrivacyPulse } from '@/components/home-v2/PrivacyPulse'
import { HeroSearch } from '@/components/home-v2/HeroSearch'
import { PopularTools } from '@/components/home-v2/PopularTools'
import { AllTools } from '@/components/home-v2/AllTools'
import { Showcase } from '@/components/home-v2/Showcase'
import { HYBRID_SLUGS, POPULAR_SLUGS, SERVER_SLUGS, type ToolItem } from '@/components/home-v2/data'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfandimage.com').replace(/\/$/, '')
const DESCRIPTION = `Free online PDF and image tools: ${tools.length} tools to merge, compress, convert, crop, resize and more. No sign-up, no watermarks. Most run in your browser.`

export const metadata: Metadata = withSocialMetadata({
  title: { absolute: 'PDF and Image — Free PDF & Image Tools Online' },
  description: DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: { title: 'PDF and Image — Free PDF & Image Tools Online', description: DESCRIPTION, url: SITE_URL },
}, '/')

const items: ToolItem[] = tools.map(t => ({
  slug: t.slug, name: t.name, description: t.description,
  category: t.category, server: SERVER_SLUGS.has(t.slug),
}))
const bySlug = (s: string) => items.find(t => t.slug === s)!
const pick = (slugs: readonly string[]) => slugs.map(bySlug).filter(Boolean)

const total = items.length
const pdfCount = items.filter(t => t.category === 'pdf').length
const imageCount = total - pdfCount
const serverTools = items.filter(t => t.server)
const browserCount = total - serverTools.length

// ── ItemList schema — AIO/GEO: tells AI models exactly what tools exist ───────
const toolListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Free PDF and Image Tools',
  description: 'Complete list of free online PDF and image processing tools on PDF and Image',
  url: SITE_URL,
  numberOfItems: tools.length,
  itemListElement: tools.map((tool, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: tool.name,
    description: tool.description,
    url: `${SITE_URL}/${tool.slug}`,
    item: {
      '@type': 'SoftwareApplication',
      name: tool.name,
      url: `${SITE_URL}/${tool.slug}`,
      applicationCategory: tool.category === 'pdf' ? 'PDF Tool' : 'Image Tool',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  })),
}

const FAQS = [
  { q: 'Are my files uploaded to a server?', a: `Most tools (${browserCount} of ${total}) run in your browser, so the file stays on your device. Remove Background sends the photo to a server. Word, Excel and PowerPoint conversions run in your browser first and only use a server for scanned or complex files, and they tell you before that happens.` },
  { q: 'Do I need an account or a subscription?', a: 'No. There is no sign-up and no paid tier. Pick a tool and use it.' },
  { q: 'Will my file get a watermark?', a: 'We do not add one. Always check the result before you send it on.' },
  { q: 'Is there a file size limit?', a: 'Browser tools are limited by your device memory and speed, so very large files can be slow or fail. Limits and tips are listed on each tool page.' },
  { q: 'Does it work on a phone?', a: 'Yes, in current mobile browsers. Heavy jobs such as AI upscaling or long PDFs can be slow on older phones.' },
  { q: 'How is it free?', a: 'The site is supported by display advertising rather than subscriptions or paywalled features.' },
  { q: 'Can I trust the output for official forms?', a: 'Tools like Passport Photo Maker and Compress PDF help you meet common requirements, but rules differ by country and portal. Check the requirements of the form you are filling in.' },
  { q: 'How do I find the right tool?', a: 'Type what you want to do into the search box, such as “merge” or “HEIC”, or filter the full list by PDF and image. The guides explain common jobs step by step.' },
]

const faqSchema = {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
}

const USE_CASES = [
  { who: 'Students', icon: GraduationCap, text: 'Combine lecture notes, shrink scans to fit a submission portal and pull text out of a photo of the whiteboard.', slugs: ['merge-pdf', 'image-to-text', 'pdf-to-word', 'compress-pdf'] },
  { who: 'Office and business', icon: Briefcase, text: 'Sign contracts, password-protect a PDF, turn Word files into PDFs and keep email attachments small.', slugs: ['sign-pdf', 'protect-pdf', 'word-to-pdf', 'compress-pdf'] },
  { who: 'Forms, visas and ID', icon: IdCard, text: 'Make a passport photo, get a PDF under the upload limit and turn phone photos into a single document.', slugs: ['passport-photo-maker', 'compress-pdf', 'jpg-to-pdf', 'resize-image'] },
  { who: 'Designers and developers', icon: Palette, text: 'Cut out backgrounds, export WebP, convert SVG to PNG and generate favicons and QR codes.', slugs: ['remove-background', 'image-to-webp', 'svg-to-png', 'favicon-generator'] },
]

const COMPARE = [
  ['Account needed', 'Often', 'No sign-up'],
  ['Watermark on the result', 'Sometimes, unless you pay', 'None added'],
  ['Where your file goes', 'Usually uploaded', `Stays on your device for ${browserCount} of ${total} tools`],
  ['Daily limits', 'Common', 'None'],
  ['Cost', 'Free tier, then a plan', 'Free'],
]

const guides = [...BLOG_POSTS].sort((a, b) => b.datePublished.localeCompare(a.datePublished)).slice(0, 4)

const h2 = 'text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 text-balance'
const lede = 'mt-3 max-w-[62ch] text-base sm:text-lg leading-relaxed text-gray-700'
const wrap = 'mx-auto w-full max-w-6xl px-4 sm:px-6'
const sec = 'py-16 sm:py-24'

export default function HomePage() {
  return (
    <MotionRoot>
      <style>{`
        @keyframes hv2-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        .hv2-rise{animation:hv2-rise .7s cubic-bezier(.16,1,.3,1) both;animation-delay:var(--d,0s)}
        .hv2-h1{animation:hv2-h1 .8s cubic-bezier(.16,1,.3,1) both}
        @keyframes hv2-h1{from{transform:translateY(16px)}to{transform:none}}
        @keyframes hv2-glide{0%{transform:translateX(0);opacity:0}12%{opacity:1}55%{transform:translateX(100px);opacity:1}62%,100%{transform:translateX(100px);opacity:0}}
        @keyframes hv2-ring{0%,52%{transform:scale(.9);opacity:0}58%{opacity:.45}100%{transform:scale(1.45);opacity:0}}
        .hv2-glide{opacity:0;animation:hv2-glide 4s cubic-bezier(.4,0,.2,1) infinite paused}
        .hv2-ring{opacity:0;animation:hv2-ring 4s ease-out infinite paused}
        [data-run=true] .hv2-glide,[data-run=true] .hv2-ring{animation-play-state:running}
        @media (prefers-reduced-motion:reduce){.hv2-rise,.hv2-h1,.hv2-glide,.hv2-ring{animation:none}}
      `}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolListSchema) }} />

      <main className="overflow-x-clip">
        {/* 1. Hero */}
        <section className="relative">
          <div className={`${wrap} grid items-center gap-10 pb-12 pt-10 sm:pt-14 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14 lg:pb-16 lg:pt-14`}>
            <div>
              <h1 className="hv2-h1 text-[2.5rem] font-bold leading-[1.04] tracking-tight text-gray-900 sm:text-5xl lg:text-[3.5rem]">
                Free <span className="text-brand-600">PDF</span> and{' '}
                <span className="text-emerald-700">image</span> tools that run in your browser.
              </h1>
              <p className="hv2-rise mt-5 max-w-[48ch] text-lg leading-relaxed text-gray-700" style={{ '--d': '.12s' } as React.CSSProperties}>
                {total} tools to merge, compress, convert and edit files. No sign-up, no watermarks. Most never leave your device.
              </p>
              <div className="hv2-rise mt-7 max-w-xl" style={{ '--d': '.22s' } as React.CSSProperties}>
                <HeroSearch items={items} total={total} />
                <p className="mt-4 text-sm text-gray-700">
                  Or{' '}
                  <a href="#directory" className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 rounded">
                    browse all {total} tools
                  </a>
                  . Popular: {pick(['merge-pdf', 'compress-pdf', 'pdf-to-word']).map((t, i) => (
                    <span key={t.slug}>{i > 0 && ', '}<Link href={`/${t.slug}`} className="font-medium text-gray-900 hover:text-brand-700 rounded focus-visible:outline-2 focus-visible:outline-brand-600">{t.name}</Link></span>
                  ))}.
                </p>
              </div>
            </div>
            <div className="hv2-rise" style={{ '--d': '.3s' } as React.CSSProperties}>
              <HeroDemo />
            </div>
          </div>

          {/* trust strip */}
          <div className="border-y border-brand-100 bg-white">
            <ul className={`${wrap} grid grid-cols-2 gap-y-3 py-4 md:grid-cols-4 md:divide-x md:divide-brand-100`}>
              {['No sign-up', 'No watermarks', 'Free to use', `${browserCount} tools run in your browser`].map(t => (
                <li key={t} className="flex items-center gap-2.5 text-sm font-semibold text-gray-900 md:justify-center md:px-4">
                  <Check className="h-4 w-4 shrink-0 text-emerald-700" strokeWidth={2.75} aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 2. Popular */}
        <section className={sec} aria-labelledby="popular-h">
          <div className={wrap}>
            <Reveal>
              <h2 id="popular-h" className={h2}>Start with what people use most</h2>
              <p className={lede}>Eight tools cover most everyday file jobs.</p>
            </Reveal>
            <div className="mt-10"><PopularTools items={pick(POPULAR_SLUGS) as ToolItem[]} /></div>
          </div>
        </section>

        {/* 3. How it works */}
        <section className="border-y border-brand-100 bg-white py-16 sm:py-20" aria-labelledby="how-h">
          <div className={wrap}>
            <Reveal><h2 id="how-h" className={h2}>Three moves, no account</h2></Reveal>
            <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              <span className="pointer-events-none absolute left-[2.1rem] right-[20%] top-7 hidden border-t-2 border-dashed border-brand-200 md:block" aria-hidden />
              {[
                { i: Search, t: 'Pick a tool', d: `Search or browse ${total} tools for merging, compressing, converting, cropping, signing and more.` },
                { i: MousePointerClick, t: 'Add your file', d: 'Drop it in. Most tools open it right in your browser, so there is nothing to install.' },
                { i: Download, t: 'Download the result', d: 'Check it, then save it. No account to create and no watermark added by us.' },
              ].map((s, k) => (
                <li key={s.t} className="relative">
                  <Reveal delay={k * 0.1}>
                    <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
                      <s.i className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                    </span>
                    <h3 className="mt-5 text-xl font-bold text-gray-900">{s.t}</h3>
                    <p className="mt-2 max-w-[38ch] leading-relaxed text-gray-700">{s.d}</p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 4. Directory */}
        <section id="directory" className={`${sec} scroll-mt-24`} aria-labelledby="dir-h">
          <div className={wrap}>
            <Reveal>
              <h2 id="dir-h" className={h2}>All {total} tools</h2>
              <p className={lede}>{pdfCount} for PDF, {imageCount} for images. Filter by type or type a few letters.</p>
            </Reveal>
            <div className="mt-8"><AllTools items={items} /></div>
          </div>
        </section>

        {/* 5. Showcase */}
        <section className="border-y border-brand-100 bg-brand-50/50 py-16 sm:py-24" aria-labelledby="show-h">
          <div className={wrap}>
            <Reveal>
              <h2 id="show-h" className={h2}>Small tools with real depth</h2>
              <p className={lede}>Beyond merge and compress, some tools go further than you might expect.</p>
            </Reveal>
            <div className="mt-10">
              <Showcase items={pick(['passport-photo-maker', 'compress-pdf', 'qr-code-generator', 'sign-pdf', 'blur-image'])} />
            </div>
          </div>
        </section>

        {/* 6. Privacy */}
        <section id="privacy" className={`${sec} scroll-mt-24`} aria-labelledby="priv-h">
          <div className={wrap}>
            <Reveal>
              <h2 id="priv-h" className={h2}>Your files, handled honestly</h2>
              <p className={lede}>Where a file is processed depends on the tool. Here is the split, with no rounding up.</p>
            </Reveal>
            <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
              <Reveal>
                <div className="relative h-full rounded-3xl border border-brand-100 bg-white p-6 sm:p-8">
                  <PrivacyPulse />
                  <div className="flex items-center gap-3 text-brand-700">
                    <Monitor className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                    <h3 className="text-lg font-bold">On your device</h3>
                  </div>
                  <p className="mt-6 text-7xl font-bold leading-none tracking-tight text-gray-900 tabular-nums">{browserCount}</p>
                  <p className="mt-2 text-lg font-semibold text-gray-900">of {total} tools run in your browser</p>
                  <p className="mt-3 max-w-[52ch] leading-relaxed text-gray-700">
                    Merging, compressing, cropping, signing, OCR and most conversions happen locally using your browser. The file is not sent to our servers to do the work.
                  </p>
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <div className="h-full rounded-3xl border border-dashed border-gray-400 bg-white p-6 sm:p-8">
                  <div className="flex items-center gap-3 text-gray-900">
                    <Server className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                    <h3 className="text-lg font-bold">When a server is used</h3>
                  </div>
                  <p className="mt-6 text-5xl font-bold leading-none tracking-tight text-gray-900 tabular-nums">{serverTools.length}</p>
                  <p className="mt-2 font-semibold text-gray-900">tool always uses a server: Remove Background</p>
                  <p className="mt-3 leading-relaxed text-gray-700">Word, Excel and PowerPoint conversions run in your browser first and only use a server for scanned or complex files. You see a notice before any file leaves your device.</p>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {items.filter(t => t.server || HYBRID_SLUGS.has(t.slug)).map(t => (
                      <li key={t.slug}>
                        <Link href={`/${t.slug}`} className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-brand-600">{t.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 7. Use cases */}
        <section className="border-y border-brand-100 bg-white py-16 sm:py-24" aria-labelledby="use-h">
          <div className={wrap}>
            <Reveal><h2 id="use-h" className={h2}>Built for the jobs you actually have</h2></Reveal>
            <ul className="mt-10 divide-y divide-gray-200 border-y border-gray-200">
              {USE_CASES.map((u, k) => (
                <li key={u.who}>
                  <Reveal delay={k * 0.05} className="grid gap-4 py-7 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:gap-10">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><u.icon className="h-5 w-5" strokeWidth={1.75} aria-hidden /></span>
                      <h3 className="text-xl font-bold text-gray-900">{u.who}</h3>
                    </div>
                    <div>
                      <p className="max-w-[60ch] leading-relaxed text-gray-700">{u.text}</p>
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {pick(u.slugs).map(t => (
                          <li key={t.slug}>
                            <Link href={`/${t.slug}`} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-semibold hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-brand-600 ${t.category === 'pdf' ? 'border-brand-200 text-brand-700' : 'border-emerald-200 text-emerald-700'}`}>
                              {t.name} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 8. Compare */}
        <section className={sec} aria-labelledby="cmp-h">
          <div className={wrap}>
            <Reveal>
              <h2 id="cmp-h" className={h2}>What changes when nobody asks you to sign up</h2>
              <p className={lede}>A general comparison with how many online file tools work, not a claim about any one site.</p>
            </Reveal>
            <Reveal className="mt-10">
              <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
                <table className="w-full border-collapse text-left text-sm sm:text-base">
                  <caption className="sr-only">Typical online file tools compared with PDF and Image</caption>
                  <thead>
                    <tr className="bg-gray-50">
                      <th scope="col" className="px-4 py-4 font-semibold text-gray-700 sm:px-6"><span className="sr-only">Feature</span></th>
                      <th scope="col" className="px-3 py-4 font-semibold text-gray-700 sm:px-6">Typical online tools</th>
                      <th scope="col" className="bg-brand-600 px-3 py-4 font-bold text-white sm:px-6">PDF and Image</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE.map(([k, a, b]) => (
                      <tr key={k} className="border-t border-gray-200 align-top">
                        <th scope="row" className="px-4 py-4 font-semibold text-gray-900 sm:px-6">{k}</th>
                        <td className="px-3 py-4 text-gray-700 sm:px-6"><span className="flex gap-2"><Minus className="mt-1 h-4 w-4 shrink-0 text-gray-500" aria-hidden />{a}</span></td>
                        <td className="bg-brand-50/60 px-3 py-4 font-semibold text-gray-900 sm:px-6"><span className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-700" strokeWidth={2.75} aria-hidden />{b}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          </div>
        </section>

        {/* 9. Stats */}
        <section className="border-y border-brand-100 bg-white py-14 sm:py-16" aria-label="The toolkit in numbers">
          <dl className={`${wrap} grid grid-cols-2 gap-y-10 lg:grid-cols-4 lg:divide-x lg:divide-gray-200`}>
            {[
              { n: total, l: 'free tools', c: 'text-gray-900' },
              { n: pdfCount, l: 'PDF tools', c: 'text-brand-600' },
              { n: imageCount, l: 'image tools', c: 'text-emerald-700' },
              { n: browserCount, l: 'run in your browser', c: 'text-gray-900' },
            ].map(s => (
              <div key={s.l} className="lg:px-8 lg:first:pl-0">
                <dd className={`order-1 text-6xl font-bold leading-none tracking-tight tabular-nums sm:text-7xl ${s.c}`}><CountUp to={s.n} /></dd>
                <dt className="mt-3 text-base font-semibold text-gray-700">{s.l}</dt>
              </div>
            ))}
          </dl>
        </section>

        {/* 10. Guides */}
        <section className={sec} aria-labelledby="guides-h">
          <div className={wrap}>
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="guides-h" className={h2}>Guides for the tricky bits</h2>
                <p className={lede}>Plain-language walkthroughs for common file problems.</p>
              </div>
              <Link href="/blog" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
                All guides <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Reveal>
            <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
              <Reveal>
                <Link href={`/blog/${guides[0].slug}`} className="group flex h-full flex-col justify-between rounded-3xl bg-brand-600 p-6 text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:p-8">
                  <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{guides[0].category} · {guides[0].readTime}</span>
                  <span className="mt-16 block">
                    <span className="block text-2xl font-bold leading-snug text-balance sm:text-3xl">{guides[0].title}</span>
                    <span className="mt-3 line-clamp-3 block max-w-[52ch] leading-relaxed text-white/90">{guides[0].excerpt}</span>
                    <span className="mt-5 inline-flex items-center gap-1.5 font-semibold">Read guide <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                  </span>
                </Link>
              </Reveal>
              <ul className="flex flex-col gap-4">
                {guides.slice(1).map((g, k) => (
                  <li key={g.slug} className="flex-1">
                    <Reveal delay={0.08 * (k + 1)} className="h-full">
                      <Link href={`/blog/${g.slug}`} className="group flex h-full flex-col justify-center rounded-3xl border border-gray-200 bg-white p-5 transition-colors hover:border-brand-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:p-6">
                        <span className={`text-xs font-bold ${g.category === 'PDF Guide' ? 'text-brand-700' : 'text-emerald-700'}`}>{g.category} · {g.readTime}</span>
                        <span className="mt-1.5 block text-lg font-bold leading-snug text-gray-900 group-hover:text-brand-700">{g.title}</span>
                      </Link>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 11. FAQ */}
        <section className="border-y border-brand-100 bg-white py-16 sm:py-24" aria-labelledby="faq-h">
          <div className={`${wrap} grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16`}>
            <Reveal>
              <h2 id="faq-h" className={h2}>Questions people ask first</h2>
              <p className={lede}>Short, direct answers. More detail lives on each tool page.</p>
            </Reveal>
            <div className="divide-y divide-gray-200 border-y border-gray-200">
              {FAQS.map(f => (
                <details key={f.q} className="group py-1">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded py-3 text-left text-base font-semibold text-gray-900 marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <Plus className="h-5 w-5 shrink-0 text-brand-600 transition-transform duration-300 group-open:rotate-45" aria-hidden />
                  </summary>
                  <p className="max-w-[62ch] pb-4 leading-relaxed text-gray-700">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 12. Final CTA */}
        <section className={sec}>
          <Reveal className={wrap}>
            <div className="rounded-3xl bg-brand-900 px-6 py-14 text-center sm:px-12 sm:py-20 lg:text-left">
              <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl">Got a file? Start with the job in front of you.</h2>
                  <p className="mx-auto mt-3 max-w-[50ch] text-lg leading-relaxed text-brand-200 lg:mx-0">Free, no account, and most files never leave your device.</p>
                </div>
                <div className="flex flex-col items-center gap-4 lg:items-end">
                  <Link href="/merge-pdf" className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-bold text-brand-900 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                    Merge PDF files <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-semibold text-brand-200 lg:justify-end">
                    {pick(['compress-image', 'remove-background', 'qr-code-generator']).map(t => (
                      <li key={t.slug}><Link href={`/${t.slug}`} className="underline decoration-brand-400 underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-white rounded">{t.name}</Link></li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
    </MotionRoot>
  )
}
