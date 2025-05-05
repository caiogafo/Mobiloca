// Aguarda o DOM (toda a estrutura HTML) ser completamente carregado e interpretado.
document.addEventListener('DOMContentLoaded', function() {

    // Tenta selecionar o botão de reservar usando seu ID único.
    const botaoReservar = document.getElementById('botaoReservar');

    // Verifica se o botão foi realmente encontrado no DOM.
    if (botaoReservar) {
        // Se o botão existe, adiciona um 'listener' que espera por um evento de 'click'.
        botaoReservar.addEventListener('click', function() {
            // Dentro desta função, 'this' se refere ao elemento que disparou o evento (o botão).

            // Tenta encontrar o elemento pai mais próximo que tenha a classe '.economico'.
            // Isso ajuda a garantir que estamos pegando dados da seção correta.
            const secaoEconomico = this.closest('.economico');

            // Verifica se a seção pai foi encontrada.
            if (secaoEconomico) {
                // Dentro da seção encontrada, procura pelo primeiro elemento <p> (assume ser o nome do carro).
                const elementoNomeCarro = secaoEconomico.querySelector('p');
                // Dentro da seção, procura pelo elemento com a classe '.grupo' dentro de '.detalhes'.
                const elementoGrupoCarro = secaoEconomico.querySelector('.detalhes .grupo');

                // Verifica se ambos os elementos (nome e grupo) foram encontrados.
                if (elementoNomeCarro && elementoGrupoCarro) {
                    // Extrai o texto contido nos elementos e remove espaços em branco extras (inicio/fim).
                    const nomeCarro = elementoNomeCarro.textContent.trim(); // Ex: "FIAT CRONOS"
                    const grupoTexto = elementoGrupoCarro.textContent.trim(); // Ex: "GRUPO B"

                    // Processa o texto do grupo para extrair apenas o código (Ex: "B").
                    // Assume o formato "PALAVRA CODIGO". Pega a segunda parte (índice 1) após dividir por espaço.
                    // Se não houver espaço, usa o texto inteiro como fallback.
                    const grupoCarro = grupoTexto.split(' ')[1] || grupoTexto;

                    // Codifica os valores de nome e grupo para serem usados de forma segura em uma URL.
                    // Isso substitui caracteres especiais (como espaços) por códigos %xx.
                    const nomeCarroCodificado = encodeURIComponent(nomeCarro);
                    const grupoCarroCodificado = encodeURIComponent(grupoCarro);

                    // Monta a URL da página de destino (reservasData.html) adicionando
                    // os dados do carro e grupo como parâmetros de consulta (query parameters).
                    const urlDestino = `reservasData.html?carro=${nomeCarroCodificado}&grupo=${grupoCarroCodificado}`;

                    // Log (mensagem no console do navegador) para fins de depuração. Mostra para onde vai redirecionar.
                    console.log(`Redirecionando para: ${urlDestino}`);

                    // Redireciona o navegador do usuário para a URL construída.
                    window.location.href = urlDestino;

                } else {
                    // Se não encontrou o elemento do nome ou do grupo, exibe um erro no console.
                    console.error("Erro: Não foi possível encontrar os elementos de nome ou grupo do carro dentro da seção '.economico'.");
                    // Poderia adicionar um alert para o usuário aqui, ou redirecionar sem os dados.
                    // Exemplo: alert("Erro ao obter detalhes do carro. Tente novamente.");
                }
            } else {
                // Se não encontrou a seção pai '.economico', exibe um erro no console.
                 console.error("Erro: Não foi possível encontrar a seção pai '.economico' para o botão clicado.");
            }
        }); // Fim do addEventListener
    } else {
        // Se o botão com ID 'botaoReservar' não foi encontrado na página, exibe um erro no console.
        console.error("Erro: Botão com ID 'botaoReservar' não encontrado no DOM.");
    }

}); // Fim do DOMContentLoaded listener

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

            // Opcional: Atualizar um ícone do tempo se houver um elemento para isso.
            // const iconCode = current.icon; // Ex: 'partly-cloudy-day'
            // document.getElementById('weather-icon').className = `weather-icon-${iconCode}`; // Exemplo

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