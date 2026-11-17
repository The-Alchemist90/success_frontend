import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy } from 'lucide-react'
import { usePrefs } from '../../lib/prefs'

function CodeBlock({ children }) {
  const { t } = usePrefs()
  const [copied, setCopied] = useState(false)
  const code = Array.isArray(children) ? children[0] : children
  const source = String(code?.props?.children ?? '').replace(/\n$/, '')
  const language = /language-([\w-]+)/.exec(code?.props?.className || '')?.[1]

  async function copy() {
    try {
      await navigator.clipboard.writeText(source)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard not available: ignore */
    }
  }
  return (
    <div className="group my-5 overflow-hidden rounded-xl bg-[#0f172a] text-slate-100 shadow-sm ring-1 ring-black/10">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="font-mono text-label-md text-slate-400">{language || 'code'}</span>
        <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-label-md text-slate-300 transition-colors hover:bg-white/10 hover:text-white">
          {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
          {copied ? t('courses.copied') : t('courses.copy')}
        </button>
      </div>
      <pre className="scroll-thin overflow-x-auto px-4 py-3.5 font-mono text-[13px] leading-6">{children}</pre>
    </div>
  )
}

const components = {
  h1: (p) => <h2 className="mb-3 mt-9 font-display text-headline-md text-on-surface first:mt-0" {...strip(p)} />,
  h2: (p) => <h2 className="mb-3 mt-9 font-display text-headline-sm text-on-surface first:mt-0" {...strip(p)} />,
  h3: (p) => <h3 className="mb-2 mt-7 font-display text-title-md text-on-surface" {...strip(p)} />,
  h4: (p) => <h4 className="mb-2 mt-6 font-display text-title-sm text-on-surface" {...strip(p)} />,
  p: (p) => <p className="my-4 text-body-lg text-on-surface" {...strip(p)} />,
  ul: (p) => <ul className="my-4 ml-1 flex list-none flex-col gap-2 text-body-lg text-on-surface [&_ul]:mt-2" {...strip(p)} />,
  ol: (p) => <ol className="my-4 ml-6 flex list-decimal flex-col gap-2 text-body-lg text-on-surface marker:font-bold marker:text-primary" {...strip(p)} />,
  li: ({ node, children, ...rest }) => (
    <li className="relative pl-6 [ol>&]:pl-1 [ol>&]:before:hidden before:absolute before:left-0 before:top-[0.7em] before:size-1.5 before:rounded-full before:bg-secondary" {...rest}>
      {children}
    </li>
  ),
  strong: (p) => <strong className="font-bold text-on-surface" {...strip(p)} />,
  em: (p) => <em className="italic" {...strip(p)} />,
  blockquote: (p) => <blockquote className="my-5 rounded-r-xl border-l-4 border-secondary bg-tertiary-fixed/60 px-5 py-1 text-on-tertiary-fixed [&>p]:text-body-md [&>p]:text-on-tertiary-fixed" {...strip(p)} />,
  hr: () => <hr className="my-8 border-outline-variant" />,
  a: ({ node, ...rest }) => <a {...rest} target="_blank" rel="noopener noreferrer nofollow ugc" className="break-words font-medium text-primary underline decoration-primary/35 underline-offset-2 hover:decoration-primary" />,
  img: ({ node, alt, ...rest }) => <img alt={alt || ''} loading="lazy" decoding="async" {...rest} className="my-5 h-auto max-w-full rounded-xl ring-1 ring-outline-variant/60" />,
  pre: CodeBlock,
  code: ({ node, className, children, ...rest }) => {
    const block = /language-/.test(className || '') || String(children).includes('\n')
    return block ? (
      <code className={className} {...rest}>{children}</code>
    ) : (
      <code className="rounded-md bg-surface-high px-1.5 py-0.5 font-mono text-[0.9em] text-on-surface" {...rest}>{children}</code>
    )
  },
  table: ({ node, ...rest }) => (
    <div className="scroll-thin my-5 overflow-x-auto rounded-xl ring-1 ring-outline-variant/70">
      <table className="w-full border-collapse text-left text-body-md" {...rest} />
    </div>
  ),
  thead: (p) => <thead className="bg-surface-container" {...strip(p)} />,
  th: (p) => <th className="whitespace-nowrap px-4 py-2.5 font-display text-label-lg font-bold text-on-surface" {...strip(p)} />,
  td: (p) => <td className="border-t border-outline-variant/60 px-4 py-2.5 text-on-surface" {...strip(p)} />,
}
function strip({ node, ...rest }) {
  return rest
}

/** Lesson text (Markdown). Raw HTML is NOT enabled: a lesson can never run a script. */
export default function Markdown({ children }) {
  return (
    <div className="max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}