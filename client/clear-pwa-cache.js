// Aggressive PWA cache clearing script
(function() {
  console.log('🔄 Starting aggressive PWA cache clearing...');
  
  // Step 1: Clear all service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      console.log(`📱 Found ${registrations.length} service workers to unregister`);
      for(let registration of registrations) {
        registration.unregister();
        console.log('🗑️ Unregistered service worker:', registration.scope);
      }
    });
  }

  // Step 2: Clear all caches
  if ('caches' in window) {
    caches.keys().then(function(names) {
      console.log(`💾 Found ${names.length} caches to delete:`, names);
      return Promise.all(names.map(function(name) {
        console.log('🗑️ Deleting cache:', name);
        return caches.delete(name);
      }));
    }).then(function() {
      console.log('✅ All caches cleared');
    });
  }

  // Step 3: Clear all storage
  try {
    console.log('🧹 Clearing sessionStorage...');
    sessionStorage.clear();
  } catch(e) {
    console.log('❌ Could not clear sessionStorage:', e);
  }

  // Step 4: Force reload with aggressive cache busting
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const newUrl = window.location.origin + '/?v=' + timestamp + '&r=' + random + '&clear=true';
  
  console.log('🔄 Forcing reload to:', newUrl);
  
  // Use location.replace to prevent back button issues
  setTimeout(() => {
    window.location.replace(newUrl);
  }, 1000);
})();