/* Shehryar & Brothers â€” shared scripts: motion system, data, render */
(function () {
      'use strict';
      window.__sbBoot = 1;

      /* ---------- Motion system (advanced animations) ---------- */
      var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

      /* shared scroll-reveal observer + sibling stagger indices */
      var revealIO = null;
      if ('IntersectionObserver' in window) {
        revealIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              revealIO.unobserve(entry.target);
            }
          });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
      }
      function observeReveals(root) {
        (root || document).querySelectorAll('.reveal').forEach(function (el) {
          if (el.dataset.observed) return;
          el.dataset.observed = '1';
          if (revealIO) revealIO.observe(el);
          else el.classList.add('is-visible');
        });
        sweepReveals();
      }
      /* fallback sweep: fast flick-scrolls (mobile) can skip IntersectionObserver
         sampling — verify each reveal synchronously on scroll/resize/timer so
         content NEVER stays stuck at opacity:0 */
      function sweepReveals() {
        var vh = window.innerHeight || 800;
        document.querySelectorAll('.reveal:not(.is-visible)').forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < vh - 40) el.classList.add('is-visible');
        });
      }
      window.addEventListener('scroll', sweepReveals, { passive: true });
      window.addEventListener('resize', sweepReveals);
      setInterval(sweepReveals, 700);
      function stagger(container) {
        if (!container) return;
        container.querySelectorAll('.reveal').forEach(function (el) {
          var sibs = el.parentNode.querySelectorAll(':scope > .reveal');
          var idx = Array.prototype.indexOf.call(sibs, el);
          el.style.setProperty('--i', Math.min(idx, 6));
        });
      }
      ['.services', '.features-grid', '.steps-grid', '.gallery-grid', '.stats-grid', '.rates-wrap'].forEach(function (sel) {
        stagger(document.querySelector(sel));
      });
      observeReveals();

      /* page load: press sheet lifts, then hero entrance plays */
      var heroSection = document.querySelector('.hero');
      var loadSheet = document.getElementById('loadSheet');
      var playHero = function () { if (heroSection) heroSection.classList.add('play'); };
      var liftSheet = function () { if (loadSheet) loadSheet.classList.add('done'); };
      if (reduceMotion) {
        playHero();
        liftSheet();
      } else {
        /* the sheet lifts as soon as the DOM is ready - it used to wait for window 'load'
           (saari images + fonts), isi se loading bohot slow lagti thi */
        var startEntrance = function () {
          setTimeout(function () { liftSheet(); setTimeout(playHero, 160); }, 120);
        };
        if (document.readyState !== 'loading') startEntrance();
        else document.addEventListener('DOMContentLoaded', startEntrance);
        setTimeout(function () { liftSheet(); playHero(); }, 1800); /* failsafe */
      }

      /* stats count-up */
      var statNums = document.querySelectorAll('.stat-num[data-count]');
      if (statNums.length) {
        var runCount = function (el) {
          var target = parseFloat(el.getAttribute('data-count')) || 0;
          var suffix = el.getAttribute('data-suffix') || '';
          if (reduceMotion) { el.textContent = target.toLocaleString('en-US') + suffix; return; }
          var t0 = null, dur = 1150;
          var step = function (ts) {
            if (!t0) t0 = ts;
            var p = Math.min((ts - t0) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased).toLocaleString('en-US') + suffix;
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        };
        if ('IntersectionObserver' in window && !reduceMotion) {
          var countIO = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
              if (en.isIntersecting) { runCount(en.target); countIO.unobserve(en.target); }
            });
          }, { threshold: 0.6 });
          statNums.forEach(function (n) { countIO.observe(n); });
        } else {
          statNums.forEach(runCount);
        }
      }


      /* pointer-only polish: tilt, magnetic, ink cursor */
      if (finePointer && !reduceMotion) {
        try {
        document.querySelectorAll('.service-card, .gallery-item').forEach(function (card) {
          card.addEventListener('pointermove', function (e) {
            var r = card.getBoundingClientRect();
            var rx = ((e.clientY - r.top) / r.height - 0.5) * -5;
            var ry = ((e.clientX - r.left) / r.width - 0.5) * 6;
            card.style.transform = 'translate(-4px,-4px) perspective(850px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
          });
          card.addEventListener('pointerleave', function () { card.style.transform = ''; });
        });

        document.querySelectorAll('.hero-actions .btn, .services-cta .btn, .contact-actions .btn, .rates-note .btn, .share-btns .sbtn').forEach(function (btn) {
          btn.addEventListener('pointermove', function (e) {
            var r = btn.getBoundingClientRect();
            var mx = Math.max(-6, Math.min(6, (e.clientX - (r.left + r.width / 2)) * 0.22));
            var my = Math.max(-6, Math.min(6, (e.clientY - (r.top + r.height / 2)) * 0.3));
            btn.style.setProperty('--mx', mx.toFixed(1) + 'px');
            btn.style.setProperty('--my', my.toFixed(1) + 'px');
          });
          btn.addEventListener('pointerleave', function () {
            btn.style.removeProperty('--mx');
            btn.style.removeProperty('--my');
          });
        });

        var cursor = document.getElementById('inkCursor');
        if (cursor) {
          var mX = innerWidth / 2, mY = innerHeight / 2, cX = mX, cY = mY, cRaf = null;
          var tickCursor = function () {
            cX += (mX - cX) * 0.22;
            cY += (mY - cY) * 0.22;
            cursor.style.transform = 'translate(' + cX.toFixed(1) + 'px,' + cY.toFixed(1) + 'px) translate(-50%,-50%)';
            if (Math.abs(mX - cX) + Math.abs(mY - cY) > 0.5) cRaf = requestAnimationFrame(tickCursor);
            else cRaf = null;
          };
          document.addEventListener('pointermove', function (e) {
            mX = e.clientX; mY = e.clientY;
            cursor.classList.add('on');
            if (!cRaf) cRaf = requestAnimationFrame(tickCursor);
          });
          document.addEventListener('pointerover', function (e) {
            cursor.classList.toggle('big', !!(e.target.closest && e.target.closest('a, button, .item-chip, .service-card, .gallery-item')));
          });
        }
        } catch (err) { /* pointer polish is optional — never block content */ }
      }

      /* ---------- Mobile drawer ---------- */
      var toggle   = document.getElementById('navToggle');
      var menu     = document.getElementById('navMenu');
      var overlay  = document.getElementById('navOverlay');
      var closeBtn = document.getElementById('drawerClose');

      function openMenu() {
        menu.classList.add('open');
        overlay.classList.add('show');
        overlay.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', 'Close menu');
        document.body.style.overflow = 'hidden';
      }
      function closeMenu() {
        menu.classList.remove('open');
        overlay.classList.remove('show');
        overlay.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
        document.body.style.overflow = '';
      }
      function isDrawerMode() { return window.matchMedia('(max-width: 1200px)').matches; }

      toggle.addEventListener('click', function () {
        menu.classList.contains('open') ? closeMenu() : openMenu();
      });
      overlay.addEventListener('click', closeMenu);
      closeBtn.addEventListener('click', closeMenu);
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeMenu();
      });
      menu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () { if (isDrawerMode()) closeMenu(); });
      });
      window.addEventListener('resize', function () {
        if (!isDrawerMode()) closeMenu();
      });

      /* ---------- Sticky header shadow + back-to-top ---------- */
      var header = document.getElementById('siteHeader');
      var toTop  = document.getElementById('toTop');

      var progressBar = document.getElementById('progressBar');
      var heroInner = document.querySelector('.hero .container');

      function onScroll() {
        var y = window.scrollY || window.pageYOffset;
        header.classList.toggle('scrolled', y > 10);
        toTop.classList.toggle('show', y > 450);
        if (progressBar) {
          var max = document.documentElement.scrollHeight - window.innerHeight;
          progressBar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
        }
        if (heroInner && !reduceMotion && y < window.innerHeight) {
          heroInner.style.transform = 'translateY(' + (y * 0.14).toFixed(1) + 'px)';
        }
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();

      toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      /* ---------- Scroll reveal: handled by shared motion system above ---------- */

      /* ---------- Active nav link on scroll ---------- */
      var sections = document.querySelectorAll('main section[id]');
      var navLinks = document.querySelectorAll('.nav-link');

      if ('IntersectionObserver' in window) {
        var spy = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              navLinks.forEach(function (l) {
                var href = l.getAttribute('href') || '';
                /* page links (files) keep their hardcoded active state —
                   spy only manages same-page anchors (#section) */
                if (href.charAt(0) !== '#') return;
                if (href === '#' + entry.target.id) l.classList.add('active');
                else l.classList.remove('active');
              });
            }
          });
        }, { rootMargin: '-45% 0px -50% 0px' });
        sections.forEach(function (s) { spy.observe(s); });
      }

      /* ---------- Rate list data (yahan apne actual rates badlein) ---------- */
      var SERVICE_RATES = [
        { title: 'Photocopy & Printing', note: 'Black & white and colour printing', img: 'img/items/photocopy-machine-full.jpg', rows: [
          ['Photocopy B&W (A4)', 'Rs. 10', '/ page'],
          ['Photocopy B&W (A3)', 'Rs. 20', '/ page'],
          ['Color Print A4', 'Rs. 50', '/ page'],
          ['Color Glossy Print A4', 'Rs. 160', '/ page'],
          ['Color Print A3', 'Rs. 300', '/ page'],
          ['Photo Print 4x6', 'Rs. 15', 'each'],
          ['Photo Print A4', 'Rs. 60', 'each'],
          ['Print from WhatsApp / USB (B&W)', 'Rs. 20', '/ page']
        ]},
        { title: 'Scanning, Lamination & Binding', note: 'Document protection and binding', img: 'img/items/item-136.jpg', rows: [
          ['Scanning A4 (PDF)', 'Rs. 15', '/ page'],
          ['Lamination A4', 'Rs. 100', 'each'],
          ['Lamination A5', 'Rs. 20', 'each'],
          ['Lamination ID Card', 'Rs. 60', 'each'],
          ['Spiral Binding (50 pages)', 'Rs. 300', 'each'],
          /* the 100 page rate must be confirmed with the owner (Rs. 90 did not
             look right next to Rs. 300 for 50 pages) - enable this line once confirmed:
          ['Spiral Binding (100 pages)', 'Rs. 90', 'each'],
          */
          ['Soft Binding / Hard Binding', 'Rs. 150 / 300', 'each']
        ]},
        { title: 'Cards, Typing & Other Services', note: 'ID cards, typing and photos', img: 'img/items/pvc-id-cards.jpg', rows: [
          ['PVC ID Card (with design)', 'Rs. 150', 'each'],
          ['Printed Lanyard', 'Rs. 100', 'each'],
          ['Typing - English', 'Rs. 50', '/ page'],
          ['Typing - Urdu', 'Rs. 70', '/ page'],
          ['Document Compose & Print', 'Rs. 100', '/ page'],
          ['Passport Size Photos', 'Rs. 150', '4 photos'],
          ['Fax', 'Rs. 30', 'per page']
        ]}
      ];

      var STATIONERY_ITEMS = [
        { title: 'Notebooks & Paper', items: [
          ['Register (100 pg)', 'Rs. 150', 'registers'],
          ['Exercise Book (80 pg)', 'Rs. 40', 'notebooks'],
          ['A4 Paper (ream)', 'Rs. 1200', 'a4-paper-ream'],
          ['Chart Paper', 'Rs. 50', 'colour-sheets'],
          ['File Cover', 'Rs. 30', 'gatta-file'],
          ['Envelope', 'Rs. 10', 'envelopes'],
          ['Sticky Notes (pack)', 'Rs. 250', 'sticky-notes']
        ]},
        { title: 'Pens & Pencils', items: [
          ['Ball Pen', 'Rs. 20', 'ball-pen'],
          ['Marker (whiteboard)', 'Rs. 90', 'item-088'],
          ['Highlighter', 'Rs. 80', 'item-084'],
          ['Pencil', 'Rs. 20', 'pencils'],
          ['Colour Pencils (12)', 'Rs. 250', 'colour-pencils'],
          ['Sketch Pens (12)', 'Rs. 200', 'item-079'],
          ['Crayons (12)', 'Rs. 150', 'crayons'],
          ['Eraser', 'Rs. 20', 'eraser'],
          ['Sharpener', 'Rs. 30', 'sharpeners']
        ]},
        { title: 'Office & Geometry', items: [
          ['Scale 30 cm', 'Rs. 40', 'scales'],
          ['Geometry Box', 'Rs. 350', 'geometry-box'],
          ['Glue Stick', 'Rs. 80', 'glue-stick'],
          ['Scissors', 'Rs. 150', 'scissors'],
          ['Stapler + Pins', 'Rs. 250', 'stapler'],
          ['Punching Machine', 'Rs. 400', 'punching-machine'],
          ['Clear Tape', 'Rs. 60', 'tape-dispenser'],
          ['Calculator', 'Rs. 700', 'calculator']
        ]},
        /* ---- NOTE: the rates below are also SAMPLE - edit them once the real rates are confirmed ---- */
        { title: 'School Essentials', items: [
          ['Pencil Box', 'Rs. 350', 'item-064'],
          ['Mechanical Pencil', 'Rs. 150', 'item-121'],
          ['Lead Refills HB (12)', 'Rs. 60', 'item-127'],
          ['Geometry Set', 'Rs. 450', 'item-061'],
          ['ID Card Covers (10 pcs)', 'Rs. 350', 'pvc-id-cards']
        ]},
        { title: 'Art & Craft', items: [
          ['Water Colors (12 cakes)', 'Rs. 250', 'water-colours-2'],
          ['Poster Colors (6 bottles)', 'Rs. 300', 'water-colours'],
          ['Paint Brush Set (5)', 'Rs. 150', 'paint-brushes'],
          ['Drawing Book (A4)', 'Rs. 150', 'drawing-book'],
          ['Oil Pastels (12)', 'Rs. 200', 'item-085']
        ]},
        { title: 'Files & Folders', items: [
          ['Spring File', 'Rs. 60', 'item-105'],
          ['Plastic Folder', 'Rs. 80', 'item-103'],
          ['Ring Binder', 'Rs. 200', 'ring-file']
        ]},
        { title: 'Office Desk', items: [
          ['Tape Dispenser', 'Rs. 350', 'tape-dispenser-2'],
          ['Visiting Cards (100 pcs)', 'Rs. 300', 'id-card-covers'],
          ['Rubber Stamp (self-inking)', 'Rs. 450', 'ink-pads-2'],
          ['Ink Pad', 'Rs. 150', 'ink-pad'],
          ['Fountain Pen', 'Rs. 150', 'fountain-pen'],
          ['Gel Pen', 'Rs. 40', 'gel-pen'],
          ['Sign Pen (fine)', 'Rs. 60', 'gel-pen-2'],
          ['Correction Pen', 'Rs. 120', 'correction-pen'],
          ['Permanent Marker', 'Rs. 150', 'permanent-markers']
        ]},
        { title: 'Printing & Tech', items: [
          ['Photo Paper A4 (10 pcs)', 'Rs. 400', 'card-sheets'],
          ['Sticker Paper A4', 'Rs. 150', 'item-093'],
          ['Thermal Roll 50mm', 'Rs. 200', 'item-098'],
          ['Ink Cartridge', 'Rs. 1200', 'printing-quality'],
          ['USB Drive (16GB)', 'Rs. 600', 'item-129'],
          ['Laminating Pouch A4 (10)', 'Rs. 250', 'item-103']
        ]},
        { title: 'Packs & Bundles', items: [
          ['Paper Clips (box)', 'Rs. 60', 'paper-clips'],
          ['Stapler Pins (box)', 'Rs. 60', 'stapler'],
          ['Bulldog Clip (large)', 'Rs. 150', 'binder-clips']
        ]}
      ];

      (function () {
        var sHost = document.getElementById('ratesServices');
        var iHost = document.getElementById('ratesItems');
        if (!sHost && !iHost) return;

        var out = '';
        if (sHost) {
        SERVICE_RATES.forEach(function (g) {
          out += '<div class="rates-card reveal' + (g.img ? ' has-media' : '') + '">';
          if (g.img) {
            out += '<div class="rate-media"><img src="' + g.img + '" alt="' + g.title + ' - Shehryar and Brothers" loading="lazy" decoding="async"></div>';
          }
          out += '<h3>' + g.title + '</h3><p class="hint">' + g.note + '</p>';
          g.rows.forEach(function (r) {
            out += '<div class="rate-row"><span class="rate-name">' + r[0] + '</span>' +
                   '<span class="rate-dots"></span>' +
                   '<span class="rate-price">' + r[1] + (r[2] ? ' <small>' + r[2] + '</small>' : '') + '</span></div>';
          });
          out += '</div>';
        });
        sHost.innerHTML = out;
        }

        if (iHost) {
        out = '';
        STATIONERY_ITEMS.forEach(function (g) {
          out += '<div class="rates-card reveal"><h3>' + g.title + '</h3><div class="items-grid">';
          g.items.forEach(function (it) {
            var thumb = it[2]
              ? '<img class="item-thumb" src="img/items/' + it[2] + '.jpg" alt="' + it[0] + ' - Shehryar and Brothers" loading="lazy" decoding="async">'
              : '<span class="item-thumb item-thumb-none" aria-hidden="true">' + it[0].charAt(0) + '</span>';
            out += '<div class="item-chip">' + thumb +
                   '<span class="item-info"><b>' + it[0] + '</b><span class="price">' + it[1] + '</span></span></div>';
          });
          out += '</div></div>';
        });
        iHost.innerHTML = out;
        }

        stagger(sHost);
        stagger(iHost);
        observeReveals(sHost);
        observeReveals(iHost);
      })();

      /* ---------- Item photo wall lightbox ---------- */
      (function () {
        var walls = document.querySelectorAll('.item-wall');
        if (!walls.length) return;
        var links = [];
        walls.forEach(function (w) {
          Array.prototype.forEach.call(w.querySelectorAll('a.item-tile'), function (a) { links.push(a); });
        });
        if (!links.length) return;

        var lb = document.createElement('div');
        lb.className = 'lightbox';
        lb.setAttribute('role', 'dialog');
        lb.setAttribute('aria-modal', 'true');
        lb.setAttribute('aria-label', 'Item photo viewer');
        lb.hidden = true;
        lb.innerHTML =
          '<button class="lb-btn lb-close" type="button" aria-label="Close viewer">&#215;</button>' +
          '<button class="lb-btn lb-prev" type="button" aria-label="Previous photo">&#8249;</button>' +
          '<button class="lb-btn lb-next" type="button" aria-label="Next photo">&#8250;</button>' +
          '<figure class="lb-figure"><img alt="" decoding="async"><figcaption class="lb-cap"></figcaption></figure>';
        document.body.appendChild(lb);

        var lbImg = lb.querySelector('img');
        var lbCap = lb.querySelector('.lb-cap');
        var cur = -1, lastFocus = null, total = links.length;

        function show(i) {
          cur = ((i % total) + total) % total;
          var a = links[cur];
          var src = a.getAttribute('href');
          var cap = a.getAttribute('data-cap') || '';
          lbImg.src = src;
          lbImg.alt = cap || 'Shehryar & Brothers item photo';
          lbCap.textContent = (cap ? cap + ' \u2014 ' : '') + (cur + 1) + ' / ' + total;
        }
        function open(i) {
          lastFocus = document.activeElement;
          show(i);
          lb.hidden = false;
          document.body.style.overflow = 'hidden';
          var c = lb.querySelector('.lb-close');
          if (c) c.focus();
        }
        function close() {
          lb.hidden = true;
          lbImg.removeAttribute('src');
          document.body.style.overflow = '';
          if (lastFocus && lastFocus.focus) lastFocus.focus();
        }

        Array.prototype.forEach.call(links, function (a, i) {
          a.addEventListener('click', function (e) {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
            e.preventDefault();
            open(i);
          });
        });
        lb.addEventListener('click', function (e) {
          if (e.target === lb || e.target.closest('.lb-close')) { close(); return; }
          if (e.target.closest('.lb-prev')) { show(cur - 1); return; }
          if (e.target.closest('.lb-next')) { show(cur + 1); }
        });
        document.addEventListener('keydown', function (e) {
          if (lb.hidden) return;
          if (e.key === 'Escape') close();
          else if (e.key === 'ArrowLeft') show(cur - 1);
          else if (e.key === 'ArrowRight') show(cur + 1);
        });

        /* phone: swipe left/right = next/prev, swipe down = band */
        var sx = 0, sy = 0, tracking = false;
        lb.addEventListener('touchstart', function (e) {
          if (e.touches.length !== 1) { tracking = false; return; }
          sx = e.touches[0].clientX;
          sy = e.touches[0].clientY;
          tracking = true;
        }, { passive: true });
        lb.addEventListener('touchend', function (e) {
          if (!tracking) return;
          tracking = false;
          var t = e.changedTouches[0];
          var dx = t.clientX - sx;
          var dy = t.clientY - sy;
          if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.3) {
            show(cur + (dx < 0 ? 1 : -1));
          } else if (dy > 70 && Math.abs(dy) > Math.abs(dx) * 1.3) {
            close();
          }
        }, { passive: true });
      })();

      /* ---------- Share buttons ---------- */
      var pageUrl = window.location.href;
      var shareText = 'Shehryar & Brothers - Stationery, Printing & Digital Services. WhatsApp: 0301-1808840';
      var waBtn = document.getElementById('shareWa');
      var fbBtn = document.getElementById('shareFb');
      if (waBtn) waBtn.href = 'https://wa.me/?text=' + encodeURIComponent(shareText + '\n' + pageUrl);
      if (fbBtn) fbBtn.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(pageUrl);

      var copyBtn = document.getElementById('copyLink');
      var copyLabel = document.getElementById('copyLabel');
      if (copyBtn) {
        copyBtn.addEventListener('click', function () {
          var done = function () {
            copyBtn.classList.add('copied');
            copyLabel.textContent = 'Copied!';
            setTimeout(function () {
              copyBtn.classList.remove('copied');
              copyLabel.textContent = 'Link Copy';
            }, 1800);
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(pageUrl).then(done, done);
          } else {
            var ta = document.createElement('textarea');
            ta.value = pageUrl;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch (e) {}
            document.body.removeChild(ta);
            done();
          }
        });
      }

      /* ---------- Footer year ---------- */
      var yearEl = document.getElementById('year');
      if (yearEl) yearEl.textContent = new Date().getFullYear();

      /* all motion/reveal machinery is up - tell the head watchdog that JS works */
      document.documentElement.classList.add('fx-ready');
    })();
