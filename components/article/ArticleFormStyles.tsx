export default function ArticleFormStyles() {
  return (
    <style jsx global>{`
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(251, 191, 36, 0.3);
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(251, 191, 36, 0.5);
      }
      
      .prose-mystical-preview {
        color: rgb(251 191 36 / 0.9);
      }
      .prose-mystical-preview h1, 
      .prose-mystical-preview h2, 
      .prose-mystical-preview h3 {
        color: rgb(251 191 36);
        border-bottom: 1px solid rgb(251 191 36 / 0.3);
        padding-bottom: 0.5rem;
        margin-top: 1.5rem;
        margin-bottom: 1rem;
      }
      .prose-mystical-preview p {
        margin: 1rem 0;
        line-height: 1.6;
      }
      .prose-mystical-preview ul, 
      .prose-mystical-preview ol {
        color: rgb(251 191 36 / 0.8);
        margin: 1rem 0;
        padding-left: 1.5rem;
      }
      .prose-mystical-preview li {
        margin: 0.5rem 0;
      }
      .prose-mystical-preview blockquote {
        border-left: 4px solid rgb(251 191 36 / 0.4);
        background: rgb(0 0 0 / 0.2);
        padding: 1rem;
        margin: 1rem 0;
        font-style: italic;
      }
      .prose-mystical-preview code {
        background: rgb(0 0 0 / 0.4);
        color: rgb(251 191 36 / 0.9);
        padding: 0.2rem 0.4rem;
        border-radius: 0.25rem;
        font-size: 0.9em;
      }
      .prose-mystical-preview pre {
        background: rgb(0 0 0 / 0.4);
        border: 1px solid rgb(251 191 36 / 0.3);
        padding: 1rem;
        border-radius: 0.5rem;
        overflow-x: auto;
        margin: 1rem 0;
      }
      .prose-mystical-preview pre code {
        background: transparent;
        padding: 0;
      }
      .prose-mystical-preview table {
        border-collapse: collapse;
        width: 100%;
        margin: 1rem 0;
      }
      .prose-mystical-preview th, 
      .prose-mystical-preview td {
        border: 1px solid rgb(251 191 36 / 0.3);
        padding: 0.5rem;
        text-align: left;
      }
      .prose-mystical-preview th {
        background: rgb(0 0 0 / 0.3);
        font-weight: bold;
      }
      .prose-mystical-preview hr {
        border: none;
        height: 1px;
        background: linear-gradient(to right, transparent, rgb(251 191 36 / 0.4), transparent);
        margin: 2rem 0;
      }
    `}</style>
  )
}