import LoadingSpinner from './LoadingSpinner';

function ParticipantTable({ participants, onGenerate, loadingId, search, onSearchChange }) {
  return (
    <div className="table-wrapper">
      <input
        className="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by name, company, or department"
      />
      {participants.length === 0 ? (
        <div className="empty-state">No training records found</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Dept</th>
              <th>Training</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((participant) => {
              const isLoading = loadingId === participant.id;
              return (
                <tr key={participant.id}>
                  <td data-label="Name">{participant.participant_name}</td>
                  <td data-label="Company">{participant.company}</td>
                  <td data-label="Dept">{participant.department}</td>
                  <td data-label="Training">{participant.training_type}</td>
                  <td data-label="Date">{participant.training_date}</td>
                  <td data-label="Action">
                    <button type="button" onClick={() => onGenerate(participant)} disabled={isLoading}>
                      {isLoading ? (
                        <span className="loading-button">
                          <LoadingSpinner /> Generating...
                        </span>
                      ) : (
                        'Generate'
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ParticipantTable;
