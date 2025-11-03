import type { LeaderboardEntry } from './types';

export function exportToCSV(data: LeaderboardEntry[], filename: string = 'competition_results.csv') {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = ['Rank', 'Name', 'College', 'Score', 'Submission Time', 'Submitted Weight (kg)'];
  const rows = data.map((item) => [
    item.rank,
    item.name || '',
    item.college || '',
    item.score || '0',
    item.time || 'N/A',
    item.weightSubmitted || 'N/A'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
