import React, { useState, useEffect } from 'react';
import Navbar from '@/src/components/Navbar';
import { 
  Users, 
  Eye, 
  Fingerprint, 
  Activity, 
  Download, 
  RefreshCw, 
  Laptop, 
  Smartphone, 
  Tablet as TabletIcon, 
  Compass, 
  Clock, 
  FileText, 
  MousePointer, 
  ChevronRight, 
  Info,
  CheckCircle,
  Database,
  Sliders,
  ShieldCheck,
  Copy,
  Server,
  Key,
  Globe,
  Settings,
  X,
  Plus,
  Trash2,
  Lock,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

export default function VisitorTracker() {
  // Config state controlled by the builder form
  const [dbHost, setDbHost] = useState('localhost');
  const [dbUser, setDbUser] = useState('u429532185_analytics_user');
  const [dbPass, setDbPass] = useState('MyHostingerPassword123!');
  const [dbName, setDbName] = useState('u429532185_analytics_db');
  const [timezone, setTimezone] = useState('UTC');
  const [inactivityTimeout, setInactivityTimeout] = useState(180); // seconds
  const [dashboardPasscode, setDashboardPasscode] = useState('admin@myloves');
  const [ipAnonymize, setIpAnonymize] = useState(true);

  // Tab control
  const [activeSegment, setActiveSegment] = useState<'sandbox' | 'exporter' | 'hostinger'>('sandbox');
  const [exporterFile, setExporterFile] = useState<'sql' | 'config' | 'tracker' | 'api' | 'dashboard' | 'embed'>('config');

  // Simulated traffic state for sandbox
  const [simulatedLiveCount, setSimulatedLiveCount] = useState(7);
  const [simulatedTodayCount, setSimulatedTodayCount] = useState(134);
  const [simulatedTotalCount, setSimulatedTotalCount] = useState(1842);
  const [simulatedViewsCount, setSimulatedViewsCount] = useState(412);
  const [showSpamWarning, setShowSpamWarning] = useState(false);
  const [lastTrackedTime, setLastTrackedTime] = useState<number>(0);

  // Path list with distribution
  const [simulatedPages, setSimulatedPages] = useState<Array<{ path: string; count: number }>>([
    { path: '/', count: 182 },
    { path: '/merge-pdf', count: 98 },
    { path: '/compress-image', count: 64 },
    { path: '/background-remover', count: 48 },
    { path: '/qr-gen', count: 20 },
  ]);

  // Simulated session queue for active log
  const [simulatedSessionLogs, setSimulatedSessionLogs] = useState<Array<{
    id: string;
    ipHash: string;
    path: string;
    device: 'Desktop' | 'Mobile' | 'Tablet';
    browser: 'Chrome' | 'Safari' | 'Firefox' | 'Edge';
    lastActive: number; // seconds ago
  }>>([
    { id: 'sess_1', ipHash: 'a89c92...', path: '/merge-pdf', device: 'Desktop', browser: 'Chrome', lastActive: 4 },
    { id: 'sess_2', ipHash: 'f1e4b3...', path: '/', device: 'Mobile', browser: 'Safari', lastActive: 12 },
    { id: 'sess_3', ipHash: 'c7c88a...', path: '/background-remover', device: 'Mobile', browser: 'Chrome', lastActive: 28 },
    { id: 'sess_4', ipHash: '9d2e11...', path: '/compress-image', device: 'Desktop', browser: 'Edge', lastActive: 54 },
    { id: 'sess_5', ipHash: '43b0f5...', path: '/compress-image', device: 'Tablet', browser: 'Safari', lastActive: 88 },
    { id: 'sess_6', ipHash: '8e100c...', path: '/qr-gen', device: 'Desktop', browser: 'Firefox', lastActive: 132 },
    { id: 'sess_7', ipHash: '320f92...', path: '/', device: 'Mobile', browser: 'Chrome', lastActive: 165 },
  ]);

  // Simulated historical past 7 days chart array
  const [recentHistory, setRecentHistory] = useState([
    { date: '05/22', views: 320, visitors: 110, uniques: 84 },
    { date: '05/23', views: 350, visitors: 125, uniques: 92 },
    { date: '05/24', views: 420, visitors: 140, uniques: 105 },
    { date: '05/25', views: 380, visitors: 118, uniques: 88 },
    { date: '05/26', views: 460, visitors: 151, uniques: 114 },
    { date: '05/27', views: 510, visitors: 168, uniques: 126 },
    { date: 'Today', views: 412, visitors: 154, uniques: 134 }, 
  ]);

  // Copy success banners
  const [copiedFilename, setCopiedFilename] = useState<string | null>(null);

  // Passive Auto-Cleanup Simulator and Timer
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Tick up session idle times by 2 seconds
      setSimulatedSessionLogs((prevLogs) => {
        const updatedLogs = prevLogs.map(log => ({
          ...log,
          lastActive: log.lastActive + 2
        }));

        // 2. AUTO CLEANUP DEMONSTRATION
        // Filter out sessions whose idle time exceeds the builder's inactivity timeout (in seconds)
        const activeLogs = updatedLogs.filter(log => log.lastActive <= inactivityTimeout);
        
        // Update Live counts dynamically based on unique visitor session IDs left
        const liveHits = activeLogs.length;
        setSimulatedLiveCount(liveHits > 0 ? liveHits : 1);
        
        return activeLogs;
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [inactivityTimeout]);

  // Auto-generate mock traffic at random intervals to make the page interactive
  useEffect(() => {
    const mockTrafficInterval = setInterval(() => {
      // 30% chance to generate a visitor trigger automatically
      if (Math.random() > 0.6) {
        generateMockVisitorHit();
      }
    }, 7000);

    return () => clearInterval(mockTrafficInterval);
  }, [simulatedTodayCount, simulatedTotalCount]);

  // Action function to manually simulate a traffic hit
  const generateMockVisitorHit = (selectedPath?: string) => {
    // Spam protection check (debounce manual button hits)
    const now = Date.now();
    if (!selectedPath && now - lastTrackedTime < 1000) {
      setShowSpamWarning(true);
      setTimeout(() => setShowSpamWarning(false), 3000);
      return;
    }
    if (!selectedPath) {
      setLastTrackedTime(now);
    }

    const pages = ['/', '/merge-pdf', '/compress-image', '/background-remover', '/qr-gen', '/resume-builder'];
    const browsers: Array<'Chrome' | 'Safari' | 'Firefox' | 'Edge'> = ['Chrome', 'Safari', 'Firefox', 'Edge'];
    const devices: Array<'Desktop' | 'Mobile' | 'Tablet'> = ['Desktop', 'Mobile', 'Tablet'];
    
    // Choose properties
    const path = selectedPath || pages[Math.floor(Math.random() * pages.length)];
    const device = devices[Math.floor(Math.random() * devices.length)];
    const browser = browsers[Math.floor(Math.random() * browsers.length)];
    const sessionToken = 'sess_' + Math.floor(Math.random() * 100000);
    const hexIp = Math.random().toString(16).substring(2, 8);
    const ipHash = `${hexIp}...`;

    // 1. Log simulation data changes
    setSimulatedSessionLogs(prev => [
      { id: sessionToken, ipHash, path, device, browser, lastActive: 0 },
      ...prev
    ]);

    // 2. Adjust counters
    setSimulatedViewsCount(v => v + 1);
    
    // 15% probability that it is a completely new unique user session ever, and 45% new today
    const isNewToday = Math.random() < 0.7;
    const isNewEver = isNewToday && (Math.random() < 0.4);

    if (isNewToday) {
      setSimulatedTodayCount(prev => prev + 1);
    }
    if (isNewEver) {
      setSimulatedTotalCount(prev => prev + 1);
    }

    // 3. Update path list distribution
    setSimulatedPages(prev => {
      const idx = prev.findIndex(p => p.path === path);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx].count += 1;
        return copy.sort((a,b) => b.count - a.count);
      } else {
        return [...prev, { path, count: 1 }].sort((a,b) => b.count - a.count);
      }
    });

    // 4. Update the graph today coordinate
    setRecentHistory(prev => {
      const updated = [...prev];
      const todayIndex = updated.length - 1;
      updated[todayIndex] = {
        ...updated[todayIndex],
        views: updated[todayIndex].views + 1,
        visitors: updated[todayIndex].visitors + (isNewToday ? 1 : 0),
        uniques: updated[todayIndex].uniques + (isNewEver ? 1 : 0)
      };
      return updated;
    });
  };

  // Helper trigger to copy formatted strings to user's clipboard
  const copyTextToClipboard = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFilename(title);
    setTimeout(() => setCopiedFilename(null), 2500);
  };

  // Automated custom individual file downloader triggers
  const downloadFileLocally = (filename: string, text: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // COMPLETE MULTI-FILE PHP SYSTEM COMPONENT CONFIGUABLE TEMPLATES
  const filesData = {
    sql: `-- Website Traffic Analytics DB Schema Setup
-- Run this on Hostinger phpMyAdmin to provision database structures automatically.

CREATE DATABASE IF NOT EXISTS \`${dbName}\`;
USE \`${dbName}\`;

-- 1. Table: Active visitor sessions for Live Online counting with fast numeric indexes
CREATE TABLE IF NOT EXISTS \`visitor_sessions\` (
  \`session_id\` VARCHAR(128) NOT NULL,
  \`ip_hashed\` VARCHAR(64) NOT NULL,
  \`user_agent\` VARCHAR(255) DEFAULT '',
  \`device_type\` VARCHAR(20) DEFAULT 'Desktop',
  \`browser\` VARCHAR(50) DEFAULT 'Unknown',
  \`current_page\` VARCHAR(255) DEFAULT '/',
  \`last_activity\` INT UNSIGNED NOT NULL,
  PRIMARY KEY (\`session_id\`),
  KEY \`idx_last_activity\` (\`last_activity\`),
  KEY \`idx_ip_hashed\` (\`ip_hashed\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table: Daily unique records (protects against cookie deletions or duplicate count reloads)
CREATE TABLE IF NOT EXISTS \`visitor_daily_uniques\` (
  \`ip_hashed\` VARCHAR(64) NOT NULL,
  \`visit_date\` DATE NOT NULL,
  PRIMARY KEY (\`ip_hashed\`, \`visit_date\`),
  KEY \`idx_visit_date\` (\`visit_date\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table: High-performance aggregated Page Views statistics
CREATE TABLE IF NOT EXISTS \`visitor_page_views\` (
  \`visit_date\` DATE NOT NULL,
  \`page_path\` VARCHAR(255) NOT NULL,
  \`views_count\` INT UNSIGNED DEFAULT 1,
  PRIMARY KEY (\`visit_date\`, \`page_path\`),
  KEY \`idx_page_path\` (\`page_path\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`,

    config: `<?php
/**
 * Website Traffic Analytics System - Configuration Module
 * Automatically styled for Hostinger MySQL Integrations
 */

// 1. MySQL Server Database Connection Configs
define('DB_HOST', '${dbHost}');         // Usually 'localhost' on Hostinger hPanel
define('DB_USER', '${dbUser}'); // Your database login username
define('DB_PASS', '${dbPass}'); // Your database secure password
define('DB_NAME', '${dbName}'); // Your database name

// 2. General Settings & Compliance
define('SECURITY_SALT', '${hashRandomSalt(dbPass)}'); // Unique encrypting variable
define('IP_ANONYMIZE', ${ipAnonymize ? 'true' : 'false'}); // GDPR IP protection toggle

// 3. Counting & Cleanup Logic
define('SESSION_TIMEOUT_SECONDS', ${inactivityTimeout}); // Idle timeout in seconds
define('SYSTEM_TIMEZONE', '${timezone}'); // Core localized zone definition

// 4. Admin Access Keys for Secure View
define('DASHBOARD_PASSCODE', '${dashboardPasscode}'); // Passcode to restrict public view

// Apply selected timezone configurations
date_default_timezone_set(SYSTEM_TIMEZONE);

// Initialize DB Safe Connection Helper using modern mysqli standard
function get_db_connection() {
    $conn = @new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode([
            "error" => "Database connection failed. Please cross-verify your credentials inside config.php.",
            "details" => $conn->connect_error
        ]);
        exit();
    }
    $conn->set_charset("utf8mb4");
    return $conn;
}
`,

    tracker: `<?php
/**
 * Website Traffic Analytics System - Tracking Core Engine
 * Captures visitor coordinates, checks duplicates, & manages background live session cleanups passive-style.
 */
require_once __DIR__ . '/config.php';

// Resolves client IP cleanly, supporting Cloudflare proxy headers
function get_real_client_ip() {
    $candidate_headers = [
        'HTTP_CLIENT_IP',
        'HTTP_X_FORWARDED_FOR',
        'HTTP_X_FORWARDED',
        'HTTP_X_CLUSTER_CLIENT_IP',
        'HTTP_FORWARDED_FOR',
        'HTTP_FORWARDED',
        'REMOTE_ADDR'
    ];
    
    foreach ($candidate_headers as $header) {
        if (!empty($_SERVER[$header])) {
            $ip_list = explode(',', $_SERVER[$header]);
            $client_ip = trim($ip_list[0]);
            if (filter_var($client_ip, FILTER_VALIDATE_IP)) {
                return $client_ip;
            }
        }
    }
    return '127.0.0.1';
}

// Simple browser classification algorithm
function parse_user_agent($ua) {
    $browser = 'Other Browser';
    $device = 'Desktop';
    if (empty($ua)) return ['browser' => $browser, 'device' => $device];

    // Detect Device type
    if (preg_match('/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i', $ua)) {
        $device = 'Tablet';
    } elseif (preg_match('/(mobi|ipod|phone|iphone|blackberry|opera mini|fennec|windows phone)/i', $ua)) {
        $device = 'Mobile';
    }

    // Detect browser
    if (preg_match('/firefox/i', $ua)) {
        $browser = 'Firefox';
    } elseif (preg_match('/chrome/i', $ua)) {
        $browser = 'Chrome';
    } elseif (preg_match('/safari/i', $ua)) {
        $browser = 'Safari';
    } elseif (preg_match('/edge|edg/i', $ua)) {
        $browser = 'Edge';
    } elseif (preg_match('/opera|opr/i', $ua)) {
        $browser = 'Opera';
    }
    return ['browser' => $browser, 'device' => $device];
}

// Cross-origin tracking headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Read and sanitize paths
$uri = isset($_GET['path']) ? trim($_GET['path']) : '/';
$page_path = filter_var($uri, FILTER_SANITIZE_URL);
if (empty($page_path)) $page_path = '/';

// Start unique session structure to prevent page-refresh spam
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$session_id = session_id();

// Resolve metrics
$raw_ip = get_real_client_ip();
$ip_hashed = IP_ANONYMIZE ? hash('sha256', $raw_ip . SECURITY_SALT) : $raw_ip;
$user_agent = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '';

$attributes = parse_user_agent($user_agent);
$browser = $attributes['browser'];
$device = $attributes['device'];
$current_epoch = time();
$date_key = date('Y-m-d');

$conn = get_db_connection();

try {
    // 1. AUTO SESSIONS CLEANUP (Active deletion of stale sessions on every page hit - NO CRON REQUIRED!)
    $cleanup_time = $current_epoch - SESSION_TIMEOUT_SECONDS;
    $stmt_clean = $conn->prepare("DELETE FROM visitor_sessions WHERE last_activity < ?");
    $stmt_clean->bind_param("i", $cleanup_time);
    $stmt_clean->execute();
    $stmt_clean->close();

    // 2. MANAGE THE ACTIVE SESSION RECORD
    $stmt_sess = $conn->prepare("INSERT INTO visitor_sessions (session_id, ip_hashed, user_agent, device_type, browser, current_page, last_activity) 
        VALUES (?, ?, ?, ?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE current_page = VALUES(current_page), last_activity = VALUES(last_activity)");
    $stmt_sess->bind_param("ssssssi", $session_id, $ip_hashed, $user_agent, $device, $browser, $page_path, $current_epoch);
    $stmt_sess->execute();
    $stmt_sess->close();

    // 3. PREVENT DUPLICATE COUNT & LOG ON NEW DATE (INSERT IGNORE guards keys)
    $stmt_uniq = $conn->prepare("INSERT IGNORE INTO visitor_daily_uniques (ip_hashed, visit_date) VALUES (?, ?)");
    $stmt_uniq->bind_param("ss", $ip_hashed, $date_key);
    $stmt_uniq->execute();
    $stmt_uniq->close();

    // 4. UPDATE PAGE VIEWS DISTRIBUTION COUNTER
    $stmt_views = $conn->prepare("INSERT INTO visitor_page_views (visit_date, page_path, views_count) 
        VALUES (?, ?, 1) 
        ON DUPLICATE KEY UPDATE views_count = views_count + 1");
    $stmt_views->bind_param("ss", $date_key, $page_path);
    $stmt_views->execute();
    $stmt_views->close();

    echo json_encode(["status" => "success", "message" => "Visitor coordinates logged. active_user=true"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database write abort.", "error" => $e->getMessage()]);
} finally {
    $conn->close();
}
`,

    api: `<?php
/**
 * Website Traffic Analytics System - Secure JSON API Endpoint
 * Resolves aggregate metrics for automated frontend AJAX updates without full-pages reloads.
 */
require_once __DIR__ . '/config.php';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// Passcode Validation for maximum metrics safety
$passcode = isset($_GET['passcode']) ? $_GET['passcode'] : '';
if ($passcode !== DASHBOARD_PASSCODE) {
    http_response_code(401);
    echo json_encode(["error" => "Access denied. Correct passcode parameter required."]);
    exit();
}

$conn = get_db_connection();
$date_key = date('Y-m-d');
$current_epoch = time();

try {
    // Perform lazy cleanup 
    $cleanup_time = $current_epoch - SESSION_TIMEOUT_SECONDS;
    $conn->query("DELETE FROM visitor_sessions WHERE last_activity < $cleanup_time");

    // Fetch Live online active count using unique sessions
    $res_live = $conn->query("SELECT COUNT(*) AS count FROM visitor_sessions");
    $live_count = $res_live->fetch_assoc()['count'];

    // Today's Unique user sessions count
    $stmt_tod = $conn->prepare("SELECT COUNT(*) AS count FROM visitor_daily_uniques WHERE visit_date = ?");
    $stmt_tod->bind_param("s", $date_key);
    $stmt_tod->execute();
    $today_uniq = $stmt_tod->get_result()->fetch_assoc()['count'];
    $stmt_tod->close();

    // Total lifetime unique visitors count desde launch
    $res_tot = $conn->query("SELECT COUNT(DISTINCT ip_hashed) AS count FROM visitor_daily_uniques");
    $total_uniq = $res_tot->fetch_assoc()['count'];

    // Today's total page views quantity
    $stmt_vw = $conn->prepare("SELECT SUM(views_count) as total FROM visitor_page_views WHERE visit_date = ?");
    $stmt_vw->bind_param("s", $date_key);
    $stmt_vw->execute();
    $today_views = $stmt_vw->get_result()->fetch_assoc()['total'] ?? 0;
    $stmt_vw->close();

    // Browser metrics today
    $res_agent = $conn->query("SELECT browser, COUNT(*) as qty FROM visitor_sessions GROUP BY browser");
    $browser_stats = [];
    while($row = $res_agent->fetch_assoc()) {
        $browser_stats[$row['browser']] = (int)$row['qty'];
    }

    // Devices metrics today
    $res_devs = $conn->query("SELECT device_type, COUNT(*) as qty FROM visitor_sessions GROUP BY device_type");
    $device_stats = ["Desktop" => 0, "Mobile" => 0, "Tablet" => 0];
    while($row = $res_devs->fetch_assoc()) {
        $device_stats[$row['device_type']] = (int)$row['qty'];
    }

    // URL path views today ordered by popularity
    $stmt_pop = $conn->prepare("SELECT page_path, views_count FROM visitor_page_views WHERE visit_date = ? ORDER BY views_count DESC LIMIT 10");
    $stmt_pop->bind_param("s", $date_key);
    $stmt_pop->execute();
    $res_pop = $stmt_pop->get_result();
    $path_stats = [];
    while($row = $res_pop->fetch_assoc()) {
        $path_stats[] = [ "path" => $row['page_path'], "views" => (int)$row['views_count'] ];
    }
    $stmt_pop->close();

    // 7-day Historical Stats
    $historical_timeline = [];
    for ($i = 6; $i >= 0; $i--) {
        $d = date('Y-m-d', strtotime("-$i days"));
        
        $sh1 = $conn->prepare("SELECT COUNT(*) as count FROM visitor_daily_uniques WHERE visit_date = ?");
        $sh1->bind_param("s", $d);
        $sh1->execute();
        $history_uniques = $sh1->get_result()->fetch_assoc()['count'];
        $sh1->close();

        $sh2 = $conn->prepare("SELECT SUM(views_count) as views FROM visitor_page_views WHERE visit_date = ?");
        $sh2->bind_param("s", $d);
        $sh2->execute();
        $history_views = $sh2->get_result()->fetch_assoc()['views'] ?? 0;
        $sh2->close();

        $historical_timeline[] = [
            "date" => date('m/d', strtotime($d)),
            "views" => (int)$history_views,
            "visitors" => (int)$history_uniques
        ];
    }

    // Activity Stream logs list
    $res_stream = $conn->query("SELECT browser, device_type, current_page, last_activity FROM visitor_sessions ORDER BY last_activity DESC LIMIT 8");
    $activity_stream = [];
    while($row = $res_stream->fetch_assoc()) {
        $activity_stream[] = [
            "browser" => $row['browser'],
            "device" => $row['device_type'],
            "path" => $row['current_page'],
            "time" => date('H:i:s', $row['last_activity'])
        ];
    }

    echo json_encode([
        "status" => "success",
        "live_online" => (int)$live_count,
        "today_visitors" => (int)$today_uniq,
        "total_visitors" => (int)$total_uniq,
        "today_pageviews" => (int)$today_views,
        "devices" => $device_stats,
        "browsers" => $browser_stats,
        "paths" => $path_stats,
        "history" => $historical_timeline,
        "stream" => $activity_stream
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Operation exception metrics query context", "details" => $e->getMessage()]);
} finally {
    $conn->close();
}
`,

    dashboard: `<?php
/**
 * Website Traffic Analytics System - HTML/PHP Standalone Dashboard
 * Stunning fully responsive client-side interface built with Tailwind CSS CDN and Chart.js.
 * Automatically polls api.php dynamically utilizing asynchronous AJAX requests.
 */
require_once __DIR__ . '/config.php';

// Passcode Protection Flow
session_start();
$logged_in = false;

if (isset($_SESSION['analytics_auth']) && $_SESSION['analytics_auth'] === true) {
    $logged_in = true;
}

if (isset($_POST['passcode'])) {
    if ($_POST['passcode'] === DASHBOARD_PASSCODE) {
        $_SESSION['analytics_auth'] = true;
        header("Location: " . $_SERVER['PHP_SELF']);
        exit();
    } else {
        $login_error = "Invalid analytics passcode, please try again.";
    }
}

if (isset($_GET['logout'])) {
    unset($_SESSION['analytics_auth']);
    session_destroy();
    header("Location: " . $_SERVER['PHP_SELF']);
    exit();
}

if (!$logged_in):
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Secure Access | Web Traffic Analytics</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-slate-900 flex items-center justify-center min-h-screen p-4">
    <div class="w-full max-w-md bg-slate-800 rounded-3xl border border-slate-700 p-8 shadow-xl relative overflow-hidden">
        <div class="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl"></div>
        
        <div class="text-center mb-8">
            <div class="inline-flex p-3.5 bg-rose-500/10 text-rose-500 rounded-2xl mb-4">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </div>
            <h1 class="text-2xl font-bold text-white tracking-tight">System Access Secured</h1>
            <p class="text-slate-400 text-sm mt-1.5">Enter dashboard authorization passcode below</p>
        </div>

        <?php if (isset($login_error)): ?>
            <div class="p-4 mb-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-450 text-sm font-semibold flex gap-2">
                <span class="text-rose-500 font-bold">&#9888;</span> <?php echo $login_error; ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="">
            <div class="space-y-4">
                <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Access PIN Passcode</label>
                    <input type="password" required name="passcode" placeholder="Enter PIN (Default: admin123)" class="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-center tracking-widest text-lg">
                </div>
                <button type="submit" class="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-rose-900/40">Authorize Session</button>
            </div>
        </form>
    </div>
</body>
</html>
<?php
exit();
endif;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MyLoves | Web Traffic Analytics Dashboard</title>
    <!-- Tailwind CSS and Chart.js Integration CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet font">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col">
    <!-- Navbar -->
    <header class="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 bg-rose-600 rounded-xl flex items-center justify-center font-black text-white text-xl">M</div>
                <div>
                    <span class="text-xl font-black text-rose-500">MyLoves</span>
                    <span class="text-slate-400 font-bold ml-1.5 text-xs uppercase tracking-widest">Traffic Analytics</span>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 rounded-full">
                    <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Auto Polling ACTIVE
                </span>
                <a href="?logout=true" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 font-bold text-xs text-slate-300 rounded-xl transition-all">Signout Suite</a>
            </div>
        </div>
    </header>

    <main class="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        
        <!-- Stats summary cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <!-- Card 1: Users Online -->
            <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
                <div class="absolute top-4 right-4 animate-ping w-2 h-2 bg-emerald-500 rounded-full"></div>
                <div class="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">Live Online Visitors</div>
                <div id="live_value" class="text-4xl font-extrabold text-white font-mono">--</div>
                <div class="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> Active inside timeout threshold
                </div>
            </div>

            <!-- Card 2: Today's Visitors -->
            <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                <div class="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">Today's Visitors (Uniques)</div>
                <div id="today_value" class="text-4xl font-extrabold text-white font-mono">--</div>
                <div class="text-xs text-slate-500 mt-2">Daily timezone unique network IPs</div>
            </div>

            <!-- Card 3: Today's Pageviews -->
            <div class="bg-slate-905 border border-slate-800 p-6 rounded-3xl">
                <div class="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">Today's Total Pageviews</div>
                <div id="today_views_value" class="text-4xl font-extrabold text-white font-mono">--</div>
                <div class="text-xs text-slate-500 mt-2">All integrated pages/URLs counts</div>
            </div>

            <!-- Card 4: Total Unique Visitors -->
            <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                <div class="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">Total Unified Visitors</div>
                <div id="total_value" class="text-4xl font-extrabold text-white font-mono">--</div>
                <div class="text-xs text-slate-500 mt-2">Unique IPs globally since system setup</div>
            </div>
        </div>

        <!-- Charts Dashboard grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Timeline Chart -->
            <div class="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between">
                <div>
                    <h3 class="text-lg font-bold text-white">Daily Traffic History</h3>
                    <p class="text-xs text-slate-400 mt-0.5">Last 7 days unique visits vs views counts</p>
                </div>
                <div class="mt-6 h-64 w-full">
                    <canvas id="timelineChart"></canvas>
                </div>
            </div>

            <!-- Device Demographics -->
            <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                <h3 class="text-lg font-bold text-white mb-6">Device Share (Live Users)</h3>
                <div class="space-y-5" id="devices_container">
                    <div class="text-slate-400 text-sm">Querying active sessions data...</div>
                </div>
            </div>
        </div>

        <!-- Secondary grid: Top Pages & Active logs -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Popular Pages Today -->
            <div class="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                <h3 class="text-lg font-bold text-white mb-6">Top Pages Today</h3>
                <div class="space-y-3.5" id="paths_container">
                    <div class="text-slate-400 text-sm">Ingesting metrics...</div>
                </div>
            </div>

            <!-- Real-time raw hit stream logs logger -->
            <div class="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-bold text-white">Live Visitor Stream</h3>
                    <span class="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg">Realtime Audit Telemetry</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm text-slate-300">
                        <thead class="text-xs font-bold uppercase text-slate-500 bg-slate-950/40 border-b border-slate-850">
                            <tr>
                                <th class="py-3 px-4">Device/Browser</th>
                                <th class="py-3 px-4">Page Path</th>
                                <th class="py-3 px-4">Last Active</th>
                            </tr>
                        </thead>
                        <tbody id="stream_container" class="divide-y divide-slate-800/40 font-semibold">
                            <tr>
                                <td colspan="3" class="py-6 text-center text-slate-500">Awaiting stream packets...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>

    <!-- AJAX updates script -->
    <script>
        const passcode = "${dashboardPasscode}";
        const apiPath = "api.php?passcode=" + passcode;
        let timelineChartInstance = null;

        async function fetchMetricsAndUpdate() {
            try {
                const response = await fetch(apiPath);
                if (!response.ok) throw new Error("Credentials/Config error");
                
                const data = await response.json();
                
                // 1. Update Core values
                document.getElementById('live_value').textContent = data.live_online;
                document.getElementById('today_value').textContent = data.today_visitors;
                document.getElementById('total_value').textContent = data.total_visitors;
                document.getElementById('today_views_value').textContent = data.today_pageviews;

                // 2. Render Device indicators
                const devsContainer = document.getElementById('devices_container');
                devsContainer.innerHTML = '';
                const totalDev = (data.devices.Desktop + data.devices.Mobile + data.devices.Tablet) || 1;
                
                ['Desktop', 'Mobile', 'Tablet'].forEach(key => {
                    const count = data.devices[key] || 0;
                    const percent = Math.round((count / totalDev) * 100);
                    
                    devsContainer.innerHTML += \`
                        <div class="space-y-1.5">
                            <div class="flex justify-between items-center text-xs">
                                <span class="font-bold text-slate-200">\${key}</span>
                                <span class="font-bold text-slate-400">\${count} users (\${percent}%)</span>
                            </div>
                            <div class="w-full h-2 bg-slate-955 border border-slate-800 rounded-full overflow-hidden">
                                <div class="h-full rounded-full \${key === 'Desktop' ? 'bg-blue-500' : key === 'Mobile' ? 'bg-emerald-500' : 'bg-orange-500'}" style="width: \${percent}%"></div>
                            </div>
                        </div>
                    \`;
                });

                // 3. Render Top Page URLs today
                const pathsContainer = document.getElementById('paths_container');
                pathsContainer.innerHTML = '';
                if(data.paths.length === 0) {
                    pathsContainer.innerHTML = '<div class="text-slate-450 text-xs py-2">No pages populated yet today.</div>';
                } else {
                    const totalViews = data.today_pageviews || 1;
                    data.paths.forEach(item => {
                        const percent = Math.round((item.views / totalViews) * 100);
                        pathsContainer.innerHTML += \`
                            <div>
                                <div class="flex justify-between items-center text-xs text-slate-200 font-bold">
                                    <span class="truncate max-w-xs font-mono text-indigo-400">\${item.path}</span>
                                    <span>\${item.views} PV</span>
                                </div>
                                <div class="w-full h-1 bg-slate-950 rounded-full overflow-hidden mt-1">
                                    <div class="h-full bg-rose-600 rounded-full animate-pulse" style="width: \${percent}%"></div>
                                </div>
                            </div>
                        \`;
                    });
                }

                // 4. Render Active stream rows
                const streamContainer = document.getElementById('stream_container');
                streamContainer.innerHTML = '';
                if (data.stream.length === 0) {
                    streamContainer.innerHTML = '<tr><td colspan="3" class="py-4 text-center text-slate-500 text-xs">Waiting for hits logs...</td></tr>';
                } else {
                    data.stream.forEach(row => {
                        const icon = row.device === 'Mobile' ? '📱' : row.device === 'Tablet' ? '📟' : '💻';
                        streamContainer.innerHTML += \`
                            <tr class="hover:bg-slate-900 transition-colors text-xs font-semibold">
                                <td class="py-3 px-4 flex items-center gap-2">
                                    <span class="text-lg">\${icon}</span>
                                    <div>
                                        <div class="text-white font-bold">\${row.browser}</div>
                                        <div class="text-slate-500 font-normal">\${row.device}</div>
                                    </div>
                                </td>
                                <td class="py-3 px-4 font-mono text-rose-450 font-bold text-indigo-400">\${row.path}</td>
                                <td class="py-3 px-4 text-slate-450 flex items-center gap-1">
                                    <svg class="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0yZ"/></svg>
                                    \&nbsp;\${row.time}
                                </td>
                            </tr>
                        \`;
                    });
                }

                // 5. Render Timeline chart via canvas
                const chartLabels = data.history.map(h => h.date);
                const chartViews = data.history.map(h => h.views);
                const chartVisitors = data.history.map(h => h.visitors);

                if (!timelineChartInstance) {
                    const ctx = document.getElementById('timelineChart').getContext('2d');
                    timelineChartInstance = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: chartLabels,
                            datasets: [
                                {
                                    label: 'Page Views Today',
                                    data: chartViews,
                                    borderColor: '#f43f5e',
                                    backgroundColor: 'rgba(244, 63, 94, 0.05)',
                                    fill: true,
                                    tension: 0.35,
                                    borderWidth: 2
                                },
                                {
                                    label: 'Unique Visitors',
                                    data: chartVisitors,
                                    borderColor: '#10b981',
                                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                                    fill: true,
                                    tension: 0.35,
                                    borderWidth: 2
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { labels: { color: '#94a3b8', font: { family: 'Inter', weight: 'bold' } } }
                            },
                            scales: {
                                x: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { color: '#94a3b8' } },
                                y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { color: '#94a3b8', precision: 0 } }
                            }
                        }
                    });
                } else {
                    timelineChartInstance.data.labels = chartLabels;
                    timelineChartInstance.data.datasets[0].data = chartViews;
                    timelineChartInstance.data.datasets[1].data = chartVisitors;
                    timelineChartInstance.update('none');
                }

            } catch (err) {
                console.warn("Analytics refresh cycle interrupted: ", err);
            }
        }

        // Initialize and setup 5-seconds dashboard poll loops
        fetchMetricsAndUpdate();
        setInterval(fetchMetricsAndUpdate, 5000);
    </script>
</body>
</html>
`,

    embed: `/**
 * Website Traffic Analytics System - Dynamic Embed Script
 * Asynchronously logs pageviews during visitor loading cycles.
 * Save this file inside your Hostinger '/analytics/' folder as 'embed.js'.
 */
(function() {
    // 1. Point of contact inside your server path
    const trackerEndpoint = "https://yourdomain.com/analytics/track.php";

    function triggerTrafficTrackingPackage() {
        try {
            // Read path string safely
            const pathName = window.location.pathname || "/";
            const requestUrl = trackerEndpoint + "?path=" + encodeURIComponent(pathName) + "&nocache=" + Date.now();

            // Trigger quiet XMLHttp API request asynchronous delivery
            const xhr = new XMLHttpRequest();
            xhr.open("GET", requestUrl, true);
            xhr.withCredentials = true; // Send existing session identifiers securely
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    // Logs result safely under debug conditions
                    console.debug("Analytics processed (status: " + xhr.status + ")");
                }
            };
            xhr.send();
        } catch (err) {
            console.warn("Silent traffic tracking interrupted: ", err);
        }
    }

    // Load trigger on DOM render completeness
    if (document.readyState === "complete" || document.readyState === "interactive") {
        triggerTrafficTrackingPackage();
    } else {
        window.addEventListener("DOMContentLoaded", triggerTrafficTrackingPackage);
    }
})();
`
  };

  // Safe hashing helper
  function hashRandomSalt(seed: string) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    return 'salt_' + Math.abs(hash).toString(16).substring(0, 8);
  }

  // Get current active file contents depending on configuration values
  const getSelectedCode = () => {
    return filesData[exporterFile];
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 transition-colors duration-300">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        
        {/* Banner Segment */}
        <div className="relative overflow-hidden p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl -z-10"></div>
          
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black bg-rose-500/10 text-rose-500 rounded-full border border-rose-500/20 mb-4 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> High-Performance PHP Suite
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Website Traffic Analytics <span className="bg-gradient-to-r from-rose-500 to-indigo-500 bg-clip-text text-transparent">Creator Toolkit</span>
            </h1>
            <p className="text-slate-400 text-base sm:text-lg mt-3 leading-relaxed">
              Generate, preview, customize, and export a complete, lightweight, and ultra-secure visitor traffic tracker for your websites. Optimized explicitly to run perfectly on Hostinger Shared & VPS environments.
            </p>
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-800/80">
            <div className="space-y-1">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Real-time update</div>
              <div className="text-sm font-semibold text-white">Polled Automatically (AJAX)</div>
            </div>
            <div className="space-y-1 border-l border-slate-800/80 pl-4">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Server Cleanups</div>
              <div className="text-sm font-semibold text-white">Auto Inactive Garbage Collection</div>
            </div>
            <div className="space-y-1 border-l border-slate-800/80 pl-4">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Security Engine</div>
              <div className="text-sm font-semibold text-white">IP Cryptographic Hash Protection</div>
            </div>
            <div className="space-y-1 border-l border-slate-800/80 pl-4">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Hostinger Friendly</div>
              <div className="text-sm font-semibold text-white">SQL Schemas + Modern mysqli</div>
            </div>
          </div>
        </div>

        {/* Global tab routing headers */}
        <div className="flex border-b border-slate-800 gap-2 pb-0.5">
          <button 
            onClick={() => setActiveSegment('sandbox')}
            className={`px-5 py-3 font-extrabold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeSegment === 'sandbox' ? 'border-rose-600 text-rose-500 bg-rose-500/5 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            <Activity className="w-4 h-4" /> Live Sandbox Dashboard Preview
          </button>
          <button 
            onClick={() => setActiveSegment('exporter')}
            className={`px-5 py-3 font-extrabold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeSegment === 'exporter' ? 'border-indigo-600 text-indigo-500 bg-indigo-500/5 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            <Sliders className="w-4 h-4" /> Customized Code Exporter
          </button>
          <button 
            onClick={() => setActiveSegment('hostinger')}
            className={`px-5 py-3 font-extrabold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeSegment === 'hostinger' ? 'border-emerald-600 text-emerald-500 bg-emerald-500/5 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            <Server className="w-4 h-4" /> Hostinger Setup Guide
          </button>
        </div>

        {/* Dynamic Section Contents */}
        <AnimatePresence mode="wait">
          {activeSegment === 'sandbox' && (
            <motion.div 
              key="sandbox"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Info banner detailing how to interact */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex gap-3 items-start">
                  <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white leading-snug">Interactive Sandbox: Try Tracking Live Traffic!</h4>
                    <p className="text-slate-405 text-sm text-slate-400 mt-0.5">
                      Below is a working simulation reflecting exactly how the PHP files track live hits, aggregate uniquely, and do passive cleanup. Click any simulated hit button to trigger instant updates!
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => generateMockVisitorHit()}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Random Visitor hit
                  </button>
                  <button 
                    onClick={() => generateMockVisitorHit('/merge-pdf')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-705 cursor-pointer transition-transform active:scale-95"
                  >
                    Hit /merge-pdf
                  </button>
                </div>
              </div>

              {/* Float Debounce Alarm */}
              <AnimatePresence>
                {showSpamWarning && (
                  <motion.div 
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-550 rounded-xl text-center text-sm font-semibold flex items-center justify-center gap-2 text-amber-400"
                  >
                    <span>🛡️</span> Duplicate Request Blocked: Cookie session debounce trigger locked tracking for 1.5s to prevent page spam loops!
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Core 4 Simulated Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. Live count */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    <span className="text-[9px] font-black uppercase text-emerald-400">Live</span>
                  </div>
                  <div className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Live Users Online</div>
                  <div className="text-4xl font-extrabold text-white font-mono">{simulatedLiveCount}</div>
                  <p className="text-xs text-slate-400 mt-2.5">
                    Automatic cleanup if inactive &gt; {inactivityTimeout}s
                  </p>
                </div>

                {/* 2. Today's Uniques */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                  <div className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Today's Visitors</div>
                  <div className="text-4xl font-extrabold text-white font-mono">{simulatedTodayCount}</div>
                  <p className="text-xs text-slate-400 mt-2.5 flex items-center gap-1">
                    Daily reset matches Zone: <b className="text-indigo-400">{timezone}</b>
                  </p>
                </div>

                {/* 3. Today's page views */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                  <div className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Today's Page Views</div>
                  <div className="text-4xl font-extrabold text-white font-mono">{simulatedViewsCount}</div>
                  <p className="text-xs text-slate-400 mt-2.5">
                    Total aggregated pages loaded
                  </p>
                </div>

                {/* 4. Lifetime Total */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                  <div className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Lifetime Visitors</div>
                  <div className="text-4xl font-extrabold text-white font-mono">{simulatedTotalCount}</div>
                  <p className="text-xs text-slate-400 mt-2.5">
                    Permanent MySQL storage statistics
                  </p>
                </div>
              </div>

              {/* Line graph of recent history */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Timeline */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between min-h-[350px]">
                  <div>
                    <h3 className="text-lg font-bold text-white">Simulated Weekly Timeline</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Visits and Page views historical progression</p>
                  </div>
                  <div className="flex-1 min-h-[220px] w-full mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={recentHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorUniques" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="opacity-5" />
                        <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} />
                        <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            borderColor: '#1e293b', 
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '12px'
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Area type="monotone" name="Page Views" dataKey="views" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorViews)" />
                        <Area type="monotone" name="Unique Visitors" dataKey="uniques" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorUniques)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Simulated Popular paths distribution */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Ingestion Paths Log</h3>
                    <p className="text-xs text-slate-500">Distribution frequency across integrated paths</p>
                  </div>
                  <div className="space-y-4 flex-1 overflow-y-auto max-h-[220px] mt-6 pr-1">
                    {simulatedPages.map((page, index) => {
                      const totalViews = simulatedViewsCount || 1;
                      const pct = Math.min(100, Math.round((page.count / totalViews) * 100));
                      return (
                        <div key={index} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="truncate flex items-center gap-1 text-slate-350">
                              <MousePointer className="w-3 h-3 text-slate-500 shrink-0" />
                              {page.path}
                            </span>
                            <span className="font-bold text-white">{page.count} PV</span>
                          </div>
                          <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Real-time Simulated active sessions list (Garbage Collection visual representation) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-rose-500" /> Active Session State Stream
                    </h3>
                    <p className="text-xs text-slate-500">
                      Real-time garbage collector is demonstrating auto cleanup if inactive &gt; {inactivityTimeout}s
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-bold text-indigo-400">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping"></span>
                    Memory passive cleanup: active
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm text-slate-300">
                    <thead className="bg-[#0b0f19] text-xs font-bold uppercase text-slate-500 border-b border-slate-800/80">
                      <tr>
                        <th className="py-3.5 px-6">Hashed IP Identifier</th>
                        <th className="py-3.5 px-6">Client Device / Browser</th>
                        <th className="py-3.5 px-6">Requested Coordinate</th>
                        <th className="py-3.5 px-6 text-right">Last Action Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      <AnimatePresence>
                        {simulatedSessionLogs.map((log) => (
                          <motion.tr 
                            key={log.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, x: 20 }}
                            className="hover:bg-slate-950/40 transition-colors"
                          >
                            <td className="py-4 px-6 font-mono text-indigo-400 font-semibold">{log.ipHash}</td>
                            <td className="py-4 px-6 flex items-center gap-3">
                              <span className="p-2 bg-slate-800 rounded-lg text-slate-300 shrink-0">
                                {log.device === 'Mobile' ? <Smartphone className="w-3.5 h-3.5" /> : log.device === 'Tablet' ? <TabletIcon className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
                              </span>
                              <div>
                                <div className="font-bold text-white text-xs">{log.browser}</div>
                                <div className="text-[10px] text-slate-500">{log.device}</div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center gap-1 text-slate-400 font-mono text-xs">
                                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                                {log.path}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right font-semibold">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase font-black ${log.lastActive < 20 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'}`}>
                                {log.lastActive}s ago
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                      {simulatedSessionLogs.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-slate-500 font-semibold text-xs-italic">
                            All sessions expired. Passive cleanup successfully ran! Click "Random Visitor" above to populate mock data.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeSegment === 'exporter' && (
            <motion.div 
              key="exporter"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column Settings Builder */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit space-y-6">
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-400" /> Configuration Builder
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Customize variables below; the PHP/SQL export files shown will physically change output code in real-time!
                  </p>
                </div>

                <div className="space-y-4">
                  {/* DB Host */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Database Host</label>
                    <input 
                      type="text" 
                      value={dbHost}
                      onChange={(e) => setDbHost(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  {/* DB User */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Database User Name</label>
                    <input 
                      type="text" 
                      value={dbUser}
                      onChange={(e) => setDbUser(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  {/* DB Pass */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Database Password</label>
                    <input 
                      type="password" 
                      value={dbPass}
                      onChange={(e) => setDbPass(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono text-xs"
                    />
                  </div>

                  {/* DB Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Database Name</label>
                    <input 
                      type="text" 
                      value={dbName}
                      onChange={(e) => setDbName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  {/* Timezone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Target Timezone</label>
                    <select 
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                    >
                      <option value="UTC">UTC (Coordinated Universal)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Europe/Paris">Europe/Paris (CET)</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                      <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                    </select>
                  </div>

                  {/* Timeout */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Inactivity Session Timeout</label>
                    <select 
                      value={inactivityTimeout}
                      onChange={(e) => setInactivityTimeout(parseInt(e.target.value, 10))}
                      className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                    >
                      <option value={60}>60 Seconds (1 minute)</option>
                      <option value={120}>120 Seconds (2 minutes)</option>
                      <option value={180}>180 Seconds (3 minutes)</option>
                      <option value={300}>300 Seconds (5 minutes)</option>
                      <option value={600}>600 Seconds (10 minutes)</option>
                    </select>
                  </div>

                  {/* Passcode */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Admin PASSCODE Access Key</label>
                    <input 
                      type="text" 
                      value={dashboardPasscode}
                      onChange={(e) => setDashboardPasscode(e.target.value)}
                      placeholder="Access dashboard passcode"
                      className="w-full bg-slate-950 border border-slate-755 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  {/* GDPR IP Toggle */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="block text-xs font-bold text-slate-300">GDPR SHA256 IP Masking</span>
                      <span className="text-[10px] text-slate-500">Hash IP addresses with secure salt values</span>
                    </div>
                    <button 
                      onClick={() => setIpAnonymize(!ipAnonymize)}
                      className={`w-10 h-6 rounded-full transition-all relative shrink-0 cursor-pointer ${ipAnonymize ? 'bg-rose-600' : 'bg-slate-800'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${ipAnonymize ? 'right-1' : 'left-1'}`}></span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column Core Files Previewer */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between min-h-[550px]">
                
                {/* File selectors header tab */}
                <div className="flex border-b border-slate-800 overflow-x-auto">
                  {[
                    { key: 'sql', label: 'database.sql', file: 'database.sql' },
                    { key: 'config', label: 'config.php', file: 'config.php' },
                    { key: 'tracker', label: 'track.php', file: 'track.php' },
                    { key: 'api', label: 'api.php', file: 'api.php' },
                    { key: 'dashboard', label: 'dashboard.php', file: 'dashboard.php' },
                    { key: 'embed', label: 'embed.js', file: 'embed.js' },
                  ].map((tab) => (
                    <button 
                      key={tab.key}
                      onClick={() => setExporterFile(tab.key as any)}
                      className={`px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${exporterFile === tab.key ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-400 hover:text-slate-100'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Sub-header detailing current file action context */}
                <div className="px-6 py-3 bg-[#0d1220] border-b border-slate-800/85 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 font-mono">
                    File: <b className="text-white">analytics/{exporterFile === 'sql' ? 'database.sql' : exporterFile === 'config' ? 'config.php' : exporterFile === 'tracker' ? 'track.php' : exporterFile === 'api' ? 'api.php' : exporterFile === 'dashboard' ? 'dashboard.php' : 'embed.js'}</b>
                  </span>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => copyTextToClipboard(getSelectedCode(), exporterFile)}
                      className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-750 text-slate-200 border border-slate-750 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedFilename === exporterFile ? 'Copied' : 'Copy Code'}
                    </button>
                    <button 
                      onClick={() => downloadFileLocally(exporterFile === 'sql' ? 'database.sql' : exporterFile === 'config' ? 'config.php' : exporterFile === 'tracker' ? 'track.php' : exporterFile === 'api' ? 'api.php' : exporterFile === 'dashboard' ? 'dashboard.php' : 'embed.js', getSelectedCode())}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" /> Use Code
                    </button>
                  </div>
                </div>

                {/* Main Code block code viewer */}
                <div className="flex-1 overflow-auto bg-[#080b13] p-6 text-slate-350 font-mono text-xs leading-relaxed max-h-[450px]">
                  <pre className="whitespace-pre">{getSelectedCode()}</pre>
                </div>

                {/* Bottom status toolbar */}
                <div className="p-4 bg-slate-900 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>✨ Standard UTF-8, compliant with Hostinger Apache configs & SQLite/MySQL platforms.</span>
                  <span className="font-bold text-indigo-400">Security Guard Checked Ok ✓</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeSegment === 'hostinger' && (
            <motion.div 
              key="hostinger"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Hostinger Detailed Tutorial Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Step 1 */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full font-black bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-lg">1</div>
                  <Database className="w-8 h-8 text-indigo-400 mb-4" />
                  <h4 className="text-base font-bold text-white mb-2">Step 1: Setup Hostinger MySQL</h4>
                  <ul className="text-xs text-slate-400 space-y-2 leading-relaxed">
                    <li>Log into your <b>Hostinger hPanel</b> Dashboard.</li>
                    <li>Navigate to <b>Databases → MySQL Databases</b>.</li>
                    <li>Create a new Database name and Database user (e.g., prefix <code className="text-indigo-400">u12345_analytics</code>). Assign a secure password.</li>
                    <li>Open <b>phpMyAdmin</b> for the new database, click on the **SQL** tab.</li>
                    <li>Copy and paste all code of the <code className="text-indigo-400">database.sql</code> file, then click <b>Go / Run</b> to generate tables instantly!</li>
                  </ul>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full font-black bg-rose-500/10 text-rose-400 flex items-center justify-center text-lg">2</div>
                  <Server className="w-8 h-8 text-rose-400 mb-4" />
                  <h4 className="text-base font-bold text-white mb-2">Step 2: Upload Files Code</h4>
                  <ul className="text-xs text-slate-400 space-y-2 leading-relaxed">
                    <li>Open Hostinger <b>File Manager</b> or utilize file transfer software of choice.</li>
                    <li>Navigate to your website's root index, usually located inside `public_html/`.</li>
                    <li>Create a new directory named <code className="text-rose-400">analytics</code>.</li>
                    <li>Use our exporter tab to customize and download: <code className="text-rose-400">config.php</code>, <code className="text-rose-400">track.php</code>, <code className="text-rose-400">api.php</code>, <code className="text-rose-400">dashboard.php</code>, and <code className="text-rose-400">embed.js</code>.</li>
                    <li>Upload all 5 files directly inside the new `public_html/analytics/` directory!</li>
                  </ul>
                </div>

                {/* Step 3 */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full font-black bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-lg">3</div>
                  <CheckCircle className="w-8 h-8 text-emerald-400 mb-4" />
                  <h4 className="text-base font-bold text-white mb-2">Step 3: Integrate and Test</h4>
                  <ul className="text-xs text-slate-400 space-y-2 leading-relaxed">
                    <li>Insert the following simple tracking script immediately before the closing tag of any HTML/PHP file you want to monitor:</li>
                    <li className="p-2 py-3.5 bg-slate-950 font-mono rounded text-[10px] text-emerald-400 overflow-x-auto select-all">
                      &lt;script src="https://yourdomain.com/analytics/embed.js" async&gt;&lt;/script&gt;
                    </li>
                    <li>Refresh your website index page, then navigate to your dashboard access link:</li>
                    <li className="font-semibold text-slate-300">
                      https://yourdomain.com/analytics/dashboard.php
                    </li>
                    <li>Authorize access using your passcode, and look at live updates!</li>
                  </ul>
                </div>

              </div>

              {/* Hostinger specific optimization notice bento details */}
              <div className="p-6 bg-gradient-to-r from-[#0d172c] to-[#0f1118] border border-slate-800 rounded-2xl space-y-4">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" /> Hostinger Optimized Passive Garbage Collection
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Unlike traditional memory trackers that require dedicated background processes or heavy cron routines, this visitor traffic tracker uses **Passive/Lazy Inactive Cleanup**. 
                  Every time a user reads any page on your website, a minor fast execution cleans entries whose last activity exceeds {inactivityTimeout} seconds. This is exceptionally fast, occupies near-zero milliseconds of processing, and keeps the database table small and fast-loading — which is absolutely vital on Shared Web Hostings!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
