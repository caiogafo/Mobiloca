// Espera o DOM (estrutura HTML) estar completamente carregado antes de executar o script
document.addEventListener('DOMContentLoaded', function() {

    // --- FUNÇÕES AUXILIARES ---

    /**
     * Formata uma data (ISO 8601 'YYYY-MM-DD') e hora ('HH:MM') para o formato 'DD/MM/YYYY HH:MM'.
     * Retorna um placeholder se a data for inválida.
     * @param {string | null} dataISO - A data no formato 'YYYY-MM-DD'.
     * @param {string | null} hora - A hora no formato 'HH:MM'.
     * @returns {string} A data/hora formatada ou '--/--/---- --:--'.
     */
    function formatarDataHoraResumo(dataISO, hora) {
        if (!dataISO) return '--/--/---- --:--'; // Retorna placeholder se não houver data
        try {
            const [ano, mes, dia] = dataISO.split('-');
            const horaFormatada = hora || '--:--'; // Usa placeholder se não houver hora
            // Validação simples dos componentes da data
            if (!ano || !mes || !dia || ano.length !== 4 || mes.length !== 2 || dia.length !== 2) {
                 // Se o formato for inesperado, retorna o original com a hora
                console.warn("Formato de data inesperado recebido:", dataISO);
                return `${dataISO} ${horaFormatada}`;
            }
            // Retorna no formato DD/MM/YYYY HH:MM
            return `${dia}/${mes}/${ano} ${horaFormatada}`;
        } catch (e) {
            console.error("Erro ao formatar data/hora para resumo:", e);
            return '--/--/---- --:--'; // Retorna placeholder em caso de erro
        }
    }

    // --- LÓGICA DO RESUMO LATERAL ---

    /**
     * Preenche as informações de retirada e devolução no card de resumo lateral
     * buscando os dados salvos no sessionStorage.
     */
    function preencherResumoLateral() {
        // Busca os dados salvos na sessão anterior (página de datas)
        const dataRetirada = sessionStorage.getItem('dataRetirada');
        const horaRetirada = sessionStorage.getItem('horaRetirada');
        const dataDevolucao = sessionStorage.getItem('dataDevolucao');
        const horaDevolucao = sessionStorage.getItem('horaDevolucao');

        // Seleciona os elementos no HTML onde as informações serão exibidas
        const retiradaInfoEl = document.getElementById('retirada-info');
        const devolucaoInfoEl = document.getElementById('devolucao-info');

        // Atualiza o texto dos elementos com as datas formatadas
        if (retiradaInfoEl) {
            retiradaInfoEl.textContent = formatarDataHoraResumo(dataRetirada, horaRetirada);
        }
        if (devolucaoInfoEl) {
            devolucaoInfoEl.textContent = formatarDataHoraResumo(dataDevolucao, horaDevolucao);
        }

        // Adiciona funcionalidade aos links "Editar" para voltar à página de seleção de data
        const editLinks = document.querySelectorAll('.resume-card a[href="reservasData.html"]');
        editLinks.forEach(link => {
            link.addEventListener('click', function(event) {
                event.preventDefault(); // Previne a navegação padrão do link
                window.location.href = "reservasData.html"; // Redireciona para a página de datas
            });
        });
    }

    // --- LÓGICA DE SELEÇÃO DE VEÍCULOS ---

    // Seleciona todos os elementos que representam um card de veículo
    const todosOsCards = document.querySelectorAll('.vehicle-card');
    // Busca no sessionStorage se um carro específico foi pré-selecionado na página anterior (index.html)
    const carroSelecionadoInicialmente = sessionStorage.getItem('nomeCarro');

    // Itera sobre cada card de veículo encontrado
    todosOsCards.forEach(card => {
        const groupName = card.dataset.groupName; // Pega o nome do grupo do atributo data-group-name

        // 1. Pré-seleção ao carregar a página:
        // Verifica se este card corresponde ao carro pré-selecionado
        if (groupName && carroSelecionadoInicialmente && groupName === carroSelecionadoInicialmente) {
            card.classList.add('selected'); // Adiciona a classe 'selected' para destacar visualmente
            console.log(`Card pré-selecionado (vindo do index/sessionStorage): ${groupName}`);
        }

        // 2. Adiciona um listener para seleção manual (clique no card):
        card.addEventListener('click', function() {
            // Remove a classe 'selected' de todos os outros cards
            todosOsCards.forEach(c => c.classList.remove('selected'));
            // Adiciona a classe 'selected' apenas ao card que foi clicado
            this.classList.add('selected');
            console.log(`Seleção manual alterada para: ${this.dataset.groupName}`);
        });

        // 3. Adiciona um listener para o botão "CONTINUAR" dentro de cada card:
        const continueButton = card.querySelector('.continue-button');
        if (continueButton) {
            continueButton.addEventListener('click', function(event) {
                // Impede que o clique no botão também acione o clique no card (evita deseleção acidental)
                event.stopPropagation();

                // Encontra o card pai do botão clicado
                const selectedCard = this.closest('.vehicle-card');

                if (selectedCard) {
                    // Pega os dados do veículo dos atributos data-* do card selecionado
                    const nomeGrupo = selectedCard.dataset.groupName;
                    const precoDiaria = parseFloat(selectedCard.dataset.groupPrice); // Converte para número
                    const imagemUrl = selectedCard.dataset.groupImage;
                    const modeloExemplo = selectedCard.dataset.groupModel;

                    // Validação básica dos dados obtidos
                    if (!nomeGrupo || isNaN(precoDiaria) || !imagemUrl || !modeloExemplo) {
                        console.error("Erro: Atributos data-* faltando ou inválidos no card:", selectedCard);
                        alert("Erro ao obter informações do veículo selecionado. Verifique os atributos data-* no HTML.");
                        return; // Interrompe a execução se houver erro
                    }

                    // Salva/Atualiza os dados do veículo selecionado no sessionStorage para usar na próxima página
                    sessionStorage.setItem('nomeCarro', nomeGrupo);
                    sessionStorage.setItem('precoCarro', precoDiaria.toString()); // Salva como string por segurança
                    sessionStorage.setItem('urlImagemCarro', imagemUrl);
                    sessionStorage.setItem('modeloCarro', modeloExemplo);

                    console.log('Dados do veículo salvos para próxima etapa:', { nome: nomeGrupo, preco: precoDiaria, imagem: imagemUrl, modelo: modeloExemplo });

                    // Redireciona o usuário para a próxima etapa do processo de reserva
                    window.location.href = 'reservasOpcionais.html'; // *** CONFIRME SE ESTE É O NOME CORRETO DA PRÓXIMA PÁGINA ***

                } else {
                    // Isso não deveria acontecer se o botão estiver dentro do card
                    console.error("Erro crítico: Não foi possível encontrar o card pai do botão 'CONTINUAR'.");
                }
            });
        }
    }); // Fim do forEach para os cards

    // Opcional: Seleciona o primeiro card automaticamente se nenhum veio pré-selecionado do sessionStorage
    const algumSelecionado = document.querySelector('.vehicle-card.selected');
    if (!algumSelecionado && todosOsCards.length > 0) {
        todosOsCards[0].classList.add('selected');
        console.log("Nenhum card pré-selecionado via sessionStorage, selecionando o primeiro da lista como padrão.");
    }

    // --- INICIALIZAÇÃO ---
    // Chama a função para preencher o resumo lateral assim que a página carregar
    preencherResumoLateral();

}); // Fim do 'DOMContentLoaded'


// --- LÓGICA DO CLIMA (Executa independentemente do DOMContentLoaded, mas busca elementos do DOM) ---

/**
 * Busca dados de tempo da API Visual Crossing para uma localização específica
 * e atualiza os elementos correspondentes no rodapé da página.
 */
async function fetchWeather() {
    // --- Configurações da API ---
    const location = 'santo amaro, sao paulo, br'; // Localização mais específica
    const apiKey = '4UHF6RU7LPLQU73J9SR5REXX6'; // Sua chave da API Visual Crossing
    // Monta a URL da API
    const apiUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(location)}?unitGroup=metric&key=${apiKey}&contentType=json&lang=pt`; // lang=pt para tentar obter descrição em português

    // --- Seleciona os elementos HTML para atualizar ---
    const tempElement = document.getElementById('weather-temp');
    const descElement = document.getElementById('weather-desc');

    // Define um estado inicial enquanto os dados carregam
    if (tempElement) tempElement.textContent = '--';
    if (descElement) descElement.textContent = 'Carregando...';

    try {
        // Faz a requisição para a API
        const response = await fetch(apiUrl);

        // Verifica se a requisição foi bem-sucedida (status 2xx)
        if (!response.ok) {
            const errorText = await response.text(); // Tenta obter detalhes do erro da resposta
            throw new Error(`Erro ${response.status}: ${response.statusText}. Resposta da API: ${errorText}`);
        }

        // Converte a resposta para JSON
        const data = await response.json();
        console.log("Resposta da API Visual Crossing:", data); // Útil para depuração

        // --- Processa a Resposta da API ---
        // Verifica se existem dados de condições atuais na resposta
        if (data && data.currentConditions) {
            const current = data.currentConditions;
            const temperature = current.temp; // Temperatura já em Celsius (unitGroup=metric)
            const description = current.conditions; // Descrição textual do tempo

            // Atualiza o elemento da temperatura no HTML
            if (temperature !== undefined && temperature !== null && tempElement) {
                tempElement.textContent = Math.round(temperature); // Arredonda para inteiro
            } else if (tempElement) {
                tempElement.textContent = 'N/A'; // Indica que não foi possível obter
            }

            // Atualiza o elemento da descrição no HTML
            if (description && descElement) {
                // Coloca a primeira letra em maiúscula
                descElement.textContent = description.charAt(0).toUpperCase() + description.slice(1);
            } else if (descElement) {
                descElement.textContent = 'N/A'; // Indica que não foi possível obter
            }

            // Opcional: Poderia adicionar lógica para exibir um ícone baseado em 'current.icon'
            // Ex: const iconCode = current.icon; -> atualizar src de um <img> ou classe de um <i>

        } else {
            // Se a estrutura da resposta não for a esperada
            console.warn("Estrutura inesperada na resposta da API: objeto 'currentConditions' não encontrado.", data);
            if (tempElement) tempElement.textContent = 'N/A';
            if (descElement) descElement.textContent = 'Indisponível';
        }

    } catch (error) {
        // Captura erros de rede ou de processamento
        console.error("Falha ao buscar ou processar dados de tempo:", error);
        if (tempElement) tempElement.textContent = 'N/A';
        if (descElement) descElement.textContent = 'Erro';
    }
}

// --- EXECUÇÃO INICIAL ---
// Chama a função para buscar o clima assim que o script for carregado
fetchWeather();