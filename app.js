/* Arcadium portfolio: starfield, nav, lite video embeds, GSAP scroll animations. */
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
  const progress = document.getElementById("scroll-progress");
  function onScrollHeader() {
    const scrolled = window.scrollY > 24;
    header.classList.toggle("bg-space-950/85", scrolled);
    header.classList.toggle("backdrop-blur-md", scrolled);
    header.classList.toggle("border-b", scrolled);
    header.classList.toggle("border-white/10", scrolled);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ")";
    }
  }
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  window.addEventListener("resize", onScrollHeader);

  /* ---------- Nav: highlight the section in view ---------- */
  const navLinks = document.querySelectorAll(".nav-link[data-nav]");
  if (navLinks.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) =>
            link.classList.toggle("is-active", link.dataset.nav === entry.target.id)
          );
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    navLinks.forEach((link) => {
      const section = document.getElementById(link.dataset.nav);
      if (section) observer.observe(section);
    });
  }

  /* ---------- Ticker: fill the screen and loop seamlessly ---------- */
  const marqueeTrack = document.querySelector(".marquee-track");
  const marqueeGroup = marqueeTrack && marqueeTrack.querySelector(".marquee-group");
  if (marqueeTrack && marqueeGroup) {
    const SPEED = 50; // pixels per second, the same at every screen width
    let builtForWidth = 0;

    const buildMarquee = () => {
      const viewport = window.innerWidth;
      if (viewport === builtForWidth) return; // mobile URL bars change height, not width
      builtForWidth = viewport;

      marqueeTrack.querySelectorAll(".marquee-group[data-clone]").forEach((n) => n.remove());
      const groupWidth = marqueeGroup.getBoundingClientRect().width;
      if (!groupWidth) return;

      // After shifting left by one group, the remaining copies must still cover the screen.
      const copies = Math.ceil(viewport / groupWidth) + 1;
      for (let i = 0; i < copies; i++) {
        const clone = marqueeGroup.cloneNode(true);
        clone.dataset.clone = "";
        marqueeTrack.append(clone);
      }

      marqueeTrack.style.setProperty("--marquee-distance", groupWidth + "px");
      marqueeTrack.style.setProperty("--marquee-duration", groupWidth / SPEED + "s");
      if (!reducedMotion) {
        marqueeTrack.classList.remove("is-running");
        void marqueeTrack.offsetWidth; // restart the animation with the new distance
        marqueeTrack.classList.add("is-running");
      }
    };

    // The pixel font changes the group width, so measure after it has loaded.
    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    fontsReady.then(buildMarquee);

    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(buildMarquee, 150);
    });
  }

  /* ---------- Hero: rotating genre word ---------- */
  const rotator = document.getElementById("rotator");
  if (rotator && !reducedMotion) {
    const words = (rotator.dataset.words || "").split("|").filter(Boolean);
    if (words.length > 1) {
      // Screen readers keep the full static sentence; the animated word is decorative.
      const srText = document.createElement("span");
      srText.className = "sr-only";
      srText.textContent = rotator.textContent.trim();
      rotator.after(srText);
      rotator.setAttribute("aria-hidden", "true");
      rotator.style.transition = "opacity 0.3s ease, transform 0.3s ease";

      let index = 0;
      rotator.textContent = words[0];
      setInterval(() => {
        if (document.hidden) return;
        rotator.style.opacity = "0";
        rotator.style.transform = "translateY(0.35em)";
        setTimeout(() => {
          index = (index + 1) % words.length;
          rotator.textContent = words[index];
          rotator.style.opacity = "1";
          rotator.style.transform = "none";
        }, 300);
      }, 2200);
    }
  }

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
        '[data-hero="pill"], [data-hero="eyebrow"]',
        { autoAlpha: 0, y: 16, duration: 0.7, stagger: 0.1 },
        "-=0.8"
      )
      .from('[data-hero="role"]', { autoAlpha: 0, y: 24, duration: 0.7 }, "-=0.5")
      .from('[data-hero="sub"]', { autoAlpha: 0, y: 24, duration: 0.7 }, "-=0.5")
      .from('[data-hero="cta"]', { autoAlpha: 0, y: 24, duration: 0.7 }, "-=0.5")
      .from(
        '[data-hero="spotlight"]',
        { autoAlpha: 0, x: 60, rotate: 8, duration: 1.1 },
        "-=1.4"
      )
      .from('[data-hero="scroll"]', { autoAlpha: 0, duration: 0.9 }, "-=0.3");

    // The featured-game card floats gently once it has landed.
    gsap.to('[data-hero="spotlight"]', {
      y: -12,
      duration: 3.2,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      delay: 1.6,
    });

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
    // Elements pause their own CSS transitions while revealing, and the inline
    // transform is cleared afterwards so hover effects keep working.
    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      el.classList.add("is-revealing");
      gsap.from(el, {
        autoAlpha: 0,
        y: 44,
        duration: 0.9,
        ease: "power3.out",
        clearProps: "transform",
        scrollTrigger: { trigger: el, start: "top 87%" },
        onComplete: () => el.classList.remove("is-revealing"),
      });
    });

    // Grouped reveals stagger their children.
    gsap.utils.toArray("[data-reveal-group]").forEach((group) => {
      const items = Array.from(group.children);
      items.forEach((item) => item.classList.add("is-revealing"));
      gsap.from(items, {
        autoAlpha: 0,
        y: 36,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
        clearProps: "transform",
        scrollTrigger: { trigger: group, start: "top 85%" },
        onComplete: () => items.forEach((item) => item.classList.remove("is-revealing")),
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
