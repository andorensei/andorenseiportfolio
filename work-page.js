/* ============================================================
   作品ページ(work-a.html / work-b.html)の写真の入れ替え

   サムネイルを押すと、上の大きい写真が入れ替わります。
   大きい写真を押す／矢印／キーボードの ← → でも送れます。

   HTML 側でやることは、サムネイルの button に
     data-type="image" data-src="写真のファイル"  …… 写真
     data-type="video" data-src="映像のファイル"  …… 映像
     data-type="audio" data-src="音のファイル"    …… 音
   と書くことだけです。JavaScript 側は直さなくて大丈夫です。

   コンセプト文をはさんでサムネイルが下に離れている形(型B)でも、
   押したときに大きい写真の位置まで自動で戻ります。

   JavaScript が動かない環境では、1枚目がそのまま表示され、
   サムネイルも全部見えます(壊れません)。
   ============================================================ */

(function () {
  'use strict';

  var viewer = document.getElementById('viewer');
  var thumbs = document.getElementById('thumbs');
  if (!viewer || !thumbs) return;

  var list = Array.prototype.slice.call(thumbs.querySelectorAll('.thumb'));
  var vNow = document.getElementById('vNow');
  var vAll = document.getElementById('vAll');
  var prev = document.getElementById('vPrev');
  var next = document.getElementById('vNext');
  if (!list.length) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var at = Math.max(0, list.indexOf(thumbs.querySelector('.thumb.is-on')));
  if (vAll) vAll.textContent = pad(list.length);

  /* --- 表示を入れ替える --- */

  function show(i, keepView) {
    i = (i + list.length) % list.length;
    at = i;

    var b    = list[i];
    var type = b.dataset.type || 'image';
    var src  = b.dataset.src;
    var alt  = b.dataset.alt || '';

    list.forEach(function (x) { x.classList.remove('is-on'); });
    b.classList.add('is-on');
    if (vNow) vNow.textContent = pad(i + 1);

    viewer.classList.add('is-swapping');

    setTimeout(function () {
      viewer.innerHTML = '';

      if (type === 'video') {
        var v = document.createElement('video');
        v.src = src;
        v.controls = true;
        v.playsInline = true;
        v.preload = 'metadata';
        if (b.dataset.poster) v.poster = b.dataset.poster;
        viewer.appendChild(v);

      } else if (type === 'audio') {
        var box = document.createElement('div');
        box.className = 'viewer__audio';
        var a = document.createElement('audio');
        a.src = src;
        a.controls = true;
        a.preload = 'metadata';
        box.appendChild(a);
        viewer.appendChild(box);

      } else {
        var img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        viewer.appendChild(img);
      }

      viewer.classList.remove('is-swapping');
      if (!keepView) bringViewerIntoSight();
    }, reduce ? 0 : 180);
  }

  /* 大きい写真が画面の外にあるときだけ、そこまで戻る */
  function bringViewerIntoSight() {
    var r = viewer.getBoundingClientRect();
    var h = window.innerHeight || document.documentElement.clientHeight;
    if (r.top >= 0 && r.bottom <= h) return;
    viewer.scrollIntoView({
      block: 'center',
      behavior: reduce ? 'auto' : 'smooth'
    });
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* --- 操作 --- */

  list.forEach(function (b, i) {
    b.addEventListener('click', function () { if (i !== at) show(i); });
  });

  if (prev) prev.addEventListener('click', function () { show(at - 1, true); });
  if (next) next.addEventListener('click', function () { show(at + 1, true); });

  /* 大きい写真を押しても次へ進む(映像と音のときは邪魔しない) */
  viewer.addEventListener('click', function (e) {
    if (e.target.tagName === 'VIDEO' || e.target.tagName === 'AUDIO') return;
    show(at + 1, true);
  });

  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft')  show(at - 1, true);
    if (e.key === 'ArrowRight') show(at + 1, true);
  });

  /* 先に読み込んでおくと、切り替わりが止まりません */
  list.forEach(function (b) {
    if ((b.dataset.type || 'image') !== 'image') return;
    var pre = new Image();
    pre.src = b.dataset.src;
  });
})();
