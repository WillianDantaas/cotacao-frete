// ==========================
// Funções de Formatação Monetária
// ==========================
function parseCurrency(value) {
  if (!value) return 0;
  // Remove "R$", espaços e caracteres não numéricos (exceto vírgula, ponto e sinal de menos)
  let cleanValue = value.replace(/R\$\s?/g, '').replace(/[^0-9,.-]+/g, '');
  cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleanValue) || 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatCurrencyOnBlur(event) {
  let input = event.target;
  let value = parseCurrency(input.value);
  input.value = formatCurrency(value);
}

function unformatCurrencyOnFocus(event) {
  let input = event.target;
  let value = parseCurrency(input.value);
  input.value = value.toString();
}

function setupCurrencyFormatting(idsArray) {
  idsArray.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener("blur", formatCurrencyOnBlur);
      input.addEventListener("focus", unformatCurrencyOnFocus);
    }
  });
}

const currencyInputIds = [
  "valorCarga",
  "txEntrega",
  "txColeta",
  "overrideFretePeso",
  "overrideFreteValor",
  "volumeValor"
];

document.addEventListener("DOMContentLoaded", function() {
  setupCurrencyFormatting(currencyInputIds);
});

// ==========================
// Variável para armazenar os componentes para override e índice de edição
// ==========================
let feeComponents = {};
let editIndex = -1; // -1 indica que não estamos editando nenhum volume

// ==========================
// Função para calcular o frete base para um grupo (usando a tabela original)
// ==========================
function calcFreightBaseForWeight(effectiveWeight, distance) {
  if (effectiveWeight <= 0) return 0;
  let tariff = 0, minVal = 0;
  if (effectiveWeight <= 10) { tariff = 0.20; minVal = 40.00; }
  else if (effectiveWeight <= 20) { tariff = 0.22; minVal = 45.00; }
  else if (effectiveWeight <= 30) { tariff = 0.24; minVal = 50.00; }
  else if (effectiveWeight <= 40) { tariff = 0.26; minVal = 55.00; }
  else if (effectiveWeight <= 50) { tariff = 0.28; minVal = 60.00; }
  else if (effectiveWeight <= 60) { tariff = 0.30; minVal = 65.00; }
  else if (effectiveWeight <= 70) { tariff = 0.32; minVal = 70.00; }
  else if (effectiveWeight <= 80) { tariff = 0.34; minVal = 75.00; }
  else if (effectiveWeight <= 90) { tariff = 0.36; minVal = 80.00; }
  else if (effectiveWeight <= 100) { tariff = 0.38; minVal = 85.00; }
  else if (effectiveWeight <= 150) { tariff = 0.40; minVal = 100.00; }
  else if (effectiveWeight <= 200) { tariff = 0.42; minVal = 120.00; }
  else if (effectiveWeight <= 500) { tariff = 0.50; minVal = 150.00; }
  else if (effectiveWeight <= 700) { tariff = 0.60; minVal = 200.00; }
  else if (effectiveWeight <= 1000) { tariff = 0.70; minVal = 250.00; }
  
  let calc = tariff * distance;
  return calc < minVal ? minVal : calc;
}

// ==========================
// Lógica para Volumes (Lista)
// ==========================
let volumesList = [];

function updateVolumesDisplay() {
  const volumesDiv = document.getElementById("volumesList");
  if (volumesList.length === 0) {
    volumesDiv.innerHTML = "<p>Nenhum volume adicionado.</p>";
    return;
  }
  let html = `<table>
    <thead>
      <tr>
        <th>#</th>
        <th>Qtd</th>
        <th>Peso Total (kg)</th>
        <th>Peso Unitário (kg)</th>
        <th>Comp. (m)</th>
        <th>Larg. (m)</th>
        <th>Alt. (m)</th>
        <th>Valor Total (R$)</th>
        <th>Ação</th>
      </tr>
    </thead>
    <tbody>`;
  volumesList.forEach((vol, index) => {
    // Calcula o peso unitário: se quantidade > 1, divide o peso total pelo número de volumes; senão, usa o valor informado.
    let unitPeso = (vol.quantidade > 1 ? vol.peso / vol.quantidade : vol.peso);
    html += `<tr>
      <td>${index + 1}</td>
      <td>${vol.quantidade}</td>
      <td>${vol.peso.toFixed(2)}</td>
      <td>${unitPeso.toFixed(2)}</td>
      <td>${vol.comprimento.toFixed(2)}</td>
      <td>${vol.largura.toFixed(2)}</td>
      <td>${vol.altura.toFixed(2)}</td>
      <td>${formatCurrency(vol.valor)}</td>
      <td>
        <button onclick="editarVolume(${index})" class="bg-yellow-500 text-white px-2 py-1 rounded">Editar</button>
        <button onclick="removerVolume(${index})" class="bg-red-500 text-white px-2 py-1 rounded ml-1">Remover</button>
      </td>
    </tr>`;
  });
  html += `</tbody></table>`;
  volumesDiv.innerHTML = html;
}

function adicionarOuAtualizarVolume() {
  const quantidade = parseInt(document.getElementById("volumeQuantidade").value) || 0;
  if (quantidade <= 0) {
    alert("A quantidade deve ser maior que zero.");
    return;
  }
  const peso = parseFloat(document.getElementById("volumePeso").value) || 0;
  const comprimento = parseFloat(document.getElementById("volumeComprimento").value) || 0;
  const largura = parseFloat(document.getElementById("volumeLargura").value) || 0;
  const altura = parseFloat(document.getElementById("volumeAltura").value) || 0;
  const valor = parseCurrency(document.getElementById("volumeValor").value);
  
  // Se estivermos editando (editIndex >= 0), atualiza o volume; senão, adiciona novo
  if (editIndex >= 0) {
    volumesList[editIndex] = { quantidade, peso, comprimento, largura, altura, valor };
    editIndex = -1;
    document.getElementById("adicionarVolume").textContent = "Adicionar Volume";
  } else {
    volumesList.push({ quantidade, peso, comprimento, largura, altura, valor });
  }
  
  document.getElementById("volumeForm").reset();
  updateVolumesDisplay();
}

function removerVolume(index) {
  volumesList.splice(index, 1);
  // Se estivermos editando o volume que foi removido, cancela a edição
  if (editIndex === index) {
    editIndex = -1;
    document.getElementById("adicionarVolume").textContent = "Adicionar Volume";
    document.getElementById("volumeForm").reset();
  }
  updateVolumesDisplay();
}

function editarVolume(index) {
  // Define o índice global para edição
  editIndex = index;
  const vol = volumesList[index];
  document.getElementById("volumeQuantidade").value = vol.quantidade;
  document.getElementById("volumePeso").value = vol.peso;
  document.getElementById("volumeComprimento").value = vol.comprimento;
  document.getElementById("volumeLargura").value = vol.largura;
  document.getElementById("volumeAltura").value = vol.altura;
  document.getElementById("volumeValor").value = vol.valor;
  // Muda o texto do botão para indicar que estamos atualizando
  document.getElementById("adicionarVolume").textContent = "Atualizar Volume";
}

document.getElementById("adicionarVolume").addEventListener("click", adicionarOuAtualizarVolume);

// ==========================
// Cálculo do Frete
// ==========================
function calculateFreight() {
  if (volumesList.length === 0) {
    alert("Adicione pelo menos um volume para calcular o frete.");
    return;
  }
  
  let totalPesoReal = 0;
  let totalPesoCubado = 0;
  let totalNF = 0;
  let totalVolumes = 0;
  
  // Para cada volume, calculamos os totais.
  volumesList.forEach(vol => {
    totalVolumes += vol.quantidade;
    totalNF += vol.quantidade * vol.valor;
    // Aqui, tratamos o campo "peso": assumimos que o valor inserido é o peso total do grupo.
    // Então, o peso unitário é: (peso informado) / (quantidade).
    let unitPeso = (vol.quantidade > 1 ? vol.peso / vol.quantidade : vol.peso);
    totalPesoReal += vol.peso;  // já que o usuário inseriu o peso total do grupo
    if (vol.comprimento === 0 && vol.largura === 0 && vol.altura === 0) {
      // Se as medidas forem 0, use o peso total informado para o grupo (sem cubagem adicional)
      totalPesoCubado += vol.peso;
    } else {
      let unitCubed = (vol.comprimento * vol.largura * vol.altura) / 6000;
      totalPesoCubado += vol.quantidade * unitCubed;
    }
  });
  
  const pesoEfetivo = Math.max(totalPesoReal, totalPesoCubado);
  const distance = parseFloat(document.getElementById("distancia").value) || 0;
  
  let freteBase = calcFreightBaseForWeight(pesoEfetivo, distance);
  
  const adValorem = totalNF * 0.001;
  const taxaEntrega = parseCurrency(document.getElementById("txEntrega").value);
  const taxaColeta = parseCurrency(document.getElementById("txColeta").value);
  let extraVolume = 0;
  if (totalVolumes > 3) {
    extraVolume = (totalVolumes - 3) * 0.70;
  }
  
  let somaTaxas = freteBase + adValorem + taxaEntrega + taxaColeta + extraVolume;
  let icms = somaTaxas * 0.12;
  let totalFrete = somaTaxas + icms;
  let adicionalExpress = 0;
  if (document.getElementById("express").checked) {
    adicionalExpress = totalFrete * 0.20;
    totalFrete += adicionalExpress;
  }
  
  feeComponents = {
    txEntrega: taxaEntrega,
    txColeta: taxaColeta,
    adValorem: adValorem,
    extraVolume: extraVolume,
    express: document.getElementById("express").checked,
    adicionalExpress: adicionalExpress,
    defaultOverridePeso: freteBase * 0.5,
    defaultOverrideValor: freteBase * 0.5
  };
  
  let resultadoHTML = `<p><strong>Total de Volumes:</strong> ${totalVolumes}</p>`;
  resultadoHTML += `<p><strong>Peso Real Total:</strong> ${totalPesoReal.toFixed(2)} kg</p>`;
  resultadoHTML += `<p><strong>Peso Cubado Total:</strong> ${totalPesoCubado.toFixed(2)} kg</p>`;
  resultadoHTML += `<p><strong>Peso Efetivo:</strong> ${pesoEfetivo.toFixed(2)} kg</p>`;
  resultadoHTML += `<hr>`;
  resultadoHTML += `<p><strong>Frete Base:</strong> R$ ${freteBase.toFixed(2)}</p>`;
  resultadoHTML += `<hr>`;
  resultadoHTML += `<p><strong>Ad Valorem (0,1% da NF):</strong> R$ ${adValorem.toFixed(2)}</p>`;
  resultadoHTML += `<p><strong>Taxa de Entrega:</strong> R$ ${taxaEntrega.toFixed(2)}</p>`;
  resultadoHTML += `<p><strong>Taxa de Coleta:</strong> R$ ${taxaColeta.toFixed(2)}</p>`;
  if (extraVolume > 0) {
    resultadoHTML += `<p><strong>Acréscimo por Volumes (R$0,70 para cada volume acima de 3):</strong> R$ ${extraVolume.toFixed(2)}</p>`;
  }
  resultadoHTML += `<p><strong>Soma das Taxas:</strong> R$ ${somaTaxas.toFixed(2)}</p>`;
  resultadoHTML += `<p><strong>ICMS (12%):</strong> R$ ${icms.toFixed(2)}</p>`;
  if (feeComponents.express) {
    resultadoHTML += `<p><strong>Adicional de Entrega Expressa (20%):</strong> R$ ${adicionalExpress.toFixed(2)}</p>`;
  }
  resultadoHTML += `<hr>`;
  resultadoHTML += `<p class="font-bold text-xl text-blue-600"><strong>Total do Frete (calculado):</strong> R$ ${totalFrete.toFixed(2)}</p>`;
  
  // Seção de override
  resultadoHTML += `
    <div class="override-section mt-6">
      <h3 class="text-xl font-bold mb-2">Ajuste da Base do Frete</h3>
      <div class="mb-4">
        <label for="overrideFretePeso" class="block text-gray-700 font-medium mb-1">Frete-Peso (R$):</label>
        <input id="overrideFretePeso" type="text" step="any" class="w-full border rounded px-3 py-2">
      </div>
      <div class="mb-4">
        <label for="overrideFreteValor" class="block text-gray-700 font-medium mb-1">Frete-Valor (R$):</label>
        <input id="overrideFreteValor" type="text" step="any" class="w-full border rounded px-3 py-2">
      </div>
      <p class="font-bold text-xl" id="finalTotalOverride"><strong>Total do Frete (final):</strong> R$ ${totalFrete.toFixed(2)}</p>
    </div>
  `;
  
  document.getElementById("detalhesFrete").innerHTML = resultadoHTML;
  
  // Preenche os inputs de override com os valores padrão
  document.getElementById("overrideFretePeso").value = feeComponents.defaultOverridePeso.toFixed(2);
  document.getElementById("overrideFreteValor").value = feeComponents.defaultOverrideValor.toFixed(2);
  
  document.getElementById("overrideFretePeso").addEventListener("input", updateFinalFreight);
  document.getElementById("overrideFreteValor").addEventListener("input", updateFinalFreight);
  
  setupCurrencyFormatting(["overrideFretePeso", "overrideFreteValor"]);
}

function updateFinalFreight() {
  let pesoStr = document.getElementById("overrideFretePeso").value.trim();
  let valorStr = document.getElementById("overrideFreteValor").value.trim();
  let overridePeso = (pesoStr === "" ? feeComponents.defaultOverridePeso : parseCurrency(pesoStr));
  let overrideValor = (valorStr === "" ? feeComponents.defaultOverrideValor : parseCurrency(valorStr));
  
  let overriddenBase = overridePeso + overrideValor;
  let otherFees = feeComponents.txEntrega + feeComponents.txColeta + feeComponents.adValorem + feeComponents.extraVolume;
  let subtotal = overriddenBase + otherFees;
  let icms = subtotal * 0.12;
  let newTotal = subtotal + icms;
  if (feeComponents.express) { newTotal *= 1.20; }
  
  document.getElementById("finalTotalOverride").innerHTML = `<strong>Total do Frete (final):</strong> R$ ${newTotal.toFixed(2)}`;
}

document.getElementById("calcular").addEventListener("click", calculateFreight);
