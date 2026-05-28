import { db } from '@/src/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { getTodayDateKey, withTimeout } from './visitorTrackerClient';

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
    const res = await fetch('/api/analytics/increment-files-processed', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count })
    });
    
    const contentType = res.headers.get('content-type');
    if (res.ok && contentType && contentType.includes('application/json')) {
      console.log("Recorded files processed via API.");
      return;
    } else {
      throw new Error("Not a real JSON API endpoint");
    }
  } catch (error) {
    console.debug("Backend analytics offline, falling back to direct Firestore.");
  }

  // Direct Firestore increment fallback with robust timeout
  try {
    const todayKey = getTodayDateKey();
    const globalRef = doc(db, "globalStats", "summary");
    const globalSnap = await withTimeout(getDoc(globalRef), 2000);
    if (!globalSnap.exists()) {
      await withTimeout(setDoc(globalRef, {
        totalPageViews: 0,
        totalVisitors: 0,
        uniqueVisitors: 0,
        filesProcessed: count,
        lastUpdated: new Date().toISOString()
      }), 2000);
    } else {
      await withTimeout(updateDoc(globalRef, {
        filesProcessed: increment(count),
        lastUpdated: new Date().toISOString()
      }), 2000);
    }

    const dailyRef = doc(db, "dailyStats", todayKey);
    const dailySnap = await withTimeout(getDoc(dailyRef), 2000);
    if (dailySnap.exists()) {
      await withTimeout(updateDoc(dailyRef, {
        filesProcessed: increment(count)
      }), 2000);
    } else {
      await withTimeout(setDoc(dailyRef, {
        date: todayKey,
        totalPageViews: 0,
        totalVisitors: 0,
        uniqueVisitors: 0,
        devices: { Desktop: 0, Mobile: 0, Tablet: 0 },
        browsers: { Chrome: 0, Safari: 0, Firefox: 0, Edge: 0, Opera: 0, "Internet Explorer": 0, Unknown: 0 },
        pageViewsByPath: {},
        filesProcessed: count
      }), 2000);
    }
    console.log("Recorded files processed via client firestore direct.");
  } catch (err) {
    console.warn("Failed direct filesProcessed firestore track:", err);
  }
}

