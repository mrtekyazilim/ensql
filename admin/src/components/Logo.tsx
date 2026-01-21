interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'white'
}

export function Logo({ size = 'md', variant = 'default' }: LogoProps) {
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
    : 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'

  return (
    <div className="flex items-center gap-1">
      <span className={`${sizeClasses[size]} rounded-full border-2 ${colorClasses} flex items-center justify-center font-bold pb-0.5`}>
        En
      </span>
      <span className={`${textSizeClasses[size]} font-bold ${variant === 'white' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
        SQL
      </span>
    </div>
  )
}
