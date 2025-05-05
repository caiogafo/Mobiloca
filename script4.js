// Executa o script após o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function() {

    // --- Seletores de Elementos do DOM (Resumo) ---
    // Seleciona os spans onde os valores serão exibidos
    const totalElement = document.getElementById('total');
    const nomeCarroElement = document.getElementById('nomeCarro');
    const dataEntregaElement = document.getElementById('dataEntrega');
    const dataDevolucaoElement = document.getElementById('dataDevolucao');
    const taxaConvenienciaElement = document.getElementById('taxaConveniencia');
    const descontosElement = document.getElementById('descontos');
    const imagemResumo = document.getElementById('resumoImagemCarro'); // ID adicionado à imagem
    const valorDiariasElement = document.getElementById('valorDiarias');
    const valorProtecaoDetalheElement = document.getElementById('valorProtecaoDetalhe');
    const valorOpcionaisDetalheElement = document.getElementById('valorOpcionaisDetalhe');

    // --- Funções Auxiliares ---

    /**
     * Formata uma string de data (YYYY-MM-DD ou YYYY-MM-DD HH:MM:SS) para DD/MM/YYYY.
     * @param {string | null} dataString - A data vinda do sessionStorage.
     * @returns {string} Data formatada ou placeholder.
     */
    function formatarData(dataString) {
        if (!dataString) return '--/--/----';
        try {
            // Pega apenas a parte da data, ignorando a hora se houver
            const dataParte = dataString.split(' ')[0];
            // Cria um objeto Date considerando UTC para evitar problemas de fuso horário na formatação
            const dataObj = new Date(dataParte + 'T00:00:00Z');
            // Verifica se a data é válida
            if (isNaN(dataObj.getTime())) return '--/--/----';
            // Formata para DD/MM/YYYY
            const dia = String(dataObj.getUTCDate()).padStart(2, '0');
            const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0'); // Mês é base 0
            const ano = dataObj.getUTCFullYear();
            return `${dia}/${mes}/${ano}`;
        } catch (e) {
            console.error("Erro ao formatar data:", e);
            return '--/--/----';
        }
    }

    /**
     * Calcula o número de diárias entre duas datas.
     * @returns {number} Número de diárias (mínimo 1).
     */
    function calcularDiarias() {
        const dataRetirada = sessionStorage.getItem('dataRetirada');
        const dataDevolucao = sessionStorage.getItem('dataDevolucao');
        if (dataRetirada && dataDevolucao) {
            try {
                // Considera apenas a data, em UTC
                const dR = new Date(dataRetirada.split(' ')[0] + 'T00:00:00Z');
                const dD = new Date(dataDevolucao.split(' ')[0] + 'T00:00:00Z');
                // Verifica se as datas são válidas e a devolução é após ou no mesmo dia da retirada
                if (!isNaN(dR.getTime()) && !isNaN(dD.getTime()) && dD >= dR) {
                    const diffEmMilissegundos = dD.getTime() - dR.getTime();
                    // Converte a diferença para dias (1 dia = 86400000 ms)
                    const dias = Math.ceil(diffEmMilissegundos / 86400000);
                    // Retorna o número de dias, garantindo que seja pelo menos 1
                    return dias === 0 ? 1 : dias;
                }
            } catch (e) {
                console.error("Erro ao calcular diárias:", e);
            }
        }
        // Retorna 1 como padrão se não for possível calcular
        return 1;
    }

    /**
     * Formata um número para o formato de moeda brasileira (R$ X.XXX,XX).
     * @param {number | string} valor - O valor numérico a ser formatado.
     * @returns {string} Valor formatado como moeda ou '0,00'.
     */
    function formatarMoeda(valor) {
        const v = parseFloat(valor);
        // Verifica se é um número válido, senão retorna '0,00'
        return isNaN(v) ? '0,00' : v.toFixed(2).replace('.', ',');
    }

    // --- Recuperação de Dados Iniciais do sessionStorage ---
    const urlImagemCarro = sessionStorage.getItem('urlImagemCarro');
    const nomeCarro = sessionStorage.getItem('nomeCarro');
    const dataRetirada = sessionStorage.getItem('dataRetirada');
    const dataDevolucao = sessionStorage.getItem('dataDevolucao');
    const retiradaLocal = sessionStorage.getItem('retiradaLocal') || ''; // Local, se existir
    const devolucaoLocal = sessionStorage.getItem('devolucaoLocal') || ''; // Local, se existir
    const precoCarroDiaria = parseFloat(sessionStorage.getItem('precoCarro')) || 0; // Preço por diária do carro

    // --- Preenchimento Inicial do Resumo (Dados Estáticos da Reserva) ---
    /**
     * Preenche os campos do resumo que não mudam nesta página (imagem, nome, datas).
     */
    function preencherResumoEstatico() {
        if (imagemResumo) {
            if (urlImagemCarro) {
                imagemResumo.src = urlImagemCarro;
                imagemResumo.alt = nomeCarro || 'Carro Selecionado';
            } else {
                imagemResumo.src = "placeholder_car.png"; // Imagem padrão
                imagemResumo.alt = "Imagem indisponível";
                console.warn("URL da imagem do carro não encontrada no sessionStorage.");
            }
        }
        if (nomeCarroElement) {
            nomeCarroElement.textContent = nomeCarro || 'Veículo não definido';
        }
        if (dataEntregaElement) {
            // Exibe data formatada e local (se houver)
            dataEntregaElement.textContent = formatarData(dataRetirada) + (retiradaLocal ? ` - ${retiradaLocal}` : '');
        }
        if (dataDevolucaoElement) {
            // Exibe data formatada e local (se houver)
            dataDevolucaoElement.textContent = formatarData(dataDevolucao) + (devolucaoLocal ? ` - ${devolucaoLocal}` : '');
        }
    }

    // --- Cálculo e Atualização de Totais ---
    const diarias = calcularDiarias(); // Calcula o número de diárias uma vez

    /**
     * Calcula todos os custos (diárias, proteção, opcionais, taxa, desconto),
     * atualiza a exibição no resumo e salva os totais no sessionStorage.
     */
    function atualizarTotaisGlobais() {
        // 1. Calcular Custo Base do Carro
        const totalDiariasCarro = precoCarroDiaria * diarias;
        if (valorDiariasElement) {
            valorDiariasElement.textContent = formatarMoeda(totalDiariasCarro);
        }

        // 2. Calcular Custo da Proteção Selecionada
        const protecaoSelecionadaInput = document.querySelector('input[name="protecao"]:checked');
        const precoProtecaoDiaria = parseFloat(protecaoSelecionadaInput ? protecaoSelecionadaInput.value : 0) || 0;
        const precoTotalProtecao = precoProtecaoDiaria * diarias;
        const nomeProtecao = protecaoSelecionadaInput ? protecaoSelecionadaInput.closest('.protecao-card').querySelector('h3').textContent.trim() : 'Nenhuma';
        if (valorProtecaoDetalheElement) {
            valorProtecaoDetalheElement.textContent = formatarMoeda(precoTotalProtecao);
        }

        // 3. Calcular Custo Total dos Opcionais
        let totalOpcionais = 0;
        let detalhesOpcionais = {}; // Objeto para guardar valores individuais dos opcionais

        document.querySelectorAll('.opcionais .quantidade').forEach(input => {
            const quantidade = parseInt(input.value) || 0;
            const precoUnitarioDiario = parseFloat(input.getAttribute('data-preco')) || 0;
            const itemNome = input.getAttribute('data-item');
            // Calcula o valor total do item (preço diário * quantidade * número de diárias)
            const valorItemTotal = quantidade * precoUnitarioDiario * diarias;
            totalOpcionais += valorItemTotal;

            // Armazena o valor total calculado para este item opcional
            if (itemNome) {
                detalhesOpcionais[itemNome] = valorItemTotal;
            }
        });
        if (valorOpcionaisDetalheElement) {
            valorOpcionaisDetalheElement.textContent = formatarMoeda(totalOpcionais);
        }

        // 4. Calcular Subtotal (Diárias + Proteção + Opcionais)
        const subtotalCalculado = totalDiariasCarro + precoTotalProtecao + totalOpcionais;

        // 5. Obter/Calcular Taxa de Conveniência e Descontos
        // Usar valores fixos ou buscar do sessionStorage se já definidos antes
        // Exemplo: Taxa de 12% sobre o subtotal (ou outro critério)
        // Exemplo: Desconto fixo ou percentual
        let taxaConveniencia = (subtotalCalculado * 0.12); // Exemplo: 12% do subtotal
        let descontos = 0; // Exemplo: Sem desconto padrão aqui
        // Se a taxa ou desconto foram calculados e salvos antes, pode recuperá-los:
        // taxaConveniencia = parseFloat(sessionStorage.getItem('finalTaxa')) || taxaConveniencia;
        // descontos = parseFloat(sessionStorage.getItem('finalDescontos')) || descontos;

        if (taxaConvenienciaElement) {
            taxaConvenienciaElement.textContent = formatarMoeda(taxaConveniencia);
        }
        if (descontosElement) {
            // Exibe com sinal negativo se for maior que zero
            descontosElement.textContent = descontos > 0 ? `-${formatarMoeda(descontos)}` : '0,00';
        }

        // 6. Calcular Total Final
        const totalFinal = subtotalCalculado + taxaConveniencia - descontos;
        if (totalElement) {
            totalElement.textContent = formatarMoeda(totalFinal);
        }

        // --- 7. Salvar Valores Calculados no sessionStorage para a Próxima Página ---
        // Salva valores totais calculados (já multiplicados pelas diárias)
        sessionStorage.setItem('protecaoNome', nomeProtecao);
        sessionStorage.setItem('protecaoValor', precoTotalProtecao.toFixed(2));
        sessionStorage.setItem('valorOpcionaisTotal', totalOpcionais.toFixed(2));
        sessionStorage.setItem('finalTaxa', taxaConveniencia.toFixed(2));
        sessionStorage.setItem('finalDescontos', descontos.toFixed(2));
        sessionStorage.setItem('finalSubtotal', subtotalCalculado.toFixed(2));
        sessionStorage.setItem('finalTotal', totalFinal.toFixed(2));

        // Salva valores individuais dos opcionais (também já multiplicados pelas diárias)
        for (const [key, value] of Object.entries(detalhesOpcionais)) {
            sessionStorage.setItem(`${key}Valor`, value.toFixed(2));
        }

        // Garante que os dados básicos da reserva continuem salvos
        if (urlImagemCarro) sessionStorage.setItem('urlImagemCarro', urlImagemCarro);
        if (nomeCarro) sessionStorage.setItem('nomeCarro', nomeCarro);
        sessionStorage.setItem('precoCarro', precoCarroDiaria.toString()); // Salva preço diário original
        if (dataRetirada) sessionStorage.setItem('dataRetirada', dataRetirada);
        if (dataDevolucao) sessionStorage.setItem('dataDevolucao', dataDevolucao);
        const horaRetirada = sessionStorage.getItem('horaRetirada');
        const horaDevolucao = sessionStorage.getItem('horaDevolucao');
        if (horaRetirada) sessionStorage.setItem('horaRetirada', horaRetirada);
        if (horaDevolucao) sessionStorage.setItem('horaDevolucao', horaDevolucao);
        if (retiradaLocal) sessionStorage.setItem('retiradaLocal', retiradaLocal);
        if (devolucaoLocal) sessionStorage.setItem('devolucaoLocal', devolucaoLocal);
        sessionStorage.setItem('numeroDiarias', diarias.toString()); // Salva número de diárias calculado
    }

    // --- Event Listeners ---

    // Listener para os botões de +/- nos contadores de opcionais
    document.querySelectorAll('.opcionais .contador button').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentNode.querySelector('.quantidade');
            let valor = parseInt(input.value) || 0;
            if (this.classList.contains('btn-mais')) {
                valor++; // Incrementa
                // Pode adicionar um limite máximo aqui se necessário (ex: if (valor > 5) valor = 5;)
            } else if (this.classList.contains('btn-menos') && valor > 0) {
                valor--; // Decrementa apenas se for maior que 0
            }
            input.value = valor;
            atualizarTotaisGlobais(); // Recalcula tudo ao mudar a quantidade
        });
    });

    // Listener para a seleção de proteção (radio buttons)
    document.querySelectorAll('input[name="protecao"]').forEach(radio => {
        radio.addEventListener('change', atualizarTotaisGlobais); // Recalcula tudo ao mudar a proteção
    });

    // Listener para o botão "Voltar"
    const cancelarButton = document.querySelector('.resumo-actions .cancelar');
    cancelarButton?.addEventListener('click', function() {
        // Volta para a página de seleção de veículo
        window.location.href = 'reservasCarro.html'; // CONFIRME ESTE NOME
    });

    // Listener para o botão "Continuar"
    const continuarButton = document.querySelector('.resumo-actions .continuar');
    continuarButton?.addEventListener('click', function() {
        // 1. Garante que os totais estão atualizados e salvos antes de prosseguir
        atualizarTotaisGlobais();

        // 2. Validações Essenciais (Exemplo)
        if (!sessionStorage.getItem('nomeCarro') || !sessionStorage.getItem('precoCarro')) {
            alert('Informações do veículo ausentes. Por favor, retorne à seleção de veículo.');
            window.location.href = 'reservasCarro.html'; // Volta para seleção de carro
            return; // Interrompe
        }
        if (!sessionStorage.getItem('dataRetirada') || !sessionStorage.getItem('dataDevolucao')) {
            alert('Datas da reserva ausentes. Por favor, retorne à seleção de datas.');
            window.location.href = 'reservasData.html'; // Volta para seleção de data
            return; // Interrompe
        }
        // Pode adicionar outras validações aqui (ex: proteção selecionada?)

        // 3. Redireciona para a próxima página (Condutor)
        console.log("Dados salvos. Redirecionando para a página do condutor...");
        window.location.href = 'reservasCondutor.html'; // CONFIRME ESTE NOME
    });

    // --- Inicialização da Página ---
    preencherResumoEstatico(); // Preenche imagem, nome, datas
    atualizarTotaisGlobais(); // Calcula e exibe os custos iniciais e salva no storage

    // Chama a função para buscar o clima (se ela estiver definida globalmente ou importada)
    if (typeof fetchWeather === "function") {
        fetchWeather();
    } else {
        console.warn("Função fetchWeather não encontrada.");
    }

}); // Fim do DOMContentLoaded

// --- Função de Clima (Definida Globalmente ou Importada) ---
// Cole aqui a definição da função async function fetchWeather() { ... }
// ou garanta que ela seja carregada antes deste script.
// Exemplo Mínimo:
async function fetchWeather() {
    const location = 'santo amaro, sao paulo, br';
    const apiKey = '4UHF6RU7LPLQU73J9SR5REXX6'; // Sua chave API
    const apiUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(location)}?unitGroup=metric&key=${apiKey}&contentType=json&lang=pt`;
    const tempElement = document.getElementById('weather-temp');
    const descElement = document.getElementById('weather-desc');
    if (tempElement) tempElement.textContent = '--';
    if (descElement) descElement.textContent = 'Carregando...';
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`Erro ${response.status}`);
        const data = await response.json();
        if (data && data.currentConditions) {
            const current = data.currentConditions;
            if (tempElement && current.temp !== null) tempElement.textContent = Math.round(current.temp);
            if (descElement && current.conditions) descElement.textContent = current.conditions.charAt(0).toUpperCase() + current.conditions.slice(1);
        } else { throw new Error("Dados de clima inesperados"); }
    } catch (error) {
        console.error("Falha ao buscar clima:", error);
        if (tempElement) tempElement.textContent = 'N/A';
        if (descElement) descElement.textContent = 'Erro';
    }
}
// A chamada fetchWeather() é feita dentro do DOMContentLoaded agora.