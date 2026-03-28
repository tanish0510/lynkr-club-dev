import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAB = ({
  onClick,
  label = 'Add',
  tooltip,
  icon: Icon = Plus,
  className,
}) => (
  <>
    <style>{`
      @keyframes fab-glow-pulse {
        0%,
        100% {
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.4);
        }
        50% {
          box-shadow: 0 0 38px rgba(59, 130, 246, 0.52);
        }
      }
      .fab-glow-pulse {
        animation: fab-glow-pulse 2.5s ease-in-out infinite;
      }
    `}</style>
    <div
      className={cn(
        'fixed bottom-24 right-4 z-50 pointer-events-none lg:hidden',
        className
      )}
    >
      <div className="pointer-events-auto relative h-14 w-14">
        <span
          className="absolute inset-0 rounded-full bg-blue-500/35 animate-ping"
          aria-hidden
        />
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          title={tooltip ?? label}
          className={cn(
            'relative flex h-14 w-14 items-center justify-center rounded-full',
            'bg-blue-500 text-white shadow-[0_0_30px_rgba(59,130,246,0.4)] fab-glow-pulse',
            'transition-all duration-300',
            'hover:animate-none hover:scale-110 hover:shadow-[0_0_40px_rgba(59,130,246,0.6)]',
            'active:scale-90'
          )}
        >
          <Icon className="h-6 w-6 text-white" strokeWidth={2} />
        </button>
      </div>
    </div>
  </>
);

export default FAB;
