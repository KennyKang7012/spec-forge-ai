import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import useProjectStore from '../../stores/projectStore';
import useChatStore from '../../stores/chatStore';
import { useApi } from '../../hooks/useApi';
import CreateProjectModal from '../Project/CreateProjectModal';
import {
  Plus,
  Settings,
  LogOut,
  Trash2,
  FolderOpen,
  Folder,
} from 'lucide-react';
import './Layout.css';

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const { projects, currentProject, setProjects, setCurrentProject, addProject } =
    useProjectStore();
  const clearMessages = useChatStore((s) => s.clearMessages);
  const api = useApi();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  // 載入專案列表
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await api.get('/api/projects');
        // 後端回傳格式為 { projects: [...], total: ... }
        setProjects(data.projects);
      } catch (error) {
        console.error('Failed to fetch projects', error);
      }
    };
    fetchProjects();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateProject = async ({ name, description }) => {
    const newProject = await api.post('/api/projects', { name, description });
    addProject(newProject);
    setCurrentProject(newProject);
    clearMessages();
  };

  const handleSelectProject = (project) => {
    if (currentProject?.id !== project.id) {
      setCurrentProject(project);
      clearMessages();
    }
  };

  const handleDeleteProject = async (e, projectId) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[Sidebar] 嘗試刪除專案 ID:', projectId);
    
    // 暫時移除確認視窗以排除瀏覽器干擾
    // if (!window.confirm('確定要刪除此專案嗎？')) return;

    try {
      console.log('[Sidebar] 正在發送 DELETE 請求...');
      const res = await api.delete(`/api/projects/${projectId}`);
      console.log('[Sidebar] 刪除成功:', res);
      
      setProjects(projects.filter((p) => p.id !== projectId));
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
        clearMessages();
      }
    } catch (err) {
      console.error('[Sidebar] 刪除專案失敗:', err);
      alert('刪除失敗：' + err.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusBadge = (status) => {
    const labels = {
      created: '新建',
      in_progress: '進行中',
      completed: '已完成',
    };
    return (
      <span className={`project-status ${status}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <>
      <aside className="sidebar">
        {/* Header */}
        <div className="sidebar-header">
          <h2>SpecForge AI</h2>
          <button
            className="new-project-btn"
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} />
            新建專案
          </button>
        </div>

        {/* Project List */}
        <div className="project-list">
          {projects.length === 0 ? (
            <div className="project-list-empty">
              尚無專案，請建立第一個專案
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className={`project-item-container ${
                  currentProject?.id === project.id ? 'active' : ''
                }`}
              >
                <div
                  className="project-item-main"
                  onClick={() => handleSelectProject(project)}
                >
                  <span className="project-icon">
                    {currentProject?.id === project.id ? (
                      <FolderOpen size={16} />
                    ) : (
                      <Folder size={16} />
                    )}
                  </span>
                  <span className="project-name">{project.name}</span>
                  {getStatusBadge(project.status)}
                </div>
                
                <button
                  className="project-delete-btn"
                  onClick={(e) => handleDeleteProject(e, project.id)}
                  title="刪除專案"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar-circle">
              {(user?.display_name || user?.username || '?')[0].toUpperCase()}
            </div>
            <span>{user?.display_name || user?.username}</span>
          </div>
          <div className="sidebar-footer-actions">
            <button
              className="icon-btn"
              onClick={() => navigate('/settings')}
              title="設定"
            >
              <Settings size={16} />
            </button>
            <button
              className="icon-btn"
              onClick={handleLogout}
              title="登出"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <CreateProjectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateProject}
      />
    </>
  );
};

export default Sidebar;
