import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { GitBranch } from 'lucide-react';
import './Project.css';

/**
 * ProjectVersions — 版本歷程面板
 * @param {{ projectId: number }} props
 */
const ProjectVersions = ({ projectId }) => {
  const api = useApi();
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    const fetchVersions = async () => {
      setIsLoading(true);
      try {
        const data = await api.get(`/api/projects/${projectId}/versions`);
        setVersions(data);
      } catch (err) {
        console.error('Failed to fetch versions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVersions();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="versions-panel">
      <h3>
        <GitBranch size={18} />
        版本歷程
      </h3>

      {isLoading && (
        <div className="versions-empty">載入中...</div>
      )}

      {!isLoading && versions.length === 0 && (
        <div className="versions-empty">
          尚無版本紀錄。<br />
          完成第一次規格產出後即會自動建立版本。
        </div>
      )}

      {!isLoading && versions.length > 0 && (
        <div className="version-timeline">
          {versions.map((ver) => (
            <div key={ver.id} className="version-item">
              <div className="version-tag">{ver.version_tag}</div>
              {ver.change_summary && (
                <div className="version-summary">{ver.change_summary}</div>
              )}
              <div className="version-date">
                {new Date(ver.created_at).toLocaleString('zh-TW')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectVersions;
