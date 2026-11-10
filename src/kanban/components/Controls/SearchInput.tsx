import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useKanbanStore } from '@/kanban/store/kanban.store';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
}

export function SearchInput({ className }: Props) {
  const searchQuery = useKanbanStore((s) => s.filters.searchQuery);
  const setSearchQuery = useKanbanStore((s) => s.setSearchQuery);

  const [isExpanded, setIsExpanded] = useState<boolean>(Boolean(searchQuery));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    }
  }, [isExpanded]);

  const handleClear = () => {
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (searchQuery.length > 0) {
        setSearchQuery('');
      } else {
        setIsExpanded(false);
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (
      e.relatedTarget &&
      (e.relatedTarget as HTMLElement).getAttribute('aria-label') ===
        'Limpiar búsqueda'
    ) {
      return;
    }
    if (!searchQuery.trim()) {
      setIsExpanded(false);
    }
  };

  if (!isExpanded && !searchQuery) {
    return (
      <Button
        variant="outline"
        size="icon"
        className={cn(
          'border-[#e3e3df] bg-white text-[#74757b] hover:bg-[#f1f1ed]',
          className,
        )}
        onClick={() => setIsExpanded(true)}
        aria-label="Buscar tareas"
      >
        <Search className="size-4" />
      </Button>
    );
  }

  return (
    <div
      className={cn('relative flex items-center', className)}
      role="search"
    >
      <Search className="pointer-events-none absolute left-2.5 size-4 text-[#8b8c91]" />
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="Buscar tareas..."
        aria-label="Buscar tareas"
        className="h-9 w-48 rounded-lg border border-[#e3e3df] bg-white pl-8 pr-8 text-xs text-[#1e2025] placeholder:text-[#8b8c91] transition-all focus:border-[#252a45] focus:outline-none focus:ring-1 focus:ring-[#252a45] sm:w-60"
      />
      {searchQuery.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Limpiar búsqueda"
          className="absolute right-2.5 flex size-4 items-center justify-center rounded-sm text-[#8b8c91] hover:text-[#1e2025] focus:outline-none"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
