import { useEffect, useMemo, useState } from 'react';
import ParticipantTable from '../components/ParticipantTable';
import ModuleSelector from '../components/ModuleSelector';
import { fetchParticipants, generateCertificate } from '../services/api';

function Dashboard() {
  const [participants, setParticipants] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeRecurrentParticipant, setActiveRecurrentParticipant] = useState(null);

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
      setMessage('Certificate generated successfully.');
    } catch (requestError) {
      if (requestError.response?.status === 400) {
        setError('Incomplete participant data');
      } else {
        setError('Certificate generation failed. Please retry.');
      }
    } finally {
      setLoadingId(null);
      setActiveRecurrentParticipant(null);
    }
  }

  function handleGenerateClick(participant) {
    if (participant.training_type === 'Recurrent') {
      setActiveRecurrentParticipant(participant);
      return;
    }
    doGenerate(participant, participant.modules || []);
  }

  const statusClass = useMemo(() => (error ? 'error' : 'success'), [error]);

  return (
    <main className="dashboard">
      <h1>Training Certificate Dashboard</h1>
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
