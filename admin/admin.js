/* TRAVEL SOM — Comprehensive Admin Dashboard Logic
   Admin Email: cabdilahi cawil881@gmail.com | PIN: somtravel
   Features: Dynamic Overview, Bookings Management (Codsiyada), Registered Customers (Macaamiisha),
   Content Management, Media Library, Contact Messages & Real-time Live Actions
*/
(function () {
  'use strict';

  var csrf = '', email = '', schema = {}, draft = {}, dirty = {}, images = [], unsaved = false;
  var byId = function (id) { return document.getElementById(id); };

  var PAGES = [
    { id: 'overview', label: 'Dulmar Guud', icon: '📊', title: 'Dashboard & Dulmar Guud', subtitle: 'Guud ahaan xaaladda dalabaadka, macaamiisha iyo website-ka' },
    { id: 'bookings', label: 'Codsiyada & Dalabaadka', icon: '🎫', title: 'Maamulka Codsiyada Safarka', subtitle: 'Aqbal, maamul, ama tirtir dalabaadka tikidhada macaamiisha', highlight: true },
    { id: 'customers', label: 'Macaamiisha Is-diiwaangelisay', icon: '👥', title: 'Macaamiisha Shabakadda', subtitle: 'Liiska dhammaan macaamiisha iska diiwaangelisay websaytka' },
    { id: 'messages', label: 'Fariimaha Xiriirka', icon: '💬', title: 'Fariimaha Dadweynaha', subtitle: 'Dhammaan farriimaha laga soo diray bogga Contact Us' },
    { id: 'homepage', label: 'Bogga Hore (Home)', icon: '🏠', title: 'Maamulka Bogga Hore', subtitle: 'Wax ka beddel cinwaanka weyn, slideshow-ga iyo qoraalada', sections: ['home', 'hero'] },
    { id: 'services', label: 'Adeegyada (Services)', icon: '🧳', title: 'Adeegyada Safarka', subtitle: 'Maamulka Basaska, Taxis-ka iyo Duulimaadyada Diyaaradaha', sections: ['services'] },
    { id: 'cities', label: 'Magaalooyinka (Cities)', icon: '🌍', title: 'Magaalooyinka Soomaaliya', subtitle: 'Ku dar ama wax ka beddel magaalooyinka safarku tago', sections: ['cities'] },
    { id: 'images', label: 'Sawirrada (Photos)', icon: '🖼️', title: 'Keydka Sawirrada', subtitle: 'Soo geli sawirro cusub ama ku beddel kuwa jira' },
    { id: 'about', label: 'Nagu Saabsan (About)', icon: 'ℹ️', title: 'Xogta Shirkadda', subtitle: 'Qoraallada taariikhda, hadafka iyo aragtida shirkadda', sections: ['about'] },
    { id: 'branches', label: 'Laamaha (Branches)', icon: '📍', title: 'Laamaha Shirkadda', subtitle: 'Xafiisyada TRAVEL SOM ee gobollada dalka', sections: ['branches'] },
    { id: 'contact', label: 'Xiriirka (Contact Info)', icon: '📞', title: 'Xogta Xiriirka', subtitle: 'Telefoonnada, Emailada iyo cinwaannada rasmiga ah', sections: ['contact'] },
    { id: 'settings', label: 'Dejinta (Settings)', icon: '⚙️', title: 'Dejinta Nidaamka', subtitle: 'Dejinta guud iyo beddelka furaha sirta ah ee maamulka', sections: ['settings'] }
  ];

  /* ---------------- Helpers ---------------- */
  function el(tag, cls, text, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }
  function fill(c, nodes) {
    while (c.firstChild) c.removeChild(c.firstChild);
    nodes.forEach(function (n) { if (n) c.appendChild(n); });
  }
  function toast(msg, ok) {
    var t = el('div', 'toast ' + (ok === false ? 'err' : 'ok'), (ok === false ? '⚠️ ' : '✅ ') + msg);
    byId('toasts').appendChild(t);
    setTimeout(function () {
      if (t.parentNode) t.parentNode.removeChild(t);
    }, ok === false ? 6500 : 4000);
  }
  function confirmBox(msg) {
    return new Promise(function (res) {
      var d = byId('dlg');
      byId('dlgMsg').textContent = msg;
      d.addEventListener('close', function h() {
        d.removeEventListener('close', h);
        res(d.returnValue === 'ok');
      });
      d.returnValue = 'cancel';
      d.showModal();
    });
  }
  function fmtDate(s) {
    if (!s) return '—';
    var d = new Date(s);
    return isNaN(d) ? s : d.toLocaleDateString('so-SO', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function kb(n) {
    return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.ceil(n / 1024) + ' KB';
  }

  function api(method, url, body, raw) {
    var o = { method: method, credentials: 'same-origin', headers: {} };
    if (method !== 'GET' && csrf) o.headers['X-CSRF-Token'] = csrf;
    if (raw) {
      o.body = raw.file;
      o.headers['Content-Type'] = raw.file.type || 'application/octet-stream';
      o.headers['X-Filename'] = encodeURIComponent(raw.file.name);
    } else if (body !== undefined) {
      o.headers['Content-Type'] = 'application/json';
      o.body = JSON.stringify(body);
    }
    return fetch(url, o).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (r.status === 401 && url.indexOf('/login') < 0 && url.indexOf('/session') < 0) {
          showLogin();
          throw new Error('Fadlan dib u soo gal nidaamka maamulka.');
        }
        if (!r.ok) throw new Error(d.error || 'Khalad ayaa dhacay (' + r.status + ')');
        return d;
      });
    });
  }

  /* ---------------- Login / Logout ---------------- */
  function showLogin() {
    csrf = '';
    byId('app').hidden = true;
    byId('login').hidden = false;
    byId('lPass').value = '';
    byId('lEmail').value = '';
    var err = byId('lErr');
    if (err) {
      err.style.display = 'none';
      err.textContent = '';
    }
  }

  byId('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = byId('lBtn'), err = byId('lErr');
    btn.disabled = true;
    if (err) {
      err.style.display = 'none';
      err.textContent = '';
    }
    var emailVal = (byId('lEmail').value || '').trim();
    var passVal = (byId('lPass').value || '').trim();

    api('POST', '/api/admin/login', { email: emailVal, password: passVal })
      .then(function (d) {
        csrf = d.csrf;
        email = d.email;
        toast('Ku soo dhowow nidaamka maamulka!');
        return boot();
      })
      .catch(function (x) {
        if (err) {
          err.style.display = 'flex';
          err.textContent = x.message || 'DIIDMO: Email-ka ama PIN-ka ma saxna! Gelitaanka waa laguu diiday.';
        } else {
          toast(x.message || 'DIIDMO: Gelitaanka waa laguu diiday!', false);
        }
      })
      .then(function () { btn.disabled = false; });
  });

  var togglePassBtn = byId('togglePassBtn');
  if (togglePassBtn) {
    togglePassBtn.addEventListener('click', function () {
      var passInp = byId('lPass');
      if (passInp.type === 'password') {
        passInp.type = 'text';
        togglePassBtn.textContent = '🔒';
      } else {
        passInp.type = 'password';
        togglePassBtn.textContent = '👁️';
      }
    });
  }

  function logout() {
    confirmBox('Ma hubtaa inaad rabto inaad ka baxdo nidaamka maamulka?').then(function (ok) {
      if (!ok) return;
      api('POST', '/api/admin/logout', {}).catch(function () {}).then(function () {
        toast('Si guul leh ayaad uga baxday.');
        showLogin();
      });
    });
  }

  byId('sideLogoutBtn').addEventListener('click', logout);

  /* ---------------- Loading Data ---------------- */
  function loadDraft() {
    return api('GET', '/api/admin/draft').then(function (d) {
      draft = d.draft;
      dirty = d.dirty;
      updateBar();
    });
  }
  function loadImages() {
    return api('GET', '/api/admin/images').then(function (d) {
      images = d.images;
    });
  }

  function boot() {
    return Promise.all([api('GET', '/api/admin/schema'), loadDraft(), loadImages()]).then(function (r) {
      schema = r[0].sections;
      byId('login').hidden = true;
      byId('app').hidden = false;
      byId('who').textContent = email || 'cabdilahi cawil881@gmail.com';
      buildMenu();
      route();
    });
  }

  function dirtyList() {
    return Object.keys(dirty).filter(function (k) { return dirty[k]; });
  }

  function updateBar() {
    var n = dirtyList().length, b = byId('dirtyBadge');
    b.textContent = n ? n + ' isbeddel lama faafin' : 'Dhammaan waa la faafiyey';
    b.className = 'badge' + (n ? ' warn' : '');
    byId('publishBtn').disabled = !n;
    byId('discardBtn').disabled = !n;
  }

  /* ---------------- Menu / Routing ---------------- */
  function buildMenu() {
    fill(byId('menu'), PAGES.map(function (p) {
      var b = el('button', p.highlight ? 'highlight' : null, null, { type: 'button', 'data-id': p.id });
      var ic = el('span', null, p.icon);
      var lb = el('span', null, p.label);
      b.appendChild(ic);
      b.appendChild(lb);

      if (p.id === 'bookings') {
        var countBadge = el('span', 'menu-badge', '...');
        countBadge.id = 'menuPendingBadge';
        b.appendChild(countBadge);
      }

      b.addEventListener('click', function () {
        go(p.id);
      });
      return b;
    }));
    updatePendingBadge();
  }

  function updatePendingBadge() {
    api('GET', '/api/admin/stats').then(function (d) {
      var mb = byId('menuPendingBadge');
      if (mb && d.stats) {
        mb.textContent = d.stats.pendingBookings ? d.stats.pendingBookings + ' cusub' : d.stats.totalBookings;
        if (d.stats.pendingBookings) {
          mb.style.background = '#f59e0b';
          mb.style.color = '#000';
        }
      }
    }).catch(function () {});
  }

  function go(id) {
    if (unsaved) {
      confirmBox('Waxaad haysataa isbeddello aan la keydin. Ma rabtaa inaad ka tagto boggan oo aad lumiso?').then(function (ok) {
        if (ok) {
          unsaved = false;
          go(id);
        }
      });
      return;
    }
    if (location.hash.slice(1) === id) route();
    else location.hash = id;
    if (window.innerWidth < 990) byId('side').classList.remove('open');
  }

  function route() {
    var hash = location.hash.slice(1) || 'overview';
    var page = PAGES.filter(function (p) { return p.id === hash; })[0] || PAGES[0];
    
    Array.prototype.slice.call(byId('menu').querySelectorAll('button')).forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-id') === page.id);
    });

    byId('pageTitle').textContent = page.title;
    byId('pageSubtitle').textContent = page.subtitle || '';
    
    var v = byId('view');
    fill(v, [el('div', 'empty', 'Fadlan sug, xogta ayaa la soo rarayaa...')]);

    var p;
    if (page.id === 'overview') p = pageOverview(v);
    else if (page.id === 'bookings') p = pageBookings(v);
    else if (page.id === 'customers') p = pageCustomers(v);
    else if (page.id === 'messages') p = pageMessages(v);
    else if (page.id === 'images') p = pageImages(v);
    else p = loadDraft().then(function () { return pageSections(v, page); });

    p.catch(function (e) {
      fill(v, [el('div', 'err-box', e.message)]);
    });
  }

  window.addEventListener('hashchange', route);
  byId('burger').addEventListener('click', function () {
    byId('side').classList.toggle('open');
  });
  window.addEventListener('beforeunload', function (e) {
    if (unsaved) { e.preventDefault(); e.returnValue = ''; }
  });

  /* ---------------- Top Bar Actions ---------------- */
  byId('publishBtn').addEventListener('click', function () {
    if (unsaved) return toast('Fadlan marka hore riix "Keydi Isbeddellada", kadibna faafi.', false);
    confirmBox('Ma hubtaa inaad rabto inaad dhammaan isbeddellada toos ugu faafiso website-ka?').then(function (ok) {
      if (!ok) return;
      api('POST', '/api/admin/publish', {}).then(function (d) {
        dirty = d.dirty;
        updateBar();
        toast('Si guul leh ayaa loo faafiyey! Booqdayaashu waxay arki doonaan isbeddelka hadda.');
        route();
      }).catch(function (e) {
        toast('Faafinta way fashilantay: ' + e.message, false);
      });
    });
  });

  byId('discardBtn').addEventListener('click', function () {
    confirmBox('Ma rabtaa inaad tirtirto dhammaan isbeddelladii aan la faafin oo aad ku noqoto nuqulkii hore?').then(function (ok) {
      if (!ok) return;
      api('POST', '/api/admin/discard', {}).then(function (d) {
        dirty = d.dirty;
        updateBar();
        toast('Isbeddelladii lama faafin waa la tuuray.');
        route();
      }).catch(function (e) {
        toast('Khalad: ' + e.message, false);
      });
    });
  });

  /* ---------------- Overview Page ---------------- */
  function pageOverview(v) {
    return api('GET', '/api/admin/overview').then(function (o) {
      var nodes = [];

      // Alert Banner if pending bookings exist
      if (o.bookings.pending > 0) {
        var alertCard = el('div', 'card');
        alertCard.style.borderLeft = '6px solid var(--sun)';
        alertCard.style.background = 'linear-gradient(135deg, rgba(255,138,31,0.1), rgba(16,25,46,0.9))';
        var row = el('div', null);
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.flexWrap = 'wrap';
        row.style.gap = '14px';

        var txt = el('div');
        txt.appendChild(el('h3', null, '⚡ Waxaa jira ' + o.bookings.pending + ' codsi oo cusub oo sugaya go\'aan!'));
        txt.appendChild(el('p', 'muted', 'Macaamiishu waxay dalbadeen tikidho safar ah oo u baahan xaqiijin ama aqbalid.'));
        row.appendChild(txt);

        var btnView = el('button', 'btn primary sm', 'Eeg Codsiyada Hadda →');
        btnView.addEventListener('click', function () { go('bookings'); });
        row.appendChild(btnView);

        alertCard.appendChild(row);
        nodes.push(alertCard);
      }

      // 4 Main Metric Stats
      var grid4 = el('div', 'grid4');
      var metrics = [
        { label: 'Wadarta Codsiyada', val: o.bookings.total, icon: '🎫', color: 'orange', tag: o.bookings.last7 + ' 7-dii maalmood ee u dambeeyey' },
        { label: 'Codsiyada Sugaya', val: o.bookings.pending, icon: '⏳', color: 'purple', tag: 'U baahan xaqiijin' },
        { label: 'La Aqbalay (Confirmed)', val: o.bookings.confirmed, icon: '✅', color: 'green', tag: 'Tikidho shaqaynaya' },
        { label: 'Dakhliga Guud ($)', val: '$' + (o.bookings.revenue || 0).toLocaleString(), icon: '💰', color: 'blue', tag: 'Dalabaadka la aqbalay' }
      ];

      metrics.forEach(function (m) {
        var st = el('div', 'stat');
        var top = el('div', 'stat-top');
        var ic = el('div', 'stat-icon ' + m.color, m.icon);
        var tg = el('span', 'stat-tag', m.tag);
        tg.style.background = 'rgba(255,255,255,0.08)';
        top.appendChild(ic);
        top.appendChild(tg);
        st.appendChild(top);
        st.appendChild(el('b', null, String(m.val)));
        st.appendChild(el('span', null, m.label));
        grid4.appendChild(st);
      });
      nodes.push(grid4);

      // Secondary Grid
      var subGrid = el('div', 'grid4');
      var subMetrics = [
        { label: 'Macaamiisha Is-diiwaangelisay', val: o.customers || 0, icon: '👥' },
        { label: 'Farriimaha Xiriirka', val: o.messages || 0, icon: '💬' },
        { label: 'Magaalooyinka Safarka', val: o.cities || 10, icon: '🌍' },
        { label: 'Sawirrada Keydka ku jira', val: o.images || 0, icon: '🖼️' }
      ];
      subMetrics.forEach(function (sm) {
        var s = el('div', 'stat');
        var top = el('div', 'stat-top');
        top.appendChild(el('div', 'stat-icon', sm.icon));
        s.appendChild(top);
        s.appendChild(el('b', null, String(sm.val)));
        s.appendChild(el('span', null, sm.label));
        subGrid.appendChild(s);
      });
      nodes.push(subGrid);

      // Latest Booking Requests
      var rec = el('section', 'card');
      var recHead = el('div');
      recHead.style.display = 'flex';
      recHead.style.justifyContent = 'space-between';
      recHead.style.alignItems = 'center';
      recHead.style.marginBottom = '16px';
      recHead.appendChild(el('h2', null, 'Codsiyadii Safarka ee Ugu Dambeeyey'));

      var viewAllBtn = el('button', 'btn ghost sm', 'Dhammaan Eeg (' + o.bookings.total + ') →');
      viewAllBtn.addEventListener('click', function () { go('bookings'); });
      recHead.appendChild(viewAllBtn);
      rec.appendChild(recHead);

      if (!o.recent.length) {
        rec.appendChild(el('div', 'empty', 'Weli ma jiraan codsiyo safar oo la soo gudbiyey.'));
      } else {
        var listWrap = el('div', 'booking-table-wrap');
        var head = el('div', 'brow head');
        ['Ref ID', 'Macmiilka', 'Dariiqa & Adeegga', 'Taariikhda', 'Qiimaha', 'Xaaladda', 'Ficil Degdeg ah'].forEach(function (h) {
          head.appendChild(el('span', null, h));
        });
        listWrap.appendChild(head);

        o.recent.forEach(function (b) {
          listWrap.appendChild(renderBookingRow(b, function () { route(); }));
        });
        rec.appendChild(listWrap);
      }
      nodes.push(rec);

      fill(v, nodes);
    });
  }

  /* ---------------- Bookings Management Page ---------------- */
  function pageBookings(v) {
    var curStatus = '', curService = '', curQuery = '';
    var container = el('div');
    v.appendChild(container);

    function loadAndDraw() {
      api('GET', '/api/admin/overview').then(function (overviewData) {
        var bStats = overviewData.bookings;
        
        var topBar = el('div', 'bookings-header-bar');
        var titleGroup = el('div');
        titleGroup.appendChild(el('h2', null, 'Maamulka Codsiyada & Dalabaadka (Bookings)'));
        titleGroup.appendChild(el('p', 'muted', 'Halkan waxaad ka maamulaysaa dhammaan codsiyada safarka ee macaamiishu soo direen.'));
        topBar.appendChild(titleGroup);

        // Filter chips by status
        var chipGroup = el('div', 'b-filter-strip');
        var statusOptions = [
          { key: '', label: 'Dhammaan', count: bStats.total },
          { key: 'pending', label: '⏳ Sugaya (Pending)', count: bStats.pending },
          { key: 'confirmed', label: '✅ La Aqbalay', count: bStats.confirmed },
          { key: 'cancelled', label: '❌ La Laalay', count: bStats.cancelled }
        ];

        statusOptions.forEach(function (opt) {
          var chip = el('button', 'filter-chip' + (curStatus === opt.key ? ' active' : ''), null, { type: 'button' });
          chip.appendChild(document.createTextNode(opt.label + ' '));
          chip.appendChild(el('span', 'filter-chip-count', String(opt.count || 0)));
          chip.addEventListener('click', function () {
            curStatus = opt.key;
            fetchBookings();
          });
          chipGroup.appendChild(chip);
        });

        // Search and Service Filter Bar
        var filterBox = el('div', 'filters-box');
        var searchInput = el('input', null, null, {
          type: 'search',
          placeholder: '🔍 Raadi Magac, Taleefan, Ref ID, Magaalo...',
          value: curQuery
        });
        searchInput.addEventListener('input', function (e) {
          curQuery = e.target.value.trim();
        });
        searchInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') fetchBookings();
        });

        var serviceSelect = el('select');
        serviceSelect.appendChild(el('option', null, 'Dhammaan Gaadiidka (All Services)', { value: '' }));
        serviceSelect.appendChild(el('option', null, '🚌 Bus (Bas)', { value: 'Bus' }));
        serviceSelect.appendChild(el('option', null, '✈️ Flight (Diyaarad)', { value: 'Flight' }));
        serviceSelect.appendChild(el('option', null, '🚕 Taxi', { value: 'Taxi' }));
        serviceSelect.value = curService;
        serviceSelect.addEventListener('change', function () {
          curService = serviceSelect.value;
          fetchBookings();
        });

        var searchBtn = el('button', 'btn ghost', 'Raadi (Search)', { type: 'button' });
        searchBtn.addEventListener('click', fetchBookings);

        var resetBtn = el('button', 'btn ghost sm', 'Nadiifi (Reset)', { type: 'button' });
        resetBtn.addEventListener('click', function () {
          curQuery = '';
          curStatus = '';
          curService = '';
          searchInput.value = '';
          serviceSelect.value = '';
          fetchBookings();
        });

        filterBox.appendChild(searchInput);
        filterBox.appendChild(serviceSelect);
        filterBox.appendChild(searchBtn);
        filterBox.appendChild(resetBtn);

        var listArea = el('div');

        fill(container, [topBar, chipGroup, filterBox, listArea]);

        function fetchBookings() {
          fill(listArea, [el('div', 'empty', 'Fadlan sug, codsiyada ayaa la soo rarayaa...')]);
          var url = '/api/admin/bookings?q=' + encodeURIComponent(curQuery) + '&status=' + encodeURIComponent(curStatus) + '&service=' + encodeURIComponent(curService);
          
          api('GET', url).then(function (d) {
            if (!d.bookings.length) {
              fill(listArea, [el('div', 'empty', curQuery || curStatus || curService ? 'Lama helin wax codsi ah oo ku habboon shaandhayntaada.' : 'Weli wax codsiyo ah lama soo gudbin.')]);
              return;
            }

            var wrap = el('div', 'booking-table-wrap');
            var head = el('div', 'brow head');
            ['Ref ID', 'Macmiilka', 'Dariiqa & Adeegga', 'Taariikhda', 'Qiimaha', 'Xaaladda', 'Ficil Degdeg ah'].forEach(function (h) {
              head.appendChild(el('span', null, h));
            });
            wrap.appendChild(head);

            d.bookings.forEach(function (b) {
              wrap.appendChild(renderBookingRow(b, fetchBookings));
            });

            fill(listArea, [wrap]);
          }).catch(function (e) {
            fill(listArea, [el('div', 'err-box', e.message)]);
          });
        }

        fetchBookings();
      });
    }

    loadAndDraw();
    return Promise.resolve();
  }

  function renderBookingRow(b, reload) {
    var r = el('div', 'brow');
    
    // Ref
    var cRef = el('span');
    cRef.appendChild(el('span', 'ref-pill', b.ref));
    cRef.appendChild(el('small', null, fmtDate(b.created_at)));
    r.appendChild(cRef);

    // Customer
    var cCust = el('span');
    cCust.appendChild(el('b', null, b.name));
    cCust.appendChild(el('small', null, b.phone + (b.email ? ' · ' + b.email : '')));
    r.appendChild(cCust);

    // Trip
    var cTrip = el('span');
    cTrip.appendChild(el('b', null, b.origin + ' ➔ ' + b.destination));
    cTrip.appendChild(el('small', null, b.service + ' · ' + b.passengers + ' qof (Kursi: ' + (b.seats || '—') + ')'));
    r.appendChild(cTrip);

    // Date
    var cDate = el('span');
    cDate.appendChild(el('b', null, b.travel_date));
    cDate.appendChild(el('small', null, b.departure_time || '06:00 AM'));
    r.appendChild(cDate);

    // Price
    var cPrice = el('span');
    cPrice.appendChild(el('b', null, '$' + Number(b.price_total || 0).toFixed(2)));
    cPrice.appendChild(el('small', null, b.payment_method || 'EVC Plus'));
    if (b.receipt_image) {
      var rTag = el('span', null, '📸 Risiid La Helay');
      rTag.style.display = 'inline-block';
      rTag.style.fontSize = '11px';
      rTag.style.fontWeight = '700';
      rTag.style.color = '#15803d';
      rTag.style.background = '#dcfce7';
      rTag.style.padding = '2px 6px';
      rTag.style.borderRadius = '4px';
      rTag.style.marginTop = '3px';
      rTag.title = 'Sawirka risiidka lacag-bixinta waa la helay';
      cPrice.appendChild(rTag);
    }
    r.appendChild(cPrice);

    // Status
    var cStatus = el('span');
    var statusText = b.status === 'confirmed' ? '✅ La Aqbalay' : (b.status === 'cancelled' ? '❌ La Laalay' : '⏳ Sugaya');
    cStatus.appendChild(el('span', 'st ' + b.status, statusText));
    r.appendChild(cStatus);

    // Actions Group
    var cActs = el('div', 'row-actions-btn-group');

    // Confirm button
    if (b.status !== 'confirmed') {
      var btnOk = el('button', 'action-icon-btn confirm-btn', '✓', { title: 'Aqbal Codsiga (Confirm)' });
      btnOk.addEventListener('click', function (e) {
        e.stopPropagation();
        api('PUT', '/api/admin/bookings/' + b.id, { status: 'confirmed' }).then(function () {
          toast('Codsiga ' + b.ref + ' si guul leh ayaa loo aqbalay!');
          reload();
          updatePendingBadge();
        }).catch(function (err) { toast(err.message, false); });
      });
      cActs.appendChild(btnOk);
    }

    // Cancel button
    if (b.status !== 'cancelled') {
      var btnCancel = el('button', 'action-icon-btn cancel-btn', '✕', { title: 'Laal / Diid Codsiga (Cancel)' });
      btnCancel.addEventListener('click', function (e) {
        e.stopPropagation();
        confirmBox('Ma hubtaa inaad rabto inaad laasho codsiga ' + b.ref + '?').then(function (ok) {
          if (!ok) return;
          api('PUT', '/api/admin/bookings/' + b.id, { status: 'cancelled' }).then(function () {
            toast('Codsiga ' + b.ref + ' waa la laalay.');
            reload();
            updatePendingBadge();
          }).catch(function (err) { toast(err.message, false); });
        });
      });
      cActs.appendChild(btnCancel);
    }

    // View Modal
    var btnView = el('button', 'action-icon-btn', '👁️', { title: 'Eeg Faahfaahinta oo dhan' });
    btnView.addEventListener('click', function () { bookingModal(b, reload); });
    cActs.appendChild(btnView);

    // Print
    var btnPrint = el('button', 'action-icon-btn', '🖨️', { title: 'Daabac Tikidhka' });
    btnPrint.addEventListener('click', function (e) {
      e.stopPropagation();
      window.open('/track.html?ref=' + encodeURIComponent(b.ref) + '&print=1', '_blank');
    });
    cActs.appendChild(btnPrint);

    // Delete
    var btnDel = el('button', 'action-icon-btn', '🗑️', { title: 'Tirtir Codsiga' });
    btnDel.addEventListener('click', function (e) {
      e.stopPropagation();
      confirmBox('Ma hubtaa inaad rabto inaad nidaamka ka tirtirto dalabka ' + b.ref + '?').then(function (ok) {
        if (!ok) return;
        api('DELETE', '/api/admin/bookings/' + b.id).then(function () {
          toast('Dalabka waa la tirtiray.');
          reload();
          updatePendingBadge();
        }).catch(function (err) { toast(err.message, false); });
      });
    });
    cActs.appendChild(btnDel);

    r.appendChild(cActs);
    return r;
  }

  function bookingModal(b, reload) {
    var m = el('div', 'modal'), box = el('div', 'box');
    m.appendChild(box);

    var top = el('div', 'modal-top');
    top.appendChild(el('h2', null, 'Dalabka ' + b.ref));
    var closeTop = el('button', 'btn ghost xs', '✕ Xir');
    closeTop.addEventListener('click', function () { document.body.removeChild(m); });
    top.appendChild(closeTop);
    box.appendChild(top);

    var dl = el('dl', 'kv');
    [
      ['Macmiilka', b.name],
      ['Taleefanka', b.phone],
      ['Email-ka', b.email || '—'],
      ['Adeegga', b.service],
      ['Magaalada Bixitaanka', b.origin],
      ['Magaalada Tagitaanka', b.destination],
      ['Taariikhda Safarka', b.travel_date],
      ['Saacadda Bixitaanka', b.departure_time || '06:00 AM'],
      ['Tirada Rakaabka', String(b.passengers) + ' qof'],
      ['Kuraasta', b.seats || 'Lama cayimin'],
      ['Dakhliga / Qiimaha', '$' + Number(b.price_total || 0).toFixed(2)],
      ['Habka Lacag-bixinta', b.payment_method || 'EVC Plus'],
      ['Magaalooyinka la maro', b.transit_stops || 'Toos (Direct)'],
      ['Farriinta Macmiilka', b.notes || '—'],
      ['Waqtiga la dalbaday', fmtDate(b.created_at)],
      ['Isbeddelkii u dambeeyey', fmtDate(b.updated_at)]
    ].forEach(function (p) {
      dl.appendChild(el('dt', null, p[0]));
      dl.appendChild(el('dd', null, p[1]));
    });
    box.appendChild(dl);

    if (b.receipt_image) {
      var rcWrap = el('div', 'receipt-modal-box');
      rcWrap.style.background = '#f0fdf4';
      rcWrap.style.border = '1.5px solid #22c55e';
      rcWrap.style.borderRadius = '12px';
      rcWrap.style.padding = '14px';
      rcWrap.style.margin = '16px 0';
      rcWrap.appendChild(el('h4', null, '📸 Sawirka Risiidka Lacag-Bixinta (Uploaded Receipt):', { style: 'margin:0 0 6px;color:#15803d;font-size:15px;' }));
      if (b.receipt_note) {
        rcWrap.appendChild(el('p', null, 'Fariinta Macmiilka / Transaction ID: ' + b.receipt_note, { style: 'font-size:13px;font-weight:bold;color:#166534;margin:0 0 10px;' }));
      }
      var rImg = el('img', null, null, {
        src: '/' + b.receipt_image,
        alt: 'Risiidka ' + b.ref,
        style: 'max-width:100%;max-height:320px;border-radius:8px;border:1px solid #cbd5e1;cursor:pointer;display:block;margin:0 auto;'
      });
      rImg.addEventListener('click', function() { window.open('/' + b.receipt_image, '_blank'); });
      rcWrap.appendChild(rImg);
      rcWrap.appendChild(el('small', null, '🔍 Guji sawirka si aad u furto bog weyn (Click image to expand)', { style: 'display:block;margin-top:6px;color:#64748b;text-align:center;' }));
      box.appendChild(rcWrap);
    }

    var status = el('select');
    [
      ['pending', '⏳ Sugaya (Pending)'],
      ['confirmed', '✅ La Aqbalay (Confirmed)'],
      ['cancelled', '❌ La Laalay (Cancelled)']
    ].forEach(function (s) {
      status.appendChild(el('option', null, s[1], { value: s[0] }));
    });
    status.value = b.status;

    var note = el('textarea', null, null, { maxlength: 500, placeholder: 'Qor qoraal gudaha ah oo maamulku kaliya arki karo...' });
    note.value = b.admin_note || '';

    box.appendChild(labelWrap({ l: 'Xaaladda Codsiga (Status)' }, status));
    box.appendChild(labelWrap({ l: 'Qoraal Maamule (Internal Admin Note)' }, note));

    var save = el('button', 'btn primary', '💾 Keydi Isbeddelka', { type: 'button' });
    var close = el('button', 'btn ghost', 'Xir', { type: 'button' });
    var print = el('button', 'btn ghost', '🖨️ Daabac Tikidhka', { type: 'button' });

    print.addEventListener('click', function () {
      window.open('/track.html?ref=' + encodeURIComponent(b.ref) + '&print=1', '_blank');
    });

    var row = el('div', 'row-end');
    row.appendChild(print);
    row.appendChild(close);
    row.appendChild(save);
    box.appendChild(row);

    document.body.appendChild(m);

    function done() { if (m.parentNode) document.body.removeChild(m); }
    close.addEventListener('click', done);
    m.addEventListener('click', function (e) { if (e.target === m) done(); });

    save.addEventListener('click', function () {
      save.disabled = true;
      api('PUT', '/api/admin/bookings/' + b.id, { status: status.value, adminNote: note.value })
        .then(function () {
          toast('Dalabka ' + b.ref + ' waa la cusboonaysiiyey.');
          done();
          reload();
          updatePendingBadge();
        })
        .catch(function (e) {
          toast(e.message, false);
          save.disabled = false;
        });
    });
  }

  /* ---------------- Registered Customers Page ---------------- */
  function pageCustomers(v) {
    return api('GET', '/api/admin/customers').then(function (d) {
      var nodes = [];
      var card = el('div', 'card');
      card.appendChild(el('h2', null, 'Macaamiisha Is-diiwaangelisay'));
      card.appendChild(el('p', 'muted', 'Dhammaan macaamiisha akoon ka samaysatay website-ka adoo isticmaalaya Magaca iyo Email-ka.'));

      if (!d.customers.length) {
        card.appendChild(el('div', 'empty', 'Weli macmiil iska diiwaangeliyey ma jiro. Macaamiishu waxay iska diiwaangelin karaan qaybta "Gal / Is-diiwaangeli".'));
      } else {
        var wrap = el('div', 'booking-table-wrap');
        var head = el('div', 'brow head');
        head.style.gridTemplateColumns = '50px 1.6fr 1.6fr 120px 140px 90px';
        ['#', 'Magaca Macmiilka', 'Email-ka & Tel', 'Dalabaadka', 'Is-diiwaangelinta', 'Tirtir'].forEach(function (h) {
          head.appendChild(el('span', null, h));
        });
        wrap.appendChild(head);

        d.customers.forEach(function (c, i) {
          var r = el('div', 'brow');
          r.style.gridTemplateColumns = '50px 1.6fr 1.6fr 120px 140px 90px';

          r.appendChild(el('span', null, String(i + 1)));

          var nameWrap = el('div');
          nameWrap.appendChild(el('b', null, c.name));
          r.appendChild(nameWrap);

          var emWrap = el('div');
          emWrap.appendChild(el('span', null, c.email));
          if (c.phone) emWrap.appendChild(el('small', null, c.phone));
          r.appendChild(emWrap);

          var bCount = el('div');
          bCount.appendChild(el('span', 'badge', c.booking_count + ' Safar'));
          r.appendChild(bCount);

          r.appendChild(el('span', null, fmtDate(c.created_at)));

          var delBtn = el('button', 'action-icon-btn cancel-btn', '🗑️', { title: 'Tirtir Macmiilka' });
          delBtn.addEventListener('click', function () {
            confirmBox('Ma hubtaa inaad rabto inaad tirtirto macmiilka ' + c.name + '?').then(function (ok) {
              if (!ok) return;
              api('DELETE', '/api/admin/customers/' + c.id).then(function () {
                toast('Macmiilka waa la tirtiray.');
                route();
              }).catch(function (e) { toast(e.message, false); });
            });
          });
          r.appendChild(delBtn);

          wrap.appendChild(r);
        });
        card.appendChild(wrap);
      }
      nodes.push(card);
      fill(v, nodes);
    });
  }

  /* ---------------- Contact Messages Page ---------------- */
  function pageMessages(v) {
    return api('GET', '/api/admin/messages').then(function (d) {
      var card = el('div', 'card');
      card.appendChild(el('h2', null, 'Farriimaha Xiriirka (Inquiries)'));
      card.appendChild(el('p', 'muted', 'Farriimaha dadweynuhu ka soo direen foomka xiriirka ee bogga Contact Us.'));

      if (!d.messages.length) {
        card.appendChild(el('div', 'empty', 'Weli wax fariimo ah ma soo gaarin xafiiska.'));
      } else {
        d.messages.forEach(function (m) {
          var item = el('div', 'msgitem');
          var head = el('div', 'msgitem-header');
          var info = el('div');
          info.appendChild(el('b', null, m.name));
          info.appendChild(el('div', 'muted', (m.email ? m.email + ' · ' : '') + (m.phone ? m.phone + ' · ' : '') + fmtDate(m.created_at)));
          head.appendChild(info);

          var acts = el('div', 'row-end');
          if (m.phone) {
            var callA = el('a', 'btn ghost xs', '📞 Wac', { href: 'tel:' + m.phone });
            acts.appendChild(callA);
          }
          if (m.email) {
            var mailA = el('a', 'btn ghost xs', '✉️ U Jawaab', { href: 'mailto:' + m.email + '?subject=Jawaab: TRAVEL SOM' });
            acts.appendChild(mailA);
          }
          var delBtn = el('button', 'btn danger xs', 'Tirtir', { type: 'button' });
          delBtn.addEventListener('click', function () {
            confirmBox('Ma rabtaa inaad tirtirto fariintan?').then(function (ok) {
              if (!ok) return;
              api('DELETE', '/api/admin/messages/' + m.id).then(function () {
                toast('Farriinta waa la tirtiray.');
                route();
              }).catch(function (e) { toast(e.message, false); });
            });
          });
          acts.appendChild(delBtn);
          head.appendChild(acts);

          item.appendChild(head);
          item.appendChild(el('p', null, m.message));
          card.appendChild(item);
        });
      }
      fill(v, [card]);
    });
  }

  /* ---------------- Image Library Page ---------------- */
  function pageImages(v) {
    return Promise.all([loadImages(), loadDraft()]).then(function () {
      var nodes = [], up = el('section', 'card');
      up.appendChild(el('h2', null, 'Soo Geli Sawir Cusub'));
      up.appendChild(el('p', 'muted', 'Sawirrada noocyada JPG, PNG ama WebP ilaa 5 MB.'));
      var file = el('input', null, null, { type: 'file', accept: 'image/jpeg,image/png,image/webp' }), pv = el('div', 'preview-up');
      up.appendChild(file);
      up.appendChild(pv);

      file.addEventListener('change', function () {
        fill(pv, []);
        var fl = file.files[0];
        if (!fl) return;
        var problem = checkFile(fl);
        if (problem) { file.value = ''; return toast(problem, false); }
        var img = el('img', null, null, { alt: 'Preview', src: URL.createObjectURL(fl) });
        var info = el('div');
        info.appendChild(el('b', null, fl.name));
        info.appendChild(el('div', 'muted', kb(fl.size)));
        var ok = el('button', 'btn primary sm', 'Soo Geli Sawirka', { type: 'button' });
        var no = el('button', 'btn ghost sm', 'Ka Noqo', { type: 'button' });
        var rw = el('div', 'row-end');
        rw.style.justifyContent = 'flex-start';
        rw.appendChild(ok);
        rw.appendChild(no);
        info.appendChild(rw);
        pv.appendChild(img);
        pv.appendChild(info);

        no.addEventListener('click', function () { file.value = ''; fill(pv, []); });
        ok.addEventListener('click', function () {
          ok.disabled = true;
          api('POST', '/api/admin/images', undefined, { file: fl }).then(function () {
            toast('Sawirka si guul leh ayaa loo soo geliyey!');
            route();
          }).catch(function (e) {
            toast(e.message, false);
            ok.disabled = false;
          });
        });
      });
      nodes.push(up);

      var lib = el('section', 'card');
      lib.appendChild(el('h2', null, 'Maktabadda Sawirrada'));
      lib.appendChild(el('p', 'muted', 'Dhammaan sawirrada websaytka ku jira iyo kuwa cusub ee la soo geliyey.'));
      var grid = el('div', 'imgs');
      images.forEach(function (im) {
        var c = el('div', 'imgcard'), pic = el('div', 'pic'), inn = el('div', 'in');
        pic.appendChild(el('img', null, null, { src: '/' + im.path, alt: im.name, loading: 'lazy' }));
        inn.appendChild(el('b', null, im.name));
        var meta = el('div');
        meta.appendChild(el('span', 'tag' + (im.kind === 'upload' ? ' up' : ''), im.kind === 'upload' ? 'La Soo Geliyey' : 'Rasmiga ah'));
        meta.appendChild(document.createTextNode('  ' + kb(im.size)));
        inn.appendChild(meta);
        inn.appendChild(el('div', 'muted', im.usedIn.length ? 'Lagu isticmaalay: ' + im.usedIn.join(', ') : 'Lama isticmaalin'));
        inn.appendChild(assignControl(im));

        if (im.kind === 'upload') {
          var bd = el('button', 'btn danger sm', 'Tirtir', { type: 'button' });
          bd.addEventListener('click', function () {
            confirmBox('Ma hubtaa inaad rabto inaad tirtirto sawirkan?').then(function (ok) {
              if (!ok) return;
              api('DELETE', '/api/admin/images/' + im.id).then(function () {
                toast('Sawirka waa la tirtiray.');
                route();
              }).catch(function (e) { toast(e.message, false); });
            });
          });
          inn.appendChild(bd);
        }
        c.appendChild(pic);
        c.appendChild(inn);
        grid.appendChild(c);
      });
      lib.appendChild(grid);
      nodes.push(lib);
      fill(v, nodes);
    });
  }

  function assignControl(im) {
    var targets = [['hero', 'Hero slideshow (Ku dar slide)']];
    if (draft.services && draft.services.items) {
      draft.services.items.forEach(function (s, i) { targets.push(['services:' + i, 'Adeegga: ' + s.title]); });
    }
    if (draft.cities && draft.cities.items) {
      draft.cities.items.forEach(function (c, i) { targets.push(['cities:' + i, 'Magaalada: ' + c.name]); });
    }
    targets.push(['about', 'Sawirka About-ka']);

    var sel = el('select');
    sel.appendChild(el('option', null, 'U Qoondee Bog…', { value: '' }));
    targets.forEach(function (t) { sel.appendChild(el('option', null, t[1], { value: t[0] })); });
    var b = el('button', 'btn ghost sm', 'Qoondee', { type: 'button' });
    var r = el('div', 'assign');
    r.appendChild(sel);
    r.appendChild(b);

    b.addEventListener('click', function () {
      if (!sel.value) return toast('Dooro meesha aad sawirkan u qoondaynayso.', false);
      var p = sel.value.split(':'), idx = parseInt(p[1], 10), section, data;
      if (p[0] === 'hero') {
        section = 'hero';
        data = JSON.parse(JSON.stringify(draft.hero));
        data.slides.push({ image: im.path, alt: '', position: 'center' });
      } else if (p[0] === 'services') {
        section = 'services';
        data = JSON.parse(JSON.stringify(draft.services));
        data.items[idx].image = im.path;
      } else if (p[0] === 'cities') {
        section = 'cities';
        data = JSON.parse(JSON.stringify(draft.cities));
        data.items[idx].image = im.path;
      } else {
        section = 'about';
        data = JSON.parse(JSON.stringify(draft.about));
        data.image = im.path;
      }

      api('PUT', '/api/admin/draft/' + section, data).then(function (d) {
        draft[section] = d.draft;
        dirty = d.dirty;
        updateBar();
        toast('Sawirka waa loo qoondeeyey! Riix "Faafi Isbeddellada" si uu website-ka toos ugu muuqdo.');
        route();
      }).catch(function (e) { toast(e.message, false); });
    });
    return r;
  }

  function checkFile(fl) {
    if (['image/jpeg', 'image/png', 'image/webp'].indexOf(fl.type) < 0) return 'Kaliya sawirrada JPG, PNG ama WebP ayaa la ogolyahay.';
    if (fl.size > 5 * 1024 * 1024) return 'Sawirku aad buu u weyn yahay (' + kb(fl.size) + '). Xadka ugu badan waa 5 MB.';
    return '';
  }

  /* ---------------- Section Editing Pages ---------------- */
  function pageSections(v, page) {
    var cards = page.sections.map(function (sec) { return sectionCard(sec, page); });
    if (page.id === 'settings') cards.push(accountCard());
    fill(v, cards);
    return Promise.resolve();
  }

  function sectionCard(sec, page) {
    var card = el('section', 'card'), def = schema[sec];
    if (!def) return card;
    card.appendChild(el('h2', null, def.title));
    card.appendChild(el('p', 'muted', 'Isbeddellada halkan lagu sameeyo waxaa lagu keydiyaa Draft ahaan. Riix "Faafi Isbeddellada" dusha sare si dadweynuhu u arkaan.'));

    var errBox = el('div', 'err-box');
    errBox.hidden = true;
    var form = buildFields(def.fields, draft[sec]);
    card.appendChild(errBox);
    card.appendChild(form.node);

    var save = el('button', 'btn primary', '💾 Keydi Isbeddellada', { type: 'button' });
    var cancel = el('button', 'btn ghost', 'Ka Noqo', { type: 'button' });
    var row = el('div', 'row-end');
    row.appendChild(cancel);
    row.appendChild(save);
    card.appendChild(row);

    save.addEventListener('click', function () {
      save.disabled = true;
      errBox.hidden = true;
      api('PUT', '/api/admin/draft/' + sec, form.get()).then(function (d) {
        draft[sec] = d.draft;
        dirty = d.dirty;
        unsaved = false;
        updateBar();
        toast('Qaybta ' + def.title + ' waa la keydiyey! Riix "Faafi Isbeddellada" si ay toos u noqoto.');
        var fresh = sectionCard(sec, page);
        card.parentNode.replaceChild(fresh, card);
      }).catch(function (e) {
        errBox.textContent = 'Lama keydin karin: ' + e.message;
        errBox.hidden = false;
        toast('Keydintu way fashilantay: ' + e.message, false);
      }).then(function () { save.disabled = false; });
    });

    cancel.addEventListener('click', function () {
      unsaved = false;
      loadDraft().then(function () {
        var fresh = sectionCard(sec, page);
        card.parentNode.replaceChild(fresh, card);
        toast('Isbeddelladii waa la joojiyey.');
      });
    });

    card.addEventListener('input', function () { unsaved = true; });
    card.addEventListener('change', function () { unsaved = true; });
    return card;
  }

  function accountCard() {
    var card = el('section', 'card');
    card.appendChild(el('h2', null, 'Akoonka Maamulka (Admin Credentials)'));
    card.appendChild(el('p', 'muted', 'Maamulaha rasmiga ah: ' + (email || 'cabdilahi cawil881@gmail.com') + ' (PIN: somtravel)'));

    var cur = el('input', null, null, { type: 'password', autocomplete: 'current-password', placeholder: 'somtravel' });
    var n1 = el('input', null, null, { type: 'password', autocomplete: 'new-password', placeholder: 'Furaha cusub' });
    var n2 = el('input', null, null, { type: 'password', autocomplete: 'new-password', placeholder: 'Ku celi furaha cusub' });

    card.appendChild(labelWrap({ l: 'Furaha Hadda (Current PIN/Password)' }, cur));
    card.appendChild(labelWrap({ l: 'PIN-ka ama Furaha Cusub' }, n1));
    card.appendChild(labelWrap({ l: 'Ku Celi Furaha Cusub' }, n2));

    var b = el('button', 'btn primary', 'Beddel Furaha Sirta ah', { type: 'button' });
    var r = el('div', 'row-end');
    r.appendChild(b);
    card.appendChild(r);

    b.addEventListener('click', function () {
      if (!n1.value) return toast('Fadlan gali furaha cusub.', false);
      if (n1.value !== n2.value) return toast('Labada fure isma leha, fadlan hubi.', false);
      b.disabled = true;
      api('POST', '/api/admin/password', { current: cur.value, 'new': n1.value }).then(function () {
        toast('Furaha sirta ah si guul leh ayaa loo beddelay!');
        cur.value = n1.value = n2.value = '';
      }).catch(function (e) {
        toast(e.message, false);
      }).then(function () { b.disabled = false; });
    });
    return card;
  }

  /* ---------------- Form Builder ---------------- */
  function labelWrap(f, input) {
    var l = el('label', 'fld');
    l.appendChild(el('span', null, f.l));
    l.appendChild(input);
    return l;
  }

  function buildFields(fields, data) {
    var wrap = el('div'), getters = [];
    fields.forEach(function (f) {
      var r = buildField(f, data ? data[f.k] : undefined);
      wrap.appendChild(r.node);
      getters.push([f.k, r.get]);
    });
    return {
      node: wrap,
      get: function () {
        var o = {};
        getters.forEach(function (g) { o[g[0]] = g[1](); });
        return o;
      }
    };
  }

  function buildField(f, val) {
    var t = f.t, input;
    if (t === 'hidden') return { node: el('span'), get: function () { return val; } };
    if (t === 'bool') {
      var cb = el('input', null, null, { type: 'checkbox' });
      cb.checked = !!val;
      var l = el('label', 'chk');
      l.appendChild(cb);
      l.appendChild(document.createTextNode(f.l));
      return { node: l, get: function () { return cb.checked; } };
    }
    if (t === 'list') return listEditor(f, val || []);
    if (t === 'image') return imagePicker(f, val || '');
    if (t === 'textarea') input = el('textarea', null, null, { maxlength: f.max });
    else if (t === 'select') {
      input = el('select');
      f.options.forEach(function (o) { input.appendChild(el('option', null, o, { value: o })); });
    }
    else if (t === 'color') input = el('input', null, null, { type: 'color' });
    else input = el('input', null, null, { type: t === 'email' ? 'email' : t === 'url' ? 'url' : t === 'phone' ? 'tel' : 'text', maxlength: f.max });
    
    input.value = val === undefined || val === null ? '' : val;
    if (f.req) input.required = true;
    return {
      node: labelWrap(f, input),
      get: function () { return input.value; }
    };
  }

  function listEditor(f, items) {
    var box = el('div'), list = el('div', 'items'), rows = [];
    box.appendChild(el('div', 'fieldlabel', f.l));
    box.appendChild(list);

    function refresh() {
      rows.forEach(function (r, i) {
        var d = r.body.get(), name = f.title ? d[f.title] : '';
        r.title.textContent = f.il + ' ' + (i + 1) + (name ? ': ' + name : '');
        r.up.disabled = i === 0;
        r.down.disabled = i === rows.length - 1;
      });
      if (add) add.disabled = rows.length >= f.max;
    }

    function addRow(data, open) {
      var det = el('details', 'item'), sum = el('summary'), title = el('span', 'ititle'), ctl = el('div', 'ictl');
      var body = buildFields(f.item, data), r = { det: det, body: body, title: title };
      det.open = !!open;
      sum.appendChild(title);

      if (!f.fixed) {
        r.up = el('button', null, '↑', { type: 'button', title: 'Kor u qaad' });
        r.down = el('button', null, '↓', { type: 'button', title: 'Hoos u dhig' });
        var rm = el('button', null, '✕', { type: 'button', title: 'Tirtir' });
        ctl.appendChild(r.up);
        ctl.appendChild(r.down);
        ctl.appendChild(rm);
        sum.appendChild(ctl);

        ctl.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); });
        r.up.addEventListener('click', function () { move(r, -1); });
        r.down.addEventListener('click', function () { move(r, 1); });
        rm.addEventListener('click', function () {
          if (rows.length <= f.min) return toast('Ugu yaraan ' + f.min + ' ' + f.il + ' ayaa loo baahan yahay.', false);
          var idx = rows.indexOf(r);
          rows.splice(idx, 1);
          list.removeChild(det);
          refresh();
        });
      }

      det.appendChild(sum);
      var bWrap = el('div', 'ibody');
      bWrap.appendChild(body.node);
      det.appendChild(bWrap);
      list.appendChild(det);
      rows.push(r);
      refresh();
    }

    function move(r, delta) {
      var idx = rows.indexOf(r), n = idx + delta;
      if (n < 0 || n >= rows.length) return;
      var tmp = rows[idx];
      rows[idx] = rows[n];
      rows[n] = tmp;
      if (delta < 0) list.insertBefore(r.det, rows[idx].det);
      else list.insertBefore(rows[idx].det, r.det);
      refresh();
    }

    items.forEach(function (it) { addRow(it, false); });

    var add;
    if (!f.fixed && f.max > f.min) {
      add = el('button', 'btn ghost sm', '+ Ku dar ' + f.il, { type: 'button' });
      add.addEventListener('click', function () {
        var empty = {};
        f.item.forEach(function (fld) { empty[fld.k] = ''; });
        addRow(empty, true);
      });
      box.appendChild(add);
    }
    refresh();

    return {
      node: box,
      get: function () {
        return rows.map(function (r) { return r.body.get(); });
      }
    };
  }

  function imagePicker(f, val) {
    var wrap = el('div'), pick = el('div', 'pick'), thumb = el('div', 'thumb'), ctl = el('div', 'ctl');
    var img = el('img', null, null, { alt: '' });
    if (val) img.src = '/' + val;
    thumb.appendChild(val ? img : el('span', null, 'Sawir ma jiro'));

    var sel = el('select');
    sel.appendChild(el('option', null, 'Dooro Sawir…', { value: '' }));
    images.forEach(function (im) {
      sel.appendChild(el('option', null, im.name + ' (' + im.kind + ')', { value: im.path }));
    });
    sel.value = val || '';
    sel.addEventListener('change', function () {
      fill(thumb, []);
      if (sel.value) {
        img.src = '/' + sel.value;
        thumb.appendChild(img);
      } else {
        thumb.appendChild(el('span', null, 'Sawir ma jiro'));
      }
    });

    ctl.appendChild(sel);
    pick.appendChild(thumb);
    pick.appendChild(ctl);

    wrap.appendChild(el('div', 'fieldlabel', f.l));
    wrap.appendChild(pick);
    return {
      node: wrap,
      get: function () { return sel.value; }
    };
  }

  /* ---------------- Init / Check Session ---------------- */
  api('GET', '/api/admin/session').then(function (d) {
    if (d.authenticated) {
      csrf = d.csrf;
      email = d.email;
      return boot();
    }
    showLogin();
  }).catch(function () {
    showLogin();
  });

})();
