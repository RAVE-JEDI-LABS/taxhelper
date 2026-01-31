import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  variant?: 'default' | 'light'
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className, variant = 'default', size = 'md' }: LogoProps) {
  const heights = {
    sm: 40,
    md: 50,
    lg: 60,
  }

  const widths = {
    sm: 180,
    md: 220,
    lg: 280,
  }

  return (
    <div className={cn('flex items-center', className)}>
      <Image
        src="/images/logo.png"
        alt="Gordon W. Ulen, CPA PC"
        width={widths[size]}
        height={heights[size]}
        className={cn(
          'h-auto',
          variant === 'light' && 'brightness-0 invert'
        )}
        priority
      />
    </div>
  )
}

// Text-based fallback logo
export function LogoText({ className, variant = 'default', size = 'md' }: LogoProps) {
  const textColor = variant === 'light' ? 'text-white' : 'text-primary-800'

  return (
    <div className={cn('flex flex-col leading-tight', className)}>
      <span className={cn('font-bold tracking-tight', textColor, {
        'text-lg': size === 'sm',
        'text-xl': size === 'md',
        'text-2xl': size === 'lg',
      })}>
        Gordon W. Ulen, <span className="font-normal">CPA PC</span>
      </span>
      <span className={cn('text-gray-500 tracking-wide', {
        'text-xs': size === 'sm',
        'text-sm': size === 'md',
        'text-base': size === 'lg',
      })}>
        Certified Public Accountant
      </span>
    </div>
  )
}
