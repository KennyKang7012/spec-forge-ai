import React from 'react';
import useChatStore from '../../stores/chatStore';
import { X, FileText, Download, Box } from 'lucide-react';
import './Files.css';

/**
 * SpecForge AI — 檔案產出面板
 */
const FilePanel = ({ projectId, isOpen, onClose }) => {
  const files = useChatStore((s) => s.files);
  const token = localStorage.getItem('token') || '';
  const encodedToken = encodeURIComponent(token);

  if (!isOpen) return null;

  // 輔助函式：產生帶有 Token 的下載 URL
  const getDownloadUrl = (endpoint) => {
    return `${endpoint}?token=${encodedToken}`;
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="file-panel">
      <div className="file-panel-header">
        <h3>
          <FileText size={20} className="header-icon" />
          產出物清單
          {files.length > 0 && <span className="file-count">{files.length}</span>}
        </h3>
        <button className="icon-btn close-btn" onClick={onClose} title="關閉面板">
          <X size={20} />
        </button>
      </div>

      <div className="file-list">
        {files.length === 0 ? (
          <div className="empty-files">
            <div className="empty-icon">📄</div>
            <p>目前尚無產出文件<br /><small>Agent 執行完畢後將自動顯示</small></p>
          </div>
        ) : (
          files.map((file) => (
            <div key={file.filename} className="file-item">
              <div className="file-item-info">
                <FileText size={24} className="file-icon-item" />
                <div className="file-details">
                  <span className="file-name">{file.display_name}</span>
                  <span className="file-meta">
                    {formatSize(file.size)} • {new Date(file.updated_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <div className="file-actions">
                {/* 使用真正的 <a> 標籤，這是最穩定的下載方式 */}
                <a 
                  href={getDownloadUrl(`/api/projects/${projectId}/files/${file.filename}`)}
                  download={file.filename}
                  className="file-btn-link"
                  onClick={(e) => console.log(`[FilePanel] 觸發原生下載: ${file.filename}`)}
                >
                  <Download size={14} /> 下載
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="file-panel-footer">
        {files.length > 0 && (
          <a 
            href={getDownloadUrl(`/api/projects/${projectId}/download-all`)}
            download={`SpecForge_Project_${projectId}_All_Files.zip`}
            className="download-all-btn-link"
          >
            <Box size={18} /> 打包下載全部 (ZIP)
          </a>
        )}
      </div>
    </div>
  );
};

export default FilePanel;
