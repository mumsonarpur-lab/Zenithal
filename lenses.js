const ZENITHAL_LENSES = {
  all: "",
  human: " (site:reddit.com OR site:://ycombinator.com OR site:medium.com OR inurl:blog)",
  code: " (site:github.com OR site:stackoverflow.com OR site:developer.mozilla.org)",
  local: " (Kolkata OR \"West Bengal\" OR India) news",
  academic: " (site:arxiv.org OR filetype:pdf)"
};

const ZENITHAL_BANGS = {
  "!gh": "https://github.com",
  "!yt": "https://youtube.com",
  "!w": "https://wikipedia.org",
  "!r": "https://reddit.com"
};

let currentLens = "all";

function selectZenithalLens(lensKey, buttonElement) {
  currentLens = lensKey;
  document.querySelectorAll(".zenithal-lens-btn").forEach(btn => {
    btn.style.background = "transparent";
    btn.style.color = "inherit";
  });
  buttonElement.style.background = "#10b981";
  buttonElement.style.color = "#ffffff";
}

function processZenithalQuery(rawQuery) {
  const query = rawQuery.trim();
  const words = query.split(" ");
  const firstWord = words[0].toLowerCase();

  if (ZENITHAL_BANGS[firstWord]) {
    const cleanQuery = encodeURIComponent(words.slice(1).join(" "));
    window.open(ZENITHAL_BANGS[firstWord] + cleanQuery, "_blank");
    return null;
  }

  return query + (ZENITHAL_LENSES[currentLens] || "");
}
