/* Arcadium portfolio — starfield, nav, lite video embeds, GSAP scroll animations. */
(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hoverCapable = window.matchMedia("(hover: hover)").matches;

  /* ---------- Starfield (canvas, 3 parallax depth layers) ---------- */
  const canvas = document.getElementById("starfield");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let stars = [];
    let w = 0;
    let h = 0;
    let pointerX = 0;
    let pointerY = 0;
    let lerpX = 0;
    let lerpY = 0;
    let rafId = null;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(220, Math.floor((w * h) / 6500));
      stars = Array.from({ length: count }, () => {
        const depth = 0.25 + Math.random() * 0.75; // far → near
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          depth,
          r: depth * 1.4,
          twinkle: Math.random() * Math.PI * 2,
          speed: 0.02 + depth * 0.05,
          hue: Math.random() < 0.12 ? "rgba(62,224,255," : Math.random() < 0.06 ? "rgba(255,78,205," : "rgba(226,232,240,",
        };
      });
    }

    function draw(time) {
      ctx.clearRect(0, 0, w, h);
      const scroll = window.scrollY;
      lerpX += (pointerX - lerpX) * 0.04;
      lerpY += (pointerY - lerpY) * 0.04;

      for (const s of stars) {
        // Slow upward drift + parallax from scroll and pointer, all scaled by depth.
        const drift = reducedMotion ? 0 : (time * 0.01 * s.speed) % (h + 8);
        let y = s.y - drift - scroll * s.depth * 0.25;
        let x = s.x + lerpX * s.depth * 18;
        y += lerpY * s.depth * 12;
        y = ((y % (h + 8)) + h + 8) % (h + 8) - 4;
        x = ((x % (w + 8)) + w + 8) % (w + 8) - 4;

        const alpha = reducedMotion
          ? 0.7
          : 0.45 + 0.45 * Math.sin(s.twinkle + time * 0.0012 * (0.5 + s.depth));
        ctx.beginPath();
        ctx.fillStyle = s.hue + alpha * s.depth + ")";
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function loop(time) {
      draw(time);
      rafId = requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener("resize", () => {
      resize();
      if (reducedMotion) draw(0);
    });

    if (hoverCapable && !reducedMotion) {
      window.addEventListener(
        "pointermove",
        (e) => {
          pointerX = (e.clientX / w - 0.5) * 2;
          pointerY = (e.clientY / h - 0.5) * 2;
        },
        { passive: true }
      );
    }

    if (reducedMotion) {
      draw(0); // static sky
      window.addEventListener("scroll", () => draw(0), { passive: true });
    } else {
      rafId = requestAnimationFrame(loop);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          cancelAnimationFrame(rafId);
          rafId = null;
        } else if (!rafId) {
          rafId = requestAnimationFrame(loop);
        }
      });
    }
  }

  /* ---------- Header: solid background after scrolling ---------- */
  const header = document.getElementById("site-header");
  function onScrollHeader() {
    header.classList.toggle("bg-space-950/85", window.scrollY > 24);
    header.classList.toggle("backdrop-blur-md", window.scrollY > 24);
    header.classList.toggle("border-b", window.scrollY > 24);
    header.classList.toggle("border-white/10", window.scrollY > 24);
  }
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ---------- Mobile menu ---------- */
  const menuBtn = document.getElementById("menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", () => {
      const open = mobileMenu.classList.toggle("hidden") === false;
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    mobileMenu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        mobileMenu.classList.add("hidden");
        menuBtn.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* ---------- Card pointer glow ---------- */
  if (hoverCapable) {
    document.querySelectorAll(".card").forEach((card) => {
      card.addEventListener(
        "pointermove",
        (e) => {
          const rect = card.getBoundingClientRect();
          card.style.setProperty("--mx", e.clientX - rect.left + "px");
          card.style.setProperty("--my", e.clientY - rect.top + "px");
        },
        { passive: true }
      );
    });
  }

  /* ---------- Lite YouTube: swap facade for iframe on demand ---------- */
  document.querySelectorAll(".yt-lite").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.ytId;
      if (!id || btn.querySelector("iframe")) return;
      const iframe = document.createElement("iframe");
      iframe.src =
        "https://www.youtube-nocookie.com/embed/" +
        encodeURIComponent(id) +
        "?autoplay=1&rel=0";
      iframe.title = btn.dataset.ytTitle || "Game trailer";
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      btn.append(iframe);
      iframe.focus();
    });
  });

  /* ---------- Copy email (mailto fallback) ---------- */
  const copyBtn = document.getElementById("copy-email");
  if (copyBtn) {
    let resetTimer = null;
    copyBtn.addEventListener("click", async () => {
      const email = copyBtn.dataset.email;
      try {
        await navigator.clipboard.writeText(email);
        copyBtn.textContent = "Copied ✓";
      } catch {
        copyBtn.textContent = email; // clipboard unavailable: show the address itself
      }
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => (copyBtn.textContent = "Copy email"), 2000);
    });
  }

  /* ---------- Footer year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- GSAP scroll animations (progressive enhancement) ---------- */
  function initGsap() {
    if (reducedMotion || typeof window.gsap === "undefined") return;
    const gsap = window.gsap;
    if (typeof window.ScrollTrigger !== "undefined") {
      gsap.registerPlugin(window.ScrollTrigger);
    }

    // Hero intro: masked line reveal, then supporting elements.
    const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
    intro
      .from(".hero-line", {
        yPercent: 115,
        rotate: 3,
        duration: 1.1,
        stagger: 0.12,
        delay: 0.15,
      })
      .from(
        '[data-hero="eyebrow"]',
        { autoAlpha: 0, y: 16, duration: 0.7 },
        "-=0.7"
      )
      .from('[data-hero="sub"]', { autoAlpha: 0, y: 24, duration: 0.7 }, "-=0.5")
      .from('[data-hero="cta"]', { autoAlpha: 0, y: 24, duration: 0.7 }, "-=0.5")
      .from('[data-hero="scroll"]', { autoAlpha: 0, duration: 0.9 }, "-=0.3");

    if (typeof window.ScrollTrigger === "undefined") return;

    // Hero content drifts up slightly faster than the scroll (foreground parallax).
    gsap.to("#hero-inner", {
      yPercent: -12,
      autoAlpha: 0.25,
      ease: "none",
      scrollTrigger: {
        trigger: "#hero-inner",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    // Nebulae scroll at different speeds (background parallax).
    document.querySelectorAll(".nebula").forEach((el) => {
      gsap.to(el, {
        y: () => -window.innerHeight * parseFloat(el.dataset.depth || "0.3"),
        ease: "none",
        scrollTrigger: { trigger: document.body, start: "top top", end: "max", scrub: true },
      });
    });

    // Section reveals.
    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      gsap.from(el, {
        autoAlpha: 0,
        y: 44,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 87%" },
      });
    });

    // Grouped reveals stagger their children.
    gsap.utils.toArray("[data-reveal-group]").forEach((group) => {
      gsap.from(group.children, {
        autoAlpha: 0,
        y: 36,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: group, start: "top 85%" },
      });
    });
  }

  // Scripts are deferred and execute in order, so GSAP is already present here;
  // the readyState guard covers direct execution edge cases.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGsap);
  } else {
    initGsap();
  }
})();
