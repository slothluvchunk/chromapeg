import { useGame } from '../context/GameContext';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useGame();

  function handleChange(key: keyof typeof settings, value: number | boolean) {
    updateSettings({ [key]: value });
    onClose();
  }

  return (
    <div className="modal__overlay" role="dialog" aria-modal="true" aria-label="Settings">
      <div className="modal">
        <div className="modal__header">
          <h2 className="modal__title">Settings</h2>
          <button className="modal__close" onClick={onClose} type="button" aria-label="Close settings">
            ×
          </button>
        </div>

        <div className="modal__body">
          <div className="modal__field">
            <label className="modal__label">Sequence Length</label>
            <div className="modal__options">
              {[4, 5, 6].map((n) => (
                <button
                  key={n}
                  className={`modal__option${settings.sequenceLength === n ? ' modal__option--active' : ''}`}
                  onClick={() => handleChange('sequenceLength', n)}
                  type="button"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="modal__field">
            <label className="modal__label">Number of Colors</label>
            <div className="modal__options">
              {[6, 8].map((n) => (
                <button
                  key={n}
                  className={`modal__option${settings.colorCount === n ? ' modal__option--active' : ''}`}
                  onClick={() => handleChange('colorCount', n)}
                  type="button"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="modal__field modal__field--toggle">
            <label className="modal__label" htmlFor="allow-dupes">
              Allow Duplicates
            </label>
            <input
              id="allow-dupes"
              className="modal__toggle"
              type="checkbox"
              checked={settings.allowDuplicates}
              onChange={(e) => handleChange('allowDuplicates', e.target.checked)}
            />
          </div>
        </div>

        <p className="modal__note">Changing any setting starts a new game.</p>
      </div>
    </div>
  );
}
