import { LayoutGrid, Search, SlidersHorizontal, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useKanbanStore } from '@/kanban/store/kanban.store';

export function BoardHeader() {
  const setAddingTo = useKanbanStore((s) => s.setAddingTo);

  return (
    <header className="flex flex-col gap-6 border-b border-[#e7e7e3] pb-7 md:flex-row md:items-start md:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#252a45] text-white shadow-sm">
          <LayoutGrid className="size-5" />
        </div>
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b8c91]">
            Workspace / Product
          </p>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#1e2025] sm:text-[29px]">
            Product roadmap
          </h1>
          <p className="mt-1 text-sm text-[#85868b]">
            Keep the team moving in the right direction.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="border-[#e3e3df] bg-white text-[#74757b] hover:bg-[#f1f1ed]"
          aria-label="Search"
        >
          <Search />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="border-[#e3e3df] bg-white text-[#74757b] hover:bg-[#f1f1ed]"
          aria-label="Filter board"
        >
          <SlidersHorizontal />
        </Button>
        <Button
          className="bg-[#252a45] px-3.5 text-white hover:bg-[#333957]"
          onClick={() => setAddingTo('To Do')}
        >
          <Plus data-icon="inline-start" />
          Add card
        </Button>
      </div>
    </header>
  );
}
