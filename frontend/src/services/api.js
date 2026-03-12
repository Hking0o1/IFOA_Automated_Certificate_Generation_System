import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function fetchParticipants(search = '') {
  const response = await axios.get(`${API_BASE}/participants`, { params: search ? { search } : {} });
  return response.data;
}

export async function generateCertificate(id, modules = []) {
  const response = await axios.post(
    `${API_BASE}/certificate/${id}`,
    { modules },
    { responseType: 'blob', timeout: 60000 }
  );
  return response.data;
}
