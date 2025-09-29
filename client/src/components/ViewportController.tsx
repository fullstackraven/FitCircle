import React, { useEffect } from 'react';

export default function ViewportController() {
  useEffect(() => {
    // Check if visualViewport is supported (iOS Safari, Chrome mobile)
    if (!window.visualViewport) {
      return;
    }

    const updateViewportVars = () => {
      const viewport = window.visualViewport!;
      const windowHeight = window.innerHeight;
      
      // Calculate keyboard offset: how much the viewport has shrunk
      const keyboardOffset = Math.max(0, windowHeight - viewport.height - viewport.offsetTop);
      
      // Set CSS variables for use throughout the app
      document.documentElement.style.setProperty('--keyboard-offset', `${keyboardOffset}px`);
      
      // Set data attribute for CSS targeting
      document.documentElement.setAttribute(
        'data-keyboard-open', 
        keyboardOffset > 0 ? 'true' : 'false'
      );
      
    };

    // Initial update
    updateViewportVars();
    
    // Listen for viewport changes (keyboard open/close, orientation change)
    window.visualViewport.addEventListener('resize', updateViewportVars);
    window.visualViewport.addEventListener('scroll', updateViewportVars);
    
    // Cleanup
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportVars);
        window.visualViewport.removeEventListener('scroll', updateViewportVars);
      }
      
      // Reset CSS variables
      document.documentElement.style.removeProperty('--keyboard-offset');
      document.documentElement.removeAttribute('data-keyboard-open');
    };
  }, []);

  // This component doesn't render anything, it's just for viewport management
  return null;
}