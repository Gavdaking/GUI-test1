const API_KEY = "d586ad07866a8ce4a557aa933dab7b92";

class SearchComponent {

  constructor() {
    this.input = document.getElementById("searchInput");
    this.results = document.getElementById("results");
    this.app = document.getElementById("app");

    // NEW (Week 2 elements)
    this.movieTitle = document.getElementById("movieTitle");
    this.movieOverview = document.getElementById("movieOverview");
    this.castList = document.getElementById("castList");
    this.videoContainer = document.getElementById("videoContainer");

    this.debounceTimer = null;

    this.init();
  }

  init() {
    this.input.addEventListener("input", (e) => this.handleInput(e));
  }

  handleInput(e) {
    const query = e.target.value.trim();

    clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout(() => {
      this.search(query);
    }, 300);
  }

  async search(query) {

    if (!query) {
      this.results.innerHTML = "";
      return;
    }

    this.app.dataset.loading = "true";

    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${query}`
      );

      const data = await res.json();

      this.renderResults(data.results);

    } catch (err) {
      console.error("Fetch error:", err);
    }

    this.app.dataset.loading = "false";
  }

  renderResults(results) {

    this.results.innerHTML = "";

    results.forEach(movie => {

      const li = document.createElement("li");
      li.className = "result-item";
      li.textContent = movie.title;

      // ✅ WEEK 2: click to load details
      li.addEventListener("click", () => {
        this.fetchMovieDetails(movie.id);
      });

      this.results.appendChild(li);
    });
  }

  // ================= WEEK 2 =================

  async fetchMovieDetails(movieId) {

    this.app.dataset.loading = "true";

    try {

      const [detailsRes, creditsRes, videosRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}`),
        fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${API_KEY}`),
        fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}`)
      ]);

      const details = await detailsRes.json();
      const credits = await creditsRes.json();
      const videos = await videosRes.json();

      this.displayDetails(details, credits.cast, videos.results);

    } catch (err) {
      console.error("Details error:", err);
    }

    this.app.dataset.loading = "false";
  }

  displayDetails(details, cast, videos) {

    // Title + Overview
    this.movieTitle.textContent = details.title;
    this.movieOverview.textContent = details.overview || "No description available.";

    // ===== CAST =====
    this.castList.innerHTML = "";

    cast.slice(0, 5).forEach(actor => {
      const li = document.createElement("li");
      li.textContent = actor.name;
      this.castList.appendChild(li);
    });

    // ===== TRAILER =====
    this.videoContainer.innerHTML = "";

    const trailer = videos.find(
      v => v.type === "Trailer" && v.site === "YouTube"
    );

    if (trailer) {
      const iframe = document.createElement("iframe");
      iframe.width = "100%";
      iframe.height = "315";
      iframe.src = `https://www.youtube.com/embed/${trailer.key}`;
      iframe.frameBorder = "0";
      iframe.allowFullscreen = true;

      this.videoContainer.appendChild(iframe);
    } else {
      this.videoContainer.textContent = "No trailer available.";
    }
  }
}

new SearchComponent(); 