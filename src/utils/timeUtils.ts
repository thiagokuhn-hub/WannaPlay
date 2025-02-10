export const generateTimeOptions = (startHour: number = 6) => {
  const times = [];
  for (let hours = startHour; hours < 24; hours++) {
    for (let minutes = 0; minutes < 60; minutes += 30) {
      const hour = hours.toString().padStart(2, '0');
      const minute = minutes.toString().padStart(2, '0');
      times.push(`${hour}:${minute}`);
    }
  }
  return times;
};