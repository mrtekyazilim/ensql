import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'white'
}

export function Logo({ className, size = 'md', variant = 'default' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-7 h-7 text-sm',
    md: 'w-9 h-9 text-base',
    lg: 'w-11 h-11 text-lg'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl'
  }

  const colorClasses = variant === 'white'
    ? 'border-white text-white'
    : 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className={`${sizeClasses[size]} rounded-full border-2 ${colorClasses} flex items-center justify-center font-bold pb-0.5`}>
        En
      </span>
      <span className={`${textSizeClasses[size]} font-bold ${variant === 'white' ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`}>
        SQL
      </span>
    </div>
  )
}
