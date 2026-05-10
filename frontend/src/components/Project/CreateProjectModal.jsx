import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import './Project.css';

/**
 * CreateProjectModal — 專案建立模態框
 * @param {{ isOpen, onClose, onSubmit }} props
 */
const CreateProjectModal = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const nameInputRef = useRef(null);

  // 開啟時聚焦
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setError(null);
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ESC 關閉
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await onSubmit({ name: name.trim(), description: description.trim() || null });
      onClose();
    } catch (err) {
      setError(err.message || '建立專案失敗');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-panel modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>🚀 建立新專案</h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'var(--error-bg)',
            color: 'var(--error)',
            padding: '0.6rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
          }}>
            {error}
          </div>
        )}

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="project-name">專案名稱 *</label>
            <input
              ref={nameInputRef}
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：電商平台、內部管理系統..."
              required
              disabled={isLoading}
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label htmlFor="project-desc">專案描述（選填）</label>
            <textarea
              id="project-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="簡要描述專案的目標和範圍..."
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="ghost-btn"
              onClick={onClose}
              disabled={isLoading}
            >
              取消
            </button>
            <button
              type="submit"
              className="primary-btn"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? '建立中...' : '建立專案'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
