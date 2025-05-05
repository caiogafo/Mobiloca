// Aguarda o carregamento completo do DOM antes de executar o script
document.addEventListener('DOMContentLoaded', function() {

    // --- Funções auxiliares (formatarData, calcularDiarias, formatarMoeda) ---

    // Formata uma string de data (vários formatos de entrada) para DD/MM/AAAA ou DD/MM/AAAA às HH:MM
    function formatarData(dataString) {
        // Retorna um placeholder se a data for inválida ou vazia
        if (!dataString) return '--/--/----';
        try {
            let dataObj; // Objeto Date
            let horaFormatada = ''; // Armazena a hora extraída, se houver

            // Tenta analisar diferentes formatos de data/hora
            if (dataString.includes('T')) { // Formato ISO 8601 (com T)
                dataObj = new Date(dataString);
                // Extrai a hora do objeto Date
                horaFormatada = `${String(dataObj.getHours()).padStart(2, '0')}:${String(dataObj.getMinutes()).padStart(2, '0')}`;
            } else if (dataString.includes(' ')) { // Formato com espaço (ex: 'DD/MM/YYYY HH:MM' ou 'YYYY-MM-DD HH:MM')
                const partes = dataString.split(' ');
                const dataPart = partes[0];
                const horaPart = partes.length > 1 ? partes[1] : ''; // Pega a hora se existir
                // Tenta analisar a parte da data (YYYY-MM-DD ou DD/MM/YYYY)
                if (dataPart.includes('-')) {
                    // Assume UTC para evitar problemas de fuso horário ao criar apenas com data
                    dataObj = new Date(dataPart + 'T00:00:00Z');
                } else if (dataPart.includes('/')) {
                    const [dia, mes, ano] = dataPart.split('/');
                    // Cria data UTC a partir de DD/MM/YYYY
                    dataObj = new Date(Date.UTC(ano, mes - 1, dia));
                } else {
                    // Fallback para outros formatos, assumindo UTC
                    dataObj = new Date(dataPart + 'T00:00:00Z');
                }
                horaFormatada = horaPart; // Usa a hora extraída da string original
            } else if (dataString.includes('-')) { // Formato YYYY-MM-DD (sem hora)
                // Assume UTC
                dataObj = new Date(dataString + 'T00:00:00Z');
            } else if (dataString.includes('/')) { // Formato DD/MM/YYYY (sem hora)
                const [dia, mes, ano] = dataString.split('/');
                // Cria data UTC
                dataObj = new Date(Date.UTC(ano, mes - 1, dia));
            } else {
                // Última tentativa, pode ser um formato inesperado
                dataObj = new Date(dataString);
            }

            // Verifica se a data resultante é válida
            if (isNaN(dataObj.getTime())) {
                // Se inválida, tenta uma análise mais específica para DD/MM/YYYY
                if (dataString.includes('/')) {
                    const [dia, mes, ano] = dataString.split('/');
                    if(dia && mes && ano) {
                        // Tenta criar no formato YYYY-MM-DD que é mais robusto
                        dataObj = new Date(`${ano}-${mes}-${dia}T00:00:00`);
                        if (isNaN(dataObj.getTime())) {
                            throw new Error("Data inválida mesmo após tentativa DD/MM/YYYY");
                        }
                    } else {
                        throw new Error("Formato DD/MM/YYYY incompleto");
                    }
                } else {
                    // Se não for DD/MM/YYYY e deu inválido, desiste
                    throw new Error("Data inválida");
                }
            }

            // Extrai dia, mês e ano em UTC para consistência
            const dia = String(dataObj.getUTCDate()).padStart(2, '0');
            const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0'); // Mês é 0-indexado
            const ano = dataObj.getUTCFullYear();

            // Verifica se a string original continha uma hora válida para exibi-la
            const horaOriginal = dataString.match(/\d{1,2}:\d{2}/);
            if (horaOriginal && horaOriginal[0] !== '00:00') {
                return `${dia}/${mes}/${ano} às ${horaOriginal[0]}`;
            } else if (horaFormatada && horaFormatada !== '00:00') {
                // Usa a hora formatada se extraída e não for meia-noite
                return `${dia}/${mes}/${ano} às ${horaFormatada}`;
            } else {
                // Retorna apenas a data se não houver hora relevante
                return `${dia}/${mes}/${ano}`;
            }
        } catch (e) {
            // Loga erro no console e retorna placeholder
            console.error("Erro ao formatar data:", dataString, e);
            return '--/--/----';
        }
    }

    // Calcula o número de diárias entre duas datas (considerando apenas a data, não a hora)
    function calcularDiarias(dataRetiradaStr, dataDevolucaoStr) {
        try {
            // Função interna para parsear apenas a parte da data da string (DD/MM/YYYY ou YYYY-MM-DD) para um objeto Date UTC
            const parseDateOnly = (d) => {
                if (!d) return null; // Retorna nulo se a string for vazia
                let p = d.split(' ')[0]; // Pega a parte antes do espaço (ignora hora)
                let y, m, day;
                if (p.includes('/')) { // Formato DD/MM/YYYY
                    [day, m, y] = p.split('/');
                } else if (p.includes('-')) { // Formato YYYY-MM-DD
                    [y, m, day] = p.split('-');
                } else return null; // Formato não reconhecido
                // Cria objeto Date em UTC (mês - 1 pois é 0-indexado)
                const dt = new Date(Date.UTC(y, m - 1, day));
                // Verifica se a data criada é válida
                return isNaN(dt.getTime()) ? null : dt;
            };

            // Parseia as datas de retirada e devolução
            const dR = parseDateOnly(dataRetiradaStr);
            const dD = parseDateOnly(dataDevolucaoStr);

            // Verifica se ambas as datas são válidas e se a devolução é no mesmo dia ou depois da retirada
            if (dR && dD && dD >= dR) {
                // Calcula a diferença em milissegundos
                const diff = dD.getTime() - dR.getTime();
                // Converte para dias e arredonda para cima (Math.ceil)
                const dias = Math.ceil(diff / 86400000); // 86400000 = 1000 * 60 * 60 * 24
                // Se a diferença for 0 (mesmo dia), retorna 1 diária, senão retorna o número de dias calculado
                return dias === 0 ? 1 : dias;
            } else if (dR && dD && dD < dR) {
                // Loga erro se a devolução for antes da retirada
                console.error("Data de devolução anterior à data de retirada.");
                return 1; // Retorna 1 diária como fallback
            }
        } catch (e) {
            // Loga erro no console em caso de falha no cálculo
            console.error("Erro ao calcular diárias:", e);
        }
        // Retorna 1 diária como fallback em caso de erro ou datas inválidas
        return 1;
    }

    // Formata um número para o formato de moeda brasileira (BRL) - ex: 1234.56 -> 1.234,56 (aqui apenas 1234,56)
    function formatarMoeda(valor) {
        // Converte o valor para float
        const v = parseFloat(valor);
        // Se for inválido (NaN), retorna '0,00', senão formata com 2 casas decimais e troca ponto por vírgula
        return isNaN(v) ? '0,00' : v.toFixed(2).replace('.', ',');
    }

    // --- Recuperar/Calcular Valores ---

    // Recupera valores finais (com possíveis descontos) da sessionStorage
    let totalValorComDesconto = parseFloat(sessionStorage.getItem('finalTotal'));
    let subtotalValor = parseFloat(sessionStorage.getItem('finalSubtotal'));
    let opcionaisTotalValor = parseFloat(sessionStorage.getItem('finalOpcionais'));
    let descontosValor = parseFloat(sessionStorage.getItem('finalDescontos'));
    let taxaConvenienciaComDesconto = parseFloat(sessionStorage.getItem('finalTaxa'));
    let protecaoValor = parseFloat(sessionStorage.getItem('protecaoValor')) || 0; // Pega o valor da proteção ou 0

    // Recupera outros dados da reserva da sessionStorage, com valores padrão caso não existam
    const nomeCarro = sessionStorage.getItem('nomeCarro') || 'N/D'; // Nome do carro ou 'N/D'
    const urlImagemCarro = sessionStorage.getItem('urlImagemCarro') || 'placeholder_car.png'; // URL da imagem ou placeholder
    const dataRetirada = sessionStorage.getItem('dataRetirada'); // Data de retirada (string)
    const dataDevolucao = sessionStorage.getItem('dataDevolucao'); // Data de devolução (string)
    const retiradaLocal = sessionStorage.getItem('retiradaLocal') || 'N/D'; // Local de retirada ou 'N/D'
    const devolucaoLocal = sessionStorage.getItem('devolucaoLocal') || 'N/D'; // Local de devolução ou 'N/D'
    const precoDiariaCarro = parseFloat(sessionStorage.getItem('precoCarro')) || 0; // Preço da diária ou 0
    // Valores dos opcionais, com 0 como padrão
    const condutorAdicionalValor = parseFloat(sessionStorage.getItem('condutorAdicionalValor')) || 0;
    const cadeiraBebeValor = parseFloat(sessionStorage.getItem('cadeiraBebeValor')) || 0;
    const gpsValor = parseFloat(sessionStorage.getItem('gpsValor')) || 0;

    // Recalcula valores se o total final lido da sessionStorage for inválido (NaN)
    if (isNaN(totalValorComDesconto)) {
        console.warn("Total final (com desc) não encontrado/inválido na sessionStorage. Recalculando...");
        // Calcula o número de diárias
        const diarias = calcularDiarias(dataRetirada, dataDevolucao);
        // Calcula o subtotal (preço da diária * número de diárias)
        subtotalValor = precoDiariaCarro * diarias;
        // Soma os valores dos opcionais
        opcionaisTotalValor = (condutorAdicionalValor || 0) + (cadeiraBebeValor || 0) + (gpsValor || 0);
        // Tenta pegar o valor do desconto da sessionStorage
        let tempDesconto = parseFloat(sessionStorage.getItem('descontosValor'));
        // Usa o desconto lido ou aplica um desconto padrão de 25% sobre o subtotal se não houver
        descontosValor = !isNaN(tempDesconto) ? tempDesconto : (subtotalValor * 0.25); // Aplica 25% como fallback
        // Calcula a base para a taxa (subtotal + proteção + opcionais - descontos)
        const baseTaxaComDesconto = subtotalValor + protecaoValor + opcionaisTotalValor - descontosValor;
        // Calcula a taxa de conveniência (12%) sobre a base com desconto (se > 0)
        taxaConvenienciaComDesconto = baseTaxaComDesconto > 0 ? (baseTaxaComDesconto * 0.12) : 0;
        // Calcula o total final com desconto (base com desconto + taxa com desconto)
        totalValorComDesconto = baseTaxaComDesconto + taxaConvenienciaComDesconto;
    } else {
        // Se o total final foi lido corretamente, garante que os componentes individuais também sejam números válidos
        subtotalValor = isNaN(subtotalValor) ? 0 : subtotalValor;
        opcionaisTotalValor = isNaN(opcionaisTotalValor) ? 0 : opcionaisTotalValor;
        descontosValor = isNaN(descontosValor) ? 0 : descontosValor;
        taxaConvenienciaComDesconto = isNaN(taxaConvenienciaComDesconto) ? 0 : taxaConvenienciaComDesconto;
    }

    // --- Calcular Total SEM Desconto (para opção "Pagar no Balcão") ---
    // Calcula a base sem aplicar os descontos
    const baseSemDesconto = (subtotalValor || 0) + (protecaoValor || 0) + (opcionaisTotalValor || 0);
    // Calcula a taxa de conveniência (12%) sobre a base SEM desconto (se > 0)
    const taxaConvenienciaSemDesconto = baseSemDesconto > 0 ? (baseSemDesconto * 0.12) : 0;
    // Calcula o total final SEM desconto (base sem desconto + taxa sem desconto)
    const totalValorSemDesconto = baseSemDesconto + taxaConvenienciaSemDesconto;

    // --- Elementos do DOM ---
    // Função auxiliar para simplificar a obtenção de elementos por ID
    const el = (id) => document.getElementById(id);
    // Seleciona os elementos do DOM que serão atualizados ou lidos
    const resumoImagemCarroElement = el('resumoImagemCarro');
    const nomeCarroElement = el('nomeCarro');
    const subtotalElement = el('subtotal');
    const valorProtecaoElement = el('valorProtecao');
    const valorOpcionaisElement = el('valorOpcionais');
    const taxaConvenienciaElement = el('taxaConveniencia');
    const descontosElement = el('descontos');
    const totalElement = el('total'); // Elemento no resumo que mostra o total geral
    const dataEntregaElement = el('dataEntrega'); // Elemento para data/local de retirada
    const dataDevolucaoElement = el('dataDevolucao'); // Elemento para data/local de devolução

    // Seleciona os elementos que exibem os valores nas opções de pagamento
    const valorPixEl = document.querySelector('.valor-pix');
    const valorCreditEl = document.querySelector('.valor-credit');
    const valorPayLaterEl = document.querySelector('.valor-pay-later');

    // Seleciona os radio buttons das opções de pagamento
    const pixOption = el('pix');
    const payLaterOption = el('pay-later');
    const creditCardOption = el('credit-card');
    const paymentRadios = document.querySelectorAll('input[name="payment-method"]'); // Todos os radios do grupo

    // Seleciona os formulários específicos de cada método de pagamento
    const pixForm = el('pix-form');
    const payLaterForm = el('pay-later-form');
    const creditCardForm = el('credit-card-form');
    // Seleciona o botão principal de pagamento
    const payButton = document.querySelector('.pay-button');

    // --- Preencher Detalhamento do Resumo ---
    // Atualiza os elementos do resumo com os dados recuperados/calculados
    if (resumoImagemCarroElement) { // Verifica se o elemento existe antes de usar
        resumoImagemCarroElement.src = urlImagemCarro;
        resumoImagemCarroElement.alt = `Imagem ${nomeCarro}`;
    }
    if (nomeCarroElement) nomeCarroElement.textContent = nomeCarro;
    // Formata data e local de retirada/devolução
    if (dataEntregaElement) dataEntregaElement.textContent = formatarData(dataRetirada) + (retiradaLocal !== 'N/D' ? ` - ${retiradaLocal}` : '');
    if (dataDevolucaoElement) dataDevolucaoElement.textContent = formatarData(dataDevolucao) + (devolucaoLocal !== 'N/D' ? ` - ${devolucaoLocal}` : '');
    // Preenche os valores formatados como moeda
    if (subtotalElement) subtotalElement.textContent = formatarMoeda(subtotalValor);
    if (valorProtecaoElement) valorProtecaoElement.textContent = formatarMoeda(protecaoValor);
    if (valorOpcionaisElement) valorOpcionaisElement.textContent = formatarMoeda(opcionaisTotalValor);
    // Exibe a taxa de conveniência COM desconto por padrão no resumo detalhado
    if (taxaConvenienciaElement) taxaConvenienciaElement.textContent = formatarMoeda(taxaConvenienciaComDesconto);
    // Exibe o valor do desconto formatado (com sinal negativo se > 0)
    if (descontosElement) descontosElement.textContent = (descontosValor || 0) > 0 ? `-${formatarMoeda(descontosValor)}` : '0,00';

    // --- Função para ATUALIZAR TOTAIS EXIBIDOS (nas opções e no resumo final) ---
    function atualizarTotaisExibidos() {
        // Formata os valores totais com e sem desconto para exibição
        const valorComDescontoF = `R$ ${formatarMoeda(totalValorComDesconto || 0)}`;
        const valorSemDescontoF = `R$ ${formatarMoeda(totalValorSemDesconto || 0)}`;

        // Atualiza os textos dos valores nas opções de pagamento
        if (valorPixEl) valorPixEl.textContent = valorComDescontoF; // PIX mostra valor com desconto
        if (valorCreditEl) valorCreditEl.textContent = valorComDescontoF; // Cartão mostra valor com desconto
        if (valorPayLaterEl) valorPayLaterEl.textContent = valorSemDescontoF; // Pagar Depois mostra valor SEM desconto

        // Atualiza o valor total exibido no resumo final (#total)
        if (totalElement) {
            // Se a opção "Pagar Depois" estiver selecionada, mostra o total SEM desconto
            if (payLaterOption?.checked) { // Usa optional chaining (?.) caso o elemento não exista
                totalElement.textContent = formatarMoeda(totalValorSemDesconto || 0);
            } else {
                // Caso contrário (PIX ou Cartão), mostra o total COM desconto
                totalElement.textContent = formatarMoeda(totalValorComDesconto || 0);
            }
        }
    }

    // --- Atualizar Totais e Configurar Listeners ---
    atualizarTotaisExibidos(); // Chama a função uma vez para definir o estado inicial

    // Adiciona um listener a cada radio button de pagamento
    paymentRadios.forEach(radio => {
        // Quando a seleção mudar, chama a função para atualizar os totais exibidos
        radio.addEventListener('change', atualizarTotaisExibidos);
    });

    // --- Lógica de exibição dos forms de pagamento ---
    // Função para configurar a exibição dinâmica dos formulários específicos de cada método
    function setupPaymentForms() {
        // Adiciona listener de mudança a cada radio button
        paymentRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                // Mostra/Esconde o form do PIX baseado na seleção
                if(pixForm) pixForm.style.display = (this.id === 'pix' && this.checked) ? 'block' : 'none';
                // Mostra/Esconde o form do Cartão baseado na seleção
                if(creditCardForm) creditCardForm.style.display = (this.id === 'credit-card' && this.checked) ? 'block' : 'none';
                // Mostra/Esconde o form do Pagar Depois baseado na seleção
                if(payLaterForm) payLaterForm.style.display = (this.id === 'pay-later' && this.checked) ? 'block' : 'none';
            });
        });
        // Define a visibilidade inicial dos forms baseado no radio que pode já estar checado ao carregar a página
        if (pixOption?.checked && pixForm) pixForm.style.display = 'block'; else if(pixForm) pixForm.style.display = 'none';
        if (creditCardOption?.checked && creditCardForm) creditCardForm.style.display = 'block'; else if(creditCardForm) creditCardForm.style.display = 'none';
        if (payLaterOption?.checked && payLaterForm) payLaterForm.style.display = 'block'; else if(payLaterForm) payLaterForm.style.display = 'none';
    }
    // Chama a função de setup se algum dos formulários existir
    if(pixForm || creditCardForm || payLaterForm) {
        setupPaymentForms();
    }

    // --- Formatação Inputs Cartão ---
    // Seleciona os inputs do formulário de cartão de crédito
    const cardNumberInput = el('card-number');
    const expiryDateInput = el('expiry-date');
    const securityCodeInput = el('security-code');

    // Adiciona máscara/formatação ao input do número do cartão enquanto o usuário digita
    cardNumberInput?.addEventListener('input', function(e) {
        // Remove caracteres não numéricos e limita a 16 dígitos
        let v = e.target.value.replace(/\D/g, '').substring(0, 16);
        let f = '';
        // Adiciona espaços a cada 4 dígitos
        for (let i = 0; i < v.length; i++) {
            if (i > 0 && i % 4 === 0) f += ' ';
            f += v[i];
        }
        e.target.value = f; // Atualiza o valor do input
    });

    // Adiciona máscara/formatação ao input da data de validade (MM/AA)
    expiryDateInput?.addEventListener('input', function(e) {
        // Remove caracteres não numéricos e limita a 4 dígitos
        let v = e.target.value.replace(/\D/g, '').substring(0, 4);
        let f = '';
        // Adiciona a barra '/' após os 2 primeiros dígitos (mês)
        if (v.length > 0) f += v.substring(0, 2);
        if (v.length >= 2) f += '/' + v.substring(2);
        e.target.value = f; // Atualiza o valor do input
    });

    // Adiciona máscara/formatação ao input do código de segurança (CVV)
    securityCodeInput?.addEventListener('input', function(e) {
        // Remove caracteres não numéricos e limita a 3 dígitos
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
    });

    // --- Evento do botão Pagar ---
    // Adiciona um listener de clique ao botão de pagar
    payButton?.addEventListener('click', function(event) {
        let isValid = true; // Flag de validade geral
        let formSelecionado = false; // Flag para verificar se um método foi selecionado
        let termsAccepted = false; // Flag para verificar se os termos foram aceitos

        // Verifica qual método de pagamento está selecionado e valida os termos/formulário
        if (pixOption?.checked) {
            formSelecionado = true;
            // Verifica se o checkbox de termos do PIX está marcado
            termsAccepted = pixForm?.querySelector('input[name="terms-pix"]')?.checked;
            if (!termsAccepted) alert('Por favor, aceite os termos e condições para prosseguir com o pagamento via Pix.');
        } else if (payLaterOption?.checked) {
            formSelecionado = true;
            // Verifica se o checkbox de termos do Pagar Depois está marcado
            termsAccepted = payLaterForm?.querySelector('input[name="terms-pay-later"]')?.checked;
            if (!termsAccepted) alert('Por favor, aceite os termos e condições para prosseguir com o pagamento no balcão.');
        } else if (creditCardOption?.checked) {
            formSelecionado = true;
            // Valida o formulário de cartão de crédito (que inclui a verificação dos termos)
            termsAccepted = validateCreditCardForm();
            isValid = termsAccepted; // A validade geral depende da validação do cartão
        } else {
            // Se nenhum método foi selecionado
            alert('Por favor, selecione uma forma de pagamento.');
            isValid = false;
        }

        // Se PIX ou Pagar Depois foi selecionado, a validade depende apenas dos termos
        if((pixOption?.checked || payLaterOption?.checked) && !termsAccepted) isValid = false;

        // Se a validação passou e um formulário foi selecionado
        if (isValid && formSelecionado) {
            // Define qual método de pagamento foi escolhido
            const metodoPagamento = pixOption.checked ? 'pix' : (creditCardOption.checked ? 'cartao_credito' : 'balcao');
            // Salva o método escolhido na sessionStorage
            sessionStorage.setItem('metodoPagamentoEscolhido', metodoPagamento);
            // Determina qual valor final salvar (com ou sem desconto)
            let valorFinalParaSalvar = payLaterOption.checked ? totalValorSemDesconto : totalValorComDesconto;
            // Salva o valor total final correto na sessionStorage (formatado com 2 casas decimais)
            sessionStorage.setItem('valorTotalFinal', (valorFinalParaSalvar || 0).toFixed(2));
            // Log de sucesso e redirecionamento
            console.log("Pagamento validado. Redirecionando para a página de confirmação...");
            window.location.href = "reservasConfirmacao.html"; // Redireciona para a página de confirmação
        } else {
            // Log de falha na validação
            console.log("Falha na validação do pagamento ou termos não aceitos.");
        }
    });

    // --- Funções de validação do Cartão de Crédito ---
    // Função principal que valida todos os campos do formulário de cartão e os termos
    function validateCreditCardForm() {
        // Seleciona os inputs do formulário de cartão
        const cardNameInput=el('card-name');
        const cardNumberInput=el('card-number');
        const expiryDateInput=el('expiry-date');
        const securityCodeInput=el('security-code');
        // Seleciona o checkbox de termos dentro do formulário de cartão
        const termsCheckbox=creditCardForm?.querySelector('input[name="terms"]');

        // Pega os valores dos inputs (removendo espaços extras com trim())
        const cardName=cardNameInput?.value.trim();
        const cardNumber=cardNumberInput?.value.trim();
        const expiryDate=expiryDateInput?.value.trim();
        const securityCode=securityCodeInput?.value.trim();
        // Verifica se os termos foram aceitos
        const termsOk=termsCheckbox?.checked;

        let isValid=true; // Assume que é válido inicialmente
        let message=''; // Mensagem de erro

        // Realiza as validações em sequência
        if (!cardName) message='Por favor, insira o nome impresso no cartão.';
        else if (!validateCardNumber(cardNumber)) message='Número do cartão inválido. Verifique se possui 16 dígitos.';
        else if (!validateExpiryDate(expiryDate)) message='Data de validade inválida. Use o formato MM/AA e verifique se não está vencida.';
        else if (!validateSecurityCode(securityCode)) message='Código de segurança (CVV) inválido. Verifique se possui 3 dígitos.';
        else if (!termsOk) message='Por favor, aceite os termos e condições para prosseguir.';

        // Se alguma validação falhou (message não está vazia)
        if (message) {
            alert(message); // Mostra a mensagem de erro
            isValid = false; // Marca como inválido
        }
        return isValid; // Retorna true se tudo estiver válido, false caso contrário
    }

    // Valida o número do cartão (verifica se tem 16 dígitos numéricos após remover espaços)
    function validateCardNumber(num) {
        const cleaned = num?.replace(/\s/g, ''); // Remove espaços
        return /^\d{16}$/.test(cleaned); // Testa se contém exatamente 16 dígitos
    }

    // Valida a data de validade (formato MM/AA e não vencida)
    function validateExpiryDate(date) {
        if (!date) return false; // Inválido se vazio
        // Tenta encontrar o padrão MM/AA (ex: 12/25)
        const m = date.match(/^(0[1-9]|1[0-2])\/?(\d{2})$/);
        if (!m) return false; // Formato inválido

        // Extrai mês e ano
        const month = parseInt(m[1]);
        const year = parseInt(`20${m[2]}`); // Assume século 21

        // Pega a data atual
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // Mês atual (1-12)

        // Verifica se o ano é futuro OU se é o ano atual e o mês é igual ou futuro
        return year > currentYear || (year === currentYear && month >= currentMonth);
    }

    // Valida o código de segurança (CVV) (verifica se tem 3 dígitos numéricos)
    function validateSecurityCode(code) {
        return /^\d{3}$/.test(code); // Testa se contém exatamente 3 dígitos
    }

}); // Fim do DOMContentLoaded

// --- Função Assíncrona para buscar dados de Tempo ---
async function fetchWeather() {
    // --- Configuração ---
    const location = 'santo amaro'; // Localização desejada (pode precisar ser mais específica)
    const apiKey = '4UHF6RU7LPLQU73J9SR5REXX6'; // Sua chave da API Visual Crossing

    // --- URL da API ---
    // Constrói a URL da API Visual Crossing Timeline
    const apiUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(location)}?unitGroup=metric&key=${apiKey}&contentType=json&lang=pt`; // lang=pt para resposta em português

    // --- Elementos do DOM ---
    // Seleciona os elementos no rodapé para exibir a temperatura e descrição
    const tempElement = document.getElementById('weather-temp');
    const descElement = document.getElementById('weather-desc');

    // Define um estado inicial de carregamento
    if(tempElement) tempElement.textContent = '--';
    if(descElement) descElement.textContent = 'Carregando...';

    try {
        // Faz a requisição para a API
        const response = await fetch(apiUrl);
        // Verifica se a resposta da API foi bem-sucedida (status 2xx)
        if (!response.ok) {
            // Tenta ler o corpo da resposta de erro para mais detalhes
            const errorData = await response.text();
            // Lança um erro com informações do status e resposta
            throw new Error(`Erro da API: ${response.statusText} (Status: ${response.status}). Resposta: ${errorData}`);
        }
        // Converte a resposta JSON em um objeto JavaScript
        const data = await response.json();

        // Log da resposta completa da API para depuração
        console.log("Resposta da API Visual Crossing:", data);

        // --- Processamento da Resposta ---
        // Verifica se a resposta contém as condições atuais
        if (data.currentConditions) {
            const current = data.currentConditions;
            // Extrai a temperatura (já em Celsius devido a unitGroup=metric)
            const temperature = current.temp;
            // Extrai a descrição do tempo (já em português devido a lang=pt)
            const description = current.conditions;

            // Atualiza o elemento HTML da temperatura (arredondada)
            if (temperature !== undefined && temperature !== null && tempElement) {
                tempElement.textContent = Math.round(temperature);
            } else if (tempElement) {
                tempElement.textContent = 'N/A'; // Fallback se temperatura não encontrada
            }

            // Atualiza o elemento HTML da descrição
            if (description && descElement) {
                // Garante que a primeira letra seja maiúscula
                descElement.textContent = description.charAt(0).toUpperCase() + description.slice(1);
            } else if (descElement) {
                descElement.textContent = 'N/A'; // Fallback se descrição não encontrada
            }

            // Opcional: Atualizar um ícone baseado em 'current.icon'
            // const iconCode = current.icon; // Ex: 'partly-cloudy-day'
            // ... código para atualizar src de <img> ou classe de <i> ...

        } else {
            // Avisa se a estrutura esperada não foi encontrada na resposta
            console.warn("Objeto 'currentConditions' não encontrado na resposta da API.");
            if(tempElement) tempElement.textContent = 'N/A';
            if(descElement) descElement.textContent = 'Indisponível';
        }
        // -----------------------------------------------------------------

    } catch (error) {
        // Captura e loga erros de rede ou de processamento
        console.error("Falha ao buscar ou processar dados de tempo:", error);
        // Atualiza o HTML para indicar o erro
        if(tempElement) tempElement.textContent = 'N/A';
        if(descElement) descElement.textContent = 'Erro';
    }
}

// --- Chamar a função para buscar o tempo ao carregar o script ---
fetchWeather();