// Run in the OLD Replit app's browser console. Reads data; never changes it.
(async () => {
  const backup = Object.create(null);
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (/^(fitcircle_|fitness_calc_|workout-tracker-)/.test(key)) {
      const value = localStorage.getItem(key);
      try { backup[key] = JSON.parse(value); } catch { backup[key] = value; }
    }
  }
  backup.__indexeddb_custom_foods = await new Promise((resolve, reject) => {
    const req = indexedDB.open('FitCircleCustomFoods');
    // If no database exists, abort creation rather than modifying this origin.
    let absent = false;
    req.onupgradeneeded = () => { absent = true; req.transaction.abort(); };
    req.onerror = () => absent ? resolve([]) : reject(req.error);
    req.onblocked = () => reject(new Error('Close other FitCircle tabs and retry'));
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('foods')) { db.close(); resolve([]); return; }
      const tx = db.transaction('foods', 'readonly');
      const read = tx.objectStore('foods').getAll();
      tx.oncomplete = () => { db.close(); resolve(read.result); };
      tx.onabort = () => { db.close(); reject(tx.error); };
    };
  });
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = `fitcircle-replit-backup-${Date.now()}.json`;
  link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
})().catch(error => console.error('Backup failed. No data was changed.', error));
