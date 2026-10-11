/* ==========================================================================
   TRAVEL SOM — Client-side Web Application Logic
   Features: Dynamic Service Specs (Flight 1/day, Bus 24/7, Taxi On-Demand),
   Transit Route Cities Calculator, Interactive Seat Picker, Boarding Pass, Tracking
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- Somali Intercity Transit Route Matrix ---------- */
  var TRANSIT_DATA = {
    'mogadishu-baidoa': {
      stops: ['Afgooye', 'Wanlaweyn', 'Buurhakaba'],
      dist: '245 km',
      dur: '4h 30m',
      rest: 'Wanlaweyn (Nasashada Qadada & Salaadda)'
    },
    'mogadishu-kismayo': {
      stops: ['Afgooye', 'Marka', 'Baraawe', 'Jilib'],
      dist: '500 km',
      dur: '8h 00m',
      rest: 'Xeebta Baraawe & Jilib (Cunto & Nasasho)'
    },
    'mogadishu-beledweyne': {
      stops: ['Balcad', 'Jowhar', 'Buuloburde'],
      dist: '335 km',
      dur: '6h 30m',
      rest: 'Jowhar (Nasashada Wabiga Shabeelle)'
    },
    'mogadishu-galkayo': {
      stops: ['Balcad', 'Jowhar', 'Buuloburde', 'Beledweyne', 'Matabaan', 'Guriceel', 'Dhuusamareeb'],
      dist: '750 km',
      dur: '14h 00m',
      rest: 'Beledweyne & Dhuusamareeb (VIP Rest Stops)'
    },
    'mogadishu-garowe': {
      stops: ['Balcad', 'Jowhar', 'Beledweyne', 'Dhuusamareeb', 'Galkayo', 'Burtinle'],
      dist: '980 km',
      dur: '18h 00m',
      rest: 'Galkayo & Beledweyne'
    },
    'mogadishu-bosaso': {
      stops: ['Beledweyne', 'Dhuusamareeb', 'Galkayo', 'Garowe', 'Qardho'],
      dist: '1,430 km',
      dur: '26h 00m',
      rest: 'Galkayo, Garowe & Qardho'
    },
    'mogadishu-hargeisa': {
      stops: ['Beledweyne', 'Galkayo', 'Garowe', 'Laascaanood', 'Burco'],
      dist: '1,450 km',
      dur: '32h (Dhulka) / 1h 45m (Diyaarad)',
      rest: 'Garowe & Burco (Habeen dhax)'
    },
    'hargeisa-berbera': {
      stops: ['Abaarso', 'Dacarbudhug'],
      dist: '160 km',
      dur: '2h 30m',
      rest: 'Dacarbudhug (Shaah & Nasasho)'
    },
    'hargeisa-burao': {
      stops: ['Abaarso', 'Berbera', 'Sheekh'],
      dist: '310 km',
      dur: '4h 00m',
      rest: 'Buuraha Sheekh (Muuqaal qurux badan & Cunto)'
    },
    'hargeisa-garowe': {
      stops: ['Berbera', 'Sheekh', 'Burco', 'Caynabo', 'Laascaanood'],
      dist: '790 km',
      dur: '14h 00m',
      rest: 'Burco & Laascaanood'
    },
    'hargeisa-bosaso': {
      stops: ['Burco', 'Laascaanood', 'Garowe', 'Qardho'],
      dist: '1,240 km',
      dur: '22h 00m',
      rest: 'Garowe & Qardho'
    },
    'garowe-bosaso': {
      stops: ['Dangorayo', 'Qardho'],
      dist: '450 km',
      dur: '6h 00m',
      rest: 'Qardho (Cunto & Nasasho)'
    },
    'garowe-galkayo': {
      stops: ['Burtinle'],
      dist: '230 km',
      dur: '3h 30m',
      rest: 'Burtinle (Joogsi kooban)'
    },
    'bosaso-galkayo': {
      stops: ['Qardho', 'Dangorayo', 'Garowe', 'Burtinle'],
      dist: '680 km',
      dur: '9h 30m',
      rest: 'Garowe & Qardho'
    },
    'kismayo-baidoa': {
      stops: ['Jilib', 'Bu\'aale', 'Diinsoor'],
      dist: '390 km',
      dur: '7h 00m',
      rest: 'Diinsoor'
    },
    'beledweyne-galkayo': {
      stops: ['Matabaan', 'Guriceel', 'Dhuusamareeb'],
      dist: '415 km',
      dur: '7h 30m',
      rest: 'Dhuusamareeb'
    }
  };

  function getTransitInfo(from, to) {
    if (!from || !to || from === to) return null;
    var k1 = (from + '-' + to).toLowerCase();
    var k2 = (to + '-' + from).toLowerCase();

    if (TRANSIT_DATA[k1]) {
      return {
        stops: TRANSIT_DATA[k1].stops,
        count: TRANSIT_DATA[k1].stops.length,
        dist: TRANSIT_DATA[k1].dist,
        dur: TRANSIT_DATA[k1].dur,
        rest: TRANSIT_DATA[k1].rest
      };
    } else if (TRANSIT_DATA[k2]) {
      var rev = TRANSIT_DATA[k2].stops.slice().reverse();
      return {
        stops: rev,
        count: rev.length,
        dist: TRANSIT_DATA[k2].dist,
        dur: TRANSIT_DATA[k2].dur,
        rest: TRANSIT_DATA[k2].rest
      };
    } else {
      // Calculate realistic fallback stops between general regions
      var fallbackStops = ['Degmada Dhexe', 'Joogsiga 1-aad'];
      return {
        stops: fallbackStops,
        count: 2,
        dist: '~400 km',
        dur: '~6h',
        rest: 'Joogsi cunto iyo salaad'
      };
    }
  }

  /* ---------- Mobile hamburger menu ---------- */
  var menuBtn = document.getElementById('mb');
  var nav = document.getElementById('nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function () {
      nav.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  }

  /* ---------- Route Pricing Matrix ---------- */
  function calculateFare(service, origin, dest) {
    var key = (origin + '-' + dest).toLowerCase();

    if (service === 'Flight') {
      if (key.includes('mogadishu') && key.includes('hargeisa')) return 120;
      if (key.includes('mogadishu') && key.includes('bosaso')) return 130;
      if (key.includes('mogadishu') && key.includes('garowe')) return 110;
      if (key.includes('mogadishu') && key.includes('kismayo')) return 95;
      if (key.includes('hargeisa') && key.includes('garowe')) return 90;
      return 115;
    }

    if (service === 'Taxi') {
      if (key.includes('hargeisa') && key.includes('berbera')) return 45;
      if (key.includes('hargeisa') && key.includes('burao')) return 50;
      if (key.includes('mogadishu') && key.includes('baidoa')) return 70;
      if (key.includes('garowe') && key.includes('bosaso')) return 90;
      return 60;
    }

    // Bus fares
    if (key.includes('hargeisa') && key.includes('berbera')) return 12;
    if (key.includes('hargeisa') && key.includes('burao')) return 14;
    if (key.includes('mogadishu') && key.includes('baidoa')) return 15;
    if (key.includes('garowe') && key.includes('galkayo')) return 18;
    if (key.includes('garowe') && key.includes('bosaso')) return 25;
    if (key.includes('mogadishu') && key.includes('beledweyne')) return 25;
    if (key.includes('mogadishu') && key.includes('kismayo')) return 35;
    return 20;
  }

  /* ---------- Booking Form Elements ---------- */
  var bookingForm = document.getElementById('bf');
  var fromSel = document.getElementById('from');
  var toSel = document.getElementById('to');
  var dateInput = document.getElementById('date');
  var returnDateInput = document.getElementById('returnDate');
  var paxInput = document.getElementById('pax');
  var bookingMsg = document.getElementById('msg');
  var pSeatsInput = document.getElementById('pSeats');
  var selectedSeatLabel = document.getElementById('selectedSeatLabel');
  var btnOpenSeatPicker = document.getElementById('btnOpenSeatPicker');
  var serviceInfoBox = document.getElementById('serviceInfoBox');
  var busTransitBox = document.getElementById('busTransitBox');
  var pDepartTimeSel = document.getElementById('pDepartTime');

  // URL query parameter parsing (?service=Flight&city=Hargeisa)
  if (window.location.search) {
    try {
      var params = new URLSearchParams(window.location.search);
      var svcParam = params.get('service');
      var cityParam = params.get('city');
      var fromParam = params.get('from');

      if (svcParam) {
        var r = $('input[name="t"][value="' + svcParam + '"]');
        if (r) r.checked = true;
      }
      if (cityParam && toSel) {
        toSel.value = cityParam;
      }
      if (fromParam && fromSel) {
        fromSel.value = fromParam;
      }
    } catch (err) {}
  }

  /* ---------- Dynamic Service Info & Transit Stops Renderer ---------- */
  function updateServiceSpecAndTransit() {
    var checkedRadio = $('input[name="t"]:checked');
    var currentSvc = checkedRadio ? checkedRadio.value : 'Bus';
    var originVal = fromSel ? fromSel.value : 'Mogadishu';
    var destVal = toSel ? toSel.value : 'Hargeisa';

    // 1. Render Service Info Card
    if (serviceInfoBox) {
      if (currentSvc === 'Flight') {
        serviceInfoBox.className = 'service-spec-box flight';
        serviceInfoBox.innerHTML =
          '<div class="spec-header">' +
          '  <div class="spec-title">✈️ Macluumaadka Duulimaadka (Flight Details)</div>' +
          '  <span class="spec-badge flight-badge">1 Duulimaad / Maalin</span>' +
          '</div>' +
          '<div class="spec-grid">' +
          '  <div class="spec-item"><span class="icon">⚡</span><div class="txt"><b>Jadwalka Duulimaadka</b><span>Maalinkii 1 Duulimaad oo Qudha (09:30 AM)</span></div></div>' +
          '  <div class="spec-item"><span class="icon">🧳</span><div class="txt"><b>Miisaanka Shandadaha</b><span>20 kg weyn + 7 kg boorsada gacanta ah (Free)</span></div></div>' +
          '  <div class="spec-item"><span class="icon">🛂</span><div class="txt"><b>Xeerarka Garoonka</b><span>Kaalay 2 saac ka hor; Gate closes 45 min ka hor; ID/Passport</span></div></div>' +
          '  <div class="spec-item"><span class="icon">🎫</span><div class="txt"><b>Tikidhka & Cuntada</b><span>E-Ticket dijitaal ah + Cabitaanno duulimaadka dhexdiisa</span></div></div>' +
          '</div>';
      } else if (currentSvc === 'Bus') {
        serviceInfoBox.className = 'service-spec-box bus';
        serviceInfoBox.innerHTML =
          '<div class="spec-header">' +
          '  <div class="spec-title">🚌 Macluumaadka Baska (Bus Details)</div>' +
          '  <span class="spec-badge bus-badge">24-ka Saac Joogto</span>' +
          '</div>' +
          '<div class="spec-grid">' +
          '  <div class="spec-item"><span class="icon">⏰</span><div class="txt"><b>Jadwalka 24-ka Saac</b><span>Basasku waxay baxaan 24-ka saacadood (Subax, Duhur, Habeen)</span></div></div>' +
          '  <div class="spec-item"><span class="icon">🛣️</span><div class="txt"><b>Sii-maridda Magaalooyinka</b><span>Waxaa laguu sheegayaa inta magaalo ee aad sii mari doontaan</span></div></div>' +
          '  <div class="spec-item"><span class="icon">💺</span><div class="txt"><b>Raaxada Baska</b><span>AC buuxa, Kuraas jiif ah, Wi-Fi bilaash ah, USB charging</span></div></div>' +
          '  <div class="spec-item"><span class="icon">🧳</span><div class="txt"><b>Boorsooyinka</b><span>1 Boorso weyn (25 kg) + 1 boorso yar oo bilaash ah</span></div></div>' +
          '</div>';
      } else {
        serviceInfoBox.className = 'service-spec-box taxi';
        serviceInfoBox.innerHTML =
          '<div class="spec-header">' +
          '  <div class="spec-title">🚕 Macluumaadka Taksiga Gaarka Ah (Private VIP Taxi)</div>' +
          '  <span class="spec-badge taxi-badge">24/7 On-Demand</span>' +
          '</div>' +
          '<div class="spec-grid">' +
          '  <div class="spec-item"><span class="icon">🚀</span><div class="txt"><b>Baxitaan Degdeg Ah 24/7</b><span>Ma sugaysid jadwal; adigaa dooranaya saacadda aad baxayso</span></div></div>' +
          '  <div class="spec-item"><span class="icon">🚪</span><div class="txt"><b>Albaab-ilaa-Albaab</b><span>Gurigaaga, hoteelkaaga ama garoonka lagugu imaanayo</span></div></div>' +
          '  <div class="spec-item"><span class="icon">👥</span><div class="txt"><b>Awoodda Gaariga</b><span>1 ilaa 6 qof gaari VIP ah (Toyota Noah / Land Cruiser Prado)</span></div></div>' +
          '  <div class="spec-item"><span class="icon">❄️</span><div class="txt"><b>Raaxo & Xawaare</b><span>AC kuu gaar ah, xawaare toos ah, meeshii aad rabto ku joogso</span></div></div>' +
          '</div>';
      }
    }

    // 2. Render Departure Schedule Select options
    if (pDepartTimeSel) {
      var previousVal = pDepartTimeSel.value;
      pDepartTimeSel.innerHTML = '';
      if (currentSvc === 'Flight') {
        pDepartTimeSel.innerHTML =
          '<option value="09:30 AM (Duulimaadka Maalinta - Hal Duulimaad Maalinkii)">09:30 AM — Duulimaadka Maalinta (Hal Duulimaad Maalinkii / 1 Flight Daily)</option>';
      } else if (currentSvc === 'Bus') {
        pDepartTimeSel.innerHTML =
          '<option value="06:00 AM (Subax Hore - Morning Express)">🌅 06:00 AM — Subax Hore (Morning Express - 24h Schedule)</option>' +
          '<option value="12:30 PM (Duhur - Midday Departure)">☀️ 12:30 PM — Duhurnimo (Midday Departure - 24h Schedule)</option>' +
          '<option value="05:00 PM (Galab - Sunset Express)">🌇 05:00 PM — Galabnimo (Sunset Express - 24h Schedule)</option>' +
          '<option value="10:00 PM (Habeen - VIP Sleeper)">🌙 10:00 PM — Habeenimo (VIP Overnight Sleeper - 24h Schedule)</option>';
      } else {
        pDepartTimeSel.innerHTML =
          '<option value="Anytime (Waqtiga Aad Rabto - 24/7 On-Demand)">⚡ Anytime — Waqtiga aad rabto bax (24/7 Instant On-Demand)</option>' +
          '<option value="07:00 AM (Subax)">🌅 07:00 AM — Subaxnimo</option>' +
          '<option value="01:30 PM (Duhur)">☀️ 01:30 PM — Duhurnimo</option>' +
          '<option value="06:00 PM (Galab)">🌇 06:00 PM — Galabnimo</option>' +
          '<option value="11:00 PM (Habeen)">🌙 11:00 PM — Habeennimo</option>';
      }
      if (previousVal) {
        var opt = pDepartTimeSel.querySelector('option[value="' + previousVal + '"]');
        if (opt) opt.selected = true;
      }
    }

    // 3. Render Bus Transit Route Cities Box
    if (busTransitBox) {
      if (currentSvc === 'Bus' && originVal && destVal && originVal !== destVal) {
        var transitInfo = getTransitInfo(originVal, destVal);
        if (transitInfo) {
          busTransitBox.style.display = 'block';

          var timelineHtml = '<span class="transit-stop-pill origin-pill">🛫 ' + originVal + ' (Bixitaan)</span>';
          transitInfo.stops.forEach(function (stop) {
            timelineHtml += '<span class="transit-arrow">➔</span><span class="transit-stop-pill">📍 ' + stop + '</span>';
          });
          timelineHtml += '<span class="transit-arrow">➔</span><span class="transit-stop-pill dest-pill">🏁 ' + destVal + ' (Tagid)</span>';

          busTransitBox.innerHTML =
            '<div class="transit-header">' +
            '  <h4>🛣️ Magaalooyinka Safarka Baska Laga Sii Marayo</h4>' +
            '  <span class="stop-count-badge">Waxay sii mari doontaa ' + transitInfo.count + ' magaalo</span>' +
            '</div>' +
            '<div class="transit-timeline">' + timelineHtml + '</div>' +
            '<div class="transit-meta">' +
            '  <span>📏 <b>Masaafada:</b> ' + transitInfo.dist + '</span>' +
            '  <span>⏱️ <b>Waqtiga:</b> ' + transitInfo.dur + '</span>' +
            '  <span>🍽️ <b>Nasashada & Cuntada:</b> ' + transitInfo.rest + '</span>' +
            '</div>';
        } else {
          busTransitBox.style.display = 'none';
        }
      } else {
        busTransitBox.style.display = 'none';
      }
    }
  }

  // Update live trip summary card on booking.html
  function updateBookingSummary() {
    var sumSvc = document.getElementById('sum-service');
    var sumRoute = document.getElementById('sum-route');
    var sumDate = document.getElementById('sum-date');
    var sumTime = document.getElementById('sum-time');
    var sumTransit = document.getElementById('sum-transit');
    var sumPax = document.getElementById('sum-pax');
    var sumPrice = document.getElementById('sum-price');
    var sumSeats = document.getElementById('sum-seats');
    var sumPayment = document.getElementById('sum-payment');

    var checkedRadio = $('input[name="t"]:checked');
    var currentSvc = checkedRadio ? checkedRadio.value : 'Bus';

    var originVal = fromSel ? fromSel.value : 'Mogadishu';
    var destVal = toSel ? toSel.value : 'Hargeisa';
    var paxVal = paxInput ? parseInt(paxInput.value, 10) || 1 : 1;

    var unitFare = calculateFare(currentSvc, originVal, destVal);
    var totalFare = unitFare * paxVal;

    if (sumSvc) sumSvc.textContent = currentSvc;
    if (sumRoute && fromSel && toSel) {
      sumRoute.textContent = originVal + ' \u2192 ' + destVal;
    }
    if (sumDate && dateInput) {
      sumDate.textContent = dateInput.value || 'Gali taariikh';
    }
    if (sumTime && pDepartTimeSel) {
      sumTime.textContent = pDepartTimeSel.value ? pDepartTimeSel.value.split('—')[0].trim() : '06:00 AM';
    }
    if (sumTransit) {
      if (currentSvc === 'Bus') {
        var tr = getTransitInfo(originVal, destVal);
        sumTransit.textContent = tr ? tr.count + ' Magaalo (' + tr.stops.slice(0, 3).join(', ') + (tr.stops.length > 3 ? '...' : '') + ')' : 'Toos Ah (Direct)';
      } else if (currentSvc === 'Flight') {
        sumTransit.textContent = 'Duulimaad Toos Ah (Direct 1/Day)';
      } else {
        sumTransit.textContent = 'Albaab-ilaa-Albaab (Door to Door)';
      }
    }
    if (sumPax) {
      sumPax.textContent = paxVal + ' Rakaab (' + paxVal + ' Pax)';
    }
    if (sumPrice) {
      sumPrice.textContent = '$' + totalFare.toFixed(2) + ' USD';
    }
    if (sumSeats) {
      sumSeats.textContent = (pSeatsInput && pSeatsInput.value) ? pSeatsInput.value : 'Auto Assigned';
    }
    if (sumPayment) {
      var checkedPay = $('input[name="payMethod"]:checked');
      sumPayment.textContent = checkedPay ? checkedPay.value : 'EVC Plus';
    }

    updateServiceSpecAndTransit();
  }

  // Listen for changes to update summary
  if (bookingForm) {
    $$('input[name="t"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        updateServiceSpecAndTransit();
        updateBookingSummary();
      });
    });
    $$('input[name="payMethod"]').forEach(function (radio) {
      radio.addEventListener('change', updateBookingSummary);
    });
    if (fromSel) fromSel.addEventListener('change', function () {
      updateServiceSpecAndTransit();
      updateBookingSummary();
    });
    if (toSel) toSel.addEventListener('change', function () {
      updateServiceSpecAndTransit();
      updateBookingSummary();
    });
    if (dateInput) dateInput.addEventListener('change', updateBookingSummary);
    if (pDepartTimeSel) pDepartTimeSel.addEventListener('change', updateBookingSummary);
    if (paxInput) paxInput.addEventListener('input', updateBookingSummary);

    updateServiceSpecAndTransit();
    updateBookingSummary();
  }

  // Route pills click handler
  $$('[data-route-from]').forEach(function (pill) {
    pill.addEventListener('click', function () {
      if (fromSel) fromSel.value = pill.dataset.routeFrom;
      if (toSel) toSel.value = pill.dataset.routeTo;
      if (pill.dataset.routeService) {
        var r = $('input[name="t"][value="' + pill.dataset.routeService + '"]');
        if (r) r.checked = true;
      }
      updateServiceSpecAndTransit();
      updateBookingSummary();
      if (bookingForm) {
        bookingForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Service buttons
  $$('[data-t]').forEach(function (a) {
    a.addEventListener('click', function () {
      var radio = $('input[name="t"][value="' + a.dataset.t + '"]');
      if (radio) {
        radio.checked = true;
        updateServiceSpecAndTransit();
        updateBookingSummary();
      }
    });
  });

  // City buttons
  $$('[data-c]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (toSel) {
        toSel.value = a.dataset.c;
        updateServiceSpecAndTransit();
        updateBookingSummary();
      }
    });
  });

  // No past dates
  var today = new Date().toISOString().slice(0, 10);
  if (dateInput) dateInput.min = today;
  if (returnDateInput) returnDateInput.min = today;

  /* ---------- Interactive Seat Selector Modal ---------- */
  if (btnOpenSeatPicker) {
    btnOpenSeatPicker.addEventListener('click', function () {
      var checkedRadio = $('input[name="t"]:checked');
      var currentSvc = checkedRadio ? checkedRadio.value : 'Bus';
      var paxCount = paxInput ? parseInt(paxInput.value, 10) || 1 : 1;
      var selected = [];
      if (pSeatsInput && pSeatsInput.value) {
        selected = pSeatsInput.value.split(',').map(function (s) { return s.trim(); });
      }

      var modal = document.createElement('div');
      modal.className = 'seat-picker-modal';

      var totalSeats = currentSvc === 'Flight' ? 32 : (currentSvc === 'Taxi' ? 6 : 28);
      var seatHtml = '';

      for (var i = 1; i <= totalSeats; i++) {
        var seatNum = (i < 10 ? '0' : '') + i;
        if (currentSvc === 'Flight') {
          var row = Math.ceil(i / 4);
          var colLetter = ['A', 'B', 'C', 'D'][(i - 1) % 4];
          seatNum = row + colLetter;
        }
        var isTaken = (i === 3 || i === 7 || i === 14);
        var isSel = selected.indexOf(seatNum) !== -1;
        seatHtml += '<button type="button" class="seat-btn ' + (isSel ? 'selected' : '') + '" ' +
                    (isTaken ? 'disabled title="Kursigan waa la qaatay"' : 'data-seat="' + seatNum + '"') + '>' +
                    seatNum + '</button>';
      }

      modal.innerHTML =
        '<div class="seat-picker-card">' +
        '  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
        '    <h3 style="margin:0;font-size:20px;color:var(--navy);">Dooro Kursiga (' + currentSvc + ')</h3>' +
        '    <button type="button" id="closeSeatModal" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--mut);">&times;</button>' +
        '  </div>' +
        '  <p style="font-size:13px;color:var(--mut);margin:0 0 14px;">Dooro ilaa <b>' + paxCount + '</b> kursi oo safarkaaga ah.</p>' +
        '  <div class="seat-legend">' +
        '    <div class="legend-item"><div class="legend-dot available"></div> Bannaan</div>' +
        '    <div class="legend-item"><div class="legend-dot selected"></div> La Doortay</div>' +
        '    <div class="legend-item"><div class="legend-dot taken"></div> La Qaatay</div>' +
        '  </div>' +
        '  <div class="seat-map-grid" style="' + (currentSvc === 'Taxi' ? 'grid-template-columns:repeat(3,1fr);' : '') + '">' + seatHtml + '</div>' +
        '  <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:20px;">' +
        '    <button type="button" class="btn g sm" id="cancelSeatBtn">Ka Noqo</button>' +
        '    <button type="button" class="btn p sm" id="confirmSeatBtn">Xaqiiji Kuraasta (' + selected.length + '/' + paxCount + ')</button>' +
        '  </div>' +
        '</div>';

      document.body.appendChild(modal);

      var seatBtns = modal.querySelectorAll('.seat-btn:not([disabled])');
      var confirmBtn = modal.querySelector('#confirmSeatBtn');

      seatBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var sNum = btn.dataset.seat;
          var idx = selected.indexOf(sNum);
          if (idx !== -1) {
            selected.splice(idx, 1);
            btn.classList.remove('selected');
          } else {
            if (selected.length < paxCount) {
              selected.push(sNum);
              btn.classList.add('selected');
            } else if (paxCount === 1) {
              selected = [sNum];
              seatBtns.forEach(function (b) { b.classList.remove('selected'); });
              btn.classList.add('selected');
            } else {
              alert('Waxaad dooran kartaa kaliya ' + paxCount + ' kursi.');
            }
          }
          confirmBtn.textContent = 'Xaqiiji Kuraasta (' + selected.length + '/' + paxCount + ')';
        });
      });

      function closeModal() {
        if (modal.parentNode) modal.parentNode.removeChild(modal);
      }

      modal.querySelector('#closeSeatModal').addEventListener('click', closeModal);
      modal.querySelector('#cancelSeatBtn').addEventListener('click', closeModal);
      modal.querySelector('#confirmSeatBtn').addEventListener('click', function () {
        if (selected.length > 0) {
          pSeatsInput.value = selected.join(', ');
          if (selectedSeatLabel) selectedSeatLabel.textContent = selected.join(', ');
        } else {
          pSeatsInput.value = '';
          if (selectedSeatLabel) selectedSeatLabel.textContent = 'Auto Assigned';
        }
        updateBookingSummary();
        closeModal();
      });
    });
  }

  /* ---------- Boarding Pass Ticket Renderer ---------- */
  function createBoardingPassHtml(b) {
    var svcIcon = b.service === 'Flight' ? '✈️' : (b.service === 'Taxi' ? '🚕' : '🚌');
    var statusCls = b.status || 'pending';
    var statusTxt = statusCls === 'confirmed' ? 'Xaqiijiyey (Confirmed)' :
                   (statusCls === 'completed' ? 'Dhameystirmay (Completed)' :
                   (statusCls === 'cancelled' ? 'La Kansalay (Cancelled)' : 'Sugaya (Pending Verification)'));

    var scheduleDisplay = b.departure_time || (b.service === 'Flight' ? '09:30 AM (1 Duulimaad Maalinkii)' : (b.service === 'Taxi' ? '24/7 On-Demand' : '06:00 AM (24-ka Saac)'));
    var transitDisplay = b.transit_stops ? b.transit_stops : (b.service === 'Bus' ? 'Magaalooyinka gobolka' : (b.service === 'Flight' ? 'Toos Ah (Direct Flight)' : 'Albaab-ilaa-Albaab'));

    return '' +
      '<div class="boarding-pass-wrap" id="ticketCard-' + b.ref + '">' +
      '  <div class="boarding-pass">' +
      '    <div class="pass-header">' +
      '      <div class="pass-brand"><i>✈</i>TRAVEL <b>SOM</b></div>' +
      '      <span class="pass-badge ' + statusCls + '">' + statusTxt + '</span>' +
      '    </div>' +
      '    <div class="pass-route-strip">' +
      '      <div class="route-point">' +
      '        <div class="city">' + b.origin + '</div>' +
      '        <div class="lbl">Ka Bixitaanka (Origin)</div>' +
      '      </div>' +
      '      <div class="route-path">' +
      '        <div class="service-pill">' + svcIcon + ' ' + b.service + '</div>' +
      '        <div class="arrow-line"></div>' +
      '      </div>' +
      '      <div class="route-point" style="text-align:right;">' +
      '        <div class="city">' + b.destination + '</div>' +
      '        <div class="lbl">U Socodka (Destination)</div>' +
      '      </div>' +
      '    </div>' +
      '    <div class="pass-body">' +
      '      <div class="pass-cell">' +
      '        <span class="label">Reference ID</span>' +
      '        <span class="val highlight">' + b.ref + '</span>' +
      '      </div>' +
      '      <div class="pass-cell">' +
      '        <span class="label">Macaamiilka</span>' +
      '        <span class="val">' + b.name + '</span>' +
      '      </div>' +
      '      <div class="pass-cell">' +
      '        <span class="label">Telefoonka</span>' +
      '        <span class="val">' + b.phone + '</span>' +
      '      </div>' +
      '      <div class="pass-cell">' +
      '        <span class="label">Taariikhda Safarka</span>' +
      '        <span class="val">' + b.travel_date + '</span>' +
      '      </div>' +
      '      <div class="pass-cell">' +
      '        <span class="label">Saacadda Bixitaanka</span>' +
      '        <span class="val" style="color:var(--navy);font-weight:800;">' + scheduleDisplay + '</span>' +
      '      </div>' +
      '      <div class="pass-cell">' +
      '        <span class="label">Sii-maridda / Xeerka</span>' +
      '        <span class="val" style="font-size:13px;">' + transitDisplay + '</span>' +
      '      </div>' +
      '      <div class="pass-cell">' +
      '        <span class="label">Kursiga (Seat)</span>' +
      '        <span class="val">' + (b.seats || 'Auto Assigned') + '</span>' +
      '      </div>' +
      '      <div class="pass-cell">' +
      '        <span class="label">Rakaabka</span>' +
      '        <span class="val">' + b.passengers + ' qof</span>' +
      '      </div>' +
      '      <div class="pass-cell">' +
      '        <span class="label">Qiimaha Safarka</span>' +
      '        <span class="val" style="color:var(--navy);font-size:17px;">$' + (b.price_total ? Number(b.price_total).toFixed(2) : '15.00') + ' USD</span>' +
      '      </div>' +
      '      <div class="pass-cell">' +
      '        <span class="label">Lacag Bixinta</span>' +
      '        <span class="val">' + (b.payment_method || 'EVC Plus') + '</span>' +
      '      </div>' +
      '    </div>' +
      '    <div class="pass-footer">' +
      '      <div class="pass-barcode-area">' +
      '        <div class="barcode-svg" title="Barcode: ' + b.ref + '"></div>' +
      '        <div style="font-size:12px;color:#64748b;"><b>' + b.ref + '</b><br>TRAVEL SOM Official Ticket</div>' +
      '      </div>' +
      '      <div class="pass-actions">' +
      '        <button type="button" class="btn p sm" onclick="window.print()">🖨️ Daabaco Tikidhka (Print)</button>' +
      '        <a href="track.html?ref=' + encodeURIComponent(b.ref) + '" class="btn g sm">📍 Raadi Tikidhka</a>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '</div>';
  }

  /* ---------- Real Booking Submission (/api/bookings) ---------- */
  if (bookingForm) {
    bookingForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var checkedRadio = $('input[name="t"]:checked');
      var type = checkedRadio ? checkedRadio.value : 'Bus';

      if (fromSel && toSel && fromSel.value === toSel.value) {
        bookingMsg.innerHTML = '<div style="color:#ef4444;background:#fee2e2;padding:12px 16px;border-radius:12px;margin-top:14px;font-weight:600;">⚠️ Fadlan dooro laba magaalo oo kala duwan (Please choose two different cities).</div>';
        return;
      }

      var nameVal = $('#pName') ? $('#pName').value.trim() : '';
      var phoneVal = $('#pPhone') ? $('#pPhone').value.trim() : '';
      var emailVal = $('#pEmail') ? $('#pEmail').value.trim() : '';
      var notesVal = $('#pNotes') ? $('#pNotes').value.trim() : '';
      var paxVal = paxInput ? parseInt(paxInput.value, 10) || 1 : 1;
      var travelDateVal = dateInput ? dateInput.value : '';
      var returnDateVal = returnDateInput ? returnDateInput.value : '';
      var seatsVal = (pSeatsInput && pSeatsInput.value) ? pSeatsInput.value : '';
      var checkedPay = $('input[name="payMethod"]:checked');
      var payVal = checkedPay ? checkedPay.value : 'EVC Plus';
      var departTimeVal = pDepartTimeSel ? pDepartTimeSel.value : '06:00 AM';

      var transitInfo = getTransitInfo(fromSel ? fromSel.value : '', toSel ? toSel.value : '');
      var transitStopsVal = '';
      if (type === 'Bus' && transitInfo) {
        transitStopsVal = transitInfo.stops.join(' ➔ ') + ' (' + transitInfo.count + ' Magaalo)';
      } else if (type === 'Flight') {
        transitStopsVal = 'Direct Flight (1/Day)';
      } else {
        transitStopsVal = 'Door-to-Door Private';
      }

      var totalFare = calculateFare(type, fromSel ? fromSel.value : '', toSel ? toSel.value : '') * paxVal;

      var submitBtn = bookingForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Fadlan sug, dalabkaaga waa la dirayaa...';
      }

      var payload = {
        service: type,
        origin: fromSel ? fromSel.value : '',
        destination: toSel ? toSel.value : '',
        travelDate: travelDateVal,
        departureTime: departTimeVal,
        transitStops: transitStopsVal,
        returnDate: returnDateVal,
        passengers: paxVal,
        seats: seatsVal,
        priceTotal: totalFare,
        name: nameVal,
        phone: phoneVal,
        email: emailVal,
        paymentMethod: payVal,
        notes: notesVal
      };

      fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.error || 'Khalad ayaa dhacay.');
          return data;
        });
      })
      .then(function (data) {
        var b = data.booking;
        bookingMsg.innerHTML =
          '<div style="background:#ecfdf5;border:1.5px solid #10b981;border-radius:20px;padding:24px;margin-top:20px;">' +
          '  <h3 style="margin:0 0 8px;color:#047857;font-size:22px;">🎉 Hambalyo! Dalabkaaga Waa La Guddoomay!</h3>' +
          '  <p style="margin:0 0 16px;color:#065f46;font-size:15px;">Lambarkaaga dalabka waa <b>' + b.ref + '</b>. Hoos ka daabaco tikidhkaaga ama ku baaro bogga Raadi Tikidhka.</p>' +
          createBoardingPassHtml(b) +
          '</div>';

        bookingMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      })
      .catch(function (err) {
        bookingMsg.innerHTML = '<div style="color:#ef4444;background:#fee2e2;padding:14px;border-radius:12px;margin-top:14px;font-weight:600;">⚠️ ' + err.message + '</div>';
        bookingMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Xaqiiji oo Dalbo Safarka (Confirm & Book Now) →';
        }
      });
    });
  }

  /* ---------- Contact form (/api/messages) ---------- */
  var contactForm = document.getElementById('cf');
  var contactMsg = document.getElementById('cm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var senderName = $('#cName') ? $('#cName').value : 'Macaamiil';
      var senderPhone = $('#cPhone') ? $('#cPhone').value : '';
      var senderEmail = $('#cEmail') ? $('#cEmail').value : '';
      var senderMsg = $('#cMessage') ? $('#cMessage').value : '';

      var submitBtn = contactForm.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Fadlan sug...'; }

      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: senderName,
          phone: senderPhone,
          email: senderEmail,
          message: senderMsg
        })
      })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.error || 'Fariinta lama diri karin.');
          return data;
        });
      })
      .then(function () {
        contactMsg.innerHTML = '<div style="background:rgba(255,138,31,.15);border:1.5px solid var(--sun);border-radius:16px;padding:16px;margin-top:14px;">' +
          '<h4 style="margin:0 0 6px;color:var(--sun);">✅ Waad ku mahadsan tahay, ' + senderName + '!</h4>' +
          '<p style="margin:0;font-size:14px;">Fariintaada si nabad ah ayaanu ku helnay oo database-ka ku kaydsantahay. Kooxdayada daryeelka macaamiisha waxay kula soo xiriiri doontaa sida ugu dhakhsaha badan.</p>' +
          '</div>';
        contactForm.reset();
        contactMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      })
      .catch(function (err) {
        contactMsg.innerHTML = '<div style="color:#ef4444;background:#fee2e2;padding:14px;border-radius:12px;margin-top:14px;">⚠️ ' + err.message + '</div>';
      })
      .finally(function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Soo Dir Fariinta →'; }
      });
    });
  }

  /* ---------- Ticket Tracking Logic (/api/bookings/track) ---------- */
  window.performTracking = function (ref, phone, autoPrint) {
    var resultArea = document.getElementById('trackResult');
    var btn = document.getElementById('trackSubmitBtn');
    if (!resultArea) return;

    if (btn) btn.disabled = true;
    resultArea.innerHTML = '<div style="text-align:center;padding:32px;color:var(--mut);">🔍 Fadlan sug, xogta tikidhkaaga ayaa la baarayaa...</div>';

    var queryUrl = '/api/bookings/track?' + (ref ? 'ref=' + encodeURIComponent(ref) : 'phone=' + encodeURIComponent(phone));

    fetch(queryUrl)
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.error || 'Lama helin dalab u dhigma.');
          return data;
        });
      })
      .then(function (data) {
        resultArea.innerHTML = createBoardingPassHtml(data.booking);
        if (autoPrint) {
          setTimeout(function () { window.print(); }, 400);
        }
      })
      .catch(function (err) {
        resultArea.innerHTML =
          '<div style="background:#fee2e2;border:1.5px solid #ef4444;border-radius:18px;padding:22px;color:#991b1b;max-width:760px;margin:0 auto;text-align:center;">' +
          '  <h3 style="margin:0 0 6px;">❌ Dalabkan Lama Helin</h3>' +
          '  <p style="margin:0 0 14px;font-size:14px;">' + err.message + '</p>' +
          '  <a href="booking.html" class="btn p sm">Dalbo Safar Cusub (Book Now)</a>' +
          '</div>';
      })
      .finally(function () {
        if (btn) btn.disabled = false;
      });
  };

  var trackForm = document.getElementById('trackForm');
  if (trackForm) {
    trackForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = ($('#trackQuery') ? $('#trackQuery').value : '').trim();
      if (!q) return;
      window.performTracking(q, q, false);
    });
  }

  /* ---------- Hero slideshow ---------- */
  var box = document.getElementById('slides');
  if (box) {
    var slides = $$('img', box);
    var dots = $$('.dots button', box);
    var current = 0;
    var timer = null;
    var DELAY = 4800;

    var show = function (n) {
      if (!slides.length) return;
      slides[current].classList.remove('on');
      if (dots[current]) dots[current].classList.remove('on');
      current = n % slides.length;
      slides[current].classList.add('on');
      if (dots[current]) dots[current].classList.add('on');
    };

    var start = function () {
      clearInterval(timer);
      var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (slides.length > 1 && !reduce) {
        timer = setInterval(function () { show(current + 1); }, DELAY);
      }
    };

    dots.forEach(function (d, i) {
      d.addEventListener('click', function () { show(i); start(); });
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearInterval(timer); else start();
    });

    start();
  }

  /* ---------- Scroll reveal animation ---------- */
  var revealItems = $$('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach(function (el) { io.observe(el); });
  } else {
    revealItems.forEach(function (el) { el.classList.add('in'); });
  }

  /* ==========================================================================
     Customer Authentication & Portal System (Macaamiisha)
     Login & Register with Name and Email
     ========================================================================== */
  var customerAuth = {
    current: null,

    init: function () {
      this.checkSession();
    },

    checkSession: function () {
      var self = this;
      fetch('/api/customer/session')
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.authenticated && d.customer) {
            self.current = d.customer;
            self.renderHeader(true);
            self.autoFillForms(d.customer);
          } else {
            self.current = null;
            self.renderHeader(false);
          }
        })
        .catch(function () {
          self.renderHeader(false);
        });
    },

    renderHeader: function (isLoggedIn) {
      var mounts = [$('#custAuthMount'), $('#custAuthMountMob')];
      var self = this;

      mounts.forEach(function (mount) {
        if (!mount) return;
        mount.innerHTML = '';

        if (isLoggedIn && self.current) {
          var pill = document.createElement('button');
          pill.type = 'button';
          pill.className = 'cust-pill';
          pill.innerHTML = '<span class="avatar">👤</span> <span>' + self.escapeHtml(self.current.name.split(' ')[0]) + '</span> <span class="dot"></span>';
          pill.title = 'Akoonkaaga: ' + self.current.name;
          pill.addEventListener('click', function () {
            self.openProfileDrawer();
          });
          mount.appendChild(pill);
        } else {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn-cust-login';
          btn.innerHTML = '<span>👤</span> <span>Gal / Is-diiwaangeli</span>';
          btn.addEventListener('click', function () {
            self.openLoginModal();
          });
          mount.appendChild(btn);
        }
      });
    },

    openLoginModal: function () {
      var self = this;
      var existing = $('#custAuthModal');
      if (existing) existing.remove();

      var backdrop = document.createElement('div');
      backdrop.id = 'custAuthModal';
      backdrop.className = 'cust-modal-backdrop';

      backdrop.innerHTML = [
        '<div class="cust-modal-card">',
        '  <button type="button" class="cust-modal-close" id="closeCustModalBtn">✕</button>',
        '  <div class="cust-modal-header">',
        '    <span class="cust-modal-badge">AKOONKA MACMIILKA</span>',
        '    <h2>Gal ama Is-diiwaangeli</h2>',
        '    <p>Gali magacaaga iyo email-kaaga si aad u maamusho dalabaadkaaga una hesho tikidhadaada.</p>',
        '  </div>',
        '  <form id="custLoginForm">',
        '    <div class="cust-fld">',
        '      <label for="cName">Magacaaga oo buuxa (Full Name)</label>',
        '      <input type="text" id="cName" placeholder="Tusaale: Axmed Cali Warsame" required autocomplete="name">',
        '    </div>',
        '    <div class="cust-fld">',
        '      <label for="cEmail">Email-kaaga (Email Address)</label>',
        '      <input type="email" id="cEmail" placeholder="Tusaale: axmed@gmail.com" required autocomplete="email">',
        '    </div>',
        '    <div class="cust-fld">',
        '      <label for="cPhone">Taleefankaaga (Phone - ikhtiyaari)</label>',
        '      <input type="tel" id="cPhone" placeholder="Tusaale: +252 61 555 1234" autocomplete="tel">',
        '    </div>',
        '    <div id="custLoginErr" style="color: #dc2626; font-size: 13px; font-weight: 700; margin-bottom: 12px; min-height: 1px;"></div>',
        '    <button type="submit" class="cust-modal-btn" id="custSubmitBtn">🚀 Gal / Is-diiwaangeli (Continue)</button>',
        '    <p class="cust-modal-note">🔒 Uma baahnid password adag! Nidaamku wuxuu xafidayaa dalabaadkaaga adoo isticmaalaya magacaaga iyo email-kaaga.</p>',
        '  </form>',
        '</div>'
      ].join('\n');

      document.body.appendChild(backdrop);

      var closeBtn = $('#closeCustModalBtn', backdrop);
      var form = $('#custLoginForm', backdrop);
      var errBox = $('#custLoginErr', backdrop);
      var submitBtn = $('#custSubmitBtn', backdrop);

      function close() {
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      }

      closeBtn.addEventListener('click', close);
      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) close();
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        errBox.textContent = '';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Fadlan sug...';

        var nameVal = $('#cName', form).value.trim();
        var emailVal = $('#cEmail', form).value.trim();
        var phoneVal = $('#cPhone', form).value.trim();

        fetch('/api/customer/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: nameVal, email: emailVal, phone: phoneVal })
        })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            submitBtn.disabled = false;
            submitBtn.textContent = '🚀 Gal / Is-diiwaangeli (Continue)';

            if (!data.ok) {
              errBox.textContent = data.error || 'Khalad ayaa dhacay. Fadlan isku day mar kale.';
              return;
            }

            self.current = data.customer;
            self.renderHeader(true);
            self.autoFillForms(data.customer);
            close();
            self.showToast('Ku soo dhowow TRAVEL SOM, ' + data.customer.name + '!');
          })
          .catch(function (err) {
            submitBtn.disabled = false;
            submitBtn.textContent = '🚀 Gal / Is-diiwaangeli (Continue)';
            errBox.textContent = err.message || 'Xiriirka server-ka ayaa go\'ay.';
          });
      });
    },

    openProfileDrawer: function () {
      var self = this;
      if (!this.current) return;

      var existing = $('#custProfileModal');
      if (existing) existing.remove();

      var backdrop = document.createElement('div');
      backdrop.id = 'custProfileModal';
      backdrop.className = 'cust-modal-backdrop';

      backdrop.innerHTML = [
        '<div class="cust-modal-card" style="max-width: 540px;">',
        '  <button type="button" class="cust-modal-close" id="closeCustProfileBtn">✕</button>',
        '  <div class="cust-profile-card">',
        '    <div class="cust-profile-avatar">👤</div>',
        '    <div class="cust-profile-info">',
        '      <b>' + self.escapeHtml(self.current.name) + '</b>',
        '      <span>' + self.escapeHtml(self.current.email) + (self.current.phone ? ' · ' + self.escapeHtml(self.current.phone) : '') + '</span>',
        '    </div>',
        '  </div>',
        '  <div class="cust-bookings-title">',
        '    <h3>Tikidhada & Dalabaadkaaga</h3>',
        '    <span id="custBookingCount" class="badge">0 Safar</span>',
        '  </div>',
        '  <div id="custBookingsList" style="max-height: 280px; overflow-y: auto;">',
        '    <div style="text-align: center; padding: 24px; color: var(--mut);">Fadlan sug, dalabaadkaaga ayaa la soo rarayaa...</div>',
        '  </div>',
        '  <div class="cust-drawer-actions">',
        '    <a href="booking.html" class="btn p">➕ Dalbo Safar Cusub</a>',
        '    <button type="button" class="btn g" id="custLogoutBtn">🚪 Ka Bax</button>',
        '  </div>',
        '</div>'
      ].join('\n');

      document.body.appendChild(backdrop);

      var closeBtn = $('#closeCustProfileBtn', backdrop);
      var logoutBtn = $('#custLogoutBtn', backdrop);
      var listArea = $('#custBookingsList', backdrop);
      var countBadge = $('#custBookingCount', backdrop);

      function close() {
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      }

      closeBtn.addEventListener('click', close);
      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) close();
      });

      logoutBtn.addEventListener('click', function () {
        fetch('/api/customer/logout', { method: 'POST' })
          .then(function () {
            self.current = null;
            self.renderHeader(false);
            close();
            self.showToast('Si guul leh ayaad uga baxday.');
          })
          .catch(function () {
            close();
          });
      });

      // Fetch customer bookings
      fetch('/api/customer/bookings')
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!d.ok || !d.bookings || !d.bookings.length) {
            listArea.innerHTML = '<div style="text-align:center; padding: 30px 10px; color: var(--mut); font-size: 13.5px;">Weli ma aadan dalban safar. Guji "Dalbo Safar Cusub" si aad tikidh u goosato!</div>';
            countBadge.textContent = '0 Safar';
            return;
          }

          countBadge.textContent = d.bookings.length + ' Safar';
          listArea.innerHTML = '';

          d.bookings.forEach(function (b) {
            var item = document.createElement('div');
            item.className = 'cust-booking-item';

            var statusHtml = b.status === 'confirmed'
              ? '<span class="badge" style="background:#dcfce7;color:#166534;font-size:11px;">✅ La Aqbalay</span>'
              : (b.status === 'cancelled'
                ? '<span class="badge" style="background:#fee2e2;color:#991b1b;font-size:11px;">❌ La Laalay</span>'
                : '<span class="badge" style="background:#fef3c7;color:#92400e;font-size:11px;">⏳ Sugaya</span>');

            item.innerHTML = [
              '<div class="cust-b-top">',
              '  <span style="font-family:monospace;font-weight:700;color:var(--sun,#FF8A1F);">' + self.escapeHtml(b.ref) + '</span>',
              '  ' + statusHtml,
              '</div>',
              '<div class="cust-b-route">' + self.escapeHtml(b.origin) + ' ➔ ' + self.escapeHtml(b.destination) + ' (' + self.escapeHtml(b.service) + ')</div>',
              '<div class="cust-b-meta">',
              '  <span>📅 ' + self.escapeHtml(b.travel_date) + '</span>',
              '  <span>💵 $' + Number(b.price_total || 0).toFixed(2) + '</span>',
              '</div>',
              '<div style="margin-top:10px;text-align:right;">',
              '  <a href="/track.html?ref=' + encodeURIComponent(b.ref) + '" target="_blank" class="btn g xs" style="font-size:12px;padding:4px 12px;">🎟️ Eeg Tikidhka / Daabac →</a>',
              '</div>'
            ].join('\n');

            listArea.appendChild(item);
          });
        })
        .catch(function () {
          listArea.innerHTML = '<div style="text-align:center;color:#dc2626;padding:20px;">Xogta lama soo kicin karin.</div>';
        });
    },

    autoFillForms: function (c) {
      if (!c) return;
      var nameInp = $('#fullName');
      if (nameInp && !nameInp.value) nameInp.value = c.name;

      var emailInp = $('#email');
      if (emailInp && !emailInp.value) emailInp.value = c.email;

      var phoneInp = $('#phone');
      if (phoneInp && !phoneInp.value && c.phone) phoneInp.value = c.phone;

      // Contact form
      var cName = $('#c_name');
      if (cName && !cName.value) cName.value = c.name;
      var cEmail = $('#c_email');
      if (cEmail && !cEmail.value) cEmail.value = c.email;
      var cPhone = $('#c_phone');
      if (cPhone && !cPhone.value && c.phone) cPhone.value = c.phone;
    },

    showToast: function (msg) {
      var t = document.createElement('div');
      t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0A2358;color:#fff;padding:12px 24px;border-radius:999px;box-shadow:0 10px 25px rgba(0,0,0,0.3);font-weight:700;font-size:14px;z-index:9999;border:1.5px solid #FF8A1F;animation:fadeIn 0.2s ease;';
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(function () {
        if (t.parentNode) t.parentNode.removeChild(t);
      }, 4000);
    },

    escapeHtml: function (str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
  };

  customerAuth.init();
})();
