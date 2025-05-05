async function fetchWeather() {
    // --- Configuração ---
    const location = 'santo amaro'; // Ou 'Santo Amaro, São Paulo, Brazil' para mais especificidade
    const apiKey = '4UHF6RU7LPLQU73J9SR5REXX6'; // Sua chave API

    // --- URL da API (Sua URL, com unitGroup=metric) ---
    const apiUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(location)}?unitGroup=metric&key=${apiKey}&contentType=json&lang=pt`; // Adicionado lang=pt

    // --- Elementos do DOM ---
    const tempElement = document.getElementById('weather-temp');
    const descElement = document.getElementById('weather-desc');

    // Estado inicial
    if(tempElement) tempElement.textContent = '--';
    if(descElement) descElement.textContent = 'Carregando...';

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            const errorData = await response.text(); // Tenta ler corpo do erro
            throw new Error(`Erro da API: ${response.statusText} (Status: ${response.status}). Resposta: ${errorData}`);
        }
        const data = await response.json();

        console.log("Resposta da API Visual Crossing:", data); // LOG para verificar estrutura

        // --- Processamento da Resposta (Adaptado para Visual Crossing) ---
        if (data.currentConditions) {
            const current = data.currentConditions;
            const temperature = current.temp; // Temperatura em Celsius
            const description = current.conditions; // Descrição do tempo

            // Atualiza o HTML
            if (temperature !== undefined && temperature !== null && tempElement) {
                tempElement.textContent = Math.round(temperature);
            } else if (tempElement) {
                tempElement.textContent = 'N/A';
            }

            if (description && descElement) {
                // A API já deve retornar em português com lang=pt
                // Apenas garante a primeira letra maiúscula se necessário
                descElement.textContent = description.charAt(0).toUpperCase() + description.slice(1);
            } else if (descElement) {
                descElement.textContent = 'N/A';
            }

             // Opcional: Atualizar o ícone se você tiver um elemento para isso
             // const iconCode = current.icon; // Ex: 'partly-cloudy-day'
             // Atualizar src de um <img> ou classe de um <i> com base no iconCode

        } else {
            console.warn("Objeto 'currentConditions' não encontrado na resposta.");
            if(tempElement) tempElement.textContent = 'N/A';
            if(descElement) descElement.textContent = 'Indisponível';
        }
        // -----------------------------------------------------------------

    } catch (error) {
        console.error("Falha ao buscar/processar dados de tempo:", error);
        if(tempElement) tempElement.textContent = 'N/A';
        if(descElement) descElement.textContent = 'Erro';
    }
}

// --- Chamar a função para buscar o tempo ---
fetchWeather();