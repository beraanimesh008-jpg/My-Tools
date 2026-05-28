export async function trackFileProcessed(count: number = 1) {
  // Always update client-side localStorage count first as a robust fallback
  try {
    const currentLocal = parseInt(localStorage.getItem('mylovespdf_files_processed') || '0', 10);
    localStorage.setItem('mylovespdf_files_processed', (currentLocal + count).toString());
  } catch (err) {
    console.warn("localStorage persistence error:", err);
  }

  // Then attempt to report to the backend API if available
  try {
    await fetch('/api/analytics/increment-files-processed', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count })
    });
  } catch (error) {
    // Expected on static hosting environments like Hostinger
    console.debug("Backend analytics offline, client-side tracking used.");
  }
}

