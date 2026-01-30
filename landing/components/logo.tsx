import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  variant?: 'default' | 'light'
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className, variant = 'default', size = 'md' }: LogoProps) {
  const sizes = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
  }

  const textColor = variant === 'light' ? 'text-white' : 'text-primary'
  const accentColor = 'text-accent'

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Icon Mark */}
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(sizes[size], 'w-auto')}
      >
        {/* Shield/Document shape background */}
        <path
          d="M20 2L4 8V18C4 28.5 11 36.5 20 38C29 36.5 36 28.5 36 18V8L20 2Z"
          className={variant === 'light' ? 'fill-white/20' : 'fill-primary'}
        />
        {/* Inner accent stripe */}
        <path
          d="M20 6L8 10.5V18C8 26.5 13.5 33 20 34.5C26.5 33 32 26.5 32 18V10.5L20 6Z"
          className={variant === 'light' ? 'fill-white/10' : 'fill-primary-600'}
        />
        {/* Dollar sign / column lines representing financial docs */}
        <path
          d="M18 14H22V16H18V14Z"
          className="fill-accent"
        />
        <path
          d="M16 18H24V20H16V18Z"
          className={variant === 'light' ? 'fill-white' : 'fill-white'}
        />
        <path
          d="M14 22H26V24H14V22Z"
          className={variant === 'light' ? 'fill-white/80' : 'fill-white/90'}
        />
        <path
          d="M16 26H24V28H16V26Z"
          className={variant === 'light' ? 'fill-white/60' : 'fill-white/70'}
        />
      </svg>

      {/* Text */}
      <div className="flex flex-col leading-tight">
        <span className={cn('font-bold tracking-tight', textColor, {
          'text-lg': size === 'sm',
          'text-xl': size === 'md',
          'text-2xl': size === 'lg',
        })}>
          Gordon Ulen
        </span>
        <span className={cn('font-semibold tracking-widest', accentColor, {
          'text-xs': size === 'sm',
          'text-sm': size === 'md',
          'text-base': size === 'lg',
        })}>
          CPA
        </span>
      </div>
    </div>
  )
}

// Simplified icon-only version for favicon or small spaces
export function LogoIcon({ className, variant = 'default' }: Omit<LogoProps, 'size'>) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-10 h-10', className)}
    >
      <path
        d="M20 2L4 8V18C4 28.5 11 36.5 20 38C29 36.5 36 28.5 36 18V8L20 2Z"
        className={variant === 'light' ? 'fill-white/20' : 'fill-primary'}
      />
      <path
        d="M20 6L8 10.5V18C8 26.5 13.5 33 20 34.5C26.5 33 32 26.5 32 18V10.5L20 6Z"
        className={variant === 'light' ? 'fill-white/10' : 'fill-primary-600'}
      />
      <path d="M18 14H22V16H18V14Z" className="fill-accent" />
      <path d="M16 18H24V20H16V18Z" className="fill-white" />
      <path d="M14 22H26V24H14V22Z" className="fill-white/90" />
      <path d="M16 26H24V28H16V26Z" className="fill-white/70" />
    </svg>
  )
}
