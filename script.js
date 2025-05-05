// Executa o código quando o DOM (estrutura HTML) estiver completamente carregado e parseado.
document.addEventListener("DOMContentLoaded", function () {

    /**
     * Manipula o clique no botão "Reservar" de um veículo.
     * @param {Event} event - O objeto do evento de clique.
     */
    function handleReservaClick(event) {
        // Previne o comportamento padrão do link (que seria navegar para href).
        event.preventDefault();

        // Obtém o elemento <a> que foi clicado.
        const botao = event.currentTarget;

        // Extrai os dados do veículo dos atributos data-* do botão.
        const nomeCarro = botao.dataset.carro;
        const precoCarro = botao.dataset.preco;
        const urlImagemCarro = botao.dataset.imagem;

        // Armazena os dados do carro selecionado no sessionStorage.
        // sessionStorage persiste apenas durante a sessão do navegador.
        sessionStorage.setItem('nomeCarro', nomeCarro);
        sessionStorage.setItem('precoCarro', precoCarro);
        sessionStorage.setItem('urlImagemCarro', urlImagemCarro);

        // Redireciona o usuário para a página de seleção de datas (reservasData.html).
        window.location.href = "reservasData.html";
    }

    // --- Adiciona os listeners de evento aos botões "Reservar" ---
    // Seleciona todos os elementos <a> com a classe .botao-principal que também possuem o atributo data-carro.
    const botoesReservar = document.querySelectorAll(".botao-principal[data-carro]");

    // Itera sobre cada botão encontrado e adiciona o listener de clique.
    botoesReservar.forEach(botao => {
        botao.addEventListener('click', handleReservaClick);
    });

    // --- Chamada inicial para buscar dados do tempo (movida para fora do DOMContentLoaded no original, mas pode ficar aqui) ---
    // É seguro chamar aqui pois os elementos do footer (#weather-temp, #weather-desc) já existem.
    fetchWeather();

}); // Fim do DOMContentLoaded listener

/**
 * Busca dados de tempo da API Visual Crossing e atualiza o rodapé.
 * Função assíncrona para lidar com a requisição fetch.
 */
async function fetchWeather() {
    // --- Configurações da API ---
    const location = 'santo amaro'; // Localização para a busca de tempo
    const apiKey = '4UHF6RU7LPLQU73J9SR5REXX6'; // SUA CHAVE API - ATENÇÃO: NÃO É SEGURO EXPOR A CHAVE ASSIM NO FRONTEND!
    const lang = 'pt'; // Define o idioma da resposta para Português

    // --- URL da API ---
    // Constrói a URL da API com a localização, unidade métrica, chave, tipo de conteúdo e idioma.
    const apiUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(location)}?unitGroup=metric&key=${apiKey}&contentType=json&lang=${lang}`;

    // --- Elementos do DOM para exibir o tempo ---
    const tempElement = document.getElementById('weather-temp');
    const descElement = document.getElementById('weather-desc');

    // --- Estado Inicial (feedback visual enquanto carrega) ---
    if (tempElement) tempElement.textContent = '--';
    if (descElement) descElement.textContent = 'Carregando...';

    try {
        // --- Faz a requisição para a API ---
        const response = await fetch(apiUrl);

        // --- Verifica se a requisição foi bem-sucedida (status 2xx) ---
        if (!response.ok) {
            // Se houver erro, tenta ler a mensagem de erro da API e lança um erro.
            const errorData = await response.text();
            throw new Error(`Erro da API: ${response.statusText} (Status: ${response.status}). Resposta: ${errorData}`);
        }

        // --- Converte a resposta para JSON ---
        const data = await response.json();

        // Log para depuração (verificar a estrutura da resposta no console do navegador)
        // console.log("Resposta da API Visual Crossing:", data);

        // --- Processa a resposta da API ---
        // Verifica se existem dados de condições atuais na resposta.
        if (data.currentConditions) {
            const current = data.currentConditions;
            const temperature = current.temp;       // Temperatura atual (já em Celsius devido a unitGroup=metric)
            const description = current.conditions; // Descrição do tempo (já em português devido a lang=pt)

            // --- Atualiza o HTML com os dados do tempo ---
            // Atualiza a temperatura (arredondada)
            if (temperature !== undefined && temperature !== null && tempElement) {
                tempElement.textContent = Math.round(temperature);
            } else if (tempElement) {
                tempElement.textContent = 'N/A'; // Caso não venha temperatura
            }

            // Atualiza a descrição
            if (description && descElement) {
                 // Garante que a primeira letra seja maiúscula (geralmente a API já faz isso)
                descElement.textContent = description.charAt(0).toUpperCase() + description.slice(1);
            } else if (descElement) {
                descElement.textContent = 'N/A'; // Caso não venha descrição
            }

        } else {
            // Caso a estrutura da resposta não contenha 'currentConditions'.
            console.warn("Objeto 'currentConditions' não encontrado na resposta da API.");
            if (tempElement) tempElement.textContent = 'N/A';
            if (descElement) descElement.textContent = 'Indisponível';
        }

    } catch (error) {
        // --- Tratamento de Erro (falha na requisição ou no processamento) ---
        console.error("Falha ao buscar ou processar dados de tempo:", error);
        // Exibe 'Erro' no rodapé para indicar o problema.
        if (tempElement) tempElement.textContent = 'N/A';
        if (descElement) descElement.textContent = 'Erro';
    }
}