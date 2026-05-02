const express = require("express");
const axios = require("axios");
const archiver = require("archiver");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.post("/download", async (req, res) => {
  const { mods, version, loader } = req.body;

  if (!mods || !version || !loader) {
    return res.status(400).send("Versão, loader e mods são obrigatórios");
  }

  if (!Array.isArray(mods) || mods.length === 0) {
    return res.status(400).send("Nenhum mod selecionado");
  }

  const tempDir = "./temp";
  const modsDir = path.join(tempDir, "mods");

  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
  if (!fs.existsSync(modsDir)) fs.mkdirSync(modsDir);

  try {
    for (let mod of mods) {
      if (!mod.id) {
        console.warn("Mod sem ID:", mod);
        continue;
      }

      try {
        const versions = await axios.get(
          `https://api.modrinth.com/v2/project/${mod.id}/version`
        );

        const match = versions.data.find(v =>
          v.game_versions.includes(version) &&
          v.loaders.includes(loader)
        );

        if (!match) {
          console.log(`Nenhuma versão compatível para ${mod.title}`);
          continue;
        }

        if (!match.files || match.files.length === 0) {
          console.log(`Nenhum arquivo para ${mod.title}`);
          continue;
        }

        const fileUrl = match.files[0].url;
        const filePath = path.join(modsDir, match.files[0].filename);

        const response = await axios({
          url: fileUrl,
          method: "GET",
          responseType: "stream"
        });

        await new Promise((resolve, reject) => {
          const stream = fs.createWriteStream(filePath);
          response.data.pipe(stream);
          stream.on("finish", resolve);
          stream.on("error", reject);
        });

        console.log(`Baixado: ${match.files[0].filename}`);
      } catch (modErr) {
        console.error(`Erro ao processar mod ${mod.title}:`, modErr.message);
        continue;
      }
    }

    const zipPath = path.join(tempDir, "modpack.zip");
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(output);
    archive.directory(modsDir, "mods");
    await archive.finalize();

    output.on("close", () => {
      res.download(zipPath, "modpack.zip", (err) => {
        fs.rmSync(tempDir, { recursive: true, force: true });
        if (err) console.error("Erro ao enviar arquivo:", err);
      });
    });

  } catch (err) {
    console.error("Erro ao gerar modpack:", err);
    fs.rmSync(tempDir, { recursive: true, force: true });
    res.status(500).send("Erro ao gerar modpack: " + err.message);
  }
});

app.listen(3000, () => console.log("Rodando na porta 3000"));