import { Check } from 'lucide-react';
import './Chat.css';

/**
 * 五階段流水線定義
 */
const PHASES = [
  { id: 1, icon: '🔍', label: '意圖挖掘', agent: 'BA' },
  { id: 2, icon: '📋', label: '需求提案', agent: 'PM' },
  { id: 3, icon: '🏗️', label: '技術架構', agent: 'Architect' },
  { id: 4, icon: '📝', label: '規格收斂', agent: 'Writer' },
  { id: 5, icon: '✅', label: '品質保證', agent: 'Writer' },
];

/**
 * PhaseProgress — 五階段流程進度條
 * @param {{ currentPhase: number }} props
 */
const PhaseProgress = ({ currentPhase }) => {
  return (
    <div className="phase-progress">
      {PHASES.map((phase, index) => {
        const status =
          phase.id < currentPhase
            ? 'completed'
            : phase.id === currentPhase
              ? 'active'
              : 'pending';

        return (
          <div key={phase.id} style={{ display: 'flex', alignItems: 'center' }}>
            <div className={`phase-step ${status}`}>
              <span className="phase-step-icon">
                {status === 'completed' ? <Check size={12} /> : phase.icon}
              </span>
              <span>{phase.label}</span>
            </div>
            {index < PHASES.length - 1 && (
              <div
                className={`phase-connector ${
                  phase.id < currentPhase ? 'completed' : ''
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PhaseProgress;
