let modpack = JSON.parse(localStorage.getItem("modpack")) || [];

function renderModpack() {
  const ul = document.getElementById("modpack");
  ul.innerHTML = "";

  modpack.forEach(mod => {
    const li = document.createElement("li");
    li.textContent = mod.title;
    ul.appendChild(li);
  });
}

async function buscar() {
  const query = document.getElementById("search").value;
  const version = document.getElementById("version").value;
  const loader = document.getElementById("loader").value;
  const category = document.getElementById("category").value;

  let facets = [
    ["project_type:mod"]
  ];

  if (category) {
    facets = [[`project_type:${category}`]];
  }

  if (version) {
    facets.push([`versions:${version}`]);
  }

  if (loader) {
    facets.push([`categories:${loader}`]);
  }

  const url = `https://api.modrinth.com/v2/search?query=${query}&facets=${encodeURIComponent(JSON.stringify(facets))}`;

  const res = await fetch(url);
  const data = await res.json();

  const container = document.getElementById("results");
  container.innerHTML = "";

  data.hits.forEach(mod => {
    const div = document.createElement("div");

    div.innerHTML = `
      <b>${mod.title}</b>
      <p>${mod.description}</p>
      <button>Adicionar</button>
    `;

    div.querySelector("button").onclick = () => {
      modpack.push(mod);
      localStorage.setItem("modpack", JSON.stringify(modpack));
      renderModpack();
    };

    container.appendChild(div);
  });
}

async function baixar() {
  const version = document.getElementById("version").value;
  const loader = document.getElementById("loader").value;

  const res = await fetch("/download", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ modpack, version, loader })
  });

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "modpack.zip";
  a.click();
}

async function carregarVersoes() {
  const res = await fetch("https://api.modrinth.com/v2/tag/game_version");
  const versoes = await res.json();

  const select = document.getElementById("version");
  select.innerHTML = "";

  versoes
    .filter(v => v.version_type === "release")
    .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
    .forEach(v => {
      const option = document.createElement("option");
      option.value = v.version;
      option.textContent = v.version;
      select.appendChild(option);
    });
}
carregarVersoes();
renderModpack();
