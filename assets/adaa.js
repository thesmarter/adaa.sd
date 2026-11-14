/* Adaa product pages — shared behaviour: language switch, navigation,
   scroll progress, reveal motion, toasts and number formatting. */
(function () {
  "use strict";

  var SHARED = {
    ar: {
      brandBy: "Adaa · by SmartTeam",
      navHome: "الرئيسية",
      navTravel: "أداء ترافل",
      navPay: "أداء باي",
      navProducts: "المنتجات",
      navContact: "تواصل معنا",
      navCta: "اطلب عرضًا",
      footerAbout: "منظومة أداء من SmartTeam — حلول رقمية مترابطة لإدارة أعمال المؤسسات، من التعلّم والموارد إلى السفر والمدفوعات.",
      footerProducts: "المنتجات",
      footerExplore: "استكشف",
      footerCompany: "الشركة",
      footerRequest: "طلب استشارة",
      footerAllProducts: "كل منتجات أداء",
      footerTravel: "AdaaTravel — السفر والسياحة",
      footerPay: "AdaaPay — المدفوعات",
      rights: "جميع الحقوق محفوظة.",
      skip: "تخطَّ إلى المحتوى",
      langSwitch: "EN — switch to English",
      menuOpen: "فتح القائمة",
      demoNotice: "واجهة تجريبية — لا تُنفذ أي عملية حقيقية."
    },
    en: {
      brandBy: "Adaa · by SmartTeam",
      navHome: "Home",
      navTravel: "AdaaTravel",
      navPay: "AdaaPay",
      navProducts: "Products",
      navContact: "Contact",
      navCta: "Request a demo",
      footerAbout: "The Adaa suite by SmartTeam — connected digital solutions for organizations, from learning and resources to travel and payments.",
      footerProducts: "Products",
      footerExplore: "Explore",
      footerCompany: "Company",
      footerRequest: "Request a consultation",
      footerAllProducts: "All Adaa products",
      footerTravel: "AdaaTravel — travel & tourism",
      footerPay: "AdaaPay — payments",
      rights: "All rights reserved.",
      skip: "Skip to content",
      langSwitch: "عربي — التبديل إلى العربية",
      menuOpen: "Open menu",
      demoNotice: "Concept interface — no real transaction is performed."
    }
  };

  var listeners = [];
  var lang = "ar";
  try {
    if (localStorage.getItem("adaa-lang") === "en") lang = "en";
  } catch (error) {
    /* storage can be blocked; Arabic remains the default */
  }

  function t(key) {
    var page = window.PAGE_I18N || {};
    if (page[lang] && typeof page[lang][key] !== "undefined") return page[lang][key];
    if (SHARED[lang] && typeof SHARED[lang][key] !== "undefined") return SHARED[lang][key];
    return key;
  }

  function fmt(value, digits) {
    var n = Number(value) || 0;
    return n.toLocaleString("en-US", {
      minimumFractionDigits: digits || 0,
      maximumFractionDigits: digits || 0
    });
  }

  function apply(language) {
    lang = language === "en" ? "en" : "ar";
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.body.dir = lang === "ar" ? "rtl" : "ltr";

    var meta = (window.PAGE_META || {})[lang] || (window.PAGE_META || {}).ar;
    if (meta) {
      if (meta.title) document.title = meta.title;
      if (meta.description) {
        var description = document.querySelector('meta[name="description"]');
        if (description) description.setAttribute("content", meta.description);
        var ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription) ogDescription.setAttribute("content", meta.description);
      }
    }

    var pageDict = window.PAGE_I18N || {};

    document.querySelectorAll("[data-i18n]").forEach(function (element) {
      var value = pageDict[lang] && pageDict[lang][element.dataset.i18n];
      if (typeof value === "undefined") value = SHARED[lang] && SHARED[lang][element.dataset.i18n];
      if (typeof value !== "undefined") element.innerHTML = value;
    });

    document.querySelectorAll("[data-i18n-aria]").forEach(function (element) {
      var value = pageDict[lang] && pageDict[lang][element.dataset.i18nAria];
      if (typeof value === "undefined") value = SHARED[lang] && SHARED[lang][element.dataset.i18nAria];
      if (typeof value !== "undefined") element.setAttribute("aria-label", value);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (element) {
      var value = pageDict[lang] && pageDict[lang][element.dataset.i18nPlaceholder];
      if (typeof value === "undefined") value = SHARED[lang] && SHARED[lang][element.dataset.i18nPlaceholder];
      if (typeof value !== "undefined") element.setAttribute("placeholder", value);
    });

    var toggle = document.getElementById("langToggle");
    if (toggle) {
      toggle.textContent = lang === "ar" ? "EN" : "عربي";
      toggle.setAttribute("aria-label", t("langSwitch"));
    }
    var nav = document.getElementById("navLinks");
    if (nav) nav.classList.remove("open");

    try {
      localStorage.setItem("adaa-lang", lang);
    } catch (error) {
      /* ignore */
    }

    listeners.forEach(function (listener) {
      try {
        listener(lang);
      } catch (error) {
        /* a page-level renderer must never break the switch */
      }
    });
  }

  function toast(message) {
    var element = document.getElementById("toast");
    if (!element) {
      element = document.createElement("div");
      element.id = "toast";
      element.className = "toast";
      element.setAttribute("role", "status");
      document.body.appendChild(element);
    }
    element.textContent = message;
    element.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () {
      element.classList.remove("show");
    }, 3200);
  }

  document.documentElement.classList.add("js-motion");

  var header = document.querySelector(".site-header");
  var sentinel = document.getElementById("topSentinel");
  if (header && sentinel && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      header.classList.toggle("scrolled", !entries[0].isIntersecting);
    }, { threshold: 0 }).observe(sentinel);
  }

  var progress = document.getElementById("scrollProgress");
  if (progress) {
    var scrollable = 0;
    var queued = false;
    var update = function () {
      queued = false;
      if (scrollable > 0) progress.style.transform = "scaleX(" + Math.min(1, window.scrollY / scrollable) + ")";
    };
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        scrollable = document.documentElement.scrollHeight - window.innerHeight;
        update();
      }).observe(document.documentElement);
    }
    window.addEventListener("scroll", function () {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
  }

  var toggle = document.getElementById("langToggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      apply(lang === "ar" ? "en" : "ar");
    });
  }

  var menu = document.getElementById("menuBtn");
  var nav = document.getElementById("navLinks");
  if (menu && nav) {
    menu.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
      });
    });
  }

  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var siblings = Array.prototype.slice.call(entry.target.parentElement.querySelectorAll(".reveal"));
        var index = Math.max(0, siblings.indexOf(entry.target));
        entry.target.style.transitionDelay = Math.min(index * 70, 280) + "ms";
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    document.querySelectorAll(".reveal").forEach(function (element) {
      revealObserver.observe(element);
    });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  window.ADAA = {
    get lang() { return lang; },
    t: t,
    fmt: fmt,
    toast: toast,
    setLanguage: apply,
    onChange: function (listener) {
      listeners.push(listener);
      listener(lang);
    }
  };

  apply(lang);

  /* Page dictionaries are declared in inline scripts after this file, so
     re-apply once the document is parsed. Keeps the load order flexible. */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { apply(lang); });
  }
})();
