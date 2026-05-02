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
    facets[0] = [`project_type:${category}`];
  }

  if (version) {
    facets.push([`versions:${version}`]);
  }

  if (loader) {
    facets.push([`loaders:${loader}`]);
  }

  const url = `https://api.modrinth.com/v2/search?query=${query}&facets=${encodeURIComponent(JSON.stringify(facets))}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Erro na busca");
    
    const data = await res.json();

    const container = document.getElementById("results");
    container.innerHTML = "";

    if (data.hits.length === 0) {
      container.innerHTML = "<p>Nenhum mod encontrado</p>";
      return;
    }

    data.hits.forEach(mod => {
      const div = document.createElement("div");

      div.innerHTML = `
        <b>${mod.title}</b>
        <p>${mod.description}</p>
        <button>Adicionar</button>
      `;

      div.querySelector("button").onclick = () => {
        if (!modpack.find(m => m.id === mod.id)) {
          modpack.push(mod);
          localStorage.setItem("modpack", JSON.stringify(modpack));
          renderModpack();
        } else {
          alert("Este mod já foi adicionado");
        }
      };

      container.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    document.getElementById("results").innerHTML = "<p style='color: red;'>Erro ao buscar mods</p>";
  }
}

async function baixar() {
  const version = document.getElementById("version").value;
  const loader = document.getElementById("loader").value;

  if (!version || !loader) {
    alert("Selecione versão e loader");
    return;
  }

  if (modpack.length === 0) {
    alert("Adicione mods ao modpack primeiro");
    return;
  }

  try {
    const res = await fetch("/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ modpack, version, loader })
    });

    if (!res.ok) throw new Error("Erro ao baixar");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "modpack.zip";
    a.click();
  } catch (err) {
    console.error(err);
    alert("Erro ao baixar o modpack");
  }
}

async function carregarVersoes() {
  try {
    const res = await fetch("https://api.modrinth.com/v2/tag/game_version");
    const versoes = await res.json();

    const select = document.getElementById("version");
    select.innerHTML = "<option value=''>Selecione uma versão</option>";

    versoes
      .filter(v => v.version_type === "release")
      .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
      .forEach(v => {
        const option = document.createElement("option");
        option.value = v.version;
        option.textContent = v.version;
        select.appendChild(option);
      });
  } catch (err) {
    console.error(err);
  }
}

carregarVersoes();
renderModpack();