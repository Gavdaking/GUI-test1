const API_KEY = "d586ad07866a8ce4a557aa933dab7b92";

class SearchComponent {
  constructor() {
    this.input = document.getElementById("searchInput");
    this.results = document.getElementById("results");
    this.app = document.getElementById("app");

    this.movieTitle = document.getElementById("movieTitle");
    this.movieOverview = document.getElementById("movieOverview");
    this.castList = document.getElementById("castList");
    this.videoContainer = document.getElementById("videoContainer");

    this.template = document.getElementById("movie-template");

    this.debounceTimer = null;
    this.controller = null; // AbortController
    this.cache = new Map(); // caching

    this.activeIndex = -1;

    this.init();
  }

  init() {
    this.input.addEventListener("input", (e) => this.handleInput(e));
    this.input.addEventListener("keydown", (e) => this.handleKeyNav(e));
  }

  // ================= DEBOUNCE =================
  handleInput(e) {
    const query = e.target.value.trim();

    clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout(() => {
      this.search(query);
    }, 300);
  }

  // ================= SEARCH =================
  async search(query) {
    if (!query) {
      this.results.innerHTML = "";
      return;
    }

    // CACHE HIT
    if (this.cache.has(query)) {
      this.renderResults(this.cache.get(query), query);
      return;
    }

    // ABORT previous request
    if (this.controller) {
      this.controller.abort();
    }

    this.controller = new AbortController();

    this.app.dataset.loading = "true";

    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${query}`,
        { signal: this.controller.signal }
      );

      const data = await res.json();

      this.cache.set(query, data.results);

      this.renderResults(data.results, query);

    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Fetch error:", err);
      }
    }

    this.app.dataset.loading = "false";
  }

  // ================= RENDER (FRAGMENT + TEMPLATE) =================
  renderResults(results, query) {
    this.results.innerHTML = "";
    this.activeIndex = -1;

    const frag = new DocumentFragment();

    results.forEach((movie, index) => {
      const clone = this.template.content.cloneNode(true);
      const titleEl = clone.querySelector(".title");

      // SAFE highlight (NO innerHTML)
      titleEl.appendChild(this.buildHighlightedTitle(movie.title, query));

      const li = clone.querySelector("li");

      li.addEventListener("click", () => {
        this.fetchMovieDetails(movie.id);
      });

      frag.appendChild(clone);
    });

    this.results.appendChild(frag);
  }

  // ================= HIGHLIGHT (XSS SAFE) =================
  buildHighlightedTitle(title, query) {
    const container = document.createElement("span");

    const idx = title.toLowerCase().indexOf(query.toLowerCase());

    if (idx === -1) {
      container.textContent = title;
      return container;
    }

    const before = document.createTextNode(title.slice(0, idx));

    const match = document.createElement("span");
    match.className = "highlight";
    match.textContent = title.slice(idx, idx + query.length);

    const after = document.createTextNode(title.slice(idx + query.length));

    container.appendChild(before);
    container.appendChild(match);
    container.appendChild(after);

    return container;
  }

  // ================= KEYBOARD NAV =================
  handleKeyNav(e) {
    const items = this.results.querySelectorAll(".result-item");

    if (!items.length) return;

    if (e.key === "ArrowDown") {
      this.activeIndex = (this.activeIndex + 1) % items.length;
      this.updateActive(items);
    }

    if (e.key === "ArrowUp") {
      this.activeIndex =
        (this.activeIndex - 1 + items.length) % items.length;
      this.updateActive(items);
    }

    if (e.key === "Enter" && this.activeIndex >= 0) {
      items[this.activeIndex].click();
    }
  }

  updateActive(items) {
    items.forEach((el) => el.classList.remove("active"));
    items[this.activeIndex].classList.add("active");
  }

  // ================= DETAILS (ALLSETTLED) =================
  async fetchMovieDetails(movieId) {
    this.app.dataset.loading = "true";

    try {
      const results = await Promise.allSettled([
        fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}`),
        fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${API_KEY}`),
        fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}`)
      ]);

      const details = results[0].status === "fulfilled"
        ? await results[0].value.json()
        : null;

      const credits = results[1].status === "fulfilled"
        ? await results[1].value.json()
        : null;

      const videos = results[2].status === "fulfilled"
        ? await results[2].value.json()
        : null;

      this.displayDetails(
        details,
        credits?.cast || [],
        videos?.results || []
      );

    } catch (err) {
      console.error("Details error:", err);
    }

    this.app.dataset.loading = "false";
  }

  // ================= DISPLAY DETAILS =================
  displayDetails(details, cast, videos) {
    this.movieTitle.textContent = details?.title || "Unavailable";
    this.movieOverview.textContent =
      details?.overview || "No description available.";

    this.castList.innerHTML = "";

    cast.slice(0, 5).forEach(actor => {
      const li = document.createElement("li");
      li.textContent = actor.name;
      this.castList.appendChild(li);
    });

    this.videoContainer.innerHTML = "";

    const trailer = videos.find(
      v => v.type === "Trailer" && v.site === "YouTube"
    );

    if (trailer) {
      const iframe = document.createElement("iframe");
      iframe.width = "100%";
      iframe.height = "315";
      iframe.src = `https://www.youtube.com/embed/${trailer.key}`;
      iframe.allowFullscreen = true;

      this.videoContainer.appendChild(iframe);
    } else {
      this.videoContainer.textContent = "No trailer available.";
    }
  }
}

new SearchComponent();