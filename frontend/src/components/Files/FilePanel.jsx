import React from 'react';
import useChatStore from '../../stores/chatStore';
import { useApi } from '../../hooks/useApi';
import { X, FileText, Download, Box } from 'lucide-react';
import './Files.css';

/**
 * SpecForge AI — 檔案產出面板
 */
const FilePanel = ({ projectId, isOpen, onClose }) => {
  const files = useChatStore((s) => s.files);
  const api = useApi();

  if (!isOpen) return null;

  // 處理單一檔案下載
  const handleDownload = async (file) => {
    try {
      console.log(`[FilePanel] 開始下載: ${file.filename}`);
      const blob = await api.get(`/api/projects/${projectId}/files/${file.filename}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.filename);
      document.body.appendChild(link);
      link.click();
      
      // 清理
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('下載失敗:', err);
      alert('檔案下載失敗，請稍後再試');
    }
  };

  // 處理全部打包下載
  const handleDownloadAll = async () => {
    try {
      console.log(`[FilePanel] 開始打包下載全部檔案`);
      const blob = await api.get(`/api/projects/${projectId}/download-all`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SpecForge_Project_${projectId}_All_Files.zip`);
      document.body.appendChild(link);
      link.click();
      
      // 清理
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('打包下載失敗:', err);
      alert('打包下載失敗，請稍後再試');
    }
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
                <button 
                  className="file-btn"
                  onClick={() => handleDownload(file)}
                  title="下載此檔案"
                >
                  <Download size={14} /> 下載
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="file-panel-footer">
        {files.length > 0 && (
          <button 
            className="download-all-btn"
            onClick={handleDownloadAll}
          >
            <Box size={18} /> 打包下載全部 (ZIP)
          </button>
        )}
      </div>
    </div>
  );
};

export default FilePanel;
