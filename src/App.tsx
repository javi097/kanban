import { ErrorBoundary } from '@/components/custom/ErrorBoundary';
import { BoardPage } from '@/kanban/pages/BoardPage';

function App() {
  return (
    <ErrorBoundary>
      <BoardPage />
    </ErrorBoundary>
  );
}

export default App;
