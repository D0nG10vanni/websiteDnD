import MarkdownRenderer from '@/components/MarkdownRenderer'

interface LivePreviewProps {
  content: string
  onLinkClick: (title: string) => void
}

export default function LivePreview({ content, onLinkClick }: LivePreviewProps) {
  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-amber-900/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-amber-200 font-medium">
          <span className="text-amber-500">👁</span> Vorschau
        </h3>
        <div className="text-amber-600/60 text-xs">
          {content.split('\n').length} Zeilen gerendert
        </div>
      </div>
      
      <div className="h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {content.trim() ? (
          <MarkdownRenderer
            content={content}
            onLinkClick={onLinkClick}
            className="prose-mystical-preview"
          />
        ) : (
          <div className="text-center py-12 text-amber-200/30 italic font-serif">
            <div className="text-4xl mb-4">📜</div>
            <p>Deine Worte werden hier erscheinen,</p>
            <p>sobald du zu schreiben beginnst...</p>
          </div>
        )}
      </div>
    </div>
  )
}