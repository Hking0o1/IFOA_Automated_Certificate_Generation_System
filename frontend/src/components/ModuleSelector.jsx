import { useState } from 'react';

const MODULE_OPTIONS = ['Air Law', 'Aircraft Systems', 'Navigation', 'Meteorology', 'Human Factors'];

function ModuleSelector({ onConfirm, onCancel, isLoading }) {
  const [selectedModules, setSelectedModules] = useState([]);

  function toggleModule(module) {
    setSelectedModules((current) =>
      current.includes(module) ? current.filter((item) => item !== module) : [...current, module]
    );
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Select Modules Completed</h3>
        <div className="module-list">
          {MODULE_OPTIONS.map((module) => (
            <label key={module}>
              <input
                type="checkbox"
                checked={selectedModules.includes(module)}
                onChange={() => toggleModule(module)}
              />
              {module}
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button type="button" onClick={onCancel} disabled={isLoading}>
            Cancel
          </button>
          <button type="button" onClick={() => onConfirm(selectedModules)} disabled={isLoading}>
            Generate Certificate
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModuleSelector;
