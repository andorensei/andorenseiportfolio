/* ============================================================
   ページ遷移の演出

   WORKS へ行くときは「映像」でつなぎます。
     ① トップページがブレて暗くなる        (0.26秒)
     ② カメラを横に振った映像が流れる      (0.50秒)
     ③ 映像が消えると、壁のページになる    (0.20秒)

   ABOUT へ行くときは、パソコンの画面が広がる演出です。

   ▼ WORKS の演出を変えたいときは、すぐ下の WORKS_MODE を
     書き換えてください。
       'video' … 映像でつなぐ(標準)
       'enter' … 緑の画面が広がって、その中に入る
       'pan'   … カメラが左へ動くように、画面が流れる
       'wipe'  … 緑の帯が横切って、めくれると次のページ
       'whip'  … 映像なしで、ブレながら左へ振る

   JavaScript が動かない環境では、普通にページが切り替わる
   だけで中身は全部見られます(壊れません)。
   ============================================================ */

var WORKS_MODE = 'video';
var ABOUT_MODE = 'enter';

(function () {
  'use strict';

  var OUT_MS = { video: 260, enter: 520, pan: 460, wipe: 520, whip: 380 };
  /* 2種類用意してあります。ブラウザが再生できるほうが選ばれます */
  var VIDEO_SRC = [
    { src: 'img/whip.mp4',  type: 'video/mp4'  },
    { src: 'img/whip.webm', type: 'video/webm' }
  ];
  var FADE_MS   = 200;   /* 映像が消えるのにかける時間 */

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===== 出ていくとき ===== */

  var panel = document.querySelector('.panel');
  var links = document.querySelectorAll('.panel__nav a');

  if (links.length && !reduce) {
    Array.prototype.forEach.call(links, function (a) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();

        var href = a.getAttribute('href');
        var mode = (href.indexOf('works') !== -1) ? WORKS_MODE : ABOUT_MODE;

        if (mode === 'video') {
          document.body.classList.add('is-blurring-out');

        } else if (mode === 'enter' && panel) {
          var box = panel.getBoundingClientRect();
          var veil = document.createElement('div');
          veil.className = 'veil';
          veil.style.left   = box.left   + 'px';
          veil.style.top    = box.top    + 'px';
          veil.style.width  = box.width  + 'px';
          veil.style.height = box.height + 'px';
          document.body.appendChild(veil);
          raf2(function () { veil.classList.add('veil--full'); });

        } else if (mode === 'pan') {
          document.body.classList.add('is-panning-out');

        } else if (mode === 'whip') {
          document.body.classList.add('is-whipping-out');

        } else if (mode === 'wipe') {
          var bar = document.createElement('div');
          bar.className = 'wipe';
          document.body.appendChild(bar);
          raf2(function () { bar.classList.add('wipe--in'); });
        }

        try { sessionStorage.setItem('fromScreen', mode); } catch (err) {}
        setTimeout(function () { location.href = href; }, OUT_MS[mode] || 500);
      });
    });
  }

  /* ===== 入ってきたとき ===== */

  var came = null;
  try {
    came = sessionStorage.getItem('fromScreen');
    sessionStorage.removeItem('fromScreen');
  } catch (err) {}

  if (reduce || !came || document.body.dataset.enter !== 'screen') return;

  if (came === 'video') {
    playWhip();
  } else {
    document.body.classList.add('is-entering', 'enter--' + came);
  }

  /* --- 映像を一度だけ流して、終わったら消す --- */

  function playWhip() {
    var v = document.createElement('video');
    v.className = 'whipvid';
    VIDEO_SRC.forEach(function (f) {
      var s = document.createElement('source');
      s.src = f.src;
      s.type = f.type;
      v.appendChild(s);
    });
    v.muted = true;
    v.defaultMuted = true;
    v.autoplay = true;
    v.playsInline = true;
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.setAttribute('aria-hidden', 'true');
    v.preload = 'auto';

    var done = false;
    function finish() {
      if (done) return;
      done = true;
      v.classList.add('whipvid--out');
      setTimeout(function () {
        if (v.parentNode) v.parentNode.removeChild(v);
      }, FADE_MS + 60);
    }

    /* 終わりぎわから薄くしていく(壁への切り替わりを隠します) */
    v.addEventListener('timeupdate', function () {
      if (v.duration && v.currentTime >= v.duration - FADE_MS / 1000) finish();
    });
    v.addEventListener('ended', finish);
    v.addEventListener('error', finish);

    /* 読み込めなかったときは、待たずにすぐ壁を出します */
    var loaded = false;
    v.addEventListener('loadeddata', function () { loaded = true; });
    setTimeout(function () { if (!loaded) finish(); }, 600);

    /* 念のため。何かあっても1.6秒で必ず消えます */
    setTimeout(finish, 1600);

    document.body.appendChild(v);

    var p = v.play();
    if (p && typeof p.catch === 'function') {
      p.catch(function () { finish(); });   /* 自動再生が止められた場合 */
    }
  }

  function raf2(fn) {
    requestAnimationFrame(function () { requestAnimationFrame(fn); });
  }
})();
