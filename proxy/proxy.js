// proxy.js
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = "AIzaSyB7LLaKiTbQaHbtlIO-Jcvvqg5ryEpc-9c"; // Substitua pela sua chave de API do Google

app.get("/distance", async (req, res) => {
  try {
    const { origins, destinations } = req.query;
    if (!origins || !destinations) {
      return res.status(400).json({ error: "Os parâmetros 'origins' e 'destinations' são obrigatórios." });
    }

    // Constrói a URL para a API Distance Matrix
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&key=${API_KEY}`;
    console.log("[Proxy] URL solicitada ao Google:", url);

    const response = await fetch(url);
    console.log("[Proxy] Status da resposta do Google:", response.status, response.statusText);

    if (!response.ok) {
      const text = await response.text();
      console.error("[Proxy] Resposta do Google:", text);
      return res.status(response.status).json({ error: "Erro na requisição à API do Google." });
    }

    const data = await response.json();
    console.log("[Proxy] Dados recebidos do Google:", data);
    res.json(data);
  } catch (error) {
    console.error("[Proxy] Erro durante a requisição:", error);
    res.status(500).json({ error: "Erro interno no servidor." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor proxy rodando em http://localhost:${PORT}`);
});
