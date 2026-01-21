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
    : 'border-green-600 dark:border-green-400 text-green-600 dark:text-green-400'

  return (
    <div className="flex items-center gap-1 relative">
      <span className={`${sizeClasses[size]} rounded-full border-2 ${colorClasses} flex items-center justify-center font-bold pb-0.5`}>
        En
      </span>
      <span className={`${textSizeClasses[size]} font-bold ${variant === 'white' ? 'text-white' : 'text-green-600 dark:text-green-400'}`}>
        SQL
      </span>
      <span className={`absolute -bottom-1 right-0 text-xs font-semibold whitespace-nowrap ${variant === 'white' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
        partner
      </span>
    </div>
  )
}
