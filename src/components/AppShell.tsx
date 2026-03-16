import { Link } from 'react-router-dom'

export function AppShell(props: { title?: string; children: React.ReactNode }) {
  const { title = '上海攀岩信息', children } = props

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <Link
            to="/"
            className="rounded-xl px-2 py-1 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            {title}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-4">{children}</main>
    </div>
  )
}

