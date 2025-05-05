// Espera o DOM (estrutura HTML) carregar completamente
document.addEventListener('DOMContentLoaded', function() {

    // --- Lógica para data/hora nativas ---
    const rentalForm = document.getElementById('rental-search-form');
    const retiradaDataInput = document.getElementById('retirada_data');
    const retiradaHoraInput = document.getElementById('retirada_hora');
    const devolucaoDataInput = document.getElementById('devolucao_data');
    const devolucaoHoraInput = document.getElementById('devolucao_hora');

    // Verifica se todos os elementos foram encontrados antes de prosseguir
    if (!rentalForm || !retiradaDataInput || !retiradaHoraInput || !devolucaoDataInput || !devolucaoHoraInput) {
        console.error("Um ou mais elementos do formulário de data/hora não foram encontrados.");
        return; // Aborta a execução se elementos essenciais faltarem
    }

    // Define a data mínima de retirada como hoje
    const hoje = new Date().toISOString().split('T')[0];
    retiradaDataInput.min = hoje;

    // Define a data mínima de devolução ao carregar (ou igual à retirada se já preenchida)
    if (retiradaDataInput.value) {
        devolucaoDataInput.min = retiradaDataInput.value;
    } else {
        devolucaoDataInput.min = hoje; // Garante que não seja antes de hoje
    }

    // Adiciona listener para atualizar a data mínima de devolução dinamicamente
    retiradaDataInput.addEventListener('change', function() {
        // Atualiza o valor mínimo do campo data-devolucao
        devolucaoDataInput.min = this.value;

        // Se a data de devolução for menor que a nova data de retirada,
        // ajusta a data de devolução para ser igual à de retirada.
        if (devolucaoDataInput.value < this.value) {
            devolucaoDataInput.value = this.value;
        }
    });

    // Adiciona validação na submissão do formulário
    rentalForm.addEventListener('submit', function(event) {
        // Obter os valores dos campos no momento da submissão
        const dataRetirada = retiradaDataInput.value;
        const horaRetirada = retiradaHoraInput.value;
        const dataDevolucao = devolucaoDataInput.value;
        const horaDevolucao = devolucaoHoraInput.value;

        // Verifica se os campos obrigatórios estão preenchidos (redundante com 'required', mas seguro)
        if (!dataRetirada || !horaRetirada || !dataDevolucao || !horaDevolucao) {
            alert("Por favor, preencha todas as datas e horas.");
            event.preventDefault(); // Impede o envio do formulário
            return;
        }

        // --- VALIDAÇÃO DA DATA/HORA ---
        // Combina data e hora para comparação precisa
        // Adiciona segundos ':00' se não houver, para garantir compatibilidade
        const horaRetiradaCompleta = horaRetirada.includes(':') ? horaRetirada : horaRetirada + ':00';
        const horaDevolucaoCompleta = horaDevolucao.includes(':') ? horaDevolucao : horaDevolucao + ':00';

        const dataRetiradaObj = new Date(dataRetirada + "T" + horaRetiradaCompleta);
        const dataDevolucaoObj = new Date(dataDevolucao + "T" + horaDevolucaoCompleta);

        // Verifica se as datas são válidas
        if (isNaN(dataRetiradaObj.getTime()) || isNaN(dataDevolucaoObj.getTime())) {
             alert("Datas ou horas inválidas. Por favor, verifique.");
             event.preventDefault(); // Impede o envio do formulário
             return;
        }

        // Compara as datas/horas completas
        if (dataDevolucaoObj <= dataRetiradaObj) {
             alert("A data e hora de devolução devem ser posteriores à data e hora de retirada.");
             event.preventDefault(); // Impede o envio do formulário
             return;
        }

        // Se chegou aqui, a validação passou e o formulário será enviado
        console.log("Validação OK. Enviando formulário...");
    });


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
    fetchWeather(); // Chamada está correta aqui
    }); // <---------------- FIM DO document.addEventListener('DOMContentLoaded', ...);