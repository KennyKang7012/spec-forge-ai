import { useState } from 'react';
import { X, FileText, Download, Eye } from 'lucide-react';
import FilePreview from './FilePreview';
import './Files.css';

/**
 * 模擬的檔案列表（後端 /files API 尚未實作）
 * Phase 5 再接上真實 API
 */
const MOCK_FILES = [
  { name: 'intent_report.md', label: '意圖分析報告', agent: 'BA', size: '—' },
  { name: 'proposal.md', label: '需求提案', agent: 'PM', size: '—' },
  { name: 'design_and_tasks.md', label: '技術架構 & 任務清單', agent: 'Architect', size: '—' },
  { name: 'final_specs.md', label: '最終規格文件', agent: 'Writer', size: '—' },
];

/**
 * FilePanel — 檔案面板（右側滑出抽屜）
 * @param {{ projectId: number, isOpen: boolean, onClose: () => void }} props
 */
const FilePanel = ({ projectId, isOpen, onClose }) => {
  const [previewFile, setPreviewFile] = useState(null);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="file-panel-overlay" onClick={onClose} />

      {/* Panel */}
      <div className="file-panel">
        <div className="file-panel-header">
          <h3>
            <FileText size={18} />
            產出檔案
          </h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="file-panel-body">
          {MOCK_FILES.map((file) => (
            <div
              key={file.name}
              className="file-item"
              onClick={() => setPreviewFile(file)}
            >
              <div className="file-item-icon">
                <FileText size={18} />
              </div>
              <div className="file-item-info">
                <div className="file-item-name">{file.label}</div>
                <div className="file-item-meta">
                  {file.name} · {file.agent} Agent
                </div>
              </div>
              <div className="file-item-action">
                <Eye size={14} />
              </div>
            </div>
          ))}

          <div className="file-empty" style={{ marginTop: 'var(--space-lg)' }}>
            <p style={{ fontSize: '0.8rem' }}>
              💡 檔案將在 Agent 工作流程完成後產生
            </p>
          </div>
        </div>

        <div className="file-panel-footer">
          <button className="primary-btn" disabled>
            <Download size={14} style={{ marginRight: 6 }} />
            下載全部（即將推出）
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          projectId={projectId}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </>
  );
};

export default FilePanel;
