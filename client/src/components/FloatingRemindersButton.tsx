import { useState } from 'react';
import { CheckSquare } from 'lucide-react';
import { useLocation } from 'wouter';

export default function FloatingRemindersButton() {
  const [, navigate] = useLocation();

  const handleClick = () => {
    navigate('/reminders');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-gray-500/80 hover:bg-gray-500/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
      style={{ 
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      <CheckSquare className="w-6 h-6 text-white" />
    </button>
  );
}