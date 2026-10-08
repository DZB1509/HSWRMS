import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.resolve('public', 'screenshots');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const SCREENS = [
  { num: 1, name: 'public_landing', role: 'customer', route: '/' },
  { num: 2, name: 'customer_dashboard', role: 'customer', route: '/customer/dashboard' },
  { num: 8, name: 'health_profile', role: 'customer', route: '/customer/health-profile' },
  { num: 13, name: 'retreat_packages', role: 'customer', route: '/retreats' },
  { num: 16, name: 'booking_summary', role: 'customer', route: '/customer/booking/summary' },
  { num: 20, name: 'receptionist_dashboard', role: 'receptionist', route: '/receptionist/dashboard' },
  { num: 21, name: 'daily_arrivals', role: 'receptionist', route: '/receptionist/arrivals' },
  { num: 23, name: 'villa_assignment', role: 'receptionist', route: '/receptionist/check-in/HSW-88192/villa' },
  { num: 24, name: 'villa_status', role: 'receptionist', route: '/receptionist/villas' },
  { num: 25, name: 'spa_treatment_list', role: 'customer', route: '/customer/spa' },
  { num: 26, name: 'spa_booking', role: 'customer', route: '/customer/spa/book' },
  { num: 27, name: 'spa_alternative_slots', role: 'customer', route: '/customer/spa/alternatives' },
  { num: 31, name: 'therapist_dashboard', role: 'therapist', route: '/therapist/dashboard' },
  { num: 32, name: 'therapist_schedule', role: 'therapist', route: '/therapist/schedule' },
  { num: 33, name: 'therapist_session_detail', role: 'therapist', route: '/therapist/sessions/SES-301' },
  { num: 34, name: 'dietary_menu', role: 'customer', route: '/customer/dining/menu' },
  { num: 38, name: 'fnb_dashboard', role: 'fb_staff', route: '/fb/dashboard' },
  { num: 39, name: 'meal_prep_list', role: 'fb_staff', route: '/fb/meal-prep' },
  { num: 41, name: 'customer_folio', role: 'customer', route: '/customer/folio' },
  { num: 42, name: 'final_payment', role: 'customer', route: '/customer/checkout/payment' },
  { num: 44, name: 'checkout_confirmation', role: 'customer', route: '/customer/checkout/confirmation' },
  { num: 45, name: 'review_rating', role: 'customer', route: '/customer/review/HSW-88192' },
  { num: 46, name: 'revenue_dashboard', role: 'manager', route: '/manager/revenue' },
  { num: 47, name: 'occupancy_report', role: 'manager', route: '/manager/occupancy' },
  { num: 49, name: 'admin_dashboard', role: 'admin', route: '/admin/dashboard' },
  { num: 51, name: 'feature_flags', role: 'admin', route: '/admin/feature-flags' },
  { num: 53, name: 'admin_delegation', role: 'admin', route: '/admin/delegation' },
  { num: 54, name: 'sensitive_audit_log', role: 'admin', route: '/admin/audit-log' },
  { num: 56, name: 'system_overview', role: 'admin', route: '/admin/system-overview' },
];

async function main() {
  console.log('Launching Chrome with remote debugging...');
  const profileDir = path.resolve('temp_chrome_profile');
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    '--window-size=1280,850',
    `--user-data-dir=${profileDir}`,
    'http://localhost:4173/',
  ]);

  let pageWsUrl = '';
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const res = await fetch('http://127.0.0.1:9222/json/list');
      const data = await res.json();
      const page = data.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) {
        pageWsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!pageWsUrl) {
    console.error('Failed to get page WebSocket debugger URL');
    chromeProcess.kill();
    process.exit(1);
  }

  console.log('Connected to CDP Page at:', pageWsUrl);
  const ws = new WebSocket(pageWsUrl);

  let idCounter = 1;
  const pendingRequests = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pendingRequests.has(msg.id)) {
      const { resolve, reject } = pendingRequests.get(msg.id);
      pendingRequests.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise((resolve) => (ws.onopen = resolve));

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pendingRequests.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  // Enable Page and Runtime
  await sendCommand('Page.enable');
  await sendCommand('Runtime.enable');

  for (const screen of SCREENS) {
    console.log(`Capturing Screen #${screen.num}: ${screen.name} (Role: ${screen.role})...`);
    
    // Set active role in sessionStorage and navigate
    await sendCommand('Runtime.evaluate', {
      expression: `sessionStorage.setItem('hswrms_active_role', '${screen.role}');`,
    });

    await sendCommand('Page.navigate', { url: `http://localhost:4173${screen.route}` });
    
    // Wait for render
    await new Promise((r) => setTimeout(r, 800));

    // Capture screenshot
    const shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const filename = `screen_${String(screen.num).padStart(2, '0')}_${screen.name}.png`;
    const filepath = path.join(OUT_DIR, filename);
    fs.writeFileSync(filepath, Buffer.from(shot.data, 'base64'));
    console.log(`Saved: ${filename}`);
  }

  console.log('All screenshots captured successfully!');
  ws.close();
  chromeProcess.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
