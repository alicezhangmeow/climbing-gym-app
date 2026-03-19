import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SUGGESTIONS = [
  '周四下班去附近爬抱石，价格低一点',
  '静安附近有抱石吗',
  '周末上午能爬的馆，有顶绳的',
]

type Props = {
  onNavigate?: (question: string) => void
}

export function AskFloatingEntry(props: Props) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const navigate = useNavigate()

  const goToAsk = (question: string) => {
    const q = question.trim()
    if (!q) return
    if (props.onNavigate) {
      props.onNavigate(q)
    } else {
      navigate('/ask', { state: { question: q } })
    }
    setOpen(false)
    setInput('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    goToAsk(input)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 mx-auto max-w-md px-4 pb-4">
      {open ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              可以用这里做什么
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              aria-label="收起"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            选一个问题或输入你的问题，会为你推荐合适的岩馆
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => goToAsk(s)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-left text-sm text-zinc-800 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                {s}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入你的问题…"
              className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              去问
            </button>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white py-3 shadow-md hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">问一问</span>
          <svg className="h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}
    </div>
  )
}
