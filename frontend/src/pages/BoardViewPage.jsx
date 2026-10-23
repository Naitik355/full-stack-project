import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBoard } from '../api/boards';
import { ExcalidrawWrapper } from '../components/boards/ExcalidrawWrapper';
import { AiDrawingToCodePanel } from '../components/boards/AiDrawingToCodePanel';
import { Button } from '../components/common/Button';
import { ArrowLeft, Presentation, AlertCircle, RefreshCw } from 'lucide-react';

export const BoardViewPage = () => {
  const { projectId, boardId } = useParams();
  const bId = parseInt(boardId || '0', 10);
  const pId = parseInt(projectId || '0', 10);
  const navigate = useNavigate();

  const [board, setBoard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAiOpen, setIsAiOpen] = useState(false);

  const fetchBoard = useCallback(async () => {
    if (!bId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getBoard(bId);
      setBoard(data);
    } catch (err) {
      setError(
        err?.message ||
          'Failed to load whiteboard. Ensure you are an authorized member of this project.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [bId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] p-6 space-y-3">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600">Connecting to whiteboard room...</p>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4 pt-16">
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <p className="font-semibold text-base mb-1">Whiteboard Access Error</p>
          <p className="text-xs text-rose-600">{error || 'Whiteboard could not be found.'}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(pId ? `/projects/${pId}` : '/projects')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Return to Project
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1700px] mx-auto">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(pId ? `/projects/${pId}` : '/projects')}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            title="Back to project workspace"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center">
              <Presentation className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {board.title}
              </h2>
              <p className="text-[11px] text-slate-400">
                Multiplayer tldraw Canvas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas Component */}
      <ExcalidrawWrapper
        board={board}
        onOpenAiAssistant={() => setIsAiOpen(true)}
      />

      {/* AI Assistant Drawer */}
      <AiDrawingToCodePanel
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        boardTitle={board.title}
      />
    </div>
  );
};
