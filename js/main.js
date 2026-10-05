// スクロールで要素をふわっと表示
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// ナビ: 現在のセクションをハイライト
const links = [...document.querySelectorAll('.nav a[href^="#"]')];
const spy = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main section[id]').forEach((s) => spy.observe(s));

// モバイルメニュー
const toggle = document.querySelector('.nav-toggle');
const menu = document.querySelector('.nav ul');
toggle.addEventListener('click', () => menu.classList.toggle('open'));
menu.addEventListener('click', () => menu.classList.remove('open'));


// 背景: スクロール量(0〜1)に合わせて縦長画像の表示位置を 0%〜100% へ動かす
const root = document.documentElement;
function updateBg() {
  const max = root.scrollHeight - window.innerHeight;
  const p = max > 0 ? window.scrollY / max : 0;
  root.style.setProperty('--bgy', (p * 100).toFixed(2) + '%');
}
updateBg();
window.addEventListener('scroll', updateBg, { passive: true });
window.addEventListener('resize', updateBg);


// ===== テーマ切り替え(顔写真をクリック)=====
// retro(モノクロアニメ風) ⇄ pop(カラフル・モダン)。<html data-theme="..."> を書き換えるだけで、
// 色・フォント・背景などの見た目は CSS 側が [data-theme="pop"] で切り替えます。
const THEME_KEY = 'portfolio-theme';
const avatar = document.querySelector('.avatar');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function setTheme(theme) {
  root.dataset.theme = theme;
  avatar.setAttribute('aria-pressed', String(theme === 'pop'));
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* 保存できない環境では無視 */ }
}
avatar.setAttribute('aria-pressed', String(root.dataset.theme === 'pop'));

avatar.addEventListener('click', () => {
  const next = root.dataset.theme === 'pop' ? 'retro' : 'pop';

  // View Transitions API 非対応 or 視覚効果を減らす設定なら、即切り替え
  if (!document.startViewTransition || reduceMotion) { setTheme(next); return; }

  // 写真の中心から円が広がるように新しい見た目へ切り替える
  const r = avatar.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

  const transition = document.startViewTransition(() => setTheme(next));
  transition.ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 800, easing: 'cubic-bezier(.4, 0, .2, 1)', pseudoElement: '::view-transition-new(root)' }
    );
  });
});


// ===== 作品の詳細ダイアログ =====
// カードの data-open="game-xxx" と、<dialog id="game-xxx"> を対応させて開きます。
const dialogs = [...document.querySelectorAll('dialog.game-dialog')];

function loadVideo(dialog) {
  const box = dialog.querySelector('.video[data-yt]');
  if (!box || box.querySelector('iframe')) return;
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube-nocookie.com/embed/${box.dataset.yt}?rel=0`;
  iframe.title = dialog.querySelector('h3').textContent + ' のプレイ動画';
  iframe.allow = 'accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen';
  iframe.allowFullscreen = true;
  box.appendChild(iframe);
}
function unloadVideo(dialog) {
  // 閉じたら iframe ごと外して、再生を止める
  const iframe = dialog.querySelector('.video iframe');
  if (iframe) iframe.remove();
}
function openGame(id) {
  const dialog = document.getElementById(id);
  if (!dialog || dialog.open) return;
  loadVideo(dialog);
  dialog.showModal();
  history.replaceState(null, '', '#' + id);   // 共有用: URLの末尾 #game-xxx で直接開ける
}

document.querySelectorAll('[data-open]').forEach((btn) => {
  btn.addEventListener('click', () => openGame(btn.dataset.open));
});
dialogs.forEach((dialog) => {
  dialog.addEventListener('close', () => {
    unloadVideo(dialog);
    history.replaceState(null, '', '#works');
  });
  // ダイアログの外側(背景の暗い部分)をクリックしたら閉じる
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
});
// URLに #game-xxx が付いていたら、読み込み時にそのまま開く
if (location.hash.startsWith('#game-')) openGame(location.hash.slice(1));
