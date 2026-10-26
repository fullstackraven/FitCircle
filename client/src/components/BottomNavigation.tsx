import { DockNavigation } from './DockNavigation';
import { useLocation } from 'wouter';

export default function BottomNavigation() {
  const [location, navigate] = useLocation();

  // Hide navigation on wellness sub-pages
  const wellnessSubPages = [
    '/cardio',
    '/fasting', 
    '/meditation',
    '/hydration',
    '/measurements',
    '/food-tracker',
    '/fitness-calculator',
    '/recovery',
    '/journal-log',
    '/journal-entry',
    '/energy-level',
    '/supplements-page'
  ];

  // Don't render navigation on wellness sub-pages
  if (wellnessSubPages.includes(location) || location.startsWith("/dynamic-overview/")) {
    return null;
  }

  return <DockNavigation location={location} navigate={navigate} />;
}
