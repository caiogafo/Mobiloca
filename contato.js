// Garante que o script só será executado após o carregamento completo do HTML.
document.addEventListener('DOMContentLoaded', function() {

    // --- SELEÇÃO DOS ELEMENTOS DO DOM ---
    // Seleciona o formulário principal pelo ID.
    const form = document.getElementById('contatoForm');
    // Seleciona a div onde as mensagens de status (sucesso/erro) do formulário serão exibidas.
    const statusDiv = document.getElementById('form-status');
    // Seleciona o campo de input do CPF.
    const cpfInput = document.getElementById('cpf');
    // Seleciona o campo de input do email.
    const emailInput = document.getElementById('email');
    // Seleciona o campo de input para confirmação do email.
    const confirmarEmailInput = document.getElementById('confirmar-email');
    // Seleciona o campo de input do telefone.
    const telefoneInput = document.getElementById('telefone');
    // Seleciona o input real (escondido) para anexar arquivos.
    const anexoInput = document.getElementById('anexo');
    // Seleciona o span onde a mensagem de erro específica do CPF será exibida.
    const cpfErrorSpan = document.getElementById('cpf-error-message');
    // Seleciona o span onde a mensagem de erro da confirmação de email será exibida.
    const confirmarEmailErrorSpan = document.getElementById('confirmar-email-error-message');
    // Seleciona o label estilizado que funciona como botão para o input de anexo.
    const anexoLabel = document.getElementById('anexo-label');
    // Guarda o texto padrão do label do anexo para poder restaurá-lo.
    const defaultAnexoLabelText = 'ANEXAR ARQUIVO';

    // --- FUNÇÕES UTILITÁRIAS ---

    /**
     * Valida um número de CPF brasileiro.
     * @param {string} cpf - O CPF a ser validado (pode conter máscara).
     * @returns {boolean} - True se o CPF for válido, False caso contrário.
     */
    function validaCPF(cpf) {
        // Garante que a entrada seja uma string.
        if (typeof cpf !== 'string') return false;
        // Remove caracteres não numéricos (pontos, traços, etc.).
        cpf = cpf.replace(/[^\d]+/g, '');
        // Verifica se o CPF tem 11 dígitos e se não é uma sequência de dígitos repetidos (ex: 111.111.111-11).
        if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
        // Converte a string de CPF em um array de números.
        cpf = cpf.split('').map(el => +el);
        // Função auxiliar para calcular os dígitos verificadores.
        const rest = (count) => (cpf.slice(0, count-12) // Pega os primeiros 9 ou 10 dígitos
                                   .reduce((soma, el, index) => soma + el * (count - index), 0) * 10) % 11 % 10;
        // Retorna true se ambos os dígitos verificadores calculados coincidirem com os dígitos informados.
        return rest(10) === cpf[9] && rest(11) === cpf[10];
    }

    /**
     * Aplica a máscara de CPF (XXX.XXX.XXX-XX) a um campo de input.
     * @param {HTMLInputElement} input - O elemento input do CPF.
     */
    function formatarCPF(input) {
        // Obtém o valor atual e remove tudo que não for dígito.
        let value = input.value.replace(/\D/g, '');
        // Limita o valor a 11 dígitos.
        value = value.substring(0, 11);
        let formattedValue = value;
        // Aplica a máscara progressivamente conforme o usuário digita.
        if (value.length > 9) { // Completo: XXX.XXX.XXX-XX
            formattedValue = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2}).*/, '$1.$2.$3-$4');
        } else if (value.length > 6) { // Parcial: XXX.XXX.XXX
            formattedValue = value.replace(/^(\d{3})(\d{3})(\d{1,3}).*/, '$1.$2.$3');
        } else if (value.length > 3) { // Parcial: XXX.XXX
            formattedValue = value.replace(/^(\d{3})(\d{1,3}).*/, '$1.$2');
        }
        // Atualiza o valor do campo no formulário com a máscara.
        input.value = formattedValue;
    }

    /**
     * Aplica a máscara de telefone celular ((XX) XXXXX-XXXX) a um campo de input.
     * @param {HTMLInputElement} input - O elemento input do telefone.
     */
    function formatarTelefone(input) {
        // Obtém o valor atual e remove tudo que não for dígito.
        let value = input.value.replace(/\D/g, '');
        // Limita o valor a 11 dígitos (DDD + 9 dígitos).
        value = value.substring(0, 11);
        let formattedValue = value;
        // Aplica a máscara progressivamente.
        if (value.length > 6) { // Formato completo: (XX) XXXXX-XXXX
            formattedValue = value.replace(/^(\d{2})(\d{5})(\d{1,4}).*/, '($1) $2-$3');
        } else if (value.length > 2) { // Formato parcial: (XX) XXXXX
            formattedValue = value.replace(/^(\d{2})(\d{1,5}).*/, '($1) $2');
        } else if (value.length > 0) { // Formato parcial: (XX
            formattedValue = value.replace(/^(\d*)/, '($1');
        }
        // Atualiza o valor do campo no formulário.
        input.value = formattedValue;
    }

    /**
     * Verifica se os valores dos campos de email e confirmação de email são iguais.
     * @returns {boolean} - True se os emails coincidirem ou se os campos não existirem, False caso contrário.
     */
    function validaEmailsCoincidem() {
        // Se algum dos campos não existir no HTML, considera válido (não há o que comparar).
        if (!emailInput || !confirmarEmailInput) return true;
        // Compara os valores, removendo espaços em branco no início e fim (trim).
        return emailInput.value.trim() === confirmarEmailInput.value.trim();
    }

    /**
     * Aplica feedback visual (classes CSS 'input-valid'/'input-invalid') aos campos de email
     * e controla a visibilidade da mensagem de erro de confirmação.
     */
    function aplicarFeedbackEmails() {
        // Garante que todos os elementos necessários existem.
         if (!emailInput || !confirmarEmailInput || !confirmarEmailErrorSpan) return;
         // Obtém os valores e remove espaços extras.
         const email1 = emailInput.value.trim();
         const email2 = confirmarEmailInput.value.trim();

         // Se ambos os campos estiverem vazios, remove qualquer feedback visual.
         if (email1 === '' && email2 === '') {
             emailInput.classList.remove('input-valid', 'input-invalid');
             confirmarEmailInput.classList.remove('input-valid', 'input-invalid');
             confirmarEmailErrorSpan.style.display = 'none'; // Esconde mensagem de erro.
             return; // Interrompe a função.
         }

         // Se os emails coincidirem (ou um deles estiver vazio e o outro também).
         if (validaEmailsCoincidem()) {
             // Se ambos estiverem preenchidos e coincidirem, marca como válidos.
             if(email1 !== '' && email2 !== '') {
                 emailInput.classList.remove('input-invalid');
                 confirmarEmailInput.classList.remove('input-invalid');
                 emailInput.classList.add('input-valid');
                 confirmarEmailInput.classList.add('input-valid');
             // Se um estiver preenchido e o outro não (mas tecnicamente coincidem por serem vazios), remove feedback.
             } else {
                 emailInput.classList.remove('input-invalid', 'input-valid');
                 confirmarEmailInput.classList.remove('input-invalid', 'input-valid');
             }
             // Esconde a mensagem de erro de confirmação.
             confirmarEmailErrorSpan.style.display = 'none';
         // Se os emails não coincidirem.
         } else {
             // Se o campo de confirmação foi preenchido (e difere do primeiro), marca ambos como inválidos.
             if (email2 !== '') {
                 emailInput.classList.remove('input-valid');
                 confirmarEmailInput.classList.remove('input-valid');
                 emailInput.classList.add('input-invalid');
                 confirmarEmailInput.classList.add('input-invalid');
                 // Mostra a mensagem de erro de confirmação.
                 confirmarEmailErrorSpan.style.display = 'block';
             // Se o campo de confirmação está vazio (mas o primeiro não), remove feedback (não há erro de *confirmação* ainda).
             } else {
                 emailInput.classList.remove('input-invalid', 'input-valid');
                 confirmarEmailInput.classList.remove('input-invalid', 'input-valid');
                 confirmarEmailErrorSpan.style.display = 'none';
             }
         }
     }

    // --- ADIÇÃO DOS EVENT LISTENERS ---

    // Listener para o campo CPF.
    if (cpfInput && cpfErrorSpan) {
        // Evento 'input': Acionado a cada caractere digitado ou alterado.
        cpfInput.addEventListener('input', function() {
            formatarCPF(this); // Aplica a máscara.
            // Remove as classes de validação enquanto o usuário digita.
            this.classList.remove('input-valid', 'input-invalid');
            // Esconde a mensagem de erro específica do CPF.
            cpfErrorSpan.style.display = 'none';
        });
        // Evento 'blur': Acionado quando o campo perde o foco.
        cpfInput.addEventListener('blur', function() {
            // Pega o valor limpo (só dígitos).
            const cpfLimpo = this.value.replace(/\D/g, '');
            // Se o campo estiver vazio após limpar, remove feedback e sai.
            if (cpfLimpo.trim() === '') {
                 this.classList.remove('input-valid', 'input-invalid');
                 cpfErrorSpan.style.display = 'none';
                 return;
            }
            // Valida o CPF limpo.
            if (validaCPF(cpfLimpo)) { // CPF Válido
                this.classList.remove('input-invalid');
                this.classList.add('input-valid'); // Adiciona classe de válido.
                cpfErrorSpan.style.display = 'none'; // Garante que erro está escondido.
            } else { // CPF Inválido
                this.classList.remove('input-valid');
                this.classList.add('input-invalid'); // Adiciona classe de inválido.
                cpfErrorSpan.style.display = 'block'; // Mostra mensagem de erro.
            }
        });
    }

    // Listeners para os campos de Email.
    if (emailInput && confirmarEmailInput) {
        // Evento 'blur' em ambos os campos: Aplica o feedback de validação (verde/vermelho).
        emailInput.addEventListener('blur', aplicarFeedbackEmails);
        confirmarEmailInput.addEventListener('blur', aplicarFeedbackEmails);
        // Função para limpar o feedback visual enquanto o usuário digita.
        const clearEmailFeedback = () => {
            emailInput.classList.remove('input-valid', 'input-invalid');
            confirmarEmailInput.classList.remove('input-valid', 'input-invalid');
            // Esconde a mensagem de erro se existir.
            if(confirmarEmailErrorSpan) confirmarEmailErrorSpan.style.display = 'none';
        };
        // Evento 'input' em ambos os campos: Chama a função de limpeza.
        emailInput.addEventListener('input', clearEmailFeedback);
        confirmarEmailInput.addEventListener('input', clearEmailFeedback);
    }

    // Listener para o campo Telefone.
    if (telefoneInput) {
        // Evento 'input': Formata o número e remove feedback de validação.
        telefoneInput.addEventListener('input', function() {
            formatarTelefone(this); // Aplica máscara.
            // Remove classes de validação enquanto digita.
            this.classList.remove('input-valid', 'input-invalid');
        });
    }

    // Listener para o input de Anexo (tipo 'file').
    if (anexoInput && anexoLabel) {
        // Evento 'change': Acionado quando um arquivo é selecionado.
          anexoInput.addEventListener('change', function() {
              // Verifica se algum arquivo foi selecionado.
              if (this.files && this.files.length > 0) {
                  // Atualiza o texto do label com o nome do primeiro arquivo selecionado.
                  anexoLabel.textContent = this.files[0].name;
                  // Adiciona uma classe ao label (opcional, para estilização).
                  anexoLabel.classList.add('file-selected');
              } else {
                  // Se nenhum arquivo foi selecionado (ou o usuário cancelou), restaura o texto padrão.
                  anexoLabel.textContent = defaultAnexoLabelText;
                  // Remove a classe opcional.
                  anexoLabel.classList.remove('file-selected');
              }
          });
    }


    // --- LISTENER PARA O ENVIO DO FORMULÁRIO ---
    // Verifica se o formulário foi encontrado no HTML.
    if (form) {
        // Adiciona um listener para o evento 'submit' do formulário.
        // A função é 'async' para permitir o uso de 'await' com fetch.
        form.addEventListener('submit', async function(event) {
            // Impede o comportamento padrão de envio do formulário (que recarregaria a página).
            event.preventDefault();

            // --- VALIDAÇÃO FINAL ANTES DO ENVIO ---
            // Flag para rastrear se o formulário está válido.
            let formValido = true;

            // Valida o CPF novamente (caso o usuário não tenha desfocado o campo).
            const cpfLimpoParaEnvio = cpfInput ? cpfInput.value.replace(/\D/g, '') : '';
            if (cpfInput && !validaCPF(cpfLimpoParaEnvio)) {
                statusDiv.innerHTML = 'Erro: CPF inválido. Por favor, corrija.'; // Mensagem de erro geral.
                statusDiv.className = 'error'; // Aplica classe de erro.
                cpfInput.classList.add('input-invalid'); // Marca campo como inválido.
                cpfInput.classList.remove('input-valid');
                if(cpfErrorSpan) cpfErrorSpan.style.display = 'block'; // Mostra erro específico.
                if (formValido) cpfInput.focus(); // Foca no campo se for o primeiro erro.
                formValido = false; // Marca formulário como inválido.
            }

            // Valida a confirmação de email novamente.
            if (!validaEmailsCoincidem()) {
                 statusDiv.innerHTML = 'Erro: Os e-mails não coincidem.';
                 statusDiv.className = 'error';
                 // Usa optional chaining (?.) para evitar erros se os elementos não existirem.
                 emailInput?.classList.add('input-invalid');
                 confirmarEmailInput?.classList.add('input-invalid');
                 emailInput?.classList.remove('input-valid');
                 confirmarEmailInput?.classList.remove('input-valid');
                 if(confirmarEmailErrorSpan) confirmarEmailErrorSpan.style.display = 'block';
                 if (formValido) confirmarEmailInput?.focus();
                 formValido = false;
             }

            // Valida o comprimento do telefone (deve ter 11 dígitos).
            const telefoneLimpoParaEnvio = telefoneInput ? telefoneInput.value.replace(/\D/g, '') : '';
            if (telefoneInput && telefoneLimpoParaEnvio.length !== 11) {
                 statusDiv.innerHTML = 'Erro: Telefone celular inválido. Use o formato (XX) XXXXX-XXXX.';
                 statusDiv.className = 'error';
                 telefoneInput.classList.add('input-invalid');
                 telefoneInput.classList.remove('input-valid');
                 if (formValido) telefoneInput.focus();
                 formValido = false;
            // Se passou na validação de comprimento, garante que não está marcado como inválido.
            } else if (telefoneInput) {
                 telefoneInput.classList.remove('input-invalid');
            }

            // Se qualquer validação falhou, interrompe o processo de envio.
            if (!formValido) {
                return; // Sai da função submit.
            }

            // --- PREPARAÇÃO PARA ENVIO ---
            // Se chegou aqui, o formulário é considerado válido.
            // Exibe mensagem de "Enviando..." para o usuário.
            statusDiv.innerHTML = 'Enviando...';
            statusDiv.className = ''; // Remove classes 'error' ou 'success'.
            statusDiv.style.color = '#555'; // Cor padrão.
            // Garante que mensagens de erro específicas estão escondidas.
            if(cpfErrorSpan) cpfErrorSpan.style.display = 'none';
            if(confirmarEmailErrorSpan) confirmarEmailErrorSpan.style.display = 'none';

            // Cria um objeto FormData, que coleta automaticamente os dados dos campos do formulário.
            const formData = new FormData(form);
            // Atualiza o valor do CPF no FormData para a versão sem máscara.
            if (cpfInput) {
                 formData.set('cpf', cpfLimpoParaEnvio); // 'set' substitui o valor existente.
            }
            // Atualiza o valor do telefone no FormData para a versão sem máscara.
            if (telefoneInput) {
                 formData.set('telefone', telefoneLimpoParaEnvio);
            }

            // --- CONFIGURAÇÃO DO FormSubmit.co ---
            // Define o email de destino cadastrado no FormSubmit.co.
            const emailDestino = "cahpesgafo@gmail.com"; // SUBSTITUA PELO SEU EMAIL REAL!
            // Monta a URL de envio do FormSubmit.
            const formSubmitURL = `https://formsubmit.co/${emailDestino}`;
            // Adiciona campos especiais que o FormSubmit reconhece (opcional).
            formData.append('_subject', 'Novo Contato Recebido pelo Site!'); // Define o assunto do email recebido.
            formData.append('_template', 'table'); // Pede para formatar o email como uma tabela.

            // --- ENVIO ASSÍNCRONO USANDO FETCH ---
            try {
                // Realiza a requisição POST para a URL do FormSubmit.
                // 'await' pausa a execução aqui até a promessa do fetch ser resolvida.
                const response = await fetch(formSubmitURL, {
                    method: 'POST', // Método HTTP.
                    body: formData, // Corpo da requisição com os dados do formulário.
                    headers: { 'Accept': 'application/json' } // Indica que preferimos receber a resposta em JSON.
                });

                // Verifica se a resposta do servidor foi bem-sucedida (status 2xx).
                if (response.ok) {
                    // Converte a resposta para JSON (geralmente retorna { "success": "true" }).
                    const result = await response.json();
                    // Loga o resultado no console (para debug).
                    console.log('Sucesso:', result);
                    // Exibe mensagem de sucesso para o usuário.
                    statusDiv.innerHTML = 'Mensagem enviada com sucesso!';
                    statusDiv.className = 'success'; // Aplica classe de sucesso.
                    // Limpa todos os campos do formulário.
                    form.reset();
                    // Remove as classes de validação dos campos após resetar.
                    cpfInput?.classList.remove('input-valid', 'input-invalid');
                    emailInput?.classList.remove('input-valid', 'input-invalid');
                    confirmarEmailInput?.classList.remove('input-valid', 'input-invalid');
                    telefoneInput?.classList.remove('input-valid', 'input-invalid');
                    // Restaura o texto padrão do label de anexo.
                    if (anexoLabel) anexoLabel.textContent = defaultAnexoLabelText;
                    if (anexoLabel) anexoLabel.classList.remove('file-selected');
                    // Garante que as mensagens de erro específicas estejam escondidas.
                    if(cpfErrorSpan) cpfErrorSpan.style.display = 'none';
                    if(confirmarEmailErrorSpan) confirmarEmailErrorSpan.style.display = 'none';

                // Se a resposta indicar um erro (status 4xx, 5xx).
                } else {
                    // Tenta ler a resposta de erro como JSON.
                    const errorResult = await response.json().catch(() => ({ message: 'Erro desconhecido do servidor.' })); // Fallback
                    // Loga o erro no console.
                    console.error('Erro do Servidor FormSubmit:', errorResult);
                    // Exibe mensagem de erro para o usuário, usando a mensagem do servidor se disponível.
                    statusDiv.innerHTML = `Erro ao enviar: ${errorResult.message || 'Tente novamente.'}`;
                    statusDiv.className = 'error'; // Aplica classe de erro.
                }

            // Captura erros que podem ocorrer durante a requisição (ex: problema de rede).
            } catch (error) {
                // Loga o erro no console.
                console.error('Erro de Rede/Fetch:', error);
                // Exibe uma mensagem de erro genérica para o usuário.
                statusDiv.innerHTML = 'Erro ao enviar. Verifique sua conexão ou tente mais tarde.';
                statusDiv.className = 'error'; // Aplica classe de erro.
            }
        }); // Fim do listener 'submit'
    // Se o elemento do formulário não for encontrado no HTML.
    } else {
        console.error("Erro: Formulário com ID 'contatoForm' não encontrado no DOM.");
    }

// Fim do listener 'DOMContentLoaded'
});


/* --- FUNÇÃO PARA BUSCAR DADOS DE CLIMA (API Visual Crossing) --- */
// Função assíncrona para poder usar 'await' com fetch.
async function fetchWeather() {
    // --- Configuração da API ---
    // Define a localização para a qual buscar o clima.
    const location = 'santo amaro'; // Pode ser mais específico: 'Santo Amaro, São Paulo, Brazil'
    // Define a chave da API Visual Crossing (IMPORTANTE: Substitua pela sua chave real).
    const apiKey = '4UHF6RU7LPLQU73J9SR5REXX6'; // SUA CHAVE AQUI

    // --- Montagem da URL da API ---
    // Constrói a URL da API, incluindo localização, chave e parâmetros desejados.
    const apiUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(location)}?unitGroup=metric&key=${apiKey}&contentType=json&lang=pt`;

    // --- Seleção dos Elementos do DOM para Exibição ---
    // Obtém as referências aos spans no HTML onde os dados serão mostrados.
    const tempElement = document.getElementById('weather-temp');
    const descElement = document.getElementById('weather-desc');

    // --- Estado Inicial de Carregamento ---
    // Define um texto inicial enquanto os dados são buscados.
    if(tempElement) tempElement.textContent = '--'; // Placeholder para temperatura.
    if(descElement) descElement.textContent = 'Carregando...'; // Mensagem de carregamento.

    // --- Bloco try...catch para Tratamento de Erros ---
    try {
        // Realiza a chamada à API usando fetch e aguarda a resposta.
        const response = await fetch(apiUrl);
        // Verifica se a resposta da API indica um erro (status não está na faixa 200-299).
        if (!response.ok) {
            // Tenta ler o corpo da resposta de erro para obter mais detalhes.
            const errorData = await response.text();
            // Lança um erro com detalhes do status e da resposta para ser pego pelo catch.
            throw new Error(`Erro da API: ${response.statusText} (Status: ${response.status}). Resposta: ${errorData}`);
        }
        // Se a resposta foi bem-sucedida, converte o corpo para JSON.
        const data = await response.json();

        // Loga a resposta completa no console (útil para entender a estrutura dos dados).
        console.log("Resposta da API Visual Crossing:", data);

        // --- Processamento dos Dados Recebidos ---
        // Verifica se o objeto 'currentConditions' existe na resposta da API.
        if (data.currentConditions) {
            // Acessa os dados das condições atuais.
            const current = data.currentConditions;
            // Extrai a temperatura (já em Celsius).
            const temperature = current.temp;
            // Extrai a descrição do tempo (já em português).
            const description = current.conditions;

            // Atualiza o elemento da temperatura no HTML.
            // Verifica se a temperatura existe e o elemento HTML também.
            if (temperature !== undefined && temperature !== null && tempElement) {
                // Arredonda a temperatura para o inteiro mais próximo e atualiza o texto.
                tempElement.textContent = Math.round(temperature);
            } else if (tempElement) { // Se não houver temperatura, exibe 'N/A'.
                tempElement.textContent = 'N/A';
            }

            // Atualiza o elemento da descrição no HTML.
            // Verifica se a descrição existe e o elemento HTML também.
            if (description && descElement) {
                // Garante que a primeira letra da descrição seja maiúscula.
                descElement.textContent = description.charAt(0).toUpperCase() + description.slice(1);
            } else if (descElement) { // Se não houver descrição, exibe 'N/A'.
                descElement.textContent = 'N/A';
            }

        // Se o objeto 'currentConditions' não foi encontrado na resposta.
        } else {
            console.warn("Objeto 'currentConditions' não encontrado na resposta da API.");
            // Atualiza o HTML para indicar que os dados não estão disponíveis.
            if(tempElement) tempElement.textContent = 'N/A';
            if(descElement) descElement.textContent = 'Indisponível';
        }
        // -----------------------------------------------------------------

    // Captura qualquer erro ocorrido durante o fetch ou o processamento dos dados.
    } catch (error) {
        // Loga o erro detalhado no console do navegador.
        console.error("Falha ao buscar/processar dados de tempo:", error);
        // Atualiza o HTML para indicar que ocorreu um erro.
        if(tempElement) tempElement.textContent = 'N/A';
        if(descElement) descElement.textContent = 'Erro';
    }
}

// --- Chamada Inicial da Função ---
// Executa a função fetchWeather() assim que o script é carregado e interpretado.
fetchWeather();

// --- FIM DO SCRIPT ---