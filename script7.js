// Garante que o script só será executado após o carregamento completo do HTML.
document.addEventListener('DOMContentLoaded', function() {

    /**
     * Formata uma string de data/hora para exibição (DD/MM/YYYY ou DD/MM/YYYY às HH:MM).
     * Tenta lidar com vários formatos de entrada (ISO com T, com espaço, só data).
     * @returns {string} - Data/hora formatada ou placeholder em caso de erro.
     */
    function formatarData(dataString) {
        // Verifica se a string de entrada é válida.
        if (!dataString) return '--/--/----'; // Retorna placeholder se vazia/nula.
        try {
            let dataObj; // Objeto Date.
            let horaFormatada = ''; // Variável para guardar a hora, se existir.

            // Lógica para tentar parsear diferentes formatos de data/hora (código original incompleto/condensado).
            // Assume que a lógica completa identifica a data e a hora corretamente.
            if (dataString.includes('T')) { // Formato ISO 8601 (com T)
                dataObj = new Date(dataString);
                // Extrai hora se existir e não for meia-noite.
                const hours = dataObj.getHours();
                const minutes = dataObj.getMinutes();
                if (hours !== 0 || minutes !== 0) {
                    horaFormatada = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                }
            } else if (dataString.includes(' ')) { // Formato com espaço (ex: YYYY-MM-DD HH:MM ou DD/MM/YYYY HH:MM)
                const partes = dataString.split(' ');
                const dataPart = partes[0];
                const horaPart = partes.length > 1 ? partes[1] : ''; // Pega a hora se existir.
                if (dataPart.includes('-')) { // Assume YYYY-MM-DD
                     // Cria Date UTC para evitar problemas de fuso com datas YYYY-MM-DD
                    const [y, m, d] = dataPart.split('-');
                    dataObj = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
                } else if (dataPart.includes('/')) { // Assume DD/MM/YYYY
                    const [dia, mes, ano] = dataPart.split('/');
                    // Cria Date UTC.
                    dataObj = new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)));
                } else {
                     dataObj = new Date(dataPart); // Tentativa genérica.
                }
                 // Verifica se a hora extraída é válida.
                if (horaPart && /\d{1,2}:\d{2}/.test(horaPart) && horaPart !== '00:00') {
                    horaFormatada = horaPart;
                }
            } else if (dataString.includes('-')) { // Só data YYYY-MM-DD
                 const [y, m, d] = dataString.split('-');
                 dataObj = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
            } else if (dataString.includes('/')) { // Só data DD/MM/YYYY
                 const [dia, mes, ano] = dataString.split('/');
                 dataObj = new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)));
            } else {
                 dataObj = new Date(dataString); // Última tentativa genérica.
            }

            // Verifica se o objeto Date é válido.
            if (!dataObj || isNaN(dataObj.getTime())) {
                 throw new Error("Data inválida após tentativas de parse.");
            }

            // Formata a data para DD/MM/YYYY usando UTC para consistência.
            const dia = String(dataObj.getUTCDate()).padStart(2, '0');
            const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0'); // Mês é 0-11.
            const ano = dataObj.getUTCFullYear();
            const dataFormatada = `${dia}/${mes}/${ano}`;

            // Retorna data + hora se a hora foi encontrada e não é '00:00'.
            if (horaFormatada && horaFormatada !== '00:00') {
                return `${dataFormatada} às ${horaFormatada}`;
            } else {
                // Retorna apenas a data se não houver hora relevante.
                return dataFormatada;
            }
        // Captura erros durante o parse/formatação.
        } catch (e) {
            console.error("Erro ao formatar data:", dataString, e);
            return '--/--/----'; // Retorna placeholder em caso de erro.
        }
    }


    /**
     * Calcula o número de diárias entre duas datas (considerando apenas a parte da data).
     * Retorna 1 diária como mínimo, mesmo para o mesmo dia.
     * @param {string | null | undefined} dataRetiradaStr - Data de retirada.
     * @param {string | null | undefined} dataDevolucaoStr - Data de devolução.
     * @returns {number} - Número de diárias (mínimo 1).
     */
    function calcularDiarias(dataRetiradaStr, dataDevolucaoStr) {
        // Código condensado mantido do original.
        try {
            // Função interna para parsear apenas a data (ignorando hora) para Date UTC.
            const parseDateOnly = (d) => {
                if (!d) return null;
                let p = d.split(' ')[0]; // Pega só a parte da data.
                let y, m, day;
                if (p.includes('/')) { [day, m, y] = p.split('/'); } // Formato DD/MM/YYYY
                else if (p.includes('-')) { [y, m, day] = p.split('-'); } // Formato YYYY-MM-DD
                else return null;
                // Cria Date UTC para evitar problemas de fuso.
                const dt = new Date(Date.UTC(Number(y), Number(m) - 1, Number(day)));
                return isNaN(dt.getTime()) ? null : dt; // Retorna null se inválido.
            };
            const dR = parseDateOnly(dataRetiradaStr); // Data de Retirada.
            const dD = parseDateOnly(dataDevolucaoStr); // Data de Devolução.

            // Se datas válidas e devolução >= retirada.
            if (dR && dD && dD >= dR) {
                const diff = dD.getTime() - dR.getTime(); // Diferença em milissegundos.
                // Converte para dias (1 dia = 86400000ms) e arredonda para cima.
                const dias = Math.ceil(diff / 86400000);
                return dias === 0 ? 1 : dias; // Mínimo de 1 diária.
            } else if (dR && dD && dD < dR) { // Erro se devolução for antes da retirada.
                console.error("Data de devolução é anterior à data de retirada no cálculo de diárias.");
                return 1; // Retorna 1 como fallback.
            }
        } catch (e) {
            console.error("Erro ao calcular diárias:", e);
        }
        return 1; // Retorna 1 em caso de erro.
    }

    /**
     * Formata um valor numérico como moeda brasileira (BRL, com vírgula decimal).
     * @param {number | string | null | undefined} valor - O valor a ser formatado.
     * @returns {string} - O valor formatado como "X,XX" ou "0,00".
     */
    function formatarMoeda(valor) {
        // Tenta converter para número de ponto flutuante.
        const v = parseFloat(valor);
        // Se for inválido (NaN), retorna '0,00'.
        // Senão, formata com 2 casas decimais e substitui ponto por vírgula.
        return isNaN(v) ? '0,00' : v.toFixed(2).replace('.', ',');
    }

    // --- Recuperação dos Dados da Reserva do sessionStorage ---
    // Busca todos os dados relevantes salvos nas etapas anteriores.
    const nomeCarro = sessionStorage.getItem('nomeCarro') || 'N/D'; // Nome do grupo do carro.
    const precoDiariaCarro = parseFloat(sessionStorage.getItem('precoCarro')) || 0; // Preço base da diária (necessário para recalcular subtotal).
    const urlImagemCarro = sessionStorage.getItem('urlImagemCarro') || 'placeholder_car.png'; // URL da imagem.
    const dataRetirada = sessionStorage.getItem('dataRetirada'); // Data/Hora de retirada.
    const dataDevolucao = sessionStorage.getItem('dataDevolucao'); // Data/Hora de devolução.
    const retiradaLocal = sessionStorage.getItem('retiradaLocal') || 'N/D'; // Local de retirada.
    const devolucaoLocal = sessionStorage.getItem('devolucaoLocal') || 'N/D'; // Local de devolução.
    const protecaoValor = parseFloat(sessionStorage.getItem('protecaoValor')) || 0; // Custo total da proteção.
    // Custos dos opcionais (lidos individualmente, pois o total pode não ter sido salvo corretamente antes).
    const condutorAdicionalValor = parseFloat(sessionStorage.getItem('condutorAdicionalValor')) || 0;
    const cadeiraBebeValor = parseFloat(sessionStorage.getItem('cadeiraBebeValor')) || 0;
    const gpsValor = parseFloat(sessionStorage.getItem('gpsValor')) || 0;
    // Pega o valor final de descontos, se existir, senão pega o valor antigo 'descontosValor'.
    const descontosValor = parseFloat(sessionStorage.getItem('finalDescontos')) || parseFloat(sessionStorage.getItem('descontosValor')) || 0;
    // Método de pagamento escolhido na etapa anterior.
    const metodoPagamento = sessionStorage.getItem('metodoPagamentoEscolhido') || 'pix'; // Default para 'pix' se não encontrado.

    // --- Pega o VALOR TOTAL FINAL calculado e salvo pela página de pagamento ---
    // Este é o valor definitivo a ser exibido e considerado.
    const valorTotalFinal = parseFloat(sessionStorage.getItem('valorTotalFinal')) || 0;
    // --- FIM ---

    // --- Recálculo dos Componentes (APENAS PARA EXIBIÇÃO NO DETALHAMENTO DO RESUMO) ---
    // Calcula o número de diárias com base nas datas.
    const diarias = calcularDiarias(dataRetirada, dataDevolucao);
    // Recalcula o subtotal (diárias * preço base) para exibição.
    const subtotalValor = precoDiariaCarro * diarias;
    // Soma os custos dos opcionais para exibição.
    const opcionaisTotalValor = (condutorAdicionalValor || 0) + (cadeiraBebeValor || 0) + (gpsValor || 0);
    // Recalcula a taxa de conveniência (ex: 12%) com base nos componentes, apenas para exibição.
    const baseTaxaRecalc = subtotalValor + protecaoValor + opcionaisTotalValor - descontosValor;
    const taxaConvenienciaRecalc = baseTaxaRecalc > 0 ? (baseTaxaRecalc * 0.12) : 0;

    // --- Geração/Recuperação do Código da Reserva ---
    // Tenta pegar o código da reserva já existente na sessão.
    // Se não existir, gera um código aleatório (P + 5 dígitos).
    const codigoReserva = sessionStorage.getItem('codigoReserva') || ('P' + Math.floor(10000 + Math.random() * 90000));
    // Salva o código gerado/recuperado de volta na sessão para consistência.
    sessionStorage.setItem('codigoReserva', codigoReserva);
    // Seleciona o elemento HTML para exibir o código da reserva.
    const codigoReservaEl = document.getElementById('codigoReserva');
    // Atualiza o texto do elemento com o código da reserva, se o elemento existir.
    if(codigoReservaEl) codigoReservaEl.textContent = codigoReserva;


    // --- Atualização das Informações de Pagamento Conforme Método Escolhido ---
    // Seleciona a div onde as instruções de pagamento serão inseridas.
    const metodoPagamentoInfo = document.getElementById('metodoPagamentoInfo');
    if (metodoPagamentoInfo) {
        // Se o método foi PIX.
        if (metodoPagamento === 'pix') {
            // Insere HTML com instruções para pagamento PIX (placeholders para QR Code e Código).
            metodoPagamentoInfo.innerHTML = `
                <p>Use o QR Code ou Copie o código PIX abaixo para efetuar o pagamento.</p>
                <p><strong>[Placeholder: Imagem do QR CODE AQUI]</strong></p>
                <p><strong>[Placeholder: Código PIX Copia e Cola AQUI]</strong></p>
                <p>Sua reserva será confirmada após a identificação do pagamento.</p>
            `;
        // Se o método foi Cartão de Crédito.
        } else if (metodoPagamento === 'cartao_credito') {
            // Insere HTML confirmando o processamento (assumindo que já foi feito na página anterior).
            metodoPagamentoInfo.innerHTML = `
                <p>Pagamento via Cartão de Crédito processado com sucesso.</p>
                <p>Você receberá um e-mail com os detalhes da sua reserva confirmada.</p>
            `;
        // Se o método foi Pagamento no Balcão.
        } else { // Assume 'balcao'
            // Insere HTML com instruções para pagamento no balcão.
            metodoPagamentoInfo.innerHTML = `
                <p>Você optou por pagar no balcão da locadora.</p>
                <p>Apresente este código na retirada do veículo: <strong>${codigoReserva}</strong></p>
                <p>O valor total a ser pago será de <strong>R$ ${formatarMoeda(valorTotalFinal)}</strong>.</p>
            `;
        }
    }


    // --- Preenchimento do Resumo Final ---
    // Função auxiliar para selecionar elemento por ID.
    const el = (id) => document.getElementById(id);

    // Preenche a imagem e nome do carro/grupo.
    if(el('resumoImagemCarro')) { el('resumoImagemCarro').src = urlImagemCarro; el('resumoImagemCarro').alt = `Imagem ${nomeCarro}`; }
    if(el('nomeCarro')) el('nomeCarro').textContent = nomeCarro; // Exibe apenas o nome do grupo.

    // Preenche datas e locais de retirada/devolução.
    if(el('dataEntrega')) el('dataEntrega').textContent = formatarData(dataRetirada) + (retiradaLocal !== 'N/D' ? ` - ${retiradaLocal}` : '');
    if(el('dataDevolucao')) el('dataDevolucao').textContent = formatarData(dataDevolucao) + (devolucaoLocal !== 'N/D' ? ` - ${devolucaoLocal}` : '');

    // Preenche o DETALHAMENTO dos custos no resumo com os valores lidos/recalculados.
    if(el('subtotal')) el('subtotal').textContent = formatarMoeda(subtotalValor); // Subtotal recalculado.
    if(el('valorProtecao')) el('valorProtecao').textContent = formatarMoeda(protecaoValor); // Valor da proteção lido.
    if(el('valorOpcionais')) el('valorOpcionais').textContent = formatarMoeda(opcionaisTotalValor); // Opcionais recalculados.
    if(el('taxaConveniencia')) el('taxaConveniencia').textContent = formatarMoeda(taxaConvenienciaRecalc); // Taxa recalculada.
    if(el('descontos')) el('descontos').textContent = descontosValor > 0 ? `-${formatarMoeda(descontosValor)}` : '0,00'; // Desconto lido.

    // O valor final exibido é o que foi efetivamente calculado/confirmado na etapa de pagamento.
    if(el('total')) el('total').textContent = formatarMoeda(valorTotalFinal);

    // --- Funcionalidade dos Botões (Compartilhar e Imprimir) ---

    // Botão de compartilhar.
    const btnShare = document.querySelector('.btn-compartilhar');
    if (btnShare) {
        btnShare.addEventListener('click', function() {
            // Monta o texto a ser compartilhado.
            const textoCompartilhamento = `Minha reserva na Mobiloca: ${nomeCarro} de ${formatarData(dataRetirada)} até ${formatarData(dataDevolucao)}. Código: ${codigoReserva}. Valor: R$ ${formatarMoeda(valorTotalFinal)}`;
            // Tenta usar a API de Compartilhamento nativa do navegador (Web Share API).
            if (navigator.share) {
                navigator.share({
                    title: 'Minha Reserva Mobiloca', // Título da janela de compartilhamento.
                    text: textoCompartilhamento,      // Texto a ser compartilhado.
                    url: window.location.href        // URL da página atual (opcional).
                })
                .catch(err => { // Trata erros se o usuário cancelar ou a API falhar.
                    console.error('Erro ao usar navigator.share:', err);
                    // Não mostra alerta se o erro for AbortError (cancelamento pelo usuário)
                    if (err.name !== 'AbortError') {
                       alert('Não foi possível iniciar o compartilhamento.');
                    }
                });
            // Se a API nativa não estiver disponível.
            } else {
                // Fallback: Tenta copiar o texto para a área de transferência.
                navigator.clipboard.writeText(textoCompartilhamento)
                    .then(() => { // Sucesso ao copiar.
                        alert('Detalhes da reserva copiados para a área de transferência!');
                    })
                    .catch(err => { // Erro ao copiar.
                        console.error('Erro ao copiar para a área de transferência:', err);
                        alert('Não foi possível copiar os detalhes. Seu navegador pode não suportar esta funcionalidade.');
                    });
            }
        });
    }


    // Botão de imprimir.
    const btnPrint = document.querySelector('.btn-imprimir');
    if(btnPrint) {
        btnPrint.addEventListener('click', function() {
            // Aciona a funcionalidade de impressão do navegador.
            window.print();
        });
    }
// Fim do listener 'DOMContentLoaded'
});

// --- Função para Buscar Clima (API Visual Crossing) ---
async function fetchWeather() {
    console.log("fetchWeather iniciada (confirmação).");
    const location = 'santo amaro, sao paulo, br'; // Localização.
    const apiKey = '4UHF6RU7LPLQU73J9SR5REXX6'; // Chave API. **NÃO EXPONHA CHAVES ASSIM EM PRODUÇÃO!**
    const apiUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(location)}?unitGroup=metric&key=${apiKey}&contentType=json&lang=pt`; // URL da API.
    const tempElement = document.getElementById('weather-temp'); // Elemento temperatura.
    const descElement = document.getElementById('weather-desc'); // Elemento descrição.

    // Estado inicial.
    if(tempElement) tempElement.textContent = '--';
    if(descElement) descElement.textContent = 'Carregando...';

    try { // Tenta buscar.
        const response = await fetch(apiUrl); // Chamada fetch.
        if (!response.ok) { // Trata erro HTTP.
            let errorBody = ''; try { errorBody = await response.text(); } catch(_) {}
            throw new Error(`Erro HTTP ${response.status}: ${response.statusText}. ${errorBody}`);
        }
        const data = await response.json(); // Converte para JSON.
        // console.log("Resposta Clima API:", data); // Log opcional.

        // Processa dados se existirem.
        if (data && data.currentConditions) {
            const current = data.currentConditions;
            const temperature = current.temp;
            const description = current.conditions;
            // Atualiza DOM.
            if (tempElement) { tempElement.textContent = (temperature !== undefined && temperature !== null) ? Math.round(temperature) : 'N/A'; }
            if (descElement) { descElement.textContent = description ? (description.charAt(0).toUpperCase() + description.slice(1)) : 'N/A'; }
            console.log("Clima atualizado no rodapé (confirmação).");
        } else { // Trata formato inesperado.
            throw new Error("Formato inesperado da API de clima.");
        }
    } catch (error) { // Captura erros.
        console.error("Falha ao buscar/processar dados de tempo:", error);
        // Atualiza DOM para indicar erro.
        if(tempElement) tempElement.textContent = 'N/A';
        if(descElement) descElement.textContent = 'Erro';
    }
}

// --- Chamada Inicial da Função de Clima ---
// Chama a função assim que o script é carregado.
fetchWeather();