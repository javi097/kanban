import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  tag: string;
  onRemove?: () => void;
  className?: string;
}

/**
 * Badge visual para etiquetas de tarea (RF-1.2, RF-3.2).
 * Si se proporciona la función `onRemove`, añade un botón accesible con icono X
 * que detiene la propagación del evento para evitar clics accidentales en la tarjeta contenedora.
 */
export function CardTag({ tag, onRemove, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md bg-[#f1f1ee] px-2 py-1 text-[10px] font-medium text-[#77787d]',
        className,
      )}
    >
      <span>{tag}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Eliminar etiqueta ${tag}`}
          className="text-[#999a9e] hover:text-[#55565d] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm cursor-pointer"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}
