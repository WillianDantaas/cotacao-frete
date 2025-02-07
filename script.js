// script.js

document.getElementById("calcular").addEventListener("click", function () {
  // Obtém os valores dos inputs
  const peso = parseFloat(document.getElementById("peso").value) || 0;
  const comprimento = parseFloat(document.getElementById("comprimento").value) || 0;
  const largura = parseFloat(document.getElementById("largura").value) || 0;
  const altura = parseFloat(document.getElementById("altura").value) || 0;
  const distancia = parseFloat(document.getElementById("distancia").value) || 0;
  const volumes = parseInt(document.getElementById("volumes").value) || 1; // assume 1 volume se vazio
  const valorCarga = parseFloat(document.getElementById("valorCarga").value) || 0;
  
  // Taxas informadas pelo usuário (TX ENTREGA e TX COLETA)
  const txEntregaInput = parseFloat(document.getElementById("txEntrega").value);
  const txColetaInput = parseFloat(document.getElementById("txColeta").value);
  // Se não informados, assume 0 (ou você pode definir um valor padrão, ex.: 5.00)
  const txEntrega = isNaN(txEntregaInput) ? 0 : txEntregaInput;
  const txColeta = isNaN(txColetaInput) ? 0 : txColetaInput;
  
  const express = document.getElementById("express").checked;

  // Cálculo do peso cubado (opcional, se as dimensões forem informadas)
  // Fórmula: (comprimento x largura x altura) / 6000
  const pesoCubado = (comprimento && largura && altura) ? (comprimento * largura * altura) / 6000 : 0;
  // O peso efetivo é o maior entre o peso real e o peso cubado (se informado)
  const pesoEfetivo = (pesoCubado > peso) ? pesoCubado : peso;

  // Nova tabela de tarifas:
  // Se o peso efetivo for menor ou igual a 50 kg (Faixa 1), usamos:
  // - Tarifa: R$ 0,20 por km
  // - Valor mínimo do frete base: R$ 63,80
  // Para outras faixas, os valores são ajustados (exemplo):
  let tarifaPorKm = 0;
  let valorMinimo = 0;
  let faixa = "";
  
  if (pesoEfetivo <= 50) {
    tarifaPorKm = 0.20;
    valorMinimo = 63.80;
    faixa = "Faixa 1 (até 50kg)";
  } else if (pesoEfetivo <= 200) {
    tarifaPorKm = 0.25;
    valorMinimo = 80.00;
    faixa = "Faixa 2 (51kg a 200kg)";
  } else if (pesoEfetivo <= 1000) {
    tarifaPorKm = 0.35;
    valorMinimo = 150.00;
    faixa = "Faixa 3 (201kg a 1000kg)";
  } else {
    tarifaPorKm = 0.40;
    valorMinimo = 200.00;
    faixa = "Faixa 4 (acima de 1000kg)";
  }

  // Cálculo do Frete Base: tarifa × distância, mas se o resultado for menor que o mínimo, utiliza-se o valor mínimo
  let freteBaseCalculado = tarifaPorKm * distancia;
  let freteBase = (freteBaseCalculado < valorMinimo) ? valorMinimo : freteBaseCalculado;

  // Adicionais:
  // ADVALOREM: 0,1% do valor da NF
  const adValorem = valorCarga * 0.001;
  
  // Se houver mais de 1 volume, acrescenta um valor extra (exemplo: R$ 10,00 por volume adicional)
  let extraVolume = 0;
  if (volumes > 1) {
    extraVolume = (volumes - 1) * 10;
  }
  
  // Soma das taxas antes do imposto
  let somaTaxas = freteBase + adValorem + txEntrega + txColeta + extraVolume;
  
  // Aplica ICMS de 12% sobre a soma das taxas
  const icms = somaTaxas * 0.12;
  
  // Total do Frete antes de possível adicional de entrega expressa
  let totalFrete = somaTaxas + icms;
  
  // Se a entrega for expressa, adiciona 20% sobre o total
  let adicionalExpress = 0;
  if (express) {
    adicionalExpress = totalFrete * 0.20;
    totalFrete += adicionalExpress;
  }
  
  // Calcula a margem de erro de 5%
  const margemInferior = totalFrete * 0.95;
  const margemSuperior = totalFrete * 1.05;
  
  // Monta o detalhamento dos cálculos
  let resultadoHTML = `<p><strong>Peso Real:</strong> ${peso.toFixed(2)} kg</p>`;
  if (pesoCubado > peso) {
    resultadoHTML += `<p><strong>Peso Cubado:</strong> ${pesoCubado.toFixed(2)} kg</p>`;
  }
  resultadoHTML += `<p><strong>Peso Efetivo:</strong> ${pesoEfetivo.toFixed(2)} kg (${faixa})</p>`;
  resultadoHTML += `<hr>`;
  resultadoHTML += `<p><strong>Tarifa:</strong> R$ ${tarifaPorKm.toFixed(2)} por km</p>`;
  resultadoHTML += `<p><strong>Valor Mínimo do Frete Base:</strong> R$ ${valorMinimo.toFixed(2)}</p>`;
  resultadoHTML += `<p><strong>Distância:</strong> ${distancia.toFixed(2)} km</p>`;
  resultadoHTML += `<p><strong>Frete Base:</strong> R$ ${freteBase.toFixed(2)}</p>`;
  resultadoHTML += `<hr>`;
  resultadoHTML += `<p><strong>ADVALOREM (0,1% da NF):</strong> R$ ${adValorem.toFixed(2)}</p>`;
  resultadoHTML += `<p><strong>Taxa de Entrega:</strong> R$ ${txEntrega.toFixed(2)}</p>`;
  resultadoHTML += `<p><strong>Taxa de Coleta:</strong> R$ ${txColeta.toFixed(2)}</p>`;
  if (extraVolume > 0) {
    resultadoHTML += `<p><strong>Extra por Volumes Adicionais:</strong> R$ ${extraVolume.toFixed(2)}</p>`;
  }
  resultadoHTML += `<p><strong>Soma das Taxas:</strong> R$ ${somaTaxas.toFixed(2)}</p>`;
  resultadoHTML += `<p><strong>ICMS (12%):</strong> R$ ${icms.toFixed(2)}</p>`;
  if (express) {
    resultadoHTML += `<p><strong>Adicional de Entrega Expressa (20%):</strong> R$ ${adicionalExpress.toFixed(2)}</p>`;
  }
  resultadoHTML += `<hr>`;
  resultadoHTML += `<p class="font-bold text-xl"><strong>Total do Frete:</strong> R$ ${totalFrete.toFixed(2)}</p>`;
  resultadoHTML += `<p><strong>Margem de Erro (±5%):</strong> R$ ${margemInferior.toFixed(2)} até R$ ${margemSuperior.toFixed(2)}</p>`;
  
  // Insere o detalhamento na página
  document.getElementById("detalhesFrete").innerHTML = resultadoHTML;
});
