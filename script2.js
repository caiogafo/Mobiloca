/**
 * Valida os dados de data/hora inseridos no formulário, armazena no sessionStorage
 * e redireciona para a página 'reservasCarro.html'.
 * Esta função é acionada pelo clique no botão 'Continuar'.
 */
function redirecionarParaLink() {
    // Obtém referências aos elementos de input do formulário.
    const dataRetiradaInput = document.getElementById('data-retirada');
    const horaRetiradaInput = document.getElementById('hora-retirada');
    const dataDevolucaoInput = document.getElementById('data-devolucao');
    const horaDevolucaoInput = document.getElementById('hora-devolucao');

    // Verificação crucial para garantir que os elementos existem antes de usar.
    if (!dataRetiradaInput || !horaRetiradaInput || !dataDevolucaoInput || !horaDevolucaoInput) {
        console.error("Elementos de data/hora não encontrados ao tentar redirecionar.");
        alert("Ocorreu um erro. Por favor, recarregue a página.");
        return; // Interrompe a execução se algum campo não for encontrado.
    }

    // Obtém os valores atuais dos campos.
    const dataRetirada = dataRetiradaInput.value;
    const horaRetirada = horaRetiradaInput.value;
    const dataDevolucao = dataDevolucaoInput.value;
    const horaDevolucao = horaDevolucaoInput.value;

    // --- VALIDAÇÃO DOS DADOS ---

    // Verifica se todos os campos obrigatórios foram preenchidos.
    if (!dataRetirada || !horaRetirada || !dataDevolucao || !horaDevolucao) {
        alert("Por favor, preencha todas as datas e horas antes de continuar.");
        return; // Interrompe se algum campo estiver vazio.
    }

    // Combina data e hora em strings completas para criar objetos Date.
    // Adiciona ':00' aos segundos se não estiverem presentes para evitar erros em alguns navegadores.
    const horaRetiradaCompleta = horaRetirada.includes(':') ? horaRetirada + (horaRetirada.split(':').length === 2 ? ':00' : '') : '00:00:00';
    const horaDevolucaoCompleta = horaDevolucao.includes(':') ? horaDevolucao + (horaDevolucao.split(':').length === 2 ? ':00' : '') : '00:00:00';

    // Cria objetos Date para comparação.
    const dataRetiradaObj = new Date(dataRetirada + "T" + horaRetiradaCompleta);
    const dataDevolucaoObj = new Date(dataDevolucao + "T" + horaDevolucaoCompleta);

    // Verifica se as datas/horas resultaram em objetos Date válidos.
    if (isNaN(dataRetiradaObj.getTime()) || isNaN(dataDevolucaoObj.getTime())) {
        alert("Datas ou horas inválidas. Verifique os valores.");
        return; // Interrompe se a conversão falhar.
    }

    // Verifica se a data/hora de devolução é estritamente posterior à de retirada.
    if (dataDevolucaoObj <= dataRetiradaObj) {
        alert("A data e hora de devolução devem ser posteriores à data e hora de retirada.");
        return; // Interrompe se a data de devolução não for posterior.
    }
    // --- FIM DA VALIDAÇÃO ---

    // Armazena os valores validados no sessionStorage para uso na próxima página.
    sessionStorage.setItem('dataRetirada', dataRetirada);
    sessionStorage.setItem('horaRetirada', horaRetirada);
    sessionStorage.setItem('dataDevolucao', dataDevolucao);
    sessionStorage.setItem('horaDevolucao', horaDevolucao);

    // Log para depuração, mostrando os dados que serão passados (indiretamente via sessionStorage).
    console.log("Redirecionando para reservasCarro.html com dados:", { dataRetirada, horaRetirada, dataDevolucao, horaDevolucao });

    // Redireciona o navegador para a próxima página do fluxo de reserva.
    window.location.href = "reservasCarro.html";
}

/**
 * Busca dados de tempo atuais para Santo Amaro usando a API Visual Crossing
 * e atualiza os elementos correspondentes no rodapé da página.
 * Função assíncrona devido ao uso de 'await' com 'fetch'.
 */
async function fetchWeather() {
    // --- Configuração da API ---
    const location = 'santo amaro';                     // Localização fixa
    const apiKey = '4UHF6RU7LPLQU73J9SR5REXX6';         // Chave da API (ATENÇÃO: Expor no frontend não é seguro em produção)
    const lang = 'pt';                                  // Idioma da resposta

    // --- URL da API ---
    const apiUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(location)}?unitGroup=metric&key=${apiKey}&contentType=json&lang=${lang}`;

    // --- Elementos do DOM ---
    const tempElement = document.getElementById('weather-temp');
    const descElement = document.getElementById('weather-desc');

    // Verifica se os elementos do DOM para exibir o clima existem.
    if (!tempElement || !descElement) {
        console.warn("Elementos do clima (weather-temp ou weather-desc) não encontrados.");
        return; // Interrompe a função se os elementos não forem achados.
    }

    // Define o estado inicial enquanto os dados são carregados.
    tempElement.textContent = '--';
    descElement.textContent = 'Carregando...';

    try {
        // Realiza a chamada à API.
        const response = await fetch(apiUrl);

        // Verifica se a resposta da API foi bem-sucedida (status 2xx).
        if (!response.ok) {
            const errorData = await response.text(); // Tenta obter detalhes do erro.
            // Lança um erro detalhado para o bloco catch.
            throw new Error(`Erro da API: ${response.statusText} (Status: ${response.status}). Resposta: ${errorData}`);
        }

        // Converte o corpo da resposta para JSON.
        const data = await response.json();
        // console.log("Resposta da API Visual Crossing:", data); // Log opcional para depuração.

        // --- Processamento da Resposta ---
        // Verifica se o objeto esperado com as condições atuais existe.
        if (data.currentConditions) {
            const current = data.currentConditions;
            const temperature = current.temp;       // Temperatura em Celsius.
            const description = current.conditions; // Descrição do tempo em português.

            // Atualiza o elemento de temperatura no HTML.
            if (temperature !== undefined && temperature !== null) {
                tempElement.textContent = Math.round(temperature); // Arredonda para inteiro.
            } else {
                tempElement.textContent = 'N/A'; // Indica dado não disponível.
            }

            // Atualiza o elemento de descrição no HTML.
            if (description) {
                // Garante que a primeira letra seja maiúscula.
                descElement.textContent = description.charAt(0).toUpperCase() + description.slice(1);
            } else {
                descElement.textContent = 'N/A'; // Indica dado não disponível.
            }
        } else {
            // Se a estrutura da resposta for inesperada.
            console.warn("Objeto 'currentConditions' não encontrado na resposta.");
            tempElement.textContent = 'N/A';
            descElement.textContent = 'Indisponível';
        }
    } catch (error) {
        // Captura erros de rede ou erros lançados durante o processamento.
        console.error("Falha ao buscar/processar dados de tempo:", error);
        // Atualiza o HTML para indicar o erro ao usuário.
        if(tempElement) tempElement.textContent = 'N/A';
        if(descElement) descElement.textContent = 'Erro';
    }
}

// --- Ponto de Entrada Principal do Script ---
// Executa o código abaixo quando o HTML da página estiver completamente carregado e pronto.
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM carregado para reservasData.html.");

    // --- Seleção dos elementos do formulário ---
    const dataRetiradaInput = document.getElementById('data-retirada');
    const horaRetiradaInput = document.getElementById('hora-retirada');
    const dataDevolucaoInput = document.getElementById('data-devolucao');
    const horaDevolucaoInput = document.getElementById('hora-devolucao');
    const continueButton = document.querySelector(".continue-button");

    // --- Verificação da existência dos elementos essenciais ---
    // (A verificação robusta já existe dentro de redirecionarParaLink, mas uma inicial é boa prática)
    if (!dataRetiradaInput || !dataDevolucaoInput || !horaRetiradaInput || !horaDevolucaoInput) {
         console.error("Não foi possível encontrar um ou mais campos de input (data/hora) em reservasData.html. Verifique os IDs.");
         if(continueButton) continueButton.disabled = true; // Desabilita botão se faltar campo
         return; // Não continua se faltar campo essencial
    }
     if (!continueButton) {
         console.warn("Botão com classe '.continue-button' não encontrado.");
    }

    // --- 1. Tenta preencher os campos com dados da URL (Query Parameters) ---
    const urlParams = new URLSearchParams(window.location.search);
    const retiradaDataParam = urlParams.get('retirada_data');
    const retiradaHoraParam = urlParams.get('retirada_hora');
    const devolucaoDataParam = urlParams.get('devolucao_data');
    const devolucaoHoraParam = urlParams.get('devolucao_hora');

    // Log dos parâmetros recebidos (útil para depuração).
    console.log("Parâmetros da URL:", { retiradaDataParam, retiradaHoraParam, devolucaoDataParam, devolucaoHoraParam });

    let dataRetiradaPreenchida = false; // Flag para controlar lógica de data mínima.

    // Preenche os campos de data/hora se os parâmetros correspondentes existirem na URL.
    if (retiradaDataParam) {
        dataRetiradaInput.value = retiradaDataParam;
        console.log('Campo data-retirada preenchido com:', retiradaDataParam);
        dataRetiradaPreenchida = true;
    }
    if (retiradaHoraParam) {
        horaRetiradaInput.value = retiradaHoraParam;
        console.log('Campo hora-retirada preenchido com:', retiradaHoraParam);
    }
    if (devolucaoDataParam) {
        dataDevolucaoInput.value = devolucaoDataParam;
        console.log('Campo data-devolucao preenchido com:', devolucaoDataParam);
    }
    if (devolucaoHoraParam) {
        horaDevolucaoInput.value = horaDevolucaoParam;
        console.log('Campo hora-devolucao preenchido com:', horaDevolucaoParam);
    }

    // --- 2. Define as datas mínimas e adiciona listeners para validação dinâmica ---
    const hoje = new Date().toISOString().split('T')[0]; // Obtém a data de hoje no formato YYYY-MM-DD.

    // Define a data mínima permitida para retirada como hoje.
    dataRetiradaInput.min = hoje;
    // Se a data preenchida for anterior a hoje, limpa o campo.
    if (dataRetiradaInput.value && dataRetiradaInput.value < hoje) {
        console.warn("Data de retirada preenchida é anterior a hoje. Limpando.");
        dataRetiradaInput.value = "";
        dataRetiradaPreenchida = false; // Reseta a flag.
    }

    // Define a data mínima inicial para devolução baseada na data de retirada (ou hoje).
    if (dataRetiradaInput.value) {
        dataDevolucaoInput.min = dataRetiradaInput.value;
        // Se a devolução preenchida for anterior à retirada, ajusta para a data de retirada.
        if (dataDevolucaoInput.value && dataDevolucaoInput.value < dataRetiradaInput.value) {
            console.warn("Data de devolução preenchida é anterior à data de retirada. Ajustando...");
            dataDevolucaoInput.value = dataRetiradaInput.value;
        }
    } else {
        dataDevolucaoInput.min = hoje; // Se retirada estiver vazia, mínimo é hoje.
        // Se devolução estiver preenchida e for anterior a hoje, limpa.
        if (dataDevolucaoInput.value && dataDevolucaoInput.value < hoje) {
             dataDevolucaoInput.value = "";
        }
    }

    // Adiciona um listener ao campo de data de retirada.
    // Quando a data de retirada mudar, atualiza a data mínima de devolução.
    if (!dataRetiradaInput.dataset.listenerAttached) { // Evita adicionar múltiplos listeners
          dataRetiradaInput.addEventListener('change', function() {
               console.log("Data de retirada alterada para:", this.value);
               const novaMinDevolucao = this.value || hoje; // Novo mínimo é a data selecionada ou hoje.
               dataDevolucaoInput.min = novaMinDevolucao;
               // Se a data de devolução atual ficar inválida (menor que o novo mínimo), ajusta.
               if (dataDevolucaoInput.value && dataDevolucaoInput.value < novaMinDevolucao) {
                   console.log("Ajustando data de devolução para o novo mínimo:", novaMinDevolucao);
                   dataDevolucaoInput.value = novaMinDevolucao;
               }
         });
         dataRetiradaInput.dataset.listenerAttached = 'true'; // Marca que o listener foi adicionado.
    }

    // Dispara o evento 'change' manualmente se a data foi preenchida via URL.
    // Isso garante que a lógica de data mínima de devolução seja executada imediatamente.
    if (dataRetiradaPreenchida) {
        console.log("Disparando evento 'change' em data-retirada para atualizar data mínima de devolução.");
        dataRetiradaInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // --- 3. Adiciona listener ao botão Continuar ---
    // Verifica se o botão existe antes de adicionar o listener.
    if (continueButton) {
        continueButton.addEventListener("click", redirecionarParaLink);
    }
    // A verificação de !continueButton já foi feita no início.

    // --- 4. Chama a função para buscar o clima ---
    console.log("Tentando chamar fetchWeather...");
    fetchWeather(); // A função fetchWeather agora verifica internamente se os elementos existem.

    console.log("Inicialização de reservasData.html concluída.");

}); // Fim do DOMContentLoaded