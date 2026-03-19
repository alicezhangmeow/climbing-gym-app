type ChipVariant = 'default' | 'highlight-success' | 'highlight-warning'

export function Chip(props: {
  children: React.ReactNode
  variant?: ChipVariant
}) {
  const { variant = 'default' } = props
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'
  const styles: Record<ChipVariant, string> = {
    default:
      'border border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200',
    'highlight-success':
      'border-0 bg-emerald-500 text-white dark:bg-emerald-600',
    'highlight-warning':
      'border-0 bg-amber-500 text-white dark:bg-amber-600',
  }
  return <span className={`${base} ${styles[variant]}`}>{props.children}</span>
}

