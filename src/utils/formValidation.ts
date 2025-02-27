export const validateTimes = (startTime: string, endTime: string): boolean => {
  if (startTime && endTime && startTime >= endTime) {
    return false;
  }
  return true;
};

export const formatTimeForSelect = (time: string): string => {
  // Convert "HH:MM:SS" to "HH:MM" format
  return time ? time.slice(0, 5) : '';
};