export async function trackFileProcessed(count: number = 1) {
  try {
    await fetch('/api/analytics/increment-files-processed', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count })
    });
  } catch (error) {
    console.warn("Failed to increment files processed analytics:", error);
  }
}
