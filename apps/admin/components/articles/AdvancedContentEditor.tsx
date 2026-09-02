'use client'

import TipTapEditor from '@/components/editor/TipTapEditor'

interface AdvancedContentEditorProps {
  title: string
  onTitleChange: (v: string) => void
  content: string
  onContentChange: (v: string) => void
  isCodeMode: boolean
  onToggleCodeMode: () => void
  onSwitchToTheme: () => void
}

export default function AdvancedContentEditor({
  title,
  onTitleChange,
  content,
  onContentChange,
  isCodeMode,
  onToggleCodeMode,
  onSwitchToTheme,
}: AdvancedContentEditorProps) {
  return (
    <section className="bg-card rounded-xl overflow-hidden border shadow-sm">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Content Strategy</h3>
        <button
          type="button"
          onClick={onSwitchToTheme}
          className="text-xs text-primary hover:underline font-mono"
        >
          Use job visual theme
        </button>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
            Article Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full bg-background border px-4 py-3 rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Enter a high-impact title..."
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Main Body
            </label>
            <button
              type="button"
              onClick={onToggleCodeMode}
              className="text-xs text-primary hover:underline font-mono"
            >
              {isCodeMode ? 'Switch to Visual Editor' : 'Switch to Code Editor'}
            </button>
          </div>
          {isCodeMode ? (
            <textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              className="w-full h-[600px] bg-slate-950 text-slate-50 font-mono text-sm p-4 rounded-md focus:outline-none focus:ring-1 focus:ring-primary shadow-inner resize-y"
              placeholder="Enter raw HTML here..."
            />
          ) : (
            <div className="border rounded-md shadow-sm bg-background">
              <TipTapEditor content={content} onChange={onContentChange} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
