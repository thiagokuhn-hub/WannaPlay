import cron from 'node-cron';
import { startOfWeek } from 'date-fns';

// Schedule task to run every Monday at 00:00
cron.schedule('0 0 * * 1', () => {
  const startOfCurrentWeek = startOfWeek(new Date());
  
  // Clear availabilities from previous week
  const availabilities = JSON.parse(localStorage.getItem('availabilities') || '[]');
  const currentAvailabilities = availabilities.filter(availability => {
    const availabilityDate = new Date(availability.createdAt);
    return availabilityDate >= startOfCurrentWeek;
  });
  
  localStorage.setItem('availabilities', JSON.stringify(currentAvailabilities));
}, {
  scheduled: true,
  timezone: "UTC"
});