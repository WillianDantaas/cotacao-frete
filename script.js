// Função auxiliar para converter uma string formatada como moeda para número
function parseCurrency(value) {
  if (!value) return 0;
  // Remove tudo que não seja dígito, vírgula, ponto ou sinal de menos
  let cleanValue = value.replace(/[^0-9,.-]+/g, '');
  // Remove os pontos (separador de milhar) e substitui a vírgula pelo ponto decimal
  cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleanValue) || 0;
}

// Função para formatar um número como moeda (pt-BR)
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// Ao perder o foco, formata o valor como moeda
function formatCurrencyOnBlur(event) {
  let input = event.target;
  let value = parseCurrency(input.value);
  input.value = formatCurrency(value);
}

// Ao ganhar o foco, remove a formatação para facilitar a edição
function unformatCurrencyOnFocus(event) {
  let input = event.target;
  let value = parseCurrency(input.value);
  input.value = value.toString();
}

// Configura os listeners de formatação para os inputs monetários
function setupCurrencyFormatting(idsArray) {
  idsArray.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener("blur", formatCurrencyOnBlur);
      input.addEventListener("focus", unformatCurrencyOnFocus);
    }
  });
}

// Lista de IDs de inputs que representam valores monetários
const currencyInputIds = [
  "valorCarga",
  "txEntrega",
  "txColeta",
  "overrideFretePeso",
  "overrideFreteValor",
  "discountValue"
];

// Configura a formatação dos inputs que já estão na página
document.addEventListener("DOMContentLoaded", function() {
  setupCurrencyFormatting(currencyInputIds);
});

// Variável global para armazenar os componentes adicionais do frete (usados no recálculo via override)
let feeComponents = {};

function calculateFreight() {
  // Lê os valores dos inputs (para os campos monetários, usamos parseCurrency)
  const peso = parseFloat(document.getElementById("peso").value) || 0;
  const comprimento = parseFloat(document.getElementById("comprimento").value) || 0;
  const largura = parseFloat(document.getElementById("largura").value) || 0;
  const altura = parseFloat(document.getElementById("altura").value) || 0;
  const distancia = parseFloat(document.getElementById("distancia").value) || 0;
  const volumes = parseInt(document.getElementById("volumes").value) || 1;
  const valorCarga = parseCurrency(document.getElementById("valorCarga").value);
  const txEntrega = parseCurrency(document.getElementById("txEntrega").value);
  const txColeta = parseCurrency(document.getElementById("txColeta").value);
  const express = document.getElementById("express").checked;
  
  // Cálculo do peso cubado (se dimensões forem informadas)
  const pesoCubado = (comprimento && largura && altura) ? (comprimento * largura * altura) / 6000 : 0;
  const pesoEfetivo = Math.max(peso, pesoCubado);
  
  // Tabela de tarifas (por intervalos de peso)
  let tarifaPorKm = 0, valorMinimo = 0, faixa = "";
  if (pesoEfetivo <= 10) {
    tarifaPorKm = 0.20; valorMinimo = 40.00; faixa = "0 a 10 kg";
  } else if (pesoEfetivo <= 20) {
    tarifaPorKm = 0.22; valorMinimo = 45.00; faixa = "10 a 20 kg";
  } else if (pesoEfetivo <= 30) {
    tarifaPorKm = 0.24; valorMinimo = 50.00; faixa = "20 a 30 kg";
  } else if (pesoEfetivo <= 40) {
    tarifaPorKm = 0.26; valorMinimo = 55.00; faixa = "30 a 40 kg";
  } else if (pesoEfetivo <= 50) {
    tarifaPorKm = 0.28; valorMinimo = 60.00; faixa = "40 a 50 kg";
  } else if (pesoEfetivo <= 60) {
    tarifaPorKm = 0.30; valorMinimo = 65.00; faixa = "50 a 60 kg";
  } else if (pesoEfetivo <= 70) {
    tarifaPorKm = 0.32; valorMinimo = 70.00; faixa = "60 a 70 kg";
  } else if (pesoEfetivo <= 80) {
    tarifaPorKm = 0.34; valorMinimo = 75.00; faixa = "70 a 80 kg";
  } else if (pesoEfetivo <= 90) {
    tarifaPorKm = 0.36; valorMinimo = 80.00; faixa = "80 a 90 kg";
  } else if (pesoEfetivo <= 100) {
    tarifaPorKm = 0.38; valorMinimo = 85.00; faixa = "90 a 100 kg";
  } else if (pesoEfetivo <= 150) {
    tarifaPorKm = 0.40; valorMinimo = 100.00; faixa = "100 a 150 kg";
  } else if (pesoEfetivo <= 200) {
    tarifaPorKm = 0.42; valorMinimo = 120.00; faixa = "150 a 200 kg";
  } else if (pesoEfetivo <= 500) {
    tarifaPorKm = 0.50; valorMinimo = 150.00; faixa = "200 a 500 kg";
  } else if (pesoEfetivo <= 700) {
    tarifaPorKm = 0.60; valorMinimo = 200.00; faixa = "500 a 700 kg";
  } else if (pesoEfetivo <= 1000) {
    tarifaPorKm = 0.70; valorMinimo = 250.00; faixa = "700 a 1000 kg";
  }
  
  // Cálculo do frete base
  let freteBaseCalculado = tarifaPorKm * distancia;
  let freteBase = (freteBaseCalculado < valorMinimo) ? valorMinimo : freteBaseCalculado;
  
  // Adicionais
  const adValorem = valorCarga * 0.001;
  let extraVolume = 0;
  if (volumes > 1) {
    extraVolume = Math.floor((volumes - 1) / 5) * (0.015 * freteBase);
  }
  
  let somaTaxas = freteBase + adValorem + txEntrega + txColeta + extraVolume;
  const icms = somaTaxas * 0.12;
  
  let totalFrete = somaTaxas + icms;
  let adicionalExpress = 0;
  if (express) {
    adicionalExpress = totalFrete * 0.20;
    totalFrete += adicionalExpress;
  }
  
  // Armazena os componentes para override
  feeComponents = {
    txEntrega: txEntrega,
    txColeta: txColeta,
    adValorem: adValorem,
    extraVolume: extraVolume,
    express: express,
    adicionalExpress: adicionalExpress
  };
  
  // Valores padrão para override (50% do frete base para cada)
  let defaultOverridePeso = freteBase * 0.5;
  let defaultOverrideValor = freteBase * 0.5;
  
  let resultadoHTML = `<p><strong>Peso Real:</strong> ${peso.toFixed(2)} kg</p>`;
  if (pesoCubado > peso) {
    resultadoHTML += `<p><strong>Peso Cubado:</strong> ${pesoCubado.toFixed(2)} kg</p>`;
  }
  resultadoHTML += `<p><strong>Peso Efetivo:</strong> ${pesoEfetivo.toFixed(2)} kg (${faixa})</p>`;
  resultadoHTML += `<hr>`;
  resultadoHTML += `<p><strong>Tarifa:</strong> R$ ${tarifaPorKm.toFixed(2)} por km</p>`;
  resultadoHTML += `<p><strong>Valor Mínimo do Frete Base:</strong> R$ ${valorMinimo.toFixed(2)}</p>`;
  resultadoHTML += `<p><strong>Distância:</strong> ${distancia.toFixed(2)} km</p>`;
  resultadoHTML += `<p><strong>Frete Base Calculado:</strong> R$ ${freteBase.toFixed(2)}</p>`;
  resultadoHTML += `<hr>`;
  resultadoHTML += `<p><strong>Ad Valorem (0,1% da NF):</strong> R$ ${adValorem.toFixed(2)}</p>`;
  resultadoHTML += `<p><strong>Taxa de Entrega:</strong> R$ ${txEntrega.toFixed(2)}</p>`;
  resultadoHTML += `<p><strong>Taxa de Coleta:</strong> R$ ${txColeta.toFixed(2)}</p>`;
  if (extraVolume > 0) {
    resultadoHTML += `<p><strong>Acréscimo por Volumes (1,5% a cada 5 volumes):</strong> R$ ${extraVolume.toFixed(2)}</p>`;
  }
  resultadoHTML += `<p><strong>Soma das Taxas:</strong> R$ ${somaTaxas.toFixed(2)}</p>`;
  resultadoHTML += `<p><strong>ICMS (12%):</strong> R$ ${icms.toFixed(2)}</p>`;
  if (express) {
    resultadoHTML += `<p><strong>Adicional de Entrega Expressa (20%):</strong> R$ ${adicionalExpress.toFixed(2)}</p>`;
  }
  resultadoHTML += `<hr>`;
  resultadoHTML += `<p class="font-bold text-xl text-blue-600"><strong>Total do Frete (calculado):</strong> R$ ${totalFrete.toFixed(2)}</p>`;
  
  // Seção de override com campo de desconto
  resultadoHTML += `
    <div class="override-section mt-6">
      <h3 class="text-xl font-bold mb-2">Ajuste da Base do Frete</h3>
      <div class="mb-4">
        <label for="overrideFretePeso" class="block text-gray-700 font-medium mb-1">Frete-Peso (R$):</label>
        <input id="overrideFretePeso" type="text" step="any" value="${defaultOverridePeso.toFixed(2)}" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
      </div>
      <div class="mb-4">
        <label for="overrideFreteValor" class="block text-gray-700 font-medium mb-1">Frete-Valor (R$):</label>
        <input id="overrideFreteValor" type="text" step="any" value="${defaultOverrideValor.toFixed(2)}" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
      </div>
      <div class="mb-4">
        <label for="discountValue" class="block text-gray-700 font-medium mb-1">Desconto (R$):</label>
        <input id="discountValue" type="text" step="any" value="0.00" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500">
      </div>
      <p class="font-bold text-xl" id="finalTotalOverride"><strong>Total do Frete (final):</strong> R$ ${totalFrete.toFixed(2)}</p>
    </div>
  `;
  
  document.getElementById("detalhesFrete").innerHTML = resultadoHTML;
  
  // Adiciona eventos para override e desconto
  document.getElementById("overrideFretePeso").addEventListener("input", updateFinalFreight);
  document.getElementById("overrideFreteValor").addEventListener("input", updateFinalFreight);
  document.getElementById("discountValue").addEventListener("input", updateFinalFreight);
  
  // Aplica formatação aos inputs adicionados dinamicamente
  setupCurrencyFormatting(["overrideFretePeso", "overrideFreteValor", "discountValue"]);
}

function updateFinalFreight() {
  let overridePeso = parseCurrency(document.getElementById("overrideFretePeso").value);
  let overrideValor = parseCurrency(document.getElementById("overrideFreteValor").value);
  let overriddenBase = overridePeso + overrideValor;
  
  let otherFees = feeComponents.txEntrega + feeComponents.txColeta + feeComponents.adValorem + feeComponents.extraVolume;
  let newSubtotal = overriddenBase + otherFees;
  let newICMS = newSubtotal * 0.12;
  let newTotal = newSubtotal + newICMS;
  if (feeComponents.express) {
    newTotal *= 1.20;
  }
  
  let discount = parseCurrency(document.getElementById("discountValue").value);
  newTotal = newTotal - discount;
  if (newTotal < 0) newTotal = 0;
  
  document.getElementById("finalTotalOverride").innerHTML = `<strong>Total do Frete (final):</strong> R$ ${newTotal.toFixed(2)}`;
}

document.getElementById("calcular").addEventListener("click", calculateFreight);
