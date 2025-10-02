// ========== Thunderply Landing Page JS (no frameworks) ==========

// 1) Mobile menu toggle (placeholder for future drawer/links)
const menuBtn = document.querySelector('.mobile-menu-btn');
menuBtn?.addEventListener('click', () => {
  const expanded = menuBtn.getAttribute('aria-expanded') === 'true';
  menuBtn.setAttribute('aria-expanded', String(!expanded));
  alert('Mobile menu placeholder — add links or a drawer later.');
});

// 2) Scroll reveal animation (skips if user prefers reduced motion)
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReduced) {
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('show');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));
}

// 3) Preview Search button (just a friendly message for now)
document.querySelector('.btn-primary')?.addEventListener('click', () => {
  alert('This is a preview. Use “Let’s Get Started” to try the real search (coming soon)!');
});