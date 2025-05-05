document.addEventListener('DOMContentLoaded', function () {
    console.log("FAQ JS loaded");

    // Seleciona todos os botões de pergunta
    const faqQuestions = document.querySelectorAll('.faq-question');
    // Seleciona todos os itens pais para facilitar o fechamento
    const allFaqItems = document.querySelectorAll('.faq-item');

    // Adiciona um listener de clique para cada botão de pergunta
    faqQuestions.forEach(button => {
        button.addEventListener('click', () => {
            // Encontra o '.faq-item' pai do botão clicado
            const currentFaqItem = button.closest('.faq-item');
            // Encontra o elemento de resposta dentro do mesmo item (pode não ser necessário aqui)

            // Verifica se o item clicado já está aberto
            const isCurrentlyOpen = currentFaqItem.classList.contains('is-open');

            // --- LÓGICA PARA FECHAR OS OUTROS ---
            // Primeiro, fecha *todos* os itens que possam estar abertos.
            allFaqItems.forEach(item => {
                // Verifica se o item não é o que foi clicado E se ele está aberto
                if (item !== currentFaqItem && item.classList.contains('is-open')) {
                    item.classList.remove('is-open'); // Fecha o item (visual via CSS)
                    const otherButton = item.querySelector('.faq-question');
                    if (otherButton) {
                        otherButton.setAttribute('aria-expanded', 'false'); // Atualiza acessibilidade
                    }
                }
            });
            // --- FIM DA LÓGICA PARA FECHAR OS OUTROS ---


            // Agora, alterna o estado APENAS do item que foi clicado
            if (isCurrentlyOpen) {
                // Se ele JÁ estava aberto (e agora os outros estão fechados), fecha ele também.
                currentFaqItem.classList.remove('is-open');
                button.setAttribute('aria-expanded', 'false');
                console.log("Fechando:", button.querySelector('span').textContent.trim());
            } else {
                // Se ele estava fechado (e os outros foram fechados), abre ele.
                currentFaqItem.classList.add('is-open');
                button.setAttribute('aria-expanded', 'true');
                console.log("Abrindo:", button.querySelector('span').textContent.trim());
            }

            // A lógica alternativa com 'hidden' permanece comentada como estava
            /*
             if (faqAnswer.hidden) { ... } else { ... }
            */
        });
    });

}); // Fim do DOMContentLoaded

// --- fetchWeather (INTOCADO, como no seu código) ---
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
                descElement.textContent = description.charAt(0).toUpperCase() + description.slice(1);
            } else if (descElement) {
                descElement.textContent = 'N/A';
            }
        } else {
            console.warn("Objeto 'currentConditions' não encontrado na resposta.");
            if(tempElement) tempElement.textContent = 'N/A';
            if(descElement) descElement.textContent = 'Indisponível';
        }
    } catch (error) {
        console.error("Falha ao buscar/processar dados de tempo:", error);
        if(tempElement) tempElement.textContent = 'N/A';
        if(descElement) descElement.textContent = 'Erro';
    }
}

// --- Chamar a função para buscar o tempo (INTOCADO, como no seu código) ---
fetchWeather();