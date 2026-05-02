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

  const tempDir = "./temp";
  const modsDir = path.join(tempDir, "mods");

  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
  if (!fs.existsSync(modsDir)) fs.mkdirSync(modsDir);

  try {
    for (let mod of mods) {
      const versions = await axios.get(
        `https://api.modrinth.com/v2/project/${mod.id}/version`
      );

      const match = versions.data.find(v =>
        v.game_versions.includes(version) &&
        v.loaders.includes(loader)
      );

      if (!match) continue; 
      if (mod.project_type !== "mod") continue;
      
      const fileUrl = match.files[0].url;
      const filePath = path.join(modsDir, match.files[0].filename);

      const response = await axios({
        url: fileUrl,
        method: "GET",
        responseType: "stream"
      });

      await new Promise((resolve) => {
        const stream = fs.createWriteStream(filePath);
        response.data.pipe(stream);
        stream.on("finish", resolve);
      });
    }

    const zipPath = path.join(tempDir, "modpack.zip");
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip");

    archive.pipe(output);
    archive.directory(modsDir, "mods");
    await archive.finalize();

    output.on("close", () => {
      res.download(zipPath, "modpack.zip", () => {
        fs.rmSync(tempDir, { recursive: true, force: true });
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao gerar modpack");
  }
});

app.listen(3000, () => console.log("Rodando na porta 3000"));
