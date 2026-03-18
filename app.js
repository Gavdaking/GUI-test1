const API_KEY = "d586ad07866a8ce4a557aa933dab7b92";

class SearchComponent {

  constructor() {
    this.input = document.getElementById("searchInput");
    this.results = document.getElementById("results");
    this.app = document.getElementById("app");

    this.debounceTimer = null;

    this.init();
  }

  init() {
    this.input.addEventListener("input", (e) => this.handleInput(e));
  }

  handleInput(e) {

    const query = e.target.value.trim();

    // debounce
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

    // show loading
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

    // hide loading
    this.app.dataset.loading = "false";
  }

  renderResults(results) {

    this.results.innerHTML = "";

    results.forEach(movie => {

      const li = document.createElement("li");
      li.className = "result-item";
      li.textContent = movie.title;

      this.results.appendChild(li);

    });
  }

}

new SearchComponent();