import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { X, Copy, FileText } from 'lucide-react';
import './Files.css';

/**
 * FilePreview — 檔案預覽模態框
 * @param {{ file: { name, label }, projectId: number, onClose: () => void }} props
 */
const FilePreview = ({ file, projectId, onClose }) => {
  // ESC 關閉
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // 目前使用佔位內容（後端 /files API 尚未實作）
  const placeholderContent = `# ${file.label}\n\n> 📌 此檔案將在 Agent 工作流程完成後自動產生。\n\n檔案名稱：\`${file.name}\`\n\n專案 ID：${projectId}\n\n---\n\n*檔案內容預覽功能將於 Phase 5 完整開放。*`;

  const handleCopy = () => {
    navigator.clipboard.writeText(placeholderContent);
  };

  return (
    <div className="file-preview-backdrop" onClick={onClose}>
      <div
        className="glass-panel file-preview-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="file-preview-header">
          <h3>
            <FileText size={16} />
            {file.label}
          </h3>
          <div className="file-preview-actions">
            <button className="icon-btn" onClick={handleCopy} title="複製全文">
              <Copy size={16} />
            </button>
            <button className="icon-btn" onClick={onClose} title="關閉">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="file-preview-body">
          <div className="file-preview-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                      }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {placeholderContent}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreview;
