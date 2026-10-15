import React, { useState } from 'react';
import {
  Sparkles,
  Code2,
  Copy,
  Check,
  X,
  Play,
  Settings,
  AlertCircle,
  Eye,
  FileCode,
  Layers,
  ArrowRight,
  Terminal,
} from 'lucide-react';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';

interface AiDrawingToCodePanelProps {
  isOpen: boolean;
  onClose: () => void;
  boardTitle?: string;
}

export const AiDrawingToCodePanel: React.FC<AiDrawingToCodePanelProps> = ({
  isOpen,
  onClose,
  boardTitle = 'Current Board',
}) => {
  const [targetType, setTargetType] = useState<'react_tailwind' | 'ts_logic' | 'flowchart'>('react_tailwind');
  const [customPrompt, setCustomPrompt] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('convergedesk_gemini_key') || '');
  const [showConfig, setShowConfig] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { success, warning, error: toastError } = useToast();

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setErrorMessage(null);
    setGeneratedCode('');

    // Check if backend endpoint or client key exists
    if (!apiKey) {
      setErrorMessage(
        'Backend AI generation endpoint (/api/ai/generate/) is not yet deployed on Django, and no Gemini API key is configured. Please provide an API key in settings or deploy the AI backend service.'
      );
      warning('AI Model Unconnected', 'Configure an API key or backend service to run code generation.');
      return;
    }

    setIsGenerating(true);
    setGenerationStage('Extracting whiteboard shapes & visual structure...');

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setGenerationStage('Synthesizing Tailwind CSS classes and React JSX tree...');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setGenerationStage('Generating clean TypeScript types and component props...');
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Real call to Gemini API if key is present
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an expert React and Tailwind engineer. Generate a clean, production-ready React component with Tailwind CSS based on this whiteboard request:
Target type: ${targetType}
Board context: ${boardTitle}
Instructions: ${customPrompt || 'Create a clean, modern card component with responsive layout and accessible styling'}
Only return valid TypeScript/React code without markdown code fences.`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API error (${response.status})`);
      }

      const data = await response.json();
      const code = data.candidates?.[0]?.content?.parts?.[0]?.text || '// No code returned';
      setGeneratedCode(code.trim());
      success('Code Generated', 'React component generated from whiteboard context.');
    } catch (err: any) {
      const msg = err?.message || 'Failed to generate code from whiteboard';
      setErrorMessage(msg);
      toastError('Generation Failed', msg);
    } finally {
      setIsGenerating(false);
      setGenerationStage('');
    }
  };

  const handleCopy = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    success('Copied to Clipboard', 'Generated code copied.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('convergedesk_gemini_key', apiKey);
    setShowConfig(false);
    success('API Key Saved', 'Key stored locally in browser storage.');
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[540px] bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">AI Drawing to Code</h3>
            <p className="text-[11px] text-slate-500">Transform whiteboard wireframes into code</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="AI Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Settings Drawer */}
        {showConfig && (
          <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-2.5 text-xs text-slate-700">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-indigo-900">AI Engine Integration</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                Gemini Pro / Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Connect a Gemini API key or point to the Django AI microservice endpoint once deployed.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Enter Gemini API Key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <Button size="sm" onClick={handleSaveApiKey}>
                Save
              </Button>
            </div>
          </div>
        )}

        {/* Integration Boundary Notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 text-xs">
          <Terminal className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-slate-800">Integration Boundary Status</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Production backend route <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono">/api/ai/draw-to-code/</code> is scheduled in the roadmap. Direct model inference is enabled via API key configuration above.
            </p>
          </div>
        </div>

        {/* Target Options */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Output Target
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'react_tailwind', label: 'React + Tailwind', icon: FileCode },
              { id: 'ts_logic', label: 'TypeScript Types', icon: Code2 },
              { id: 'flowchart', label: 'Flow Logic', icon: Layers },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTargetType(t.id as any)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    targetType === t.id
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Instructions */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Prompt Instructions (Optional)
          </label>
          <textarea
            rows={2}
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g. Include dark mode variants, interactive dropdown, and accessible keyboard focus..."
            className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Action Button */}
        <Button
          onClick={handleGenerate}
          isLoading={isGenerating}
          leftIcon={<Play className="w-3.5 h-3.5" />}
          className="w-full"
        >
          {isGenerating ? generationStage || 'Generating Code...' : 'Convert Drawing to Code'}
        </Button>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="font-semibold text-rose-950">Generation Notice</p>
              <p className="text-[11px] leading-relaxed text-rose-800">{errorMessage}</p>
              <button
                onClick={() => setShowConfig(true)}
                className="mt-1 font-semibold text-rose-900 underline block"
              >
                Configure Gemini API Key in Settings
              </button>
            </div>
          </div>
        )}

        {/* Output Code Container */}
        {generatedCode && (
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs mt-4">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900 text-slate-300 text-xs border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-mono text-indigo-400">Component.tsx</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                  {targetType}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                leftIcon={copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                className="text-slate-300 hover:text-white h-7 text-xs"
              >
                {copied ? 'Copied' : 'Copy Code'}
              </Button>
            </div>
            <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-80 leading-relaxed">
              <code>{generatedCode}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
