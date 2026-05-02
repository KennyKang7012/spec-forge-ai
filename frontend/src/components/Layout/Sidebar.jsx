import { useEffect } from 'react';
import useAuthStore from '../../stores/authStore';
import useProjectStore from '../../stores/projectStore';
import { useApi } from '../../hooks/useApi';
import './Layout.css';

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const { projects, currentProject, setProjects, setCurrentProject, addProject } = useProjectStore();
  const api = useApi();

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

  const handleCreateProject = async () => {
    const name = prompt('請輸入新專案名稱：');
    if (!name) return;

    try {
      const newProject = await api.post('/api/projects', {
        name,
        description: '透過 SpecForge AI 建立的專案'
      });
      addProject(newProject);
      setCurrentProject(newProject);
    } catch (error) {
      alert('建立專案失敗：' + error.message);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>SpecForge AI</h2>
        <button className="new-project-btn" onClick={handleCreateProject}>
          <span>+</span> 新建專案
        </button>
      </div>

      <div className="project-list">
        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem', fontSize: '0.9rem' }}>
            尚無專案，請建立第一個專案
          </div>
        ) : (
          projects.map(project => (
            <div 
              key={project.id}
              className={`project-item ${currentProject?.id === project.id ? 'active' : ''}`}
              onClick={() => setCurrentProject(project)}
            >
              <span className="project-icon">📁</span>
              <span className="project-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {project.name}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="sidebar-footer">
        <div className="user-info">
          <span className="user-avatar">👤</span>
          <span>{user?.display_name || user?.username}</span>
        </div>
        <button className="logout-btn" onClick={logout} title="登出">
          登出
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
