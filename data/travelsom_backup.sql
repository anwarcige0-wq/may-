-- =======================================================
-- TRAVEL SOM — SQL DATABASE BACKUP
-- Taariikhda: 2026-10-10T14:12:15.191Z
-- Database: SQLite (Compatible with MySQL/PostgreSQL with minor adaptations)
-- =======================================================

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

-- -------------------------------------------------------
-- Jadwalka: admin
-- -------------------------------------------------------
DROP TABLE IF EXISTS "admin";
CREATE TABLE admin (
  id INTEGER PRIMARY KEY CHECK(id=1),
  email TEXT NOT NULL,
  pw_hash TEXT NOT NULL,
  updated_at TEXT
);

INSERT INTO "admin" ("id", "email", "pw_hash", "updated_at") VALUES (1, 'cabdilahi cawil881@gmail.com', '5fff67764309fcc08d7782f84670d97a:f393e8352a09ffd75c52e8796b61425257a0e083c49d60146827ec7efd3633f950d39cc721fbbac11d2fe6ab9197306e31c0785db0d98bb8352b888dc25a8655', '2026-10-10T14:03:15.209Z');

-- -------------------------------------------------------
-- Jadwalka: sessions
-- -------------------------------------------------------
DROP TABLE IF EXISTS "sessions";
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  csrf TEXT NOT NULL,
  email TEXT NOT NULL,
  created REAL,
  last_seen REAL
);

INSERT INTO "sessions" ("token_hash", "csrf", "email", "created", "last_seen") VALUES ('12673dc7691a1cab795392653619c27f29b28e2d4a2b08535647825978fc5ed7', 'cb99042fa362015cff59ffe8d02adf85', 'cabdilahi cawil881@gmail.com', 1791641307266, 1791641307653);

-- -------------------------------------------------------
-- Jadwalka: login_attempts
-- -------------------------------------------------------
DROP TABLE IF EXISTS "login_attempts";
CREATE TABLE login_attempts (
  key TEXT,
  ts REAL
);

-- -------------------------------------------------------
-- Jadwalka: content
-- -------------------------------------------------------
DROP TABLE IF EXISTS "content";
CREATE TABLE content (
  section TEXT PRIMARY KEY,
  draft TEXT NOT NULL,
  published TEXT NOT NULL,
  updated_at TEXT
);

INSERT INTO "content" ("section", "draft", "published", "updated_at") VALUES ('hero', '{"slides":[{"image":"images/airplane/airplane.jpg","alt":"TRAVEL SOM airplane","position":"center"},{"image":"images/taxi/taxi.jpg","alt":"TRAVEL SOM taxi","position":"center"},{"image":"images/bus/bus.jpg","alt":"TRAVEL SOM bus","position":"center"},{"image":"images/cities/mogadishu-hero.jpg","alt":"Mogadishu, Somalia — TRAVEL SOM","position":"center top"}]}', '{"slides":[{"image":"images/airplane/airplane.jpg","alt":"TRAVEL SOM airplane","position":"center"},{"image":"images/taxi/taxi.jpg","alt":"TRAVEL SOM taxi","position":"center"},{"image":"images/bus/bus.jpg","alt":"TRAVEL SOM bus","position":"center"},{"image":"images/cities/mogadishu-hero.jpg","alt":"Mogadishu, Somalia — TRAVEL SOM","position":"center top"}]}', '2026-10-09T20:14:41.361Z');
INSERT INTO "content" ("section", "draft", "published", "updated_at") VALUES ('home', '{"tag":"TRAVEL SOM","heading":"Travel Across Somalia With Comfort and Confidence","highlight":"Comfort","description":"TRAVEL SOM provides reliable transportation and travel services between major Somali cities — by bus, taxi and air.","primaryButton":"Hadda Dalbo →","secondaryButton":"Explore Services","announcementEnabled":false,"announcement":""}', '{"tag":"TRAVEL SOM","heading":"Travel Across Somalia With Comfort and Confidence","highlight":"Comfort","description":"TRAVEL SOM provides reliable transportation and travel services between major Somali cities — by bus, taxi and air.","primaryButton":"Hadda Dalbo →","secondaryButton":"Explore Services","announcementEnabled":false,"announcement":""}', '2026-10-09T20:14:41.366Z');
INSERT INTO "content" ("section", "draft", "published", "updated_at") VALUES ('services', '{"items":[{"key":"flight","emoji":"✈️","title":"Flight Services","description":"Search and book flights between different destinations with ease.","image":"images/airplane/airplane.jpg","buttonText":"Hadda Dalbo"},{"key":"bus","emoji":"🚌","title":"Bus Services","description":"Book comfortable and reliable bus transportation between Somali cities.","image":"images/bus/bus.jpg","buttonText":"Hadda Dalbo"},{"key":"taxi","emoji":"🚕","title":"Taxi Services","description":"Book taxis for local transportation and city travel, any time of day.","image":"images/taxi/taxi.jpg","buttonText":"Hadda Dalbo"}]}', '{"items":[{"key":"flight","emoji":"✈️","title":"Flight Services","description":"Search and book flights between different destinations with ease.","image":"images/airplane/airplane.jpg","buttonText":"Hadda Dalbo"},{"key":"bus","emoji":"🚌","title":"Bus Services","description":"Book comfortable and reliable bus transportation between Somali cities.","image":"images/bus/bus.jpg","buttonText":"Hadda Dalbo"},{"key":"taxi","emoji":"🚕","title":"Taxi Services","description":"Book taxis for local transportation and city travel, any time of day.","image":"images/taxi/taxi.jpg","buttonText":"Hadda Dalbo"}]}', '2026-10-09T20:14:41.370Z');
INSERT INTO "content" ("section", "draft", "published", "updated_at") VALUES ('cities', '{"items":[{"name":"Mogadishu","description":"The vibrant capital on the Indian Ocean coast.","image":"images/cities/mogadishu.jpg","exploreText":"Explore →"},{"name":"Hargeisa","description":"Bustling capital of Somaliland, rich in culture.","image":"","exploreText":"Explore →"},{"name":"Bosaso","description":"A lively port city on the Gulf of Aden.","image":"","exploreText":"Explore →"},{"name":"Garowe","description":"The administrative heart of Puntland.","image":"","exploreText":"Explore →"},{"name":"Kismayo","description":"A sunny southern port with golden beaches.","image":"","exploreText":"Explore →"},{"name":"Baidoa","description":"A key inland city in the fertile south-west.","image":"images/cities/baidoa.jpg","exploreText":"Explore →"},{"name":"Burao","description":"A major trading hub in the Togdheer region.","image":"","exploreText":"Explore →"},{"name":"Berbera","description":"Historic port with clear waters and beaches.","image":"images/cities/berbera.jpg","exploreText":"Explore →"},{"name":"Beledweyne","description":"A river city along the Shabelle.","image":"","exploreText":"Explore →"},{"name":"Galkayo","description":"A busy crossroads in central Somalia.","image":"","exploreText":"Explore →"}]}', '{"items":[{"name":"Mogadishu","description":"The vibrant capital on the Indian Ocean coast.","image":"images/cities/mogadishu.jpg","exploreText":"Explore →"},{"name":"Hargeisa","description":"Bustling capital of Somaliland, rich in culture.","image":"","exploreText":"Explore →"},{"name":"Bosaso","description":"A lively port city on the Gulf of Aden.","image":"","exploreText":"Explore →"},{"name":"Garowe","description":"The administrative heart of Puntland.","image":"","exploreText":"Explore →"},{"name":"Kismayo","description":"A sunny southern port with golden beaches.","image":"","exploreText":"Explore →"},{"name":"Baidoa","description":"A key inland city in the fertile south-west.","image":"images/cities/baidoa.jpg","exploreText":"Explore →"},{"name":"Burao","description":"A major trading hub in the Togdheer region.","image":"","exploreText":"Explore →"},{"name":"Berbera","description":"Historic port with clear waters and beaches.","image":"images/cities/berbera.jpg","exploreText":"Explore →"},{"name":"Beledweyne","description":"A river city along the Shabelle.","image":"","exploreText":"Explore →"},{"name":"Galkayo","description":"A busy crossroads in central Somalia.","image":"","exploreText":"Explore →"}]}', '2026-10-09T20:14:41.374Z');
INSERT INTO "content" ("section", "draft", "published", "updated_at") VALUES ('about', '{"tag":"Who we are","title":"About TRAVEL SOM","paragraphs":[{"text":"TRAVEL SOM is a modern Somali travel and transportation company focused on making transportation easier, safer, and more convenient for customers traveling between Somali cities."},{"text":"From long-distance coaches to city taxis and flights, we bring every option together with friendly service and transparent prices."}],"bullets":[{"text":"Modern, well-maintained fleet"},{"text":"Trained, professional drivers and staff"},{"text":"Simple online booking"}],"image":"images/bus/bus.jpg"}', '{"tag":"Who we are","title":"About TRAVEL SOM","paragraphs":[{"text":"TRAVEL SOM is a modern Somali travel and transportation company focused on making transportation easier, safer, and more convenient for customers traveling between Somali cities."},{"text":"From long-distance coaches to city taxis and flights, we bring every option together with friendly service and transparent prices."}],"bullets":[{"text":"Modern, well-maintained fleet"},{"text":"Trained, professional drivers and staff"},{"text":"Simple online booking"}],"image":"images/bus/bus.jpg"}', '2026-10-09T20:14:41.378Z');
INSERT INTO "content" ("section", "draft", "published", "updated_at") VALUES ('branches', '{"intro":"Visit a TRAVEL SOM branch to book your trip in person, or call us any time.","items":[{"name":"Hargeisa","region":"Somaliland","address":"Main Street, City Center","phone":"+252 063 7537706","hours":"6:00 AM - 9:00 PM"},{"name":"Mogadishu","region":"Banadir","address":"KM4 Junction, Maka Al Mukarama","phone":"+252 061 5557706","hours":"6:00 AM - 9:00 PM"},{"name":"Bosaso","region":"Puntland","address":"Port Road, Commercial Area","phone":"+252 090 7777706","hours":"6:30 AM - 8:30 PM"},{"name":"Garowe","region":"Puntland","address":"Airport Road","phone":"+252 090 8887706","hours":"7:00 AM - 8:00 PM"},{"name":"Kismayo","region":"Jubaland","address":"Independence Ave","phone":"+252 061 9997706","hours":"7:00 AM - 8:00 PM"},{"name":"Baidoa","region":"South West","address":"Main Terminal","phone":"+252 061 3337706","hours":"6:30 AM - 8:00 PM"}]}', '{"intro":"Visit a TRAVEL SOM branch to book your trip in person, or call us any time.","items":[{"name":"Hargeisa","region":"Somaliland","address":"Main Street, City Center","phone":"+252 063 7537706","hours":"6:00 AM - 9:00 PM"},{"name":"Mogadishu","region":"Banadir","address":"KM4 Junction, Maka Al Mukarama","phone":"+252 061 5557706","hours":"6:00 AM - 9:00 PM"},{"name":"Bosaso","region":"Puntland","address":"Port Road, Commercial Area","phone":"+252 090 7777706","hours":"6:30 AM - 8:30 PM"},{"name":"Garowe","region":"Puntland","address":"Airport Road","phone":"+252 090 8887706","hours":"7:00 AM - 8:00 PM"},{"name":"Kismayo","region":"Jubaland","address":"Independence Ave","phone":"+252 061 9997706","hours":"7:00 AM - 8:00 PM"},{"name":"Baidoa","region":"South West","address":"Main Terminal","phone":"+252 061 3337706","hours":"6:30 AM - 8:00 PM"}]}', '2026-10-09T20:14:41.382Z');
INSERT INTO "content" ("section", "draft", "published", "updated_at") VALUES ('contact', '{"phone":"+252 063 7537706","email":"info@travelsom.com","address":"Somalia","facebook":"https://facebook.com/travelsom","instagram":"https://instagram.com/travelsom","x":"https://x.com/travelsom","whatsapp":"https://wa.me/2520637537706","youtube":""}', '{"phone":"+252 063 7537706","email":"info@travelsom.com","address":"Somalia","facebook":"https://facebook.com/travelsom","instagram":"https://instagram.com/travelsom","x":"https://x.com/travelsom","whatsapp":"https://wa.me/2520637537706","youtube":""}', '2026-10-09T20:14:41.387Z');
INSERT INTO "content" ("section", "draft", "published", "updated_at") VALUES ('content', '{"whyTitle":"Why Choose TRAVEL SOM?","whyLead":"Everything you need for a smooth journey.","why":[{"icon":"🛡","title":"Reliable Transportation","text":"Reliable and comfortable transportation services."},{"icon":"🔒","title":"Safe Travel","text":"We prioritize customer safety and comfort."},{"icon":"📲","title":"Easy Booking","text":"Simple and convenient online booking."},{"icon":"🤝","title":"Professional Service","text":"Friendly and professional customer service."},{"icon":"🗺","title":"Multiple Destinations","text":"Travel between major cities across Somalia."},{"icon":"💰","title":"Affordable Prices","text":"Competitive and accessible travel prices."}],"busesTitle":"Featured Buses","busesLead":"Clean, modern coaches proudly carrying the TRAVEL SOM name.","buses":[{"title":"Executive Coach","text":"Reclining seats · AC · Wi-Fi","image":"images/bus/bus.jpg"},{"title":"Luxury Liner","text":"Extra legroom · USB charging","image":""},{"title":"Intercity Express","text":"Fast routes · Comfortable ride","image":""}],"testimonialsTitle":"What Travelers Say","testimonialsLead":"Trusted by passengers across Somalia.","testimonials":[{"name":"Amina Yusuf","city":"Hargeisa","quote":"TRAVEL SOM made my trip from Hargeisa to Bosaso simple and comfortable."},{"name":"Abdirahman Ali","city":"Mogadishu","quote":"Booking was quick and the bus was clean and on time. Highly recommended."},{"name":"Hodan Farah","city":"Garowe","quote":"Friendly staff and fair prices. I now book all my family trips here."}],"ctaTitle":"Ready to Start Your Journey?","ctaText":"Book your next trip with TRAVEL SOM and travel across Somalia with comfort and confidence.","ctaButton":"Book Your Trip Now","footerText":"A modern Somali travel and transportation company connecting major cities by bus, taxi and air.","copyright":"© 2026 TRAVEL SOM. All Rights Reserved."}', '{"whyTitle":"Why Choose TRAVEL SOM?","whyLead":"Everything you need for a smooth journey.","why":[{"icon":"🛡","title":"Reliable Transportation","text":"Reliable and comfortable transportation services."},{"icon":"🔒","title":"Safe Travel","text":"We prioritize customer safety and comfort."},{"icon":"📲","title":"Easy Booking","text":"Simple and convenient online booking."},{"icon":"🤝","title":"Professional Service","text":"Friendly and professional customer service."},{"icon":"🗺","title":"Multiple Destinations","text":"Travel between major cities across Somalia."},{"icon":"💰","title":"Affordable Prices","text":"Competitive and accessible travel prices."}],"busesTitle":"Featured Buses","busesLead":"Clean, modern coaches proudly carrying the TRAVEL SOM name.","buses":[{"title":"Executive Coach","text":"Reclining seats · AC · Wi-Fi","image":"images/bus/bus.jpg"},{"title":"Luxury Liner","text":"Extra legroom · USB charging","image":""},{"title":"Intercity Express","text":"Fast routes · Comfortable ride","image":""}],"testimonialsTitle":"What Travelers Say","testimonialsLead":"Trusted by passengers across Somalia.","testimonials":[{"name":"Amina Yusuf","city":"Hargeisa","quote":"TRAVEL SOM made my trip from Hargeisa to Bosaso simple and comfortable."},{"name":"Abdirahman Ali","city":"Mogadishu","quote":"Booking was quick and the bus was clean and on time. Highly recommended."},{"name":"Hodan Farah","city":"Garowe","quote":"Friendly staff and fair prices. I now book all my family trips here."}],"ctaTitle":"Ready to Start Your Journey?","ctaText":"Book your next trip with TRAVEL SOM and travel across Somalia with comfort and confidence.","ctaButton":"Book Your Trip Now","footerText":"A modern Somali travel and transportation company connecting major cities by bus, taxi and air.","copyright":"© 2026 TRAVEL SOM. All Rights Reserved."}', '2026-10-09T20:14:41.391Z');
INSERT INTO "content" ("section", "draft", "published", "updated_at") VALUES ('settings', '{"siteTitle":"TRAVEL SOM — Travel Across Somalia","metaDescription":"TRAVEL SOM provides reliable bus, taxi and flight services between major Somali cities.","bookingOpen":true,"bookingClosedMessage":"Online booking is temporarily closed. Please call us to book.","colorNavy":"#0A2358","colorNavy2":"#143A85","colorSun":"#FF8A1F","colorSun2":"#FFB052"}', '{"siteTitle":"TRAVEL SOM — Travel Across Somalia","metaDescription":"TRAVEL SOM provides reliable bus, taxi and flight services between major Somali cities.","bookingOpen":true,"bookingClosedMessage":"Online booking is temporarily closed. Please call us to book.","colorNavy":"#0A2358","colorNavy2":"#143A85","colorSun":"#FF8A1F","colorSun2":"#FFB052"}', '2026-10-09T20:14:41.395Z');

-- -------------------------------------------------------
-- Jadwalka: images
-- -------------------------------------------------------
DROP TABLE IF EXISTS "images";
CREATE TABLE images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT UNIQUE NOT NULL,
  name TEXT,
  kind TEXT,
  size INTEGER,
  created_at TEXT
);

INSERT INTO "images" ("id", "path", "name", "kind", "size", "created_at") VALUES (1, 'images/airplane/airplane.jpg', 'airplane.jpg', 'website', 133139, '2026-10-09T20:14:41.403Z');
INSERT INTO "images" ("id", "path", "name", "kind", "size", "created_at") VALUES (2, 'images/bus/bus.jpg', 'bus.jpg', 'website', 189313, '2026-10-09T20:14:41.408Z');
INSERT INTO "images" ("id", "path", "name", "kind", "size", "created_at") VALUES (3, 'images/cities/baidoa.jpg', 'baidoa.jpg', 'website', 280150, '2026-10-09T20:14:41.414Z');
INSERT INTO "images" ("id", "path", "name", "kind", "size", "created_at") VALUES (4, 'images/cities/berbera.jpg', 'berbera.jpg', 'website', 289233, '2026-10-09T20:14:41.418Z');
INSERT INTO "images" ("id", "path", "name", "kind", "size", "created_at") VALUES (5, 'images/cities/mogadishu-hero.jpg', 'mogadishu-hero.jpg', 'website', 270504, '2026-10-09T20:14:41.422Z');
INSERT INTO "images" ("id", "path", "name", "kind", "size", "created_at") VALUES (6, 'images/cities/mogadishu.jpg', 'mogadishu.jpg', 'website', 286307, '2026-10-09T20:14:41.428Z');
INSERT INTO "images" ("id", "path", "name", "kind", "size", "created_at") VALUES (7, 'images/other/unassigned-seafront.jpg', 'unassigned-seafront.jpg', 'website', 316804, '2026-10-09T20:14:41.433Z');
INSERT INTO "images" ("id", "path", "name", "kind", "size", "created_at") VALUES (8, 'images/taxi/taxi.jpg', 'taxi.jpg', 'website', 180563, '2026-10-09T20:14:41.438Z');
INSERT INTO "images" ("id", "path", "name", "kind", "size", "created_at") VALUES (9, 'images/bus/intercity-express.jpg', 'intercity-express.jpg', 'website', 6388552, '2026-10-10T11:40:41.693Z');
INSERT INTO "images" ("id", "path", "name", "kind", "size", "created_at") VALUES (10, 'images/bus/luxury-liner.jpg', 'luxury-liner.jpg', 'website', 1411530, '2026-10-10T11:40:41.697Z');
INSERT INTO "images" ("id", "path", "name", "kind", "size", "created_at") VALUES (11, 'images/cities/beledweyne.jpg', 'beledweyne.jpg', 'website', 1144706, '2026-10-10T11:40:41.704Z');
INSERT INTO "images" ("id", "path", "name", "kind", "size", "created_at") VALUES (12, 'images/cities/bosaso.jpg', 'bosaso.jpg', 'website', 1062141, '2026-10-10T11:40:41.709Z');
INSERT INTO "images" ("id", "path", "name", "kind", "size", "created_at") VALUES (13, 'images/cities/burao.jpg', 'burao.jpg', 'website', 1165750, '2026-10-10T11:40:41.714Z');
INSERT INTO "images" ("id", "path", "name", "kind", "size", "created_at") VALUES (14, 'images/cities/galkayo.jpg', 'galkayo.jpg', 'website', 124971, '2026-10-10T11:40:41.721Z');
INSERT INTO "images" ("id", "path", "name", "kind", "size", "created_at") VALUES (15, 'images/cities/garowe.jpg', 'garowe.jpg', 'website', 1153322, '2026-10-10T11:40:41.726Z');
INSERT INTO "images" ("id", "path", "name", "kind", "size", "created_at") VALUES (16, 'images/cities/hargeisa.jpg', 'hargeisa.jpg', 'website', 1181984, '2026-10-10T11:40:41.732Z');
INSERT INTO "images" ("id", "path", "name", "kind", "size", "created_at") VALUES (17, 'images/cities/kismayo.jpg', 'kismayo.jpg', 'website', 982685, '2026-10-10T11:40:41.737Z');

-- -------------------------------------------------------
-- Jadwalka: bookings
-- -------------------------------------------------------
DROP TABLE IF EXISTS "bookings";
CREATE TABLE bookings (
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
, departure_time TEXT DEFAULT '06:00 AM', transit_stops TEXT DEFAULT '');

INSERT INTO "bookings" ("id", "ref", "service", "origin", "destination", "travel_date", "return_date", "passengers", "seats", "price_total", "name", "phone", "email", "payment_method", "notes", "status", "admin_note", "created_at", "updated_at", "departure_time", "transit_stops") VALUES (1, 'TS-2026-1001', 'Bus', 'Mogadishu', 'Baidoa', '2026-10-09', '', 1, '04', 15, 'Axmed Cali Warsame', '+252 61 555 1234', 'axmed.ali@gmail.com', 'EVC Plus', 'Fadlan kursiga daaqada xigta ii qabta.', 'confirmed', 'Xaqiijiyey EVC Plus payment.', '2026-10-09T15:14:41.347Z', '2026-10-09T20:14:41.347Z', '06:00 AM', '');
INSERT INTO "bookings" ("id", "ref", "service", "origin", "destination", "travel_date", "return_date", "passengers", "seats", "price_total", "name", "phone", "email", "payment_method", "notes", "status", "admin_note", "created_at", "updated_at", "departure_time", "transit_stops") VALUES (2, 'TS-2026-1002', 'Flight', 'Mogadishu', 'Hargeisa', '2026-10-09', '', 2, '12A, 12B', 240, 'Maryan Xasan Nuur', '+252 63 444 8765', 'maryan.hn@outlook.com', 'Zaad Service', 'Labo qof iyo shandad 20kg ah.', 'confirmed', '', '2026-10-09T18:14:41.351Z', '2026-10-10T12:07:33.943Z', '06:00 AM', '');
INSERT INTO "bookings" ("id", "ref", "service", "origin", "destination", "travel_date", "return_date", "passengers", "seats", "price_total", "name", "phone", "email", "payment_method", "notes", "status", "admin_note", "created_at", "updated_at", "departure_time", "transit_stops") VALUES (3, 'TS-2026-1003', 'Bus', 'Hargeisa', 'Berbera', '2026-10-09', '', 1, '08', 12, 'Jaamac Maxamed Cilmi', '+252 63 753 7706', 'jaamac@sommail.so', 'Zaad Service', '', 'confirmed', 'Tikidhka waa la siiyey.', '2026-10-09T19:14:41.356Z', '2026-10-09T20:14:41.356Z', '06:00 AM', '');
INSERT INTO "bookings" ("id", "ref", "service", "origin", "destination", "travel_date", "return_date", "passengers", "seats", "price_total", "name", "phone", "email", "payment_method", "notes", "status", "admin_note", "created_at", "updated_at", "departure_time", "transit_stops") VALUES (4, 'TS-2026-3123', 'Flight', 'Mogadishu', 'Hargeisa', '2026-10-15', '', 2, '14A, 14B', 240, 'Guuleed Maxamed', '+252 61 888 9999', '', 'Zaad Service', '', 'confirmed', '', '2026-10-09T20:17:51.658Z', '2026-10-10T12:05:16.493Z', '06:00 AM', '');
INSERT INTO "bookings" ("id", "ref", "service", "origin", "destination", "travel_date", "return_date", "passengers", "seats", "price_total", "name", "phone", "email", "payment_method", "notes", "status", "admin_note", "created_at", "updated_at", "departure_time", "transit_stops") VALUES (5, 'TS-2026-6589', 'Bus', 'Hargeisa', 'Berbera', '2026-10-20', '', 2, '05, 06', 24, 'Cabdiraxmaan Jaamac', '+252 63 4567890', '', 'Zaad Service', 'Safar nabad ah', 'confirmed', 'Lacagta Zaad waa la xaqiijiyey', '2026-10-09T20:20:00.138Z', '2026-10-09T20:20:00.211Z', '06:00 AM', '');
INSERT INTO "bookings" ("id", "ref", "service", "origin", "destination", "travel_date", "return_date", "passengers", "seats", "price_total", "name", "phone", "email", "payment_method", "notes", "status", "admin_note", "created_at", "updated_at", "departure_time", "transit_stops") VALUES (6, 'TS-2026-6731', 'Bus', 'Hargeisa', 'Mogadishu', '2026-10-12', '', 1, '11', 20, 'cabdilahi cawil cige', '+2520637537706', 'abdilaahicawil823@gmail.com', 'Zaad Service', 'thank you', 'confirmed', 'Xaqiijiyey Zaad', '2026-10-09T20:27:43.962Z', '2026-10-10T11:44:14.303Z', '06:00 AM', '');
INSERT INTO "bookings" ("id", "ref", "service", "origin", "destination", "travel_date", "return_date", "passengers", "seats", "price_total", "name", "phone", "email", "payment_method", "notes", "status", "admin_note", "created_at", "updated_at", "departure_time", "transit_stops") VALUES (7, 'TS-2026-8172', 'Bus', 'Mogadishu', 'Hargeisa', '2026-10-11', '', 6, '02, 05, 06, 04, 08, 12, 16, 11', 120, 'siman', '+2520637537706', 'cigefilms58@gmail.com', 'EVC Plus', '', 'confirmed', '', '2026-10-10T12:11:30.835Z', '2026-10-10T12:13:07.084Z', '06:00 AM (Subax Hore - Morning Express)', 'Beledweyne ➔ Galkayo ➔ Garowe ➔ Laascaanood ➔ Burco (5 Magaalo)');

-- -------------------------------------------------------
-- Jadwalka: messages
-- -------------------------------------------------------
DROP TABLE IF EXISTS "messages";
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread',
  created_at TEXT
);

INSERT INTO "messages" ("id", "name", "email", "phone", "message", "status", "created_at") VALUES (1, 'Faadumo Cali', '', '+252 63 1234567', 'Waxaan rabaa inaan wax ka ogaado duulimaadka Hargeysa ilaa Muqdisho.', 'unread', '2026-10-09T20:18:25.791Z');
INSERT INTO "messages" ("id", "name", "email", "phone", "message", "status", "created_at") VALUES (2, 'Sahra Maxamuud', '', '+252 61 222 3333', 'Fadlan ma jiraa safar habeenkii ah?', 'unread', '2026-10-09T20:20:00.160Z');

-- -------------------------------------------------------
-- Jadwalka: routes
-- -------------------------------------------------------
DROP TABLE IF EXISTS "routes";
CREATE TABLE routes (
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

INSERT INTO "routes" ("id", "service", "origin", "destination", "departure_time", "duration", "price", "vehicle_name", "seats_available") VALUES (1, 'Bus', 'Mogadishu', 'Baidoa', '06:30 AM', '4h 30m', 15, 'VIP Express Coach 01', 36);
INSERT INTO "routes" ("id", "service", "origin", "destination", "departure_time", "duration", "price", "vehicle_name", "seats_available") VALUES (2, 'Bus', 'Baidoa', 'Mogadishu', '07:00 AM', '4h 30m', 15, 'VIP Express Coach 02', 36);
INSERT INTO "routes" ("id", "service", "origin", "destination", "departure_time", "duration", "price", "vehicle_name", "seats_available") VALUES (3, 'Bus', 'Hargeisa', 'Berbera', '08:00 AM', '2h 45m', 12, 'Coastline Liner 05', 40);
INSERT INTO "routes" ("id", "service", "origin", "destination", "departure_time", "duration", "price", "vehicle_name", "seats_available") VALUES (4, 'Bus', 'Berbera', 'Hargeisa', '02:00 PM', '2h 45m', 12, 'Coastline Liner 06', 40);
INSERT INTO "routes" ("id", "service", "origin", "destination", "departure_time", "duration", "price", "vehicle_name", "seats_available") VALUES (5, 'Bus', 'Hargeisa', 'Burao', '07:30 AM', '3h 15m', 14, 'Togdheer Shuttle 03', 38);
INSERT INTO "routes" ("id", "service", "origin", "destination", "departure_time", "duration", "price", "vehicle_name", "seats_available") VALUES (6, 'Bus', 'Garowe', 'Bosaso', '06:00 AM', '6h 00m', 25, 'Puntland Royal Coach', 34);
INSERT INTO "routes" ("id", "service", "origin", "destination", "departure_time", "duration", "price", "vehicle_name", "seats_available") VALUES (7, 'Bus', 'Mogadishu', 'Kismayo', '06:00 AM', '8h 00m', 35, 'Jubba Intercity Coach', 36);
INSERT INTO "routes" ("id", "service", "origin", "destination", "departure_time", "duration", "price", "vehicle_name", "seats_available") VALUES (8, 'Bus', 'Mogadishu', 'Beledweyne', '06:30 AM', '6h 30m', 25, 'Hiiraan Express', 35);
INSERT INTO "routes" ("id", "service", "origin", "destination", "departure_time", "duration", "price", "vehicle_name", "seats_available") VALUES (9, 'Bus', 'Garowe', 'Galkayo', '07:00 AM', '3h 30m', 18, 'Mudug Express Liner', 38);
INSERT INTO "routes" ("id", "service", "origin", "destination", "departure_time", "duration", "price", "vehicle_name", "seats_available") VALUES (10, 'Flight', 'Mogadishu', 'Hargeisa', '09:00 AM', '1h 45m', 120, 'TRAVEL SOM Boeing 737', 120);
INSERT INTO "routes" ("id", "service", "origin", "destination", "departure_time", "duration", "price", "vehicle_name", "seats_available") VALUES (11, 'Flight', 'Hargeisa', 'Mogadishu', '01:30 PM', '1h 45m', 120, 'TRAVEL SOM Boeing 737', 120);
INSERT INTO "routes" ("id", "service", "origin", "destination", "departure_time", "duration", "price", "vehicle_name", "seats_available") VALUES (12, 'Flight', 'Mogadishu', 'Garowe', '10:15 AM', '1h 30m', 110, 'TRAVEL SOM Embraer 190', 88);
INSERT INTO "routes" ("id", "service", "origin", "destination", "departure_time", "duration", "price", "vehicle_name", "seats_available") VALUES (13, 'Flight', 'Mogadishu', 'Bosaso', '08:00 AM', '2h 00m', 130, 'TRAVEL SOM Boeing 737', 120);
INSERT INTO "routes" ("id", "service", "origin", "destination", "departure_time", "duration", "price", "vehicle_name", "seats_available") VALUES (14, 'Flight', 'Mogadishu', 'Kismayo', '11:00 AM', '1h 15m', 95, 'TRAVEL SOM Embraer 190', 88);
INSERT INTO "routes" ("id", "service", "origin", "destination", "departure_time", "duration", "price", "vehicle_name", "seats_available") VALUES (15, 'Flight', 'Hargeisa', 'Garowe', '02:45 PM', '1h 10m', 90, 'TRAVEL SOM Dash-8', 50);
INSERT INTO "routes" ("id", "service", "origin", "destination", "departure_time", "duration", "price", "vehicle_name", "seats_available") VALUES (16, 'Taxi', 'Hargeisa', 'Berbera', 'Anytime', '2h 15m', 45, 'Toyota Noah / VIP Car', 6);
INSERT INTO "routes" ("id", "service", "origin", "destination", "departure_time", "duration", "price", "vehicle_name", "seats_available") VALUES (17, 'Taxi', 'Mogadishu', 'Baidoa', 'Anytime', '3h 45m', 70, 'Land Cruiser Prado', 4);
INSERT INTO "routes" ("id", "service", "origin", "destination", "departure_time", "duration", "price", "vehicle_name", "seats_available") VALUES (18, 'Taxi', 'Garowe', 'Bosaso', 'Anytime', '5h 00m', 90, 'Toyota Noah / Surf', 6);
INSERT INTO "routes" ("id", "service", "origin", "destination", "departure_time", "duration", "price", "vehicle_name", "seats_available") VALUES (19, 'Taxi', 'Hargeisa', 'Burao', 'Anytime', '2h 45m', 50, 'Executive Sedan / Van', 6);

-- -------------------------------------------------------
-- Jadwalka: customers
-- -------------------------------------------------------
DROP TABLE IF EXISTS "customers";
CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT DEFAULT '',
  created_at TEXT
);

INSERT INTO "customers" ("id", "name", "email", "phone", "created_at") VALUES (1, 'Axmed Cali Warsame', 'axmed.cali@gmail.com', '+252615551234', '2026-10-10T11:43:50.658Z');
INSERT INTO "customers" ("id", "name", "email", "phone", "created_at") VALUES (2, 'cabdilahi cawil cige', 'abdilaahicawil823@gmail.com', '', '2026-10-10T11:44:38.847Z');
INSERT INTO "customers" ("id", "name", "email", "phone", "created_at") VALUES (3, 'kayse cige', 'cigefilms58@gmail.com', '+2520637537706', '2026-10-10T11:52:24.612Z');

-- -------------------------------------------------------
-- Jadwalka: customer_sessions
-- -------------------------------------------------------
DROP TABLE IF EXISTS "customer_sessions";
CREATE TABLE customer_sessions (
  token_hash TEXT PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created REAL,
  last_seen REAL
);

INSERT INTO "customer_sessions" ("token_hash", "customer_id", "name", "email", "created", "last_seen") VALUES ('b82d5efbf312b84aaf38f2f1643cc3cad48d0e7ea31825518d8a9826d102064a', 1, 'Axmed Cali Warsame', 'axmed.cali@gmail.com', 1791632630664, 1791632630664);
INSERT INTO "customer_sessions" ("token_hash", "customer_id", "name", "email", "created", "last_seen") VALUES ('0ddb1f5d20a0f33c15a73dda97d67cc989b23497a91a2f7c13ab99c2af25d3a3', 2, 'cabdilahi cawil cige', 'abdilaahicawil823@gmail.com', 1791632678854, 1791632678877);
INSERT INTO "customer_sessions" ("token_hash", "customer_id", "name", "email", "created", "last_seen") VALUES ('3c04a85c20e9cd0468dada5c30e565e25a194ff602a6c91e10d4c579326e822d', 3, 'kayse cige', 'cigefilms58@gmail.com', 1791633144636, 1791641060774);

COMMIT;
PRAGMA foreign_keys = ON;
