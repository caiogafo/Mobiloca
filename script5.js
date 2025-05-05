// Garante que o script só será executado após o carregamento completo do HTML (DOM).
document.addEventListener('DOMContentLoaded', function() {
    // Mensagem de log para indicar que o script correto foi carregado e sua versão.
    console.log("Script 5 (Condutor) iniciado - v4 (Removido 'ou similar').");

    // --- Funções Auxiliares ---

    /**
     * Formata uma string de data para o formato DD/MM/YYYY.
     * Tenta ser robusto a diferentes formatos de entrada.
     * @param {string | null | undefined} dataString - A string da data a ser formatada.
     * @returns {string} - A data formatada como DD/MM/YYYY ou '--/--/----' em caso de erro.
     */
    function formatarData(dataString) {
        // Log detalhado para depuração - INÍCIO
         console.log(`--> formatarData chamada com: data='${dataString}'`);
         // Se a string de data for nula, indefinida ou vazia, retorna o placeholder.
         if (!dataString) {
             console.log("<-- formatarData: dataString vazia.");
             return '--/--/----';
         }
         try {
             let dataObj; // Variável para armazenar o objeto Date.
             // Pega apenas a parte da data (antes de um possível espaço, ex: 'YYYY-MM-DD HH:MM').
             const dataParte = dataString.split(' ')[0];

             // Tenta identificar o formato da data de entrada.
             if (dataParte.includes('-')) { // Formato YYYY-MM-DD
                 console.log(`formatarData: Detectado YYYY-MM-DD: "${dataParte}"`);
                 // Divide a string em ano, mês e dia.
                 const [year, month, day] = dataParte.split('-').map(Number);
                 // Validação básica das partes.
                 if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
                     throw new Error(`Partes inválidas YYYY-MM-DD: ${year}-${month}-${day}`);
                 }
                 // Cria o objeto Date usando UTC para evitar problemas de fuso horário. Mês é base 0.
                 dataObj = new Date(Date.UTC(year, month - 1, day));
                 console.log(`formatarData: Data UTC criada (YYYY-MM-DD): ${dataObj.toISOString()}`);
             } else if (dataParte.includes('/')) { // Formato DD/MM/YYYY
                 console.log(`formatarData: Detectado DD/MM/YYYY: "${dataParte}"`);
                 // Divide a string em dia, mês e ano.
                 const [day, month, year] = dataParte.split('/').map(Number);
                 // Validação básica das partes.
                 if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
                     throw new Error(`Partes inválidas DD/MM/YYYY: ${day}/${month}/${year}`);
                 }
                 // Cria o objeto Date usando UTC. Mês é base 0.
                 dataObj = new Date(Date.UTC(year, month - 1, day));
                 console.log(`formatarData: Data UTC criada (DD/MM/YYYY): ${dataObj.toISOString()}`);
             } else {
                 // Tenta um parse genérico se o formato não for reconhecido. Pode ser menos confiável.
                 console.log(`formatarData: Tentando parse genérico de: "${dataParte}"`);
                 dataObj = new Date(dataParte);
             }

             // Verifica se o objeto Date resultante é válido.
             if (!dataObj || isNaN(dataObj.getTime())) {
                 console.error(`formatarData: Objeto Date inválido. dataObj:`, dataObj);
                 throw new Error(`Data inválida após parse: "${dataString}"`);
             }

             // Extrai dia, mês e ano do objeto Date (usando métodos UTC).
             const diaFormatado = String(dataObj.getUTCDate()).padStart(2, '0'); // Garante 2 dígitos (ex: 05).
             const mesFormatado = String(dataObj.getUTCMonth() + 1).padStart(2, '0'); // Mês é base 0, então +1. Garante 2 dígitos.
             const anoFormatado = dataObj.getUTCFullYear();

             // Monta a string no formato DD/MM/YYYY.
             let resultadoFormatado = `${diaFormatado}/${mesFormatado}/${anoFormatado}`;
             console.log(`formatarData: Data formatada (DD/MM/YYYY): "${resultadoFormatado}"`);
             console.log("<-- formatarData: Retornando final:", resultadoFormatado);
             // Retorna a data formatada.
             return resultadoFormatado;
         // Captura qualquer erro durante o processo e retorna o placeholder.
         } catch (e) {
             console.error(`!!! Erro CRÍTICO em formatarData com input: data='${dataString}'. Erro:`, e);
             return '--/--/----';
         }
         // Log detalhado para depuração - FIM
    }

    /**
     * Calcula o número de diárias entre duas datas.
     * Considera que a data de devolução no mesmo dia da retirada conta como 1 diária.
     * @param {string | null | undefined} dataRetiradaStr - Data de retirada (YYYY-MM-DD ou DD/MM/YYYY).
     * @param {string | null | undefined} dataDevolucaoStr - Data de devolução (YYYY-MM-DD ou DD/MM/YYYY).
     * @returns {number} - O número de diárias (mínimo 1).
     */
    function calcularDiarias(dataRetiradaStr, dataDevolucaoStr) {
        // Código condensado mantido do original.
        try {
            // Função interna 'p' para parsear a data (YYYY-MM-DD ou DD/MM/YYYY) para objeto Date UTC.
            const p = (d) => {
                if (!d) return null;
                let pt = d.split(' ')[0]; // Pega só a parte da data.
                let y, m, day;
                if (pt.includes('/')) { [day, m, y] = pt.split('/'); }
                else if (pt.includes('-')) { [y, m, day] = pt.split('-'); }
                else return null; // Formato não reconhecido.
                if (!y || !m || !day) return null; // Partes inválidas.
                const dt = new Date(Date.UTC(y, m - 1, day)); // Cria Date UTC.
                return isNaN(dt.getTime()) ? null : dt; // Retorna null se inválido.
            };
            const dR = p(dataRetiradaStr); // Parse data retirada.
            const dD = p(dataDevolucaoStr); // Parse data devolução.

            // Se ambas as datas são válidas e devolução >= retirada.
            if (dR && dD && dD >= dR) {
                const diff = dD.getTime() - dR.getTime(); // Diferença em milissegundos.
                const dias = Math.ceil(diff / 86400000); // Converte para dias (86400000ms = 1 dia), arredonda para cima.
                return dias === 0 ? 1 : dias; // Se for 0 (mesmo dia), retorna 1 diária. Senão, retorna o cálculo.
            } else if (dR && dD && dD < dR) { // Data devolução anterior à retirada (erro).
                console.error("Data de devolução é anterior à data de retirada.");
                return 1; // Retorna 1 diária como fallback.
            }
        } catch (e) { // Captura erros no parse ou cálculo.
            console.error("Erro ao calcular diárias:", e);
        }
        return 1; // Retorna 1 diária em caso de erro ou datas inválidas.
    }

    /**
     * Formata um valor numérico como moeda brasileira (BRL).
     * @param {number | string | null | undefined} valor - O valor a ser formatado.
     * @returns {string} - O valor formatado como R$ X.XXX,XX ou '0,00' se inválido.
     */
    function formatarMoeda(valor) {
        // Código condensado mantido do original.
        const v = parseFloat(valor); // Tenta converter para número.
        // Se não for um número válido (NaN), retorna '0,00'.
        // Senão, usa toLocaleString para formatar como moeda BRL com 2 casas decimais.
        return isNaN(v) ? '0,00' : v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // --- Inicialização das Máscaras (jQuery Inputmask) ---
    // Tenta inicializar as máscaras nos campos de input.
    try {
        // Verifica se jQuery ($) e o plugin Inputmask estão carregados.
        if (typeof $ === 'function' && typeof $.fn.inputmask === 'function') {
            // Aplica máscara de data (dd/mm/aaaa).
            $('#nascimento').inputmask('99/99/9999', { placeholder: "dd/mm/aaaa", clearIncomplete: true });
            // Aplica máscara de CPF (xxx.xxx.xxx-xx).
            $('#cpf').inputmask('999.999.999-99', { placeholder: "___.___.___-__", clearIncomplete: true });
            // Aplica máscara de CEP (xxxxx-xxx).
            $('#cep').inputmask('99999-999', { placeholder: "_____-___", clearIncomplete: true });
            // Aplica máscara de telefone (permite 8 ou 9 dígitos no celular).
            $('#telefone').inputmask('(99) 9999[9]-9999', { placeholder: "(__) _____-____", clearIncomplete: true });
            console.log("Inputmask inicializado com sucesso.");
        // Se jQuery ou Inputmask não estiverem disponíveis.
        } else {
            console.error("jQuery ou Inputmask não está carregado. As máscaras de input não funcionarão.");
        }
    // Captura qualquer erro durante a inicialização do Inputmask.
    } catch(e) {
        console.error("Erro ao inicializar Inputmask:", e);
    }

    // --- Funções de Validação Específicas ---

    /**
     * Valida um número de CPF brasileiro (algoritmo padrão).
     * @param {string} cpf - O CPF a ser validado (pode conter máscara).
     * @returns {boolean} - True se válido, False caso contrário.
     */
    function validarCPF(cpf) {
        // Código condensado mantido do original (algoritmo de validação CPF).
        cpf=cpf.replace(/[^\d]+/g,''); // Remove não dígitos.
        if(cpf==='')return false; // Vazio é inválido.
        // Verifica tamanho 11 e se não são todos dígitos iguais.
        if(cpf.length!==11||/^(.)\1+$/.test(cpf))return false;
        // Calcula primeiro dígito verificador.
        let a=0;for(let i=0;i<9;i++)a+=parseInt(cpf.charAt(i))*(10-i);let r=11-(a%11);if(r===10||r===11)r=0;if(r!==parseInt(cpf.charAt(9)))return false;
        // Calcula segundo dígito verificador.
        a=0;for(let i=0;i<10;i++)a+=parseInt(cpf.charAt(i))*(11-i);r=11-(a%11);if(r===10||r===11)r=0;if(r!==parseInt(cpf.charAt(10)))return false;
        return true; // Se passou em tudo, é válido.
    }

    /**
     * Valida o formato de um endereço de e-mail usando expressão regular.
     * @param {string} email - O e-mail a ser validado.
     * @returns {boolean} - True se o formato for válido, False caso contrário.
     */
    function validarEmail(email) {
        // Código condensado mantido do original (Regex para validação de email).
        const re=/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return re.test(String(email).toLowerCase()); // Testa a regex contra o email em minúsculas.
    }

    /**
     * Valida um CEP brasileiro consultando a API ViaCEP.
     * Função assíncrona pois depende de uma chamada de rede.
     * @param {string} cep - O CEP a ser validado (pode conter máscara).
     * @returns {Promise<object>} - Uma promessa que resolve com um objeto:
     * { valido: boolean, erro?: string, data?: object }
     */
    async function validarCEP(cep) {
        // Código condensado mantido do original (Consulta ViaCEP).
        cep=cep.replace(/\D/g,''); // Remove não dígitos.
        if(cep.length!==8)return{valido:false,erro:'CEP deve ter 8 dígitos.'}; // Verifica tamanho.
        try{
            // Faz a chamada fetch para a API ViaCEP.
            const r=await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            // Se a resposta não for OK (status não for 2xx).
            if(!r.ok)throw new Error(`API ViaCEP falhou (Status: ${r.status})`);
            // Converte a resposta para JSON.
            const d=await r.json();
            // Se a API retornar um erro explícito (CEP não encontrado).
            if(d.erro)return{valido:false,erro:'CEP não encontrado.'};
            // Se tudo deu certo, retorna válido e os dados do endereço.
            return{valido:true,data:d};
        }catch(e){ // Captura erros de rede ou da API.
            console.error("Erro na consulta ViaCEP:",e);
            return{valido:false,erro:'Erro ao consultar CEP.'};
        }
    }

    /**
     * Exibe uma mensagem de erro associada a um campo de formulário.
     * Adiciona a classe 'input-error' ao campo e mostra a mensagem no span de erro correspondente.
     * @param {string} campoId - O ID do campo de input.
     * @param {string} mensagem - A mensagem de erro a ser exibida.
     */
    function mostrarErro(campoId, mensagem) {
        // Código condensado mantido do original.
        const inputElement = document.getElementById(campoId); // Pega o input.
        const errorElement = document.getElementById(`${campoId}-error`); // Pega o span de erro (espera ID como 'campoId-error').
        if(inputElement) inputElement.classList.add('input-error'); // Adiciona classe de erro ao input.
        if(errorElement){ errorElement.textContent = mensagem; errorElement.style.display = 'block'; } // Mostra a mensagem no span.
    }

    /**
     * Limpa a mensagem de erro e a classe de erro de um campo de formulário.
     * @param {string} campoId - O ID do campo de input.
     */
    function limparErro(campoId) {
        // Código condensado mantido do original.
        const inputElement = document.getElementById(campoId); // Pega o input.
        const errorElement = document.getElementById(`${campoId}-error`); // Pega o span de erro.
        if(inputElement) inputElement.classList.remove('input-error'); // Remove classe de erro do input.
        if(errorElement){ errorElement.textContent = ''; errorElement.style.display = 'none'; } // Limpa e esconde o span de erro.
    }

    // --- EVENT LISTENERS PARA VALIDAÇÃO EM TEMPO REAL (ao perder o foco - blur) ---

    // Validação da Data de Nascimento ao perder o foco.
    const inputNascimento = document.getElementById('nascimento');
    inputNascimento?.addEventListener('blur', function() {
        const valor = this.value; // Pega o valor do campo.
        const campoId = 'nascimento'; // ID do campo.
        limparErro(campoId); // Limpa erros anteriores.

        // Se vazio ou máscara incompleta, não valida ainda.
        if (!valor || valor.includes('_')) return;

        // Verifica o formato DD/MM/AAAA.
        const regexData = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/(19\d{2}|20\d{2})$/;
        if (!regexData.test(valor)) {
            mostrarErro(campoId, 'Formato inválido. Use dd/mm/aaaa.');
            return;
        }

        // Verifica se a data é válida (ex: não 31/02).
        const [dia, mes, ano] = valor.split('/');
        const diaNum = parseInt(dia), mesNum = parseInt(mes), anoNum = parseInt(ano);
        const dataNascimento = new Date(anoNum, mesNum - 1, diaNum); // Mês é base 0.
        // Compara se o objeto Date reconstruído bate com os valores originais.
        if (!(dataNascimento.getFullYear() === anoNum &&
              dataNascimento.getMonth() + 1 === mesNum &&
              dataNascimento.getDate() === diaNum)) {
            mostrarErro(campoId, 'Data inválida.');
            return;
        }

        // Verifica a idade mínima (18 anos).
        const hoje = new Date();
        // Calcula a data mínima de nascimento (18 anos atrás).
        const dataMinima = new Date(hoje.getFullYear() - 18, hoje.getMonth(), hoje.getDate());
        // Compara as datas (sem considerar horas)
        const dataNascSemHora = new Date(dataNascimento.getFullYear(), dataNascimento.getMonth(), dataNascimento.getDate());
        const dataMinSemHora = new Date(dataMinima.getFullYear(), dataMinima.getMonth(), dataMinima.getDate());

        if (dataNascSemHora > dataMinSemHora) {
            mostrarErro(campoId, 'Idade mínima de 18 anos não atingida.');
        } else {
            limparErro(campoId); // Se tudo ok, garante que não há erro.
        }
    });

    // Validação do CPF ao perder o foco.
    document.getElementById('cpf')?.addEventListener('blur', function() {
        const valor = this.value;
        // Só valida se não estiver vazio e a máscara estiver completa.
        if (valor.trim() && !valor.includes('_')) {
            if (!validarCPF(valor)) {
                mostrarErro('cpf', 'CPF inválido.');
            } else {
                limparErro('cpf');
            }
        // Se estiver vazio, limpa qualquer erro anterior.
        } else if (!valor.trim()) {
            limparErro('cpf');
        }
    });

    // Validação do Email ao perder o foco.
    document.getElementById('email')?.addEventListener('blur', function() {
        const valor = this.value;
        if (valor.trim()) { // Só valida se não estiver vazio.
            if (!validarEmail(valor)) {
                mostrarErro('email', 'Formato de e-mail inválido.');
            } else {
                limparErro('email');
                // Se o email for válido, verifica se coincide com a confirmação (se ela já foi preenchida).
                const confirmarInput = document.getElementById('email-confirm');
                if (confirmarInput && confirmarInput.value.trim() && confirmarInput.value !== valor) {
                    mostrarErro('email-confirm', 'Os e-mails não coincidem.');
                } else if (confirmarInput && confirmarInput.value === valor) {
                    // Se coincidem (e ambos válidos), limpa erro da confirmação também.
                    limparErro('email-confirm');
                }
            }
        } else { // Se estiver vazio, limpa erro.
            limparErro('email');
        }
    });

    // Validação da Confirmação de Email ao perder o foco.
    document.getElementById('email-confirm')?.addEventListener('blur', function() {
        const valorConfirmacao = this.value;
        if (valorConfirmacao.trim()) { // Só valida se não estiver vazio.
            const valorPrincipal = document.getElementById('email')?.value;
            if (valorConfirmacao !== valorPrincipal) {
                mostrarErro('email-confirm', 'Os e-mails não coincidem.');
            } else {
                limparErro('email-confirm');
            }
        } else { // Se estiver vazio, limpa erro.
            limparErro('email-confirm');
        }
    });

    // Validação do CEP ao perder o foco (assíncrona).
    document.getElementById('cep')?.addEventListener('blur', async function() {
        const valor = this.value;
        // Só valida se não estiver vazio e máscara completa.
        if (valor.trim() && !valor.includes('_')) {
            const resultado = await validarCEP(valor); // Chama a API ViaCEP.
            if (!resultado.valido) {
                mostrarErro('cep', resultado.erro || 'CEP inválido.');
            } else {
                limparErro('cep');
            }
        } else if (!valor.trim()) { // Se vazio, limpa erro.
            limparErro('cep');
        }
    });


    // --- PREENCHIMENTO DO RESUMO DA RESERVA ---

    /**
     * Busca dados FINAIS da reserva no sessionStorage e atualiza os elementos HTML
     * da seção de resumo.
     * MODIFICADO: Não exibe mais "ou similar" após o nome do carro/grupo.
     */
    function preencherResumo() {
        console.log("--- Iniciando preencherResumo (script5 - Apenas Nome Grupo) ---");

        // Recupera os dados salvos na sessão anterior. Usa 'N/D' ou 0 como fallback.
        const nomeCarro = sessionStorage.getItem('nomeCarro') || 'N/D'; // Nome do GRUPO selecionado.
        const urlImagemCarro = sessionStorage.getItem('urlImagemCarro') || 'placeholder_car.png'; // URL da imagem.
        const dataRetirada = sessionStorage.getItem('dataRetirada'); // Data/Hora Retirada (string).
        const horaRetirada = sessionStorage.getItem('horaRetirada'); // Hora (usada indiretamente em formatarData, se formato incluir).
        const dataDevolucao = sessionStorage.getItem('dataDevolucao'); // Data/Hora Devolução (string).
        const horaDevolucao = sessionStorage.getItem('horaDevolucao'); // Hora (usada indiretamente).
        const retiradaLocal = sessionStorage.getItem('retiradaLocal') || ''; // Local (opcional).
        const devolucaoLocal = sessionStorage.getItem('devolucaoLocal') || ''; // Local (opcional).
        const subtotalValor = parseFloat(sessionStorage.getItem('finalSubtotal')) || 0; // Subtotal (diárias * valor).
        const protecaoValor = parseFloat(sessionStorage.getItem('protecaoValor')) || 0; // Valor da proteção escolhida.
        const opcionaisTotalValor = parseFloat(sessionStorage.getItem('valorOpcionaisTotal')) || 0; // Soma dos opcionais.
        const taxaConvenienciaValor = parseFloat(sessionStorage.getItem('finalTaxa')) || 0; // Taxa administrativa/serviço.
        const descontosValor = parseFloat(sessionStorage.getItem('finalDescontos')) || 0; // Valor total de descontos aplicados.
        const totalValor = parseFloat(sessionStorage.getItem('finalTotal')) || 0; // Valor final a pagar.

        // Log dos valores recuperados para depuração.
        console.log("Valores FINAIS recuperados do sessionStorage:", { subtotalValor, protecaoValor, opcionaisTotalValor, taxaConvenienciaValor, descontosValor, totalValor });
        console.log("Datas/Horas/Locais recuperadas:", { dataRetirada, horaRetirada, dataDevolucao, horaDevolucao, retiradaLocal, devolucaoLocal });

        // Seletores para os elementos HTML do resumo.
        const el = (id) => document.getElementById(id); // Função auxiliar para pegar elemento por ID.
        const resumoImagemCarroElement = el('resumoImagemCarro'); // Imagem do carro no resumo.
        const nomeCarroElement = el('nomeCarro'); // Nome do carro/grupo no resumo.
        const dataEntregaElement = el('dataEntrega'); // Span para data/local de retirada.
        const dataDevolucaoElement = el('dataDevolucao'); // Span para data/local de devolução.
        const subtotalElement = el('subtotal'); // Span para valor do subtotal.
        const valorProtecaoElement = el('valorProtecao'); // Span para valor da proteção.
        const valorOpcionaisElement = el('valorOpcionais'); // Span para valor dos opcionais.
        const taxaConvenienciaElement = el('taxaConveniencia'); // Span para valor da taxa.
        const descontosElement = el('descontos'); // Span para valor dos descontos.
        const totalElement = el('total'); // Span para valor total final.

        // --- Atualização do DOM (elementos HTML) ---
        // Função auxiliar para definir o texto de um elemento, se ele existir.
        const setElementText = (element, text) => { if (element) element.textContent = text; };

        // Atualiza a imagem do carro e o texto alternativo.
        if (resumoImagemCarroElement) {
            resumoImagemCarroElement.src = urlImagemCarro;
            resumoImagemCarroElement.alt = `Imagem ${nomeCarro}`;
        }

        // MODIFICAÇÃO CHAVE: Exibe APENAS o nome do grupo (sem adicionar " ou similar").
        setElementText(nomeCarroElement, nomeCarro);

        // Atualiza as informações de retirada e devolução (Data + Local, se houver).
        // Usa a função formatarData que agora só lida com a data.
        setElementText(dataEntregaElement, formatarData(dataRetirada) + (retiradaLocal ? ` - ${retiradaLocal}` : ''));
        setElementText(dataDevolucaoElement, formatarData(dataDevolucao) + (devolucaoLocal ? ` - ${devolucaoLocal}` : ''));

        // Atualiza os valores monetários, formatando-os.
        setElementText(subtotalElement, formatarMoeda(subtotalValor));
        setElementText(valorProtecaoElement, formatarMoeda(protecaoValor));
        setElementText(valorOpcionaisElement, formatarMoeda(opcionaisTotalValor));
        setElementText(taxaConvenienciaElement, formatarMoeda(taxaConvenienciaValor));
        // Formata desconto com sinal negativo se for maior que zero.
        setElementText(descontosElement, descontosValor > 0 ? `-${formatarMoeda(descontosValor)}` : '0,00');
        setElementText(totalElement, formatarMoeda(totalValor));

        console.log("--- Finalizando preencherResumo ---");
    }


    // --- PROCESSAMENTO DO FORMULÁRIO NO ENVIO (Evento 'submit') ---
    // Seleciona o formulário de informações do condutor.
    const rentalForm = document.getElementById('rental-form');
    // Adiciona o listener para o evento 'submit'. Função assíncrona devido à validação de CEP.
    rentalForm?.addEventListener('submit', async function(event) {
        // Código condensado mantido do original.

        event.preventDefault(); // Impede o envio padrão que recarrega a página.
        let formValido = true; // Flag de validação.
        // IDs dos campos obrigatórios.
        const camposObrigatorios = ['nome', 'ultimo-nome', 'nascimento', 'telefone', 'cpf', 'cep', 'email', 'email-confirm'];
        // Limpa erros de validações anteriores.
        camposObrigatorios.forEach(cId => limparErro(cId));

        // 1ª Passada: Verifica campos obrigatórios e máscaras incompletas.
        camposObrigatorios.forEach(cId => {
            const i = document.getElementById(cId); // Pega o input.
            let empty = !i || !i.value.trim(); // Verifica se está vazio.
            let maskInc = false; // Flag para máscara incompleta.
            // Verifica se Inputmask está carregado e se o campo está completo.
            if (i && typeof $ === 'function' && typeof $.fn.inputmask === 'function') {
                try {
                    // Se tem valor mas não está completo ou ainda tem placeholder '_'.
                    if (i.value.trim() && (!$(i).inputmask('isComplete') || i.value.includes('_'))) {
                        maskInc = true;
                    }
                } catch (err) { // Fallback se Inputmask falhar.
                    console.warn(`Erro ao verificar máscara para ${cId}:`, err);
                    if (i.value.trim() && i.value.includes('_')) { maskInc = true; }
                }
            // Fallback se Inputmask não estiver carregado, verifica apenas por '_'.
            } else if (i && i.value.includes('_')) {
                maskInc = true;
            }
            // Se vazio ou máscara incompleta, marca como erro.
            if (empty) { mostrarErro(cId, 'Campo obrigatório'); formValido = false; }
            else if (maskInc) { mostrarErro(cId, 'Preenchimento incompleto'); formValido = false; }
        });

        // 2ª Passada: Validações específicas (CPF, Email, CEP, Nascimento) apenas se a 1ª passou.
        if (formValido) {
            const cpfIn = document.getElementById('cpf');
            if (cpfIn && !validarCPF(cpfIn.value)) { mostrarErro('cpf', 'CPF inválido'); formValido = false; }

            const emailIn = document.getElementById('email');
            if (emailIn && !validarEmail(emailIn.value)) { mostrarErro('email', 'E-mail inválido'); formValido = false; }

            const emailCIn = document.getElementById('email-confirm');
            if (emailIn && emailCIn && emailIn.value !== emailCIn.value) { mostrarErro('email-confirm', 'E-mails não coincidem'); formValido = false; }

            const cepIn = document.getElementById('cep');
            if (cepIn) {
                const resCep = await validarCEP(cepIn.value); // Validação assíncrona do CEP.
                if (!resCep.valido) { mostrarErro('cep', resCep.erro || 'CEP inválido'); formValido = false; }
            }

            // Revalida Nascimento (verifica se a mensagem de erro ainda está visível).
            const nascErr = document.getElementById('nascimento-error');
            if (nascErr && nascErr.style.display === 'block') {
                // Considera inválido se o erro for sobre idade mínima ou data inválida.
                if (nascErr.textContent.includes('18 anos') || nascErr.textContent.includes('inválida')) {
                    formValido = false;
                }
            }
        }

        // --- Ação Final ---
        if (formValido) { // Se todas as validações passaram.
            console.log("Formulário de Condutor considerado VÁLIDO.");
            // Coleta os dados do formulário em um objeto.
            const formData = {
                nome: document.getElementById('nome')?.value||'',
                ultimoNome: document.getElementById('ultimo-nome')?.value||'',
                nascimento: document.getElementById('nascimento')?.value||'',
                nacionalidade: document.getElementById('nacionalidade')?.value||'',
                ddi: document.getElementById('ddi')?.value||'',
                telefone: document.getElementById('telefone')?.value||'', // Máscara já aplicada.
                cpf: document.getElementById('cpf')?.value||'',           // Máscara já aplicada.
                cep: document.getElementById('cep')?.value||'',             // Máscara já aplicada.
                email: document.getElementById('email')?.value||'',
                receberOfertas: document.getElementById('ofertas')?.checked||false // Valor booleano do checkbox.
            };
            try {
                // Salva os dados do condutor no sessionStorage como string JSON.
                sessionStorage.setItem('condutorData', JSON.stringify(formData));
                console.log("Dados do condutor salvos no sessionStorage.");
            } catch (e) { // Erro ao salvar (ex: limite do sessionStorage).
                console.error("Erro ao salvar dados do condutor no sessionStorage:", e);
                alert("Ocorreu um erro ao salvar as informações do condutor. Tente novamente.");
                return; // Interrompe o processo.
            }

            // Verificação de segurança: garante que dados essenciais da reserva ainda existem.
            if (!sessionStorage.getItem('finalTotal') || !sessionStorage.getItem('nomeCarro')) {
                console.error("ERRO CRÍTICO: Dados essenciais da reserva (Total/Carro) ausentes no sessionStorage.");
                alert("Ocorreu um erro com os dados da sua reserva. Por favor, comece o processo novamente.");
                window.location.href = 'index.html'; // Redireciona para a página inicial.
                return; // Interrompe o processo.
            }

            // Redireciona para a próxima página (Pagamento).
            window.location.href = 'reservasPagamento.html';
        } else { // Se o formulário for inválido.
            console.log("Formulário de Condutor considerado INVÁLIDO.");
            // Encontra o primeiro campo com erro e rola a página até ele para facilitar a correção.
            const firstError = document.querySelector('.input-error');
            firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }); // Fim do listener 'submit'

    // --- INICIALIZAÇÃO DA PÁGINA ---
    // Preenche a seção de resumo com os dados da reserva salvos anteriormente.
    console.log("Chamando preencherResumo na inicialização...");
    preencherResumo();

    // Busca e exibe as informações de clima no rodapé.
    // Verifica se a função existe antes de chamar (ela pode estar em outro arquivo).
    if (typeof fetchWeather === "function") {
        console.log("Chamando fetchWeather na inicialização...");
        fetchWeather();
    } else {
        console.warn("Função fetchWeather não está definida neste escopo.");
    }

}); // Fim do listener 'DOMContentLoaded'


// --- Função para Buscar Clima (API Visual Crossing) ---
// Definida fora do DOMContentLoaded para ser potencialmente chamada de outros lugares se necessário.
async function fetchWeather() {
    // Código condensado mantido do original.
    console.log("Função fetchWeather iniciada.");
    const location = 'santo amaro, sao paulo, br'; // Localização específica.
    const apiKey = '4UHF6RU7LPLQU73J9SR5REXX6'; // Chave da API. **NÃO EXPONHA CHAVES ASSIM EM PRODUÇÃO!** Use backend.
    const apiUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(location)}?unitGroup=metric&key=${apiKey}&contentType=json&lang=pt`; // Monta URL.
    const tempElement = document.getElementById('weather-temp'); // Elemento da temperatura.
    const descElement = document.getElementById('weather-desc'); // Elemento da descrição.

    // Define estado inicial de carregamento.
    if(tempElement) tempElement.textContent = '--';
    if(descElement) descElement.textContent = 'Carregando...';

    try { // Tenta buscar os dados.
        const response = await fetch(apiUrl); // Faz a chamada.
        if (!response.ok) { // Se resposta não for OK.
            let errorBody = ''; try { errorBody = await response.text(); } catch(_) {} // Tenta pegar corpo do erro.
            throw new Error(`Erro HTTP ${response.status}: ${response.statusText}. ${errorBody}`); // Lança erro detalhado.
        }
        const data = await response.json(); // Converte para JSON.

        // Processa os dados se existirem.
        if (data && data.currentConditions) {
            const current = data.currentConditions;
            const temperature = current.temp;
            const description = current.conditions;
            // Atualiza DOM com temperatura arredondada.
            if (tempElement) { tempElement.textContent = (temperature !== undefined && temperature !== null) ? Math.round(temperature) : 'N/A'; }
            // Atualiza DOM com descrição capitalizada.
            if (descElement) { descElement.textContent = description ? (description.charAt(0).toUpperCase() + description.slice(1)) : 'N/A'; }
            console.log("Informações de clima atualizadas no rodapé.");
        } else { // Se o formato da resposta for inesperado.
            throw new Error("Formato inesperado da resposta da API de clima.");
        }
    } catch (error) { // Captura erros de rede ou processamento.
        console.error("Falha ao buscar ou processar dados de tempo:", error);
        // Atualiza DOM para indicar erro.
        if(tempElement) tempElement.textContent = 'N/A';
        if(descElement) descElement.textContent = 'Erro';
    }
}