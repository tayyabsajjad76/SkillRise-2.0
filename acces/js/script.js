// document.addEventListener("DOMContentLoaded", function () {
//   const track = document.getElementById("featureTrack");
//   const dotsContainer = document.getElementById("featureDots");
//   const prevBtn = document.getElementById("sliderPrev");
//   const nextBtn = document.getElementById("sliderNext");

//   if (track && dotsContainer && prevBtn && nextBtn) {
//     const slides = track.querySelectorAll(".feature-slide");
//     let current = 0;
//     let autoTimer;

//     function getSlidesVisible() {
//       if (window.innerWidth <= 600) return 1;
//       if (window.innerWidth <= 991) return 2;
//       return 3;
//     }

//     function totalSteps() {
//       return slides.length - getSlidesVisible() + 1;
//     }

//     function buildDots() {
//       dotsContainer.innerHTML = "";
//       const steps = totalSteps();
//       for (let i = 0; i < steps; i++) {
//         const btn = document.createElement("button");
//         btn.className = "slider-dot" + (i === current ? " active" : "");
//         btn.setAttribute("aria-label", "Go to slide " + (i + 1));
//         btn.addEventListener("click", () => goTo(i));
//         dotsContainer.appendChild(btn);
//       }
//     }

//     function updateDots() {
//       dotsContainer.querySelectorAll(".slider-dot").forEach((d, i) => {
//         d.classList.toggle("active", i === current);
//       });
//     }

//     function goTo(index) {
//       const steps = totalSteps();
//       current = Math.max(0, Math.min(index, steps - 1));
//       const slideWidth = slides[0].offsetWidth + 24;
//       track.style.transform = `translateX(-${current * slideWidth}px)`;
//       updateDots();
//     }

//     function slide(dir) {
//       const steps = totalSteps();
//       let next = current + dir;
//       if (next >= steps) next = 0;
//       if (next < 0) next = steps - 1;
//       goTo(next);
//       resetAuto();
//     }

//     function resetAuto() {
//       clearInterval(autoTimer);
//       autoTimer = setInterval(() => slide(1), 3500);
//     }

//     prevBtn.addEventListener("click", () => slide(-1));
//     nextBtn.addEventListener("click", () => slide(1));

//     window.addEventListener("resize", () => {
//       buildDots();
//       goTo(0);
//     });

//     buildDots();
//     resetAuto();
//   }
// });

// document.addEventListener("DOMContentLoaded", function () {
//   function getVisibleCount(trackId) {
//     if (window.innerWidth >= 601 && window.innerWidth <= 991) return 2;
//     return 1;
//   }

//   function initResponsiveSlider(trackId, prevId, nextId, dotsId) {
//     const track = document.getElementById(trackId);
//     const prevBtn = document.getElementById(prevId);
//     const nextBtn = document.getElementById(nextId);
//     const dotsContainer = document.getElementById(dotsId);
//     if (!track || !prevBtn || !nextBtn || !dotsContainer) return;

//     const slides = track.querySelectorAll(":scope > div");
//     let current = 0;

//     function totalSteps() {
//       const visible = getVisibleCount(trackId);
//       return Math.max(1, slides.length - visible + 1);
//     }

//     function buildDots() {
//       dotsContainer.innerHTML = "";
//       const steps = totalSteps();
//       for (let i = 0; i < steps; i++) {
//         const btn = document.createElement("button");
//         btn.className = "slider-dot" + (i === current ? " active" : "");
//         btn.setAttribute("aria-label", "Slide " + (i + 1));
//         btn.addEventListener("click", () => goTo(i));
//         dotsContainer.appendChild(btn);
//       }
//     }

//     function updateDots() {
//       dotsContainer.querySelectorAll(".slider-dot").forEach((d, i) => {
//         d.classList.toggle("active", i === current);
//       });
//     }

//     function goTo(index) {
//       const steps = totalSteps();
//       current = Math.max(0, Math.min(index, steps - 1));
//       const gap = 16;
//       const slideWidth = slides[0].offsetWidth + gap;
//       track.style.transform = "translateX(-" + current * slideWidth + "px)";
//       updateDots();
//     }

//     prevBtn.addEventListener("click", () => {
//       const steps = totalSteps();
//       goTo(current - 1 < 0 ? steps - 1 : current - 1);
//     });
//     nextBtn.addEventListener("click", () => {
//       const steps = totalSteps();
//       goTo(current + 1 >= steps ? 0 : current + 1);
//     });

//     // Touch swipe support
//     let startX = 0;
//     track.addEventListener(
//       "touchstart",
//       (e) => {
//         startX = e.touches[0].clientX;
//       },
//       { passive: true },
//     );
//     track.addEventListener(
//       "touchend",
//       (e) => {
//         const steps = totalSteps();
//         const diff = startX - e.changedTouches[0].clientX;
//         if (Math.abs(diff) > 40) {
//           goTo(
//             diff > 0
//               ? current + 1 >= steps
//                 ? 0
//                 : current + 1
//               : current - 1 < 0
//                 ? steps - 1
//                 : current - 1,
//           );
//         }
//       },
//       { passive: true },
//     );

//     window.addEventListener("resize", () => {
//       buildDots();
//       goTo(0);
//     });

//     buildDots();
//     goTo(0);
//   }

//   initResponsiveSlider("stepsTrack", "stepsPrev", "stepsNext", "stepsDots");
//   initResponsiveSlider("valuesTrack", "valuesPrev", "valuesNext", "valuesDots");

//   let activeCoursesTrackId = "coursesTrack-all";

//   function initCoursesSlider(trackId) {
//     activeCoursesTrackId = trackId;

//     [
//       "coursesTrack-all",
//       "coursesTrack-bachelor",
//       "coursesTrack-masters",
//     ].forEach((id) => {
//       const t = document.getElementById(id);
//       if (t) t.style.display = id === trackId ? "flex" : "none";
//     });
//     initResponsiveSlider(trackId, "coursesPrev", "coursesNext", "coursesDots");
//   }

//   document.querySelectorAll("#courseTab .nav-link").forEach((btn) => {
//     btn.addEventListener("click", function () {
//       const target = this.getAttribute("data-bs-target"); // e.g. #tab-all
//       const map = {
//         "#tab-all": "coursesTrack-all",
//         "#tab-bachelor": "coursesTrack-bachelor",
//         "#tab-masters": "coursesTrack-masters",
//       };
//       if (map[target]) initCoursesSlider(map[target]);
//     });
//   });

//   initCoursesSlider("coursesTrack-all");
// });








 // ── SECTION LOADER ──
      const sections = [
        'sections/home.html',
        'sections/about.html',
        'sections/howitworks.html',
        'sections/features.html',
        'sections/schedule.html',
        'sections/courses.html',
        'sections/gamification.html',
        'sections/vision.html',
        'sections/mission.html',
        'sections/values.html',
        'sections/priorities.html',
        'sections/cta.html',
        'sections/footer.html'
      ];

      async function loadSections() {
        const app = document.getElementById('app');
        for (const url of sections) {
          const res  = await fetch(url);
          const html = await res.text();
          const div  = document.createElement('div');
          div.innerHTML = html;
          app.appendChild(div);
        }

     
        if (typeof Auth !== 'undefined') Auth.init();

       
        document.querySelectorAll('[data-auth-start]').forEach(btn => {
          btn.addEventListener('click', e => {
            e.preventDefault();
            const user = Auth.getCurrentUser();
            if (user) {
              window.location.href = btn.dataset.href || 'features-hub.html';
            } else {
              window._authRedirect = btn.dataset.href || 'features-hub.html';
              Auth.open('signup');
            }
          });
        });

      
        var params = new URLSearchParams(window.location.search);
        if (params.get('auth') === 'required') {
          window._authRedirect = 'features-hub.html';
          Auth.open('login');
          history.replaceState(null, '', window.location.pathname);
        }

       
        if (typeof initSliders === 'function') initSliders();
      }

      loadSections();


document.addEventListener("DOMContentLoaded", function () {
  const track = document.getElementById("featureTrack");
  const dotsContainer = document.getElementById("featureDots");
  const prevBtn = document.getElementById("sliderPrev");
  const nextBtn = document.getElementById("sliderNext");

  if (track && dotsContainer && prevBtn && nextBtn) {
    const slides = track.querySelectorAll(".feature-slide");
    let current = 0;
    let autoTimer;

    function getSlidesVisible() {
      if (window.innerWidth <= 600) return 1;
      if (window.innerWidth <= 991) return 2;
      return 3;
    }

    function totalSteps() {
      return slides.length - getSlidesVisible() + 1;
    }

    function buildDots() {
      dotsContainer.innerHTML = "";
      const steps = totalSteps();
      for (let i = 0; i < steps; i++) {
        const btn = document.createElement("button");
        btn.className = "slider-dot" + (i === current ? " active" : "");
        btn.setAttribute("aria-label", "Go to slide " + (i + 1));
        btn.addEventListener("click", () => goTo(i));
        dotsContainer.appendChild(btn);
      }
    }

    function updateDots() {
      dotsContainer.querySelectorAll(".slider-dot").forEach((d, i) => {
        d.classList.toggle("active", i === current);
      });
    }

    function goTo(index) {
      const steps = totalSteps();
      current = Math.max(0, Math.min(index, steps - 1));
      const slideWidth = slides[0].offsetWidth + 24;
      track.style.transform = `translateX(-${current * slideWidth}px)`;
      updateDots();
    }

    function slide(dir) {
      const steps = totalSteps();
      let next = current + dir;
      if (next >= steps) next = 0;
      if (next < 0) next = steps - 1;
      goTo(next);
      resetAuto();
    }

    function resetAuto() {
      clearInterval(autoTimer);
      autoTimer = setInterval(() => slide(1), 3500);
    }

    prevBtn.addEventListener("click", () => slide(-1));
    nextBtn.addEventListener("click", () => slide(1));

    window.addEventListener("resize", () => {
      buildDots();
      goTo(0);
    });

    buildDots();
    resetAuto();
  }
});


document.addEventListener("DOMContentLoaded", function () {
  function getVisibleCount(trackId) {

    if (window.innerWidth >= 601 && window.innerWidth <= 991) return 2;
    return 1;
  }

  function initResponsiveSlider(trackId, prevId, nextId, dotsId) {
    const track = document.getElementById(trackId);
    const prevBtn = document.getElementById(prevId);
    const nextBtn = document.getElementById(nextId);
    const dotsContainer = document.getElementById(dotsId);
    if (!track || !prevBtn || !nextBtn || !dotsContainer) return;

    const slides = track.querySelectorAll(":scope > div");
    let current = 0;

    function totalSteps() {
      const visible = getVisibleCount(trackId);
      return Math.max(1, slides.length - visible + 1);
    }

    function buildDots() {
      dotsContainer.innerHTML = "";
      const steps = totalSteps();
      for (let i = 0; i < steps; i++) {
        const btn = document.createElement("button");
        btn.className = "slider-dot" + (i === current ? " active" : "");
        btn.setAttribute("aria-label", "Slide " + (i + 1));
        btn.addEventListener("click", () => goTo(i));
        dotsContainer.appendChild(btn);
      }
    }

    function updateDots() {
      dotsContainer.querySelectorAll(".slider-dot").forEach((d, i) => {
        d.classList.toggle("active", i === current);
      });
    }

    function goTo(index) {
      const steps = totalSteps();
      current = Math.max(0, Math.min(index, steps - 1));
      const gap = 16;
      const slideWidth = slides[0].offsetWidth + gap;
      track.style.transform = "translateX(-" + current * slideWidth + "px)";
      updateDots();
    }

    prevBtn.addEventListener("click", () => {
      const steps = totalSteps();
      goTo(current - 1 < 0 ? steps - 1 : current - 1);
    });
    nextBtn.addEventListener("click", () => {
      const steps = totalSteps();
      goTo(current + 1 >= steps ? 0 : current + 1);
    });

 
    let startX = 0;
    track.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
      },
      { passive: true },
    );
    track.addEventListener(
      "touchend",
      (e) => {
        const steps = totalSteps();
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) {
          goTo(
            diff > 0
              ? current + 1 >= steps
                ? 0
                : current + 1
              : current - 1 < 0
                ? steps - 1
                : current - 1,
          );
        }
      },
      { passive: true },
    );

    window.addEventListener("resize", () => {
      buildDots();
      goTo(0);
    });

    buildDots();
    goTo(0);
  }

  initResponsiveSlider("stepsTrack", "stepsPrev", "stepsNext", "stepsDots");
  initResponsiveSlider("valuesTrack", "valuesPrev", "valuesNext", "valuesDots");

  let activeCoursesTrackId = "coursesTrack-all";

  function initCoursesSlider(trackId) {
    activeCoursesTrackId = trackId;

    [
      "coursesTrack-all",
      "coursesTrack-bachelor",
      "coursesTrack-masters",
    ].forEach((id) => {
      const t = document.getElementById(id);
      if (t) t.style.display = id === trackId ? "flex" : "none";
    });
    initResponsiveSlider(trackId, "coursesPrev", "coursesNext", "coursesDots");
  }


  document.querySelectorAll("#courseTab .nav-link").forEach((btn) => {
    btn.addEventListener("click", function () {
      const target = this.getAttribute("data-bs-target"); // e.g. #tab-all
      const map = {
        "#tab-all": "coursesTrack-all",
        "#tab-bachelor": "coursesTrack-bachelor",
        "#tab-masters": "coursesTrack-masters",
      };
      if (map[target]) initCoursesSlider(map[target]);
    });
  });


  initCoursesSlider("coursesTrack-all");
});

     
