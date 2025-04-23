export const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const parts = [];
    if (hours > 0) parts.push(`${String(hours).padStart(2, '0')}h`);
    if (minutes > 0 || hours > 0) parts.push(`${String(minutes).padStart(2, '0')}m`);
    parts.push(`${String(secs).padStart(2, '0')}s`);
    
    return parts.join(' ');
  };
  
  export const formatEventDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(dateString));
  };