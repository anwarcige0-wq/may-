/**
 * TRAVEL SOM — Full-Stack Web Application Server
 * Built with Node.js 24 + Native SQLite (node:sqlite)
 * Provides RESTful APIs, Session Auth, Booking System, Admin Dashboard & Static Assets
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');
let nodemailer = null;
try { nodemailer = require('nodemailer'); } catch (e) {}

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const ROOT_DIR = __dirname;
const DATA_DIR = process.env.TSOM_DATA_DIR || path.join(ROOT_DIR, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_PATH = path.join(DATA_DIR, 'travelsom.db');
const ADMIN_EMAIL = (process.env.TSOM_ADMIN_EMAIL || 'cabdilahicawil881@gmail.com').toLowerCase().trim();
const ADMIN_DEFAULT_PIN = 'somtravel';

// Ensure data and upload directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// -------------------------------------------------------------
// Database Initialization
// -------------------------------------------------------------
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

db.exec(`
CREATE TABLE IF NOT EXISTS admin (
  id INTEGER PRIMARY KEY CHECK(id=1),
  email TEXT NOT NULL,
  pw_hash TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  csrf TEXT NOT NULL,
  email TEXT NOT NULL,
  created REAL,
  last_seen REAL
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT DEFAULT '',
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS customer_sessions (
  token_hash TEXT PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created REAL,
  last_seen REAL
);

CREATE TABLE IF NOT EXISTS login_attempts (
  key TEXT,
  ts REAL
);

CREATE TABLE IF NOT EXISTS content (
  section TEXT PRIMARY KEY,
  draft TEXT NOT NULL,
  published TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT UNIQUE NOT NULL,
  name TEXT,
  kind TEXT,
  size INTEGER,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT UNIQUE NOT NULL,
  service TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  travel_date TEXT NOT NULL,
  return_date TEXT,
  passengers INTEGER NOT NULL DEFAULT 1,
  seats TEXT DEFAULT '',
  price_total REAL DEFAULT 0,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  payment_method TEXT DEFAULT 'EVC Plus',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT DEFAULT '',
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread',
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS routes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_time TEXT NOT NULL,
  duration TEXT NOT NULL,
  price REAL NOT NULL,
  vehicle_name TEXT NOT NULL,
  seats_available INTEGER DEFAULT 40
);
`);

// Migration safety: Ensure columns exist in bookings
try { db.exec("ALTER TABLE bookings ADD COLUMN departure_time TEXT DEFAULT '06:00 AM'"); } catch(e) {}
try { db.exec("ALTER TABLE bookings ADD COLUMN transit_stops TEXT DEFAULT ''"); } catch(e) {}
try { db.exec("ALTER TABLE bookings ADD COLUMN receipt_image TEXT DEFAULT ''"); } catch(e) {}
try { db.exec("ALTER TABLE bookings ADD COLUMN receipt_note TEXT DEFAULT ''"); } catch(e) {}
try { db.exec("ALTER TABLE bookings ADD COLUMN receipt_uploaded_at TEXT DEFAULT ''"); } catch(e) {}

// Admin notifications table
try {
  db.exec(`CREATE TABLE IF NOT EXISTS admin_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    booking_ref TEXT,
    status TEXT DEFAULT 'unread',
    created_at TEXT
  );`);
} catch(e) {}

// -------------------------------------------------------------
// Admin Email & Push Notifications (Gmail: cabdilahi cawil881@gmail.com)
// -------------------------------------------------------------
async function sendAdminBookingEmail({ booking, isReceipt }) {
  const subject = isReceipt 
    ? `📸 RISIID LACAGTEED: Dalabka ${booking.ref} ($${Number(booking.price_total || 0).toFixed(2)}) — ${booking.name}`
    : `✈️ DALAB CUSUB: ${booking.ref} (${booking.origin} ➔ ${booking.destination}) — ${booking.name}`;
  
  const message = `Ref: ${booking.ref} | Macmiil: ${booking.name} (${booking.phone}) | Qiime: $${Number(booking.price_total || 0).toFixed(2)} | Adeeg: ${booking.service} | Habka: ${booking.payment_method}`;

  // Log to DB
  try {
    db.prepare('INSERT INTO admin_notifications (title, message, booking_ref, created_at) VALUES (?, ?, ?, ?)')
      .run(subject, message, booking.ref, new Date().toISOString());
  } catch(err) {
    console.error('[NOTIF ERROR]', err.message);
  }

  console.log(`[ADMIN NOTIFICATION] To: ${ADMIN_EMAIL} | Subject: ${subject}`);

  const gmailUser = (process.env.GMAIL_USER || ADMIN_EMAIL).trim();
  const gmailPass = (process.env.GMAIL_PASS || process.env.SMTP_PASS || '').trim();

  if (nodemailer && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass }
      });

      const receiptSection = booking.receipt_image ? `
        <div style="background:#f0fdf4;padding:16px;border-radius:12px;margin:18px 0;border:1.5px solid #22c55e;">
          <h4 style="margin:0 0 8px;color:#15803d;font-size:16px;">📸 Sawirka Risiidka / Screenshot-ka Lacag-Bixinta:</h4>
          <p style="margin:0 0 10px;font-size:13px;color:#166534;">Macmiilku wuxuu soo diray sawirka xawaaladda (Fariinta: <b>${booking.receipt_note || 'Lama qorin'}</b>).</p>
          <a href="http://localhost:${PORT}/${booking.receipt_image}" target="_blank" style="background:#15803d;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Eeg Sawirka Risiidka (View Screenshot) →</a>
        </div>
      ` : '';

      const htmlBody = `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;background:#ffffff;">
          <div style="background:#0A2358;color:#ffffff;padding:22px;text-align:center;">
            <h2 style="margin:0;font-size:24px;color:#ffffff;">✈️ TRAVEL SOM — Admin Notification</h2>
            <p style="margin:6px 0 0;color:#FF8A1F;font-weight:bold;font-size:15px;">${subject}</p>
          </div>
          <div style="padding:26px;color:#1e293b;line-height:1.6;">
            <h3 style="margin-top:0;color:#0A2358;border-bottom:2px solid #f1f5f9;padding-bottom:10px;">Faahfaahinta Dalabka Macmiilka:</h3>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:8px 0;color:#64748b;width:35%;">Ref ID:</td><td style="font-weight:bold;color:#0A2358;">${booking.ref}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;">Macmiilka:</td><td style="font-weight:bold;">${booking.name}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;">Taleefanka:</td><td style="font-weight:bold;"><a href="tel:${booking.phone}" style="color:#0A2358;">${booking.phone}</a></td></tr>
              <tr><td style="padding:8px 0;color:#64748b;">Email-ka:</td><td>${booking.email || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;">Dariiqa:</td><td style="font-weight:bold;color:#FF8A1F;">${booking.origin} ➔ ${booking.destination}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;">Adeegga Gaadiidka:</td><td>${booking.service} (${booking.passengers} qof, Kursi: ${booking.seats || 'Auto'})</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;">Taariikhda & Saacadda:</td><td>${booking.travel_date} (${booking.departure_time || '06:00 AM'})</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;">Wadarta Qiimaha:</td><td style="font-size:18px;font-weight:bold;color:#047857;">$${Number(booking.price_total || 0).toFixed(2)} USD</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;">Habka Lacag-bixinta:</td><td><b>${booking.payment_method || 'EVC Plus'}</b></td></tr>
              ${booking.notes ? `<tr><td style="padding:8px 0;color:#64748b;">Fariin Dheeraad ah:</td><td>${booking.notes}</td></tr>` : ''}
            </table>

            ${receiptSection}

            <div style="margin-top:26px;text-align:center;">
              <a href="http://localhost:${PORT}/admin/index.html#bookings" style="background:#FF8A1F;color:#ffffff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;box-shadow:0 4px 12px rgba(255,138,31,0.3);">Gal Maamulka si aad u Xaqiijisid Tikidhka →</a>
            </div>
          </div>
          <div style="background:#f8fafc;padding:14px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;">
            Ogeysiiskan waxa si toos ah loogu soo diray email-ka maamulka: ${ADMIN_EMAIL}
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"TRAVEL SOM System" <${gmailUser}>`,
        to: ADMIN_EMAIL,
        subject: subject,
        html: htmlBody
      });
      console.log(`[EMAIL SENT] Notification successfully dispatched to ${ADMIN_EMAIL}`);
    } catch (mailErr) {
      console.error('[EMAIL ERROR] Failed sending to Gmail:', mailErr.message);
    }
  }
}

// -------------------------------------------------------------
// Seed Data & Schema Definitions
// -------------------------------------------------------------
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, key] = stored.split(':');
  const keyBuffer = Buffer.from(key, 'hex');
  const derived = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derived);
}

// Seed or sync admin user (email: 'cabdilahi cawil881@gmail.com', PIN: 'somtravel')
const adminRow = db.prepare('SELECT id, email FROM admin WHERE id = 1').get();
const initialHash = hashPassword(ADMIN_DEFAULT_PIN);
if (!adminRow) {
  db.prepare('INSERT INTO admin (id, email, pw_hash, updated_at) VALUES (1, ?, ?, ?)')
    .run(ADMIN_EMAIL, initialHash, new Date().toISOString());
  console.log(`[AUTH] Admin initialized: ${ADMIN_EMAIL} (PIN: ${ADMIN_DEFAULT_PIN})`);
} else {
  db.prepare('UPDATE admin SET email = ?, pw_hash = ?, updated_at = ? WHERE id = 1')
    .run(ADMIN_EMAIL, initialHash, new Date().toISOString());
  console.log(`[AUTH] Admin credentials synced: ${ADMIN_EMAIL} (PIN: ${ADMIN_DEFAULT_PIN})`);
}
// Clear active sessions to enforce immediate login with the new credentials
try { db.prepare('DELETE FROM sessions').run(); } catch(e) {}

// Seed default routes
const routesCount = db.prepare('SELECT COUNT(*) as count FROM routes').get().count;
if (routesCount === 0) {
  const insertRoute = db.prepare(`
    INSERT INTO routes (service, origin, destination, departure_time, duration, price, vehicle_name, seats_available)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const initialRoutes = [
    // Bus routes
    ['Bus', 'Mogadishu', 'Baidoa', '06:30 AM', '4h 30m', 15.00, 'VIP Express Coach 01', 36],
    ['Bus', 'Baidoa', 'Mogadishu', '07:00 AM', '4h 30m', 15.00, 'VIP Express Coach 02', 36],
    ['Bus', 'Hargeisa', 'Berbera', '08:00 AM', '2h 45m', 12.00, 'Coastline Liner 05', 40],
    ['Bus', 'Berbera', 'Hargeisa', '02:00 PM', '2h 45m', 12.00, 'Coastline Liner 06', 40],
    ['Bus', 'Hargeisa', 'Burao', '07:30 AM', '3h 15m', 14.00, 'Togdheer Shuttle 03', 38],
    ['Bus', 'Garowe', 'Bosaso', '06:00 AM', '6h 00m', 25.00, 'Puntland Royal Coach', 34],
    ['Bus', 'Mogadishu', 'Kismayo', '06:00 AM', '8h 00m', 35.00, 'Jubba Intercity Coach', 36],
    ['Bus', 'Mogadishu', 'Beledweyne', '06:30 AM', '6h 30m', 25.00, 'Hiiraan Express', 35],
    ['Bus', 'Garowe', 'Galkayo', '07:00 AM', '3h 30m', 18.00, 'Mudug Express Liner', 38],
    // Flight routes
    ['Flight', 'Mogadishu', 'Hargeisa', '09:00 AM', '1h 45m', 120.00, 'TRAVEL SOM Boeing 737', 120],
    ['Flight', 'Hargeisa', 'Mogadishu', '01:30 PM', '1h 45m', 120.00, 'TRAVEL SOM Boeing 737', 120],
    ['Flight', 'Mogadishu', 'Garowe', '10:15 AM', '1h 30m', 110.00, 'TRAVEL SOM Embraer 190', 88],
    ['Flight', 'Mogadishu', 'Bosaso', '08:00 AM', '2h 00m', 130.00, 'TRAVEL SOM Boeing 737', 120],
    ['Flight', 'Mogadishu', 'Kismayo', '11:00 AM', '1h 15m', 95.00, 'TRAVEL SOM Embraer 190', 88],
    ['Flight', 'Hargeisa', 'Garowe', '02:45 PM', '1h 10m', 90.00, 'TRAVEL SOM Dash-8', 50],
    // Taxi routes (private charter per vehicle or seat)
    ['Taxi', 'Hargeisa', 'Berbera', 'Anytime', '2h 15m', 45.00, 'Toyota Noah / VIP Car', 6],
    ['Taxi', 'Mogadishu', 'Baidoa', 'Anytime', '3h 45m', 70.00, 'Land Cruiser Prado', 4],
    ['Taxi', 'Garowe', 'Bosaso', 'Anytime', '5h 00m', 90.00, 'Toyota Noah / Surf', 6],
    ['Taxi', 'Hargeisa', 'Burao', 'Anytime', '2h 45m', 50.00, 'Executive Sedan / Van', 6]
  ];
  for (const r of initialRoutes) {
    insertRoute.run(...r);
  }
}

// Seed sample initial bookings if empty for instant demonstration
const bookingsCount = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
if (bookingsCount === 0) {
  const insertBooking = db.prepare(`
    INSERT INTO bookings (ref, service, origin, destination, travel_date, return_date, passengers, seats, price_total, name, phone, email, payment_method, notes, status, admin_note, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  insertBooking.run(
    'TS-2026-1001', 'Bus', 'Mogadishu', 'Baidoa', dateStr, '', 1, '04', 15.00,
    'Axmed Cali Warsame', '+252 61 555 1234', 'axmed.ali@gmail.com', 'EVC Plus',
    'Fadlan kursiga daaqada xigta ii qabta.', 'confirmed', 'Xaqiijiyey EVC Plus payment.',
    new Date(Date.now() - 3600000 * 5).toISOString(), new Date().toISOString()
  );
  insertBooking.run(
    'TS-2026-1002', 'Flight', 'Mogadishu', 'Hargeisa', dateStr, '', 2, '12A, 12B', 240.00,
    'Maryan Xasan Nuur', '+252 63 444 8765', 'maryan.hn@outlook.com', 'Zaad Service',
    'Labo qof iyo shandad 20kg ah.', 'pending', 'Lala xiriiray, sugaysa xaqiijinta Zaad.',
    new Date(Date.now() - 3600000 * 2).toISOString(), new Date().toISOString()
  );
  insertBooking.run(
    'TS-2026-1003', 'Bus', 'Hargeisa', 'Berbera', dateStr, '', 1, '08', 12.00,
    'Jaamac Maxamed Cilmi', '+252 63 753 7706', 'jaamac@sommail.so', 'Zaad Service',
    '', 'confirmed', 'Tikidhka waa la siiyey.',
    new Date(Date.now() - 3600000 * 1).toISOString(), new Date().toISOString()
  );
}

// Seed website content & schema
const SEED_CONTENT = {
  hero: {
    slides: [
      { image: 'images/airplane/airplane.jpg', alt: 'TRAVEL SOM airplane', position: 'center' },
      { image: 'images/taxi/taxi.jpg', alt: 'TRAVEL SOM taxi', position: 'center' },
      { image: 'images/bus/bus.jpg', alt: 'TRAVEL SOM bus', position: 'center' },
      { image: 'images/cities/mogadishu-hero.jpg', alt: 'Mogadishu, Somalia — TRAVEL SOM', position: 'center top' }
    ]
  },
  home: {
    tag: 'TRAVEL SOM',
    heading: 'Travel Across Somalia With Comfort and Confidence',
    highlight: 'Comfort',
    description: 'TRAVEL SOM provides reliable transportation and travel services between major Somali cities — by bus, taxi and air.',
    primaryButton: 'Hadda Dalbo →',
    secondaryButton: 'Explore Services',
    announcementEnabled: false,
    announcement: ''
  },
  services: {
    items: [
      { key: 'flight', emoji: '✈️', title: 'Flight Services', description: 'Search and book flights between different destinations with ease.', image: 'images/airplane/airplane.jpg', buttonText: 'Hadda Dalbo' },
      { key: 'bus', emoji: '🚌', title: 'Bus Services', description: 'Book comfortable and reliable bus transportation between Somali cities.', image: 'images/bus/bus.jpg', buttonText: 'Hadda Dalbo' },
      { key: 'taxi', emoji: '🚕', title: 'Taxi Services', description: 'Book taxis for local transportation and city travel, any time of day.', image: 'images/taxi/taxi.jpg', buttonText: 'Hadda Dalbo' }
    ]
  },
  cities: {
    items: [
      { name: 'Mogadishu', description: 'The vibrant capital on the Indian Ocean coast.', image: 'images/cities/mogadishu.jpg', exploreText: 'Explore →' },
      { name: 'Hargeisa', description: 'Bustling capital of Somaliland, rich in culture.', image: '', exploreText: 'Explore →' },
      { name: 'Bosaso', description: 'A lively port city on the Gulf of Aden.', image: '', exploreText: 'Explore →' },
      { name: 'Garowe', description: 'The administrative heart of Puntland.', image: '', exploreText: 'Explore →' },
      { name: 'Kismayo', description: 'A sunny southern port with golden beaches.', image: '', exploreText: 'Explore →' },
      { name: 'Baidoa', description: 'A key inland city in the fertile south-west.', image: 'images/cities/baidoa.jpg', exploreText: 'Explore →' },
      { name: 'Burao', description: 'A major trading hub in the Togdheer region.', image: '', exploreText: 'Explore →' },
      { name: 'Berbera', description: 'Historic port with clear waters and beaches.', image: 'images/cities/berbera.jpg', exploreText: 'Explore →' },
      { name: 'Beledweyne', description: 'A river city along the Shabelle.', image: '', exploreText: 'Explore →' },
      { name: 'Galkayo', description: 'A busy crossroads in central Somalia.', image: '', exploreText: 'Explore →' }
    ]
  },
  about: {
    tag: 'Who we are',
    title: 'About TRAVEL SOM',
    paragraphs: [
      { text: 'TRAVEL SOM is a modern Somali travel and transportation company focused on making transportation easier, safer, and more convenient for customers traveling between Somali cities.' },
      { text: 'From long-distance coaches to city taxis and flights, we bring every option together with friendly service and transparent prices.' }
    ],
    bullets: [
      { text: 'Modern, well-maintained fleet' },
      { text: 'Trained, professional drivers and staff' },
      { text: 'Simple online booking' }
    ],
    image: 'images/bus/bus.jpg'
  },
  branches: {
    intro: 'Visit a TRAVEL SOM branch to book your trip in person, or call us any time.',
    items: [
      { name: 'Hargeisa', region: 'Somaliland', address: 'Main Street, City Center', phone: '+252 063 7537706', hours: '6:00 AM - 9:00 PM' },
      { name: 'Mogadishu', region: 'Banadir', address: 'KM4 Junction, Maka Al Mukarama', phone: '+252 061 5557706', hours: '6:00 AM - 9:00 PM' },
      { name: 'Bosaso', region: 'Puntland', address: 'Port Road, Commercial Area', phone: '+252 090 7777706', hours: '6:30 AM - 8:30 PM' },
      { name: 'Garowe', region: 'Puntland', address: 'Airport Road', phone: '+252 090 8887706', hours: '7:00 AM - 8:00 PM' },
      { name: 'Kismayo', region: 'Jubaland', address: 'Independence Ave', phone: '+252 061 9997706', hours: '7:00 AM - 8:00 PM' },
      { name: 'Baidoa', region: 'South West', address: 'Main Terminal', phone: '+252 061 3337706', hours: '6:30 AM - 8:00 PM' }
    ]
  },
  contact: {
    phone: '+252 063 7537706',
    email: 'info@travelsom.com',
    address: 'Somalia',
    facebook: 'https://facebook.com/travelsom',
    instagram: 'https://instagram.com/travelsom',
    x: 'https://x.com/travelsom',
    whatsapp: 'https://wa.me/2520637537706',
    youtube: ''
  },
  content: {
    whyTitle: 'Why Choose TRAVEL SOM?',
    whyLead: 'Everything you need for a smooth journey.',
    why: [
      { icon: '🛡', title: 'Reliable Transportation', text: 'Reliable and comfortable transportation services.' },
      { icon: '🔒', title: 'Safe Travel', text: 'We prioritize customer safety and comfort.' },
      { icon: '📲', title: 'Easy Booking', text: 'Simple and convenient online booking.' },
      { icon: '🤝', title: 'Professional Service', text: 'Friendly and professional customer service.' },
      { icon: '🗺', title: 'Multiple Destinations', text: 'Travel between major cities across Somalia.' },
      { icon: '💰', title: 'Affordable Prices', text: 'Competitive and accessible travel prices.' }
    ],
    busesTitle: 'Featured Buses',
    busesLead: 'Clean, modern coaches proudly carrying the TRAVEL SOM name.',
    buses: [
      { title: 'Executive Coach', text: 'Reclining seats · AC · Wi-Fi', image: 'images/bus/bus.jpg' },
      { title: 'Luxury Liner', text: 'Extra legroom · USB charging', image: 'images/bus/luxury-liner.jpg' },
      { title: 'Intercity Express', text: 'Fast routes · Comfortable ride', image: 'images/bus/intercity-express.jpg' }
    ],
    testimonialsTitle: 'What Travelers Say',
    testimonialsLead: 'Trusted by passengers across Somalia.',
    testimonials: [
      { name: 'Amina Yusuf', city: 'Hargeisa', quote: 'TRAVEL SOM made my trip from Hargeisa to Bosaso simple and comfortable.' },
      { name: 'Abdirahman Ali', city: 'Mogadishu', quote: 'Booking was quick and the bus was clean and on time. Highly recommended.' },
      { name: 'Hodan Farah', city: 'Garowe', quote: 'Friendly staff and fair prices. I now book all my family trips here.' }
    ],
    ctaTitle: 'Ready to Start Your Journey?',
    ctaText: 'Book your next trip with TRAVEL SOM and travel across Somalia with comfort and confidence.',
    ctaButton: 'Book Your Trip Now',
    footerText: 'A modern Somali travel and transportation company connecting major cities by bus, taxi and air.',
    copyright: '© 2026 TRAVEL SOM. All Rights Reserved.'
  },
  settings: {
    siteTitle: 'TRAVEL SOM — Travel Across Somalia',
    metaDescription: 'TRAVEL SOM provides reliable bus, taxi and flight services between major Somali cities.',
    bookingOpen: true,
    bookingClosedMessage: 'Online booking is temporarily closed. Please call us to book.',
    colorNavy: '#0A2358',
    colorNavy2: '#143A85',
    colorSun: '#FF8A1F',
    colorSun2: '#FFB052'
  }
};

const SECTIONS_SCHEMA = {
  hero: { title: 'Hero slideshow', fields: [
    { k: 'slides', t: 'list', l: 'Slideshow pictures', mn: 1, mx: 12, il: 'Slide', title: 'alt', item: [
      { k: 'image', t: 'image', l: 'Picture', req: true },
      { k: 'alt', t: 'text', l: 'Picture description', max: 120 },
      { k: 'position', t: 'select', l: 'Crop focus', options: ['center', 'center top', 'center bottom'] }
    ]}
  ]},
  home: { title: 'Homepage text', fields: [
    { k: 'tag', t: 'text', l: 'Small label above heading', max: 40 },
    { k: 'heading', t: 'text', l: 'Main heading', max: 120, req: true },
    { k: 'highlight', t: 'text', l: 'Word to highlight in orange', max: 60 },
    { k: 'description', t: 'textarea', l: 'Description', max: 400 },
    { k: 'primaryButton', t: 'text', l: 'Main button text', max: 40, req: true },
    { k: 'secondaryButton', t: 'text', l: 'Second button text', max: 40 },
    { k: 'announcementEnabled', t: 'bool', l: 'Show announcement bar' },
    { k: 'announcement', t: 'text', l: 'Announcement text', max: 200 }
  ]},
  services: { title: 'Services', fields: [
    { k: 'items', t: 'list', l: 'Main services', mn: 3, mx: 3, fixed: true, il: 'Service', title: 'title', item: [
      { k: 'key', t: 'hidden', l: 'Service', allowed: ['flight', 'bus', 'taxi'] },
      { k: 'emoji', t: 'text', l: 'Emoji icon', max: 4 },
      { k: 'title', t: 'text', l: 'Title', max: 60, req: true },
      { k: 'description', t: 'textarea', l: 'Description', max: 250 },
      { k: 'image', t: 'image', l: 'Picture' },
      { k: 'buttonText', t: 'text', l: 'Button text', max: 40, req: true }
    ]}
  ]},
  cities: { title: 'Somali cities', fields: [
    { k: 'items', t: 'list', l: 'City cards', mn: 1, mx: 30, il: 'City', title: 'name', item: [
      { k: 'name', t: 'text', l: 'City name', max: 60, req: true },
      { k: 'description', t: 'textarea', l: 'Description', max: 200 },
      { k: 'image', t: 'image', l: 'City picture' },
      { k: 'exploreText', t: 'text', l: 'Explore button text', max: 30 }
    ]}
  ]},
  about: { title: 'About us', fields: [
    { k: 'tag', t: 'text', l: 'Small label', max: 40 },
    { k: 'title', t: 'text', l: 'Title', max: 80, req: true },
    { k: 'paragraphs', t: 'list', l: 'Paragraphs', mn: 1, mx: 6, il: 'Paragraph', title: 'text', item: [
      { k: 'text', t: 'textarea', l: 'Paragraph', max: 700, req: true }
    ]},
    { k: 'bullets', t: 'list', l: 'Points', mn: 0, mx: 8, il: 'Point', title: 'text', item: [
      { k: 'text', t: 'text', l: 'Point', max: 100, req: true }
    ]},
    { k: 'image', t: 'image', l: 'Picture' }
  ]},
  branches: { title: 'Branches', fields: [
    { k: 'intro', t: 'textarea', l: 'Introduction', max: 250 },
    { k: 'items', t: 'list', l: 'Branches', mn: 0, mx: 40, il: 'Branch', title: 'name', item: [
      { k: 'name', t: 'text', l: 'Branch name', max: 60, req: true },
      { k: 'region', t: 'text', l: 'Region', max: 40 },
      { k: 'address', t: 'text', l: 'Address', max: 160 },
      { k: 'phone', t: 'phone', l: 'Phone', max: 30 },
      { k: 'hours', t: 'text', l: 'Opening hours', max: 100 }
    ]}
  ]},
  contact: { title: 'Contact information', fields: [
    { k: 'phone', t: 'phone', l: 'Public phone', max: 30, req: true },
    { k: 'email', t: 'email', l: 'Public email', max: 120 },
    { k: 'address', t: 'text', l: 'Address', max: 160 },
    { k: 'facebook', t: 'url', l: 'Facebook', max: 300 },
    { k: 'instagram', t: 'url', l: 'Instagram', max: 300 },
    { k: 'x', t: 'url', l: 'X (Twitter)', max: 300 },
    { k: 'whatsapp', t: 'url', l: 'WhatsApp', max: 300 },
    { k: 'youtube', t: 'url', l: 'YouTube', max: 300 }
  ]},
  content: { title: 'Website content', fields: [
    { k: 'whyTitle', t: 'text', l: 'Why Choose Us — title', max: 80 },
    { k: 'whyLead', t: 'text', l: 'Why Choose Us — intro', max: 200 },
    { k: 'busesTitle', t: 'text', l: 'Featured buses — title', max: 80 },
    { k: 'testimonialsTitle', t: 'text', l: 'Testimonials — title', max: 80 },
    { k: 'ctaTitle', t: 'text', l: 'Call-to-action — title', max: 100 },
    { k: 'ctaText', t: 'textarea', l: 'Call-to-action — text', max: 250 },
    { k: 'footerText', t: 'textarea', l: 'Footer description', max: 250 },
    { k: 'copyright', t: 'text', l: 'Copyright line', max: 100 }
  ]},
  settings: { title: 'Website settings', fields: [
    { k: 'siteTitle', t: 'text', l: 'Site title', max: 100, req: true },
    { k: 'metaDescription', t: 'textarea', l: 'Meta description', max: 250 },
    { k: 'bookingOpen', t: 'bool', l: 'Online booking is open' },
    { k: 'bookingClosedMessage', t: 'text', l: 'Closed message', max: 200 },
    { k: 'colorNavy', t: 'color', l: 'Primary color' },
    { k: 'colorSun', t: 'color', l: 'Secondary color' }
  ]}
};

// Seed content table if not present
for (const [sec, obj] of Object.entries(SEED_CONTENT)) {
  const row = db.prepare('SELECT section FROM content WHERE section = ?').get(sec);
  if (!row) {
    const jsonStr = JSON.stringify(obj);
    db.prepare('INSERT INTO content (section, draft, published, updated_at) VALUES (?, ?, ?, ?)')
      .run(sec, jsonStr, jsonStr, new Date().toISOString());
  }
}

// Register images shipped with site into database
function registerImages() {
  const imagesDir = path.join(ROOT_DIR, 'images');
  if (!fs.existsSync(imagesDir)) return;

  function walk(dir) {
    const list = fs.readdirSync(dir);
    for (const f of list) {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (/\.(jpg|jpeg|png|webp|svg)$/i.test(f)) {
        const rel = path.relative(ROOT_DIR, full).replace(/\\/g, '/');
        const exists = db.prepare('SELECT id FROM images WHERE path = ?').get(rel);
        if (!exists) {
          db.prepare('INSERT INTO images (path, name, kind, size, created_at) VALUES (?, ?, ?, ?, ?)')
            .run(rel, f, 'website', stat.size, new Date().toISOString());
        }
      }
    }
  }
  walk(imagesDir);
}
registerImages();

// -------------------------------------------------------------
// Helper Utilities & Sessions
// -------------------------------------------------------------
const SESSION_TTL = 8 * 3600 * 1000; // 8 hours in ms

function createSession(email) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const csrf = crypto.randomBytes(16).toString('hex');
  const now = Date.now();

  db.prepare('INSERT INTO sessions (token_hash, csrf, email, created, last_seen) VALUES (?, ?, ?, ?, ?)')
    .run(tokenHash, csrf, email, now, now);

  return { token, csrf, email };
}

function getSessionFromReq(req) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const match = cookieHeader.match(/(?:^|;\s*)tsom_session=([a-f0-9]{64})/);
  if (!match) return null;

  const token = match[1];
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const session = db.prepare('SELECT token_hash, csrf, email, created, last_seen FROM sessions WHERE token_hash = ?').get(tokenHash);

  if (!session) return null;
  if (Date.now() - session.last_seen > SESSION_TTL) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
    return null;
  }

  // update last seen
  db.prepare('UPDATE sessions SET last_seen = ? WHERE token_hash = ?').run(Date.now(), tokenHash);
  return session;
}

const CUSTOMER_SESSION_TTL = 30 * 24 * 3600 * 1000; // 30 days in ms

function createCustomerSession(customer) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const now = Date.now();

  db.prepare('INSERT INTO customer_sessions (token_hash, customer_id, name, email, created, last_seen) VALUES (?, ?, ?, ?, ?, ?)')
    .run(tokenHash, customer.id, customer.name, customer.email, now, now);

  return { token, customer };
}

function getCustomerSessionFromReq(req) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const match = cookieHeader.match(/(?:^|;\s*)tsom_customer=([a-f0-9]{64})/);
  if (!match) return null;

  const token = match[1];
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const session = db.prepare('SELECT token_hash, customer_id, name, email, created, last_seen FROM customer_sessions WHERE token_hash = ?').get(tokenHash);

  if (!session) return null;
  if (Date.now() - session.last_seen > CUSTOMER_SESSION_TTL) {
    db.prepare('DELETE FROM customer_sessions WHERE token_hash = ?').run(tokenHash);
    return null;
  }

  // update last seen
  db.prepare('UPDATE customer_sessions SET last_seen = ? WHERE token_hash = ?').run(Date.now(), tokenHash);

  const customer = db.prepare('SELECT id, name, email, phone, created_at FROM customers WHERE id = ?').get(session.customer_id) || {
    id: session.customer_id,
    name: session.name,
    email: session.email,
    phone: ''
  };

  return { ...session, customer };
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) { // 2MB max
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data, headers = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache',
    ...headers
  });
  res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message) {
  sendJson(res, statusCode, { ok: false, error: message });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

// -------------------------------------------------------------
// Request Routing & API Handlers
// -------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  // Common CORS and security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token, X-Filename');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  } catch (e) {
    sendError(res, 400, 'Bad Request');
    return;
  }

  const pathname = decodeURIComponent(parsedUrl.pathname);

  // -----------------------------------------------------------
  // PUBLIC APIS
  // -----------------------------------------------------------

  // Health check
  if (pathname === '/api/health' && req.method === 'GET') {
    return sendJson(res, 200, { ok: true, app: 'TRAVEL SOM', status: 'online', time: new Date().toISOString() });
  }

  // Published Website Content
  if (pathname === '/api/content' && req.method === 'GET') {
    const rows = db.prepare('SELECT section, published FROM content').all();
    const content = {};
    for (const r of rows) {
      try {
        content[r.section] = JSON.parse(r.published);
      } catch (e) {}
    }
    return sendJson(res, 200, { ok: true, content });
  }

  // Public Routes & Pricing
  if (pathname === '/api/routes' && req.method === 'GET') {
    const origin = parsedUrl.searchParams.get('origin');
    const destination = parsedUrl.searchParams.get('destination');
    const service = parsedUrl.searchParams.get('service');

    let query = 'SELECT * FROM routes WHERE 1=1';
    const params = [];
    if (origin) { query += ' AND origin = ?'; params.push(origin); }
    if (destination) { query += ' AND destination = ?'; params.push(destination); }
    if (service) { query += ' AND service = ?'; params.push(service); }
    query += ' ORDER BY price ASC';

    const routes = db.prepare(query).all(...params);
    return sendJson(res, 200, { ok: true, routes });
  }

  // Create Booking
  if (pathname === '/api/bookings' && req.method === 'POST') {
    try {
      const data = await parseJsonBody(req);
      if (!data.origin || !data.destination || !data.name || !data.phone) {
        return sendError(res, 400, 'Fadlan buuxi magaca, taleefanka, iyo dariiqa safarka (Please fill name, phone, and route).');
      }

      if (data.origin.trim() === data.destination.trim()) {
        return sendError(res, 400, 'Magaalada bixitaanka iyo tagiddu isku mid ma noqon karaan (Origin and destination must be different).');
      }

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const ref = `TS-${new Date().getFullYear()}-${randomSuffix}`;
      const service = data.service || 'Bus';
      const travelDate = data.travelDate || new Date().toISOString().slice(0, 10);
      const returnDate = data.returnDate || '';
      const passengers = parseInt(data.passengers, 10) || 1;
      const seats = data.seats || `Seat-${Math.floor(1 + Math.random() * 30)}`;

      // Calculate or lookup route price
      const routeRow = db.prepare('SELECT price FROM routes WHERE service = ? AND origin = ? AND destination = ?').get(service, data.origin, data.destination);
      let unitPrice = 20.00;
      if (routeRow) {
        unitPrice = routeRow.price;
      } else {
        if (service === 'Flight') unitPrice = 120.00;
        else if (service === 'Taxi') unitPrice = 45.00;
        else unitPrice = 18.00;
      }
      const priceTotal = data.priceTotal || (unitPrice * passengers);
      const paymentMethod = data.paymentMethod || 'EVC Plus';
      const departureTime = data.departureTime || (service === 'Flight' ? '09:30 AM' : (service === 'Taxi' ? 'Anytime 24/7' : '06:00 AM'));
      const transitStops = data.transitStops || '';
      const nowIso = new Date().toISOString();

      const insert = db.prepare(`
        INSERT INTO bookings (
          ref, service, origin, destination, travel_date, return_date,
          passengers, seats, price_total, name, phone, email, payment_method,
          notes, status, admin_note, departure_time, transit_stops, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', '', ?, ?, ?, ?)
      `);

      insert.run(
        ref, service, data.origin, data.destination, travelDate, returnDate,
        passengers, seats, priceTotal, data.name, data.phone, data.email || '',
        paymentMethod, data.notes || '', departureTime, transitStops, nowIso, nowIso
      );

      // Auto-register customer if name and email provided
      if (data.email && data.name) {
        try {
          const cEmail = data.email.trim().toLowerCase();
          const cName = data.name.trim();
          const cPhone = (data.phone || '').trim();
          const existingCust = db.prepare('SELECT id FROM customers WHERE LOWER(email) = LOWER(?)').get(cEmail);
          if (!existingCust) {
            db.prepare('INSERT INTO customers (name, email, phone, created_at) VALUES (?, ?, ?, ?)')
              .run(cName, cEmail, cPhone, nowIso);
          }
        } catch (err) {}
      }

      const booking = db.prepare('SELECT * FROM bookings WHERE ref = ?').get(ref);

      // Trigger Admin Email & Push Notification
      sendAdminBookingEmail({ booking, isReceipt: false }).catch(err => {
        console.error('[BOOKING EMAIL ERROR]', err.message);
      });

      return sendJson(res, 201, {
        ok: true,
        message: 'Dalabkaaga si nabad ah ayaa loo guddoomay!',
        ref: ref,
        booking: booking
      });
    } catch (e) {
      return sendError(res, 400, e.message);
    }
  }

  // Upload Payment Receipt / Screenshot
  if (pathname === '/api/bookings/receipt' && req.method === 'POST') {
    try {
      const data = await parseJsonBody(req);
      const ref = (data.ref || '').trim();
      const note = (data.note || '').trim();
      const imageBase64 = data.imageBase64 || '';

      if (!ref) {
        return sendError(res, 400, 'Fadlan sheeg lambarka dalabka (Ref ID is required).');
      }

      const booking = db.prepare('SELECT * FROM bookings WHERE UPPER(ref) = UPPER(?)').get(ref);
      if (!booking) {
        return sendError(res, 404, 'Lama helin dalabka lambarkiisu yahay ' + ref);
      }

      let relPath = booking.receipt_image || '';
      if (imageBase64) {
        let buffer;
        let ext = '.png';
        const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mime = matches[1].toLowerCase();
          if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
          else if (mime.includes('webp')) ext = '.webp';
          buffer = Buffer.from(matches[2], 'base64');
        } else {
          buffer = Buffer.from(imageBase64, 'base64');
        }

        const safeRef = ref.replace(/[^a-zA-Z0-9_-]/g, '_');
        const cleanName = `receipt_${safeRef}_${Date.now()}${ext}`;
        const destPath = path.join(UPLOADS_DIR, cleanName);
        fs.writeFileSync(destPath, buffer);
        relPath = `data/uploads/${cleanName}`;
      }

      const nowIso = new Date().toISOString();
      db.prepare(`
        UPDATE bookings 
        SET receipt_image = CASE WHEN ? != '' THEN ? ELSE receipt_image END,
            receipt_note = ?,
            receipt_uploaded_at = ?,
            status = 'pending',
            updated_at = ?
        WHERE id = ?
      `).run(relPath, relPath, note, nowIso, nowIso, booking.id);

      const updatedBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking.id);

      // Trigger Email Notification for Receipt
      sendAdminBookingEmail({ booking: updatedBooking, isReceipt: true }).catch(err => {
        console.error('[RECEIPT EMAIL ERROR]', err.message);
      });

      return sendJson(res, 200, {
        ok: true,
        message: 'Sawirka risiidka si guul leh ayaa loo keydiyey!',
        booking: updatedBooking
      });
    } catch (err) {
      return sendError(res, 500, err.message);
    }
  }

  // -----------------------------------------------------------
  // CUSTOMER AUTHENTICATION & PORTAL (Macaamiisha)
  // -----------------------------------------------------------

  // Customer Login / Register (Magac & Email)
  if (pathname === '/api/customer/auth' && req.method === 'POST') {
    try {
      const data = await parseJsonBody(req);
      const name = (data.name || '').trim();
      const email = (data.email || '').trim().toLowerCase();
      const phone = (data.phone || '').trim();

      if (!name || !email) {
        return sendError(res, 400, 'Fadlan gali magacaaga iyo email-kaaga (Name and email are required).');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return sendError(res, 400, 'Fadlan gali email sax ah (Please provide a valid email address).');
      }

      const nowIso = new Date().toISOString();
      let customer = db.prepare('SELECT * FROM customers WHERE LOWER(email) = LOWER(?)').get(email);

      if (customer) {
        // Update customer name & phone if provided
        db.prepare('UPDATE customers SET name = ?, phone = CASE WHEN ? != "" THEN ? ELSE phone END WHERE id = ?')
          .run(name, phone, phone, customer.id);
        customer = db.prepare('SELECT id, name, email, phone, created_at FROM customers WHERE id = ?').get(customer.id);
      } else {
        const info = db.prepare('INSERT INTO customers (name, email, phone, created_at) VALUES (?, ?, ?, ?)')
          .run(name, email, phone, nowIso);
        customer = {
          id: Number(info.lastInsertRowid),
          name: name,
          email: email,
          phone: phone,
          created_at: nowIso
        };
      }

      const sess = createCustomerSession(customer);
      res.setHeader('Set-Cookie', `tsom_customer=${sess.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${CUSTOMER_SESSION_TTL / 1000}`);

      return sendJson(res, 200, {
        ok: true,
        message: `Ku soo dhowow, ${customer.name}!`,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone
        }
      });
    } catch (e) {
      return sendError(res, 500, e.message);
    }
  }

  // Customer Session Check
  if (pathname === '/api/customer/session' && req.method === 'GET') {
    const sess = getCustomerSessionFromReq(req);
    if (!sess) {
      return sendJson(res, 200, { authenticated: false });
    }
    return sendJson(res, 200, {
      authenticated: true,
      customer: sess.customer
    });
  }

  // Customer Logout
  if (pathname === '/api/customer/logout' && req.method === 'POST') {
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)tsom_customer=([a-f0-9]{64})/);
      if (match) {
        const tokenHash = crypto.createHash('sha256').update(match[1]).digest('hex');
        db.prepare('DELETE FROM customer_sessions WHERE token_hash = ?').run(tokenHash);
      }
    }
    res.setHeader('Set-Cookie', 'tsom_customer=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    return sendJson(res, 200, { ok: true, message: 'Si guul leh ayaad uga baxday.' });
  }

  // Customer Bookings
  if (pathname === '/api/customer/bookings' && req.method === 'GET') {
    const sess = getCustomerSessionFromReq(req);
    if (!sess) {
      return sendError(res, 401, 'Fadlan marka hore gal nidaamka (Unauthorized).');
    }
    const c = sess.customer;
    let query = 'SELECT * FROM bookings WHERE LOWER(email) = LOWER(?)';
    const params = [c.email];
    if (c.phone) {
      query += ' OR (phone = ? AND phone != "")';
      params.push(c.phone);
    }
    query += ' ORDER BY id DESC';
    const bookings = db.prepare(query).all(...params);
    return sendJson(res, 200, { ok: true, bookings, customer: c });
  }

  // Track Booking by Ref or Phone
  if (pathname === '/api/bookings/track' && req.method === 'GET') {
    const q = (parsedUrl.searchParams.get('ref') || parsedUrl.searchParams.get('q') || '').trim();
    const phone = (parsedUrl.searchParams.get('phone') || '').trim();

    if (!q && !phone) {
      return sendError(res, 400, 'Gali lambarka dalabka (Ref) ama taleefankaaga.');
    }

    let booking;
    if (q) {
      booking = db.prepare('SELECT * FROM bookings WHERE UPPER(ref) = UPPER(?) OR phone LIKE ?').get(q, `%${q}%`);
    } else if (phone) {
      booking = db.prepare('SELECT * FROM bookings WHERE phone LIKE ? ORDER BY id DESC').get(`%${phone}%`);
    }

    if (!booking) {
      return sendError(res, 404, 'Lama helin dalab u dhigma xogta aad galisay. Fadlan hubi lambarka Ref ID ama taleefanka.');
    }

    return sendJson(res, 200, { ok: true, booking });
  }

  // Submit Contact Message
  if (pathname === '/api/messages' && req.method === 'POST') {
    try {
      const data = await parseJsonBody(req);
      if (!data.name || !data.message) {
        return sendError(res, 400, 'Fadlan gali magacaaga iyo fariintaada.');
      }
      db.prepare('INSERT INTO messages (name, email, phone, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(data.name, data.email || '', data.phone || '', data.message, 'unread', new Date().toISOString());

      return sendJson(res, 201, { ok: true, message: 'Waad ku mahadsan tahay! Fariintaada waa la helay.' });
    } catch (e) {
      return sendError(res, 400, e.message);
    }
  }

  // -----------------------------------------------------------
  // ADMIN AUTHENTICATION
  // -----------------------------------------------------------

  if (pathname === '/api/admin/login' && req.method === 'POST') {
    try {
      const data = await parseJsonBody(req);
      const emailInput = (data.email || '').trim().toLowerCase();
      const passInput = (data.password || '').trim();

      const admin = db.prepare('SELECT * FROM admin WHERE id = 1').get();

      // Check pin match: strict check for 'somtravel' (allowing case variations and optional space)
      const passClean = passInput.toLowerCase();
      const isPinMatch = (
        passClean === 'somtravel' ||
        passClean === 'som travel' ||
        passClean.replace(/\s+/g, '') === 'somtravel'
      );

      // Email match: strict check for 'cabdilahi cawil881@gmail.com' (and variations like 'cabdilahicawil881@gmail.com')
      const emailNormalized = emailInput.replace(/\s+/g, '');
      const targetNormalized = 'cabdilahicawil881@gmail.com';
      const isEmailMatch = (
        emailInput === 'cabdilahi cawil881@gmail.com' ||
        emailNormalized === targetNormalized ||
        emailNormalized === 'cabdilahi.cawil881@gmail.com' ||
        (admin && (emailInput === admin.email.toLowerCase() || emailNormalized === admin.email.toLowerCase().replace(/\s+/g, '')))
      );

      let isValid = false;
      if (isEmailMatch) {
        if (isPinMatch || (admin && verifyPassword(passInput, admin.pw_hash))) {
          isValid = true;
        }
      }

      if (!isValid) {
        return sendError(res, 401, 'DIIDMO: Email-ka ama PIN-ka aad galisay ma saxna! Gelitaanka qaybta maamulka waa laguu diiday.');
      }

      const sessionEmail = admin ? admin.email : ADMIN_EMAIL;
      const session = createSession(sessionEmail);
      res.setHeader('Set-Cookie', `tsom_session=${session.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL / 1000}`);
      return sendJson(res, 200, { ok: true, email: session.email, csrf: session.csrf });
    } catch (e) {
      return sendError(res, 500, e.message);
    }
  }

  if (pathname === '/api/admin/session' && req.method === 'GET') {
    const session = getSessionFromReq(req);
    if (!session) {
      return sendJson(res, 200, { authenticated: false });
    }
    return sendJson(res, 200, { authenticated: true, email: session.email, csrf: session.csrf });
  }

  if (pathname === '/api/admin/logout' && req.method === 'POST') {
    const session = getSessionFromReq(req);
    if (session) {
      db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(session.token_hash);
    }
    res.setHeader('Set-Cookie', 'tsom_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    return sendJson(res, 200, { ok: true });
  }

  // -----------------------------------------------------------
  // PROTECTED ADMIN APIS
  // -----------------------------------------------------------
  if (pathname.startsWith('/api/admin/')) {
    const session = getSessionFromReq(req);
    if (!session) {
      return sendError(res, 401, 'Fadlan soo gal nidaamka maamulka (Unauthorized).');
    }

    // CSRF check on mutations
    if (req.method !== 'GET') {
      const csrfHeader = req.headers['x-csrf-token'];
      if (!csrfHeader || csrfHeader !== session.csrf) {
        return sendError(res, 403, 'CSRF verification failed.');
      }
    }

    // Schema
    if (pathname === '/api/admin/schema' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, sections: SECTIONS_SCHEMA });
    }

    // Overview
    if (pathname === '/api/admin/overview' && req.method === 'GET') {
      const totalBookings = db.prepare('SELECT COUNT(*) as c FROM bookings').get().c;
      const pendingBookings = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status = 'pending'").get().c;
      const confirmedBookings = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status = 'confirmed'").get().c;
      const cancelledBookings = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status = 'cancelled'").get().c;
      const totalRevenue = db.prepare("SELECT SUM(price_total) as r FROM bookings WHERE status != 'cancelled'").get().r || 0;
      
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const last7 = db.prepare('SELECT COUNT(*) as c FROM bookings WHERE created_at >= ?').get(sevenDaysAgo).c;
      
      const totalMessages = db.prepare('SELECT COUNT(*) as c FROM messages').get().c;
      const totalImages = db.prepare('SELECT COUNT(*) as c FROM images').get().c;
      const totalCustomers = db.prepare('SELECT COUNT(*) as c FROM customers').get().c;
      
      let citiesCount = 10;
      try {
        const citiesRow = db.prepare("SELECT draft FROM content WHERE section = 'cities'").get();
        if (citiesRow) {
          const parsed = JSON.parse(citiesRow.draft);
          citiesCount = parsed.items ? parsed.items.length : 10;
        }
      } catch (e) {}

      const rows = db.prepare('SELECT section, draft, published FROM content').all();
      const dirty = [];
      for (const r of rows) {
        if (r.draft !== r.published) dirty.push(r.section);
      }

      const recent = db.prepare('SELECT * FROM bookings ORDER BY id DESC LIMIT 8').all();

      return sendJson(res, 200, {
        ok: true,
        bookings: {
          total: totalBookings,
          pending: pendingBookings,
          confirmed: confirmedBookings,
          cancelled: cancelledBookings,
          last7: last7,
          revenue: totalRevenue
        },
        messages: totalMessages,
        customers: totalCustomers,
        cities: citiesCount,
        images: totalImages,
        dirty: dirty,
        recent: recent
      });
    }

    // Stats
    if (pathname === '/api/admin/stats' && req.method === 'GET') {
      const totalBookings = db.prepare('SELECT COUNT(*) as c FROM bookings').get().c;
      const pendingBookings = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status = 'pending'").get().c;
      const confirmedBookings = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status = 'confirmed'").get().c;
      const totalRevenue = db.prepare("SELECT SUM(price_total) as r FROM bookings WHERE status != 'cancelled'").get().r || 0;
      const totalMessages = db.prepare('SELECT COUNT(*) as c FROM messages').get().c;
      const totalCustomers = db.prepare('SELECT COUNT(*) as c FROM customers').get().c;
      const todayDate = new Date().toISOString().slice(0, 10);
      const todayBookings = db.prepare('SELECT COUNT(*) as c FROM bookings WHERE created_at LIKE ?').get(`${todayDate}%`).c;

      return sendJson(res, 200, {
        ok: true,
        stats: {
          totalBookings,
          todayBookings,
          pendingBookings,
          confirmedBookings,
          totalRevenue,
          totalMessages,
          totalCustomers
        }
      });
    }

    // Registered Customers
    if (pathname === '/api/admin/customers' && req.method === 'GET') {
      const customers = db.prepare(`
        SELECT c.*,
          (SELECT COUNT(*) FROM bookings b WHERE LOWER(b.email) = LOWER(c.email) OR (b.phone = c.phone AND b.phone != '')) as booking_count,
          (SELECT MAX(created_at) FROM bookings b WHERE LOWER(b.email) = LOWER(c.email) OR (b.phone = c.phone AND b.phone != '')) as last_booking
        FROM customers c
        ORDER BY c.id DESC
      `).all();
      return sendJson(res, 200, { ok: true, customers });
    }

    // Delete Customer
    if (pathname.match(/^\/api\/admin\/customers\/\d+$/) && req.method === 'DELETE') {
      const id = parseInt(pathname.split('/').pop(), 10);
      db.prepare('DELETE FROM customers WHERE id = ?').run(id);
      return sendJson(res, 200, { ok: true });
    }

    // Draft content
    if (pathname === '/api/admin/draft' && req.method === 'GET') {
      const rows = db.prepare('SELECT section, draft, published FROM content').all();
      const draft = {};
      const dirty = {};
      for (const r of rows) {
        try {
          draft[r.section] = JSON.parse(r.draft);
          dirty[r.section] = r.draft !== r.published;
        } catch (e) {}
      }
      return sendJson(res, 200, { ok: true, draft, dirty });
    }

    // Update section draft
    if (pathname.startsWith('/api/admin/draft/') && req.method === 'PUT') {
      const sec = pathname.replace('/api/admin/draft/', '').trim();
      const body = await parseJsonBody(req);
      const jsonStr = JSON.stringify(body);
      const nowIso = new Date().toISOString();

      db.prepare(`
        INSERT INTO content (section, draft, published, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(section) DO UPDATE SET draft = excluded.draft, updated_at = excluded.updated_at
      `).run(sec, jsonStr, jsonStr, nowIso);

      const rows = db.prepare('SELECT section, draft, published FROM content').all();
      const dirty = {};
      for (const r of rows) {
        dirty[r.section] = r.draft !== r.published;
      }
      return sendJson(res, 200, { ok: true, draft: body, dirty });
    }

    // Publish all drafts
    if (pathname === '/api/admin/publish' && req.method === 'POST') {
      db.exec('UPDATE content SET published = draft;');
      return sendJson(res, 200, { ok: true, dirty: {} });
    }

    // Discard drafts
    if (pathname === '/api/admin/discard' && req.method === 'POST') {
      db.exec('UPDATE content SET draft = published;');
      return sendJson(res, 200, { ok: true, dirty: {} });
    }

    // Bookings list
    if (pathname === '/api/admin/bookings' && req.method === 'GET') {
      const q = (parsedUrl.searchParams.get('q') || '').trim();
      const status = (parsedUrl.searchParams.get('status') || '').trim();
      const service = (parsedUrl.searchParams.get('service') || '').trim();

      let query = 'SELECT * FROM bookings WHERE 1=1';
      const params = [];
      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      if (service) {
        query += ' AND LOWER(service) = LOWER(?)';
        params.push(service);
      }
      if (q) {
        query += ' AND (ref LIKE ? OR name LIKE ? OR phone LIKE ? OR origin LIKE ? OR destination LIKE ? OR email LIKE ?)';
        const lq = `%${q}%`;
        params.push(lq, lq, lq, lq, lq, lq);
      }
      query += ' ORDER BY id DESC';

      const bookings = db.prepare(query).all(...params);
      return sendJson(res, 200, { ok: true, bookings });
    }

    // Update single booking (status, note)
    if (pathname.match(/^\/api\/admin\/bookings\/\d+$/) && req.method === 'PUT') {
      const id = parseInt(pathname.split('/').pop(), 10);
      const body = await parseJsonBody(req);
      const status = body.status || 'pending';
      const adminNote = body.adminNote !== undefined ? body.adminNote : '';
      const nowIso = new Date().toISOString();

      db.prepare('UPDATE bookings SET status = ?, admin_note = ?, updated_at = ? WHERE id = ?')
        .run(status, adminNote, nowIso, id);

      const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
      return sendJson(res, 200, { ok: true, booking: updated });
    }

    // Delete booking
    if (pathname.match(/^\/api\/admin\/bookings\/\d+$/) && req.method === 'DELETE') {
      const id = parseInt(pathname.split('/').pop(), 10);
      db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
      return sendJson(res, 200, { ok: true });
    }

    // Messages list
    if (pathname === '/api/admin/messages' && req.method === 'GET') {
      const messages = db.prepare('SELECT * FROM messages ORDER BY id DESC').all();
      return sendJson(res, 200, { ok: true, messages });
    }

    // Delete message
    if (pathname.match(/^\/api\/admin\/messages\/\d+$/) && req.method === 'DELETE') {
      const id = parseInt(pathname.split('/').pop(), 10);
      db.prepare('DELETE FROM messages WHERE id = ?').run(id);
      return sendJson(res, 200, { ok: true });
    }

    // Images list
    if (pathname === '/api/admin/images' && req.method === 'GET') {
      const imgRows = db.prepare('SELECT * FROM images ORDER BY kind DESC, id DESC').all();
      // Calculate where each image is used
      const rows = db.prepare('SELECT section, draft FROM content').all();
      const allDraftJson = rows.map(r => r.draft).join(' ');

      const images = imgRows.map(im => {
        const usedIn = [];
        if (allDraftJson.includes(im.path)) {
          usedIn.push('Website');
        }
        return { ...im, usedIn };
      });
      return sendJson(res, 200, { ok: true, images });
    }

    // Upload image
    if (pathname === '/api/admin/images' && req.method === 'POST') {
      const rawFilename = decodeURIComponent(req.headers['x-filename'] || 'upload.jpg');
      const ext = path.extname(rawFilename).toLowerCase() || '.jpg';
      const cleanName = `up_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
      const destPath = path.join(UPLOADS_DIR, cleanName);

      const writeStream = fs.createWriteStream(destPath);
      let size = 0;
      req.on('data', chunk => {
        size += chunk.length;
        writeStream.write(chunk);
      });
      req.on('end', () => {
        writeStream.end();
        const relPath = `data/uploads/${cleanName}`;
        db.prepare('INSERT INTO images (path, name, kind, size, created_at) VALUES (?, ?, ?, ?, ?)')
          .run(relPath, rawFilename, 'upload', size, new Date().toISOString());

        return sendJson(res, 201, { ok: true, path: relPath });
      });
      req.on('error', err => {
        sendError(res, 500, err.message);
      });
      return;
    }

    // Change admin password
    if (pathname === '/api/admin/password' && req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        const currentPass = (body.current || '').trim();
        const newPass = (body.new || '').trim();

        if (!newPass) {
          return sendError(res, 400, 'Fadlan gali PIN-ka ama furaha cusub.');
        }

        const admin = db.prepare('SELECT * FROM admin WHERE id = 1').get();
        const currentClean = currentPass.toLowerCase();
        const isCurrentMatch = (
          currentClean === 'somtravel' ||
          currentClean === 'som travel' ||
          currentClean.replace(/\s+/g, '') === 'somtravel' ||
          (admin && verifyPassword(currentPass, admin.pw_hash))
        );

        if (!isCurrentMatch) {
          return sendError(res, 400, 'Furaha hadda jira (Current PIN) ma saxna.');
        }

        const newHash = hashPassword(newPass);
        db.prepare('UPDATE admin SET pw_hash = ?, updated_at = ? WHERE id = 1')
          .run(newHash, new Date().toISOString());

        return sendJson(res, 200, { ok: true, message: 'Furaha si guul leh ayaa loo beddelay.' });
      } catch (err) {
        return sendError(res, 500, err.message);
      }
    }
  }

  // -----------------------------------------------------------
  // STATIC FILE SERVING
  // -----------------------------------------------------------
  let safeRel = pathname;
  if (safeRel === '/' || safeRel === '') safeRel = '/index.html';
  if (safeRel === '/about') safeRel = '/about.html';
  if (safeRel === '/booking') safeRel = '/booking.html';
  if (safeRel === '/contact') safeRel = '/contact.html';
  if (safeRel === '/track' || safeRel === '/track.html') {
    const searchStr = parsedUrl.search || '';
    const qStr = searchStr ? '&' + searchStr.substring(1) : '';
    res.writeHead(302, { 'Location': '/booking.html?tab=track' + qStr });
    res.end();
    return;
  }
  if (safeRel === '/admin' || safeRel === '/admin/') safeRel = '/admin/index.html';

  let safePath = path.normalize(path.join(ROOT_DIR, safeRel));

  // Security: prevent path traversal outside ROOT_DIR
  if (!safePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err) {
      // 404 handler
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>404 — Not Found | TRAVEL SOM</title><link rel="stylesheet" href="/css/style.css"></head>
        <body style="display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;">
          <div style="padding:40px;max-width:500px;">
            <h1 style="font-size:72px;color:var(--sun,#FF8A1F);margin:0 0 10px;">404</h1>
            <h2 style="margin:0 0 14px;">Boggan Lama Helin (Page Not Found)</h2>
            <p style="color:var(--mut,#6a7895);margin-bottom:24px;">Fadlan hubi URL-ka aad raadinayso ama ku noqo bogga hore.</p>
            <a href="/" class="btn p">Ku Noqo Bogga Hore (Back Home)</a>
          </div>
        </body>
        </html>
      `);
      return;
    }

    if (stats.isDirectory()) {
      safePath = path.join(safePath, 'index.html');
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(safePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Internal Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(` ✈️ TRAVEL SOM Web Application is running!`);
  console.log(` 🌐 Website:         http://localhost:${PORT}`);
  console.log(` 🎫 Easy Booking:    http://localhost:${PORT}/booking.html`);
  console.log(` 📍 Track Booking:   http://localhost:${PORT}/track.html`);
  console.log(` 🛡️ Admin Dashboard: http://localhost:${PORT}/admin/`);
  console.log(` 📊 Database:        ${DB_PATH}`);
  console.log(`=======================================================`);
});
