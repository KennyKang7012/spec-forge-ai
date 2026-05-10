import { useState } from 'react';
import ChatArea from '../components/Chat/ChatArea';
import FilePanel from '../components/Files/FilePanel';
import useProjectStore from '../stores/projectStore';

/**
 * Dashboard — 主控制台頁面
 * 整合對話區 + 檔案面板
 */
const Dashboard = () => {
  const { currentProject } = useProjectStore();
  const [showFiles, setShowFiles] = useState(false);

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <ChatArea onToggleFiles={() => setShowFiles(!showFiles)} />
      </div>
      <FilePanel
        projectId={currentProject?.id}
        isOpen={showFiles}
        onClose={() => setShowFiles(false)}
      />
    </div>
  );
};

export default Dashboard;
