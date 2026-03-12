import { useEffect, useMemo, useState } from 'react';
import ParticipantTable from '../components/ParticipantTable';
import ModuleSelector from '../components/ModuleSelector';
import { fetchParticipants, generateCertificate } from '../services/api';

function Dashboard() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [participants, setParticipants] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeRecurrentParticipant, setActiveRecurrentParticipant] = useState(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      try {
        const data = await fetchParticipants(search);
        setParticipants(data);
      } catch (requestError) {
        setError('Failed to load participant records.');
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [search]);

  async function doGenerate(participant, modules = []) {
    setMessage('');
    setError('');
    setLoadingId(participant.id);

    try {
      const blob = await generateCertificate(participant.id, modules);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${participant.participant_name}_certificate.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      if (requestError.response?.status === 400) {
        setError('Failed to generate certificate. Please retry.');
      } else {
        setError('Failed to generate certificate. Please retry.');
      }
    } finally {
      setLoadingId(null);
      setActiveRecurrentParticipant(null);
    }
  }

  function isRecurrentTraining(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .includes('recurrent');
  }

  function handleGenerateClick(participant) {
    if (isRecurrentTraining(participant.training_type)) {
      setActiveRecurrentParticipant(participant);
      return;
    }
    doGenerate(participant, participant.modules || []);
  }

  const statusClass = useMemo(() => (error ? 'error' : 'success'), [error]);
  const themeLabel = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">IFOA Training Hub</p>
          <h1>Training Certificate Dashboard</h1>
          <p className="subtitle">Review participant records and generate compliant certificates in seconds.</p>
        </div>
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
          aria-pressed={theme === 'dark'}
          aria-label={themeLabel}
        >
          <span className="theme-indicator" />
          {theme === 'dark' ? 'Dark mode' : 'Light mode'}
        </button>
      </header>
      {(message || error) && <div className={`banner ${statusClass}`}>{error || message}</div>}
      {loadingId && <p className="wait-note">Generating certificate... Please wait</p>}
      <ParticipantTable
        participants={participants}
        onGenerate={handleGenerateClick}
        loadingId={loadingId}
        search={search}
        onSearchChange={setSearch}
      />
      {activeRecurrentParticipant && (
        <ModuleSelector
          isLoading={loadingId === activeRecurrentParticipant.id}
          onCancel={() => setActiveRecurrentParticipant(null)}
          onConfirm={(modules) => doGenerate(activeRecurrentParticipant, modules)}
        />
      )}
    </main>
  );
}

export default Dashboard;
