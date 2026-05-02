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

  const res = await fetch(
    `https://api.modrinth.com/v2/search?query=${query}&limit=10`
  );
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

renderModpack();