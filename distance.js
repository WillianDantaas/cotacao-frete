// distance.js

// Lista de cidades atendidas (para validação, se desejado)
const cidadesAtendidas = [
  "Porto Ferreira",
  "Pirassununga",
  "Leme",
  "Araras",
  "Campinas",
  "Americana",
  "Sumaré",
  "São Carlos",
  "Araraquara",
  "São Paulo"
];

function validarCidade(cidade) {
  return cidadesAtendidas.some(c => c.toLowerCase() === cidade.trim().toLowerCase());
}

async function getDistanceFromProxy(origem, destino) {
  // Utiliza os parâmetros "origins" e "destinations", conforme o proxy espera
  const url = `https://proxy-api-cotacao.onrender.com/distance?origins=${encodeURIComponent(origem)}&destinations=${encodeURIComponent(destino)}`;
  console.log("[Distance] URL da requisição:", url);
  
  try {
    const response = await fetch(url);
    console.log("[Distance] Status da resposta:", response.status, response.statusText);
    
    if (!response.ok) {
      const text = await response.text();
      console.error("[Distance] Resposta do Proxy:", text);
      throw new Error("Falha na requisição: " + response.status);
    }
    
    const data = await response.json();
    console.log("[Distance] Dados recebidos do proxy:", data);
    
    if (data.status === "OK") {
      const element = data.rows[0].elements[0];
      if (element.status === "OK") {
        // Converte metros para quilômetros
        const km = element.distance.value / 1000;
        return km;
      } else {
        throw new Error("Nenhuma rota encontrada: " + element.status);
      }
    } else {
      throw new Error("Erro na resposta da API: " + data.status);
    }
  } catch (error) {
    console.error("[Distance] Erro:", error);
    throw error;
  }
}

// Listener para o botão "Calcular Distância"
document.getElementById("calcularDistancia").addEventListener("click", function() {
  const btn = document.getElementById("calcularDistancia");
  // Armazena o texto original do botão para restaurá-lo depois
  const textoOriginal = btn.textContent;
  
  // Desabilita o botão e mostra o loading
  btn.disabled = true;
  btn.textContent = "Carregando...";
  
  const origem = document.getElementById("origem").value;
  const ufOrigem = document.getElementById("ufOrigem").value;
  const destino = document.getElementById("destino").value;
  const ufDestino = document.getElementById("ufDestino").value;
  
  console.log("[Distance] Cidades selecionadas:", { origem, ufOrigem, destino, ufDestino });
  
  // Validação da UF: somente atendemos SP
  if (ufOrigem !== "SP" || ufDestino !== "SP") {
    alert("Atualmente atendemos apenas o estado de SP.");
    btn.disabled = false;
    btn.textContent = textoOriginal;
    return;
  }
  
  // Validação das cidades (opcional)
  if (!validarCidade(origem)) {
    alert("A cidade de origem (" + origem + ") não está na nossa lista de atendimento.");
    btn.disabled = false;
    btn.textContent = textoOriginal;
    return;
  }
  if (!validarCidade(destino)) {
    alert("A cidade de destino (" + destino + ") não está na nossa lista de atendimento.");
    btn.disabled = false;
    btn.textContent = textoOriginal;
    return;
  }
  
  // Constrói as variáveis completas (exemplo: "Porto Ferreira, SP")
  const origemCompleta = `${origem.trim()}, ${ufOrigem}`;
  const destinoCompleta = `${destino.trim()}, ${ufDestino}`;
  
  console.log("[Distance] Origem Completa:", origemCompleta, "| Destino Completo:", destinoCompleta);
  
  getDistanceFromProxy(origemCompleta, destinoCompleta)
    .then(distance => {
      console.log("[Distance] Distância calculada (km):", distance);
      document.getElementById("distancia").value = distance.toFixed(2);
      // Em vez de alert, apenas atualizamos o campo de distância
    })
    .catch(error => {
      console.error("[Distance] Erro ao obter a distância:", error);
      alert("Erro ao obter a distância. Verifique o console para mais detalhes.");
    })
    .finally(() => {
      // Restaura o botão independentemente do resultado
      btn.disabled = false;
      btn.textContent = textoOriginal;
    });
});
