/* ==========================================================================
   Navegação Dinâmica Isolada - Nitrogênio Protocolo
   ========================================================================== */

function navegarPara(idTela) {
    // 1. Esconde todas as seções do app
    document.querySelectorAll('main#conteudo-principal section').forEach(section => {
        section.classList.remove('ativa');
        section.style.display = 'none'; 
    });
    
    // 2. Mostra a nova tela ativa
    const novaTela = document.getElementById(idTela);
    if (novaTela) {
        novaTela.classList.add('ativa');
        novaTela.style.display = 'block'; 
        window.scrollTo(0, 0); 
        
        // ==========================================================================
        // MÁGICA DOS BOTÕES DO RODAPÉ (Injetada aqui para automação total)
        // ==========================================================================
        // Remove o azul (.active) de TODOS os botões do rodapé
        document.querySelectorAll('#rodape-fixo button').forEach(b => b.classList.remove('active'));
        
        // Mapeia qual botão deve acender baseado na tela atual
        const mapaBotoes = {
            'tela-home': 'btn-menu-home',
            'tela-nft': 'btn-menu-nft',
            'tela-dao': 'btn-menu-dao',
            'tela-redes': 'btn-menu-redes',
            'tela-perfil': 'btn-menu-perfil'
        };
        
        // Descobre o ID do botão correspondente à tela ativa
        const idBotaoAlvo = mapaBotoes[idTela];
        const botaoMenu = document.getElementById(idBotaoAlvo);
        
        // Se achou o botão no rodapé, acende ele (fica azul, os outros ficam cinza)
        if (botaoMenu) {
            botaoMenu.classList.add('active');
        }
        // ==========================================================================

    } else {
        console.warn(`Aviso: A tela "${idTela}" não foi encontrada.`);
    }
}

function ligarAcao(idBotao, idTelaDestino) {
    const botao = document.getElementById(idBotao);
    if (botao) {
        botao.addEventListener('click', (e) => {
            e.preventDefault();
            navegarPara(idTelaDestino);
        });
    }
}

// CONFIGURAÇÃO DOS GATILHOS DE CLIQUE
ligarAcao('btn-menu-home', 'tela-home');
ligarAcao('btn-menu-nft', 'tela-nft');
ligarAcao('btn-menu-dao', 'tela-dao');
ligarAcao('btn-menu-redes', 'tela-redes');
ligarAcao('btn-menu-perfil', 'tela-perfil');

ligarAcao('nav-pagar', 'tela-pagar');
ligarAcao('nav-receber', 'tela-receber');
ligarAcao('nav-trocar', 'tela-trocar');
ligarAcao('nav-coletar', 'tela-coletar');

ligarAcao('card-dao-recompensas', 'sub-recompensas');
ligarAcao('btn-abrir-governanca', 'sub-governanca-safe');
ligarAcao('btn-abrir-tesouraria', 'tela-tesouraria');
ligarAcao('card-pagar-leitor', 'sub-pagar-leitor');
ligarAcao('card-receber-gerar', 'sub-receber-gerar-qr');
ligarAcao('card-coletar-executar', 'sub-coletar-executar');
ligarAcao('card-trocar-pancake', 'sub-trocar-pancakeswap');

ligarAcao('card-recompensa-poupanca', 'folha-poupanca');
ligarAcao('card-recompensa-quiz', 'folha-quiz');
ligarAcao('card-recompensa-checkin', 'folha-checkin');
ligarAcao('card-recompensa-roleta', 'folha-roleta');

// Dispara a busca de dados da API da Safe assim que o usuário abre a governança
const botaoGovClick = document.getElementById('btn-abrir-governanca');
if (botaoGovClick) {
    botaoGovClick.addEventListener('click', () => {
        atualizarPainelSafeDAO();
    });
}

// LOGICA DO BOTÃO VOLTAR
const caminhosVoltar = {
    'folha-poupanca': 'sub-recompensas',
    'folha-quiz': 'sub-recompensas',
    'folha-checkin': 'sub-recompensas',
    'folha-roleta': 'sub-recompensas',
    'sub-pagar-leitor': 'tela-pagar',
    'sub-receber-gerar-qr': 'tela-receber',
    'sub-coletar-executar': 'tela-coletar',
    'sub-trocar-pancakeswap': 'tela-trocar',
    'sub-recompensas': 'tela-dao',
    'tela-pagar': 'tela-home',
    'tela-receber': 'tela-home',
    'tela-coletar': 'tela-home',
    'tela-trocar': 'tela-home',
    'tela-tesouraria': 'tela-dao',
   'sub-governanca-safe': 'tela-dao',
};

document.querySelectorAll('.btn-voltar').forEach(botao => {
    botao.addEventListener('click', (e) => {
        e.preventDefault();
        const telaAtual = botao.closest('section');
        if (!telaAtual) return;

        const destino = caminhosVoltar[telaAtual.id];
        if (destino) {
            navegarPara(destino);
        } else {
            navegarPara('tela-home');
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    navegarPara('tela-home');
});

console.log("Nitrogênio Protocolo: Home destravada com sucesso!");


/* ==========================================================================
   INTEGRAÇÃO WEB3 - ETHERS V6 (AQUI COMEÇA A NOSSA MÁGICA)
   ========================================================================== */

// 1. Configurações Iniciais do Token
// Quando criar seu token, você APENAS muda esse endereço de contrato abaixo!
const ENDERECO_DO_TOKEN = "0x...Coloque_Aqui_O_Endereco_Do_Token_De_Testes..."; 

// A "ABI" avisa o Ethers quais funções existem dentro do contrato do Token. 
// Para ler saldo (balanceOf), precisamos apenas dessa linha padrão ERC-20/BEP-20:
const ABI_SIMPLIFICADA_TOKEN = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)"
];

// Variáveis globais para usarmos em todo o app
let provider;
let signer;
let usuarioEndereco;

// Elementos do HTML que vamos alterar dinamicamente
const btnConectar = document.getElementById('btn-conectar-wallet');
const txtStatusCarteira = document.getElementById('carteira-status');
const txtSaldoToken = document.getElementById('txt-saldo-token');

// 2. Função para Conectar e Buscar o Saldo do Token
async function gerenciarConexaoMetaMask() {
    if (!window.ethereum) {
        alert("MetaMask não encontrada! Por favor, instale a extensão.");
        return;
    }

    try {
        // Inicializa o provider e requisita a conta (v6)
        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
        usuarioEndereco = await signer.getAddress();

        // Altera o layout para mostrar que conectou
        txtStatusCarteira.innerText = `CONECTADO: ${usuarioEndereco.substring(0, 6)}...${usuarioEndereco.substring(usuarioEndereco.length - 4)}`;
        btnConectar.innerText = "CONECTADO";
        btnConectar.style.backgroundColor = "#27ae60"; // Deixa o botão verde

        // Executa a busca de saldo do Token
        await atualizarSaldoDoToken();
       await atualizarSaldosTesouraria();
       await atualizarPainelSafeDAO();
    } catch (erro) {
        console.error("Erro na conexão:", erro);
        alert("Usuário rejeitou ou falhou na conexão.");
    }
}

// 3. Função para Ler os Dados do Contrato Inteligente
async function atualizarSaldoDoToken() {
    if (!provider || !usuarioEndereco) return;

    try {
        // Se ainda não colocou o contrato real, evita estourar erro no console
        if(ENDERECO_DO_TOKEN.includes("...")) {
            txtSaldoToken.innerText = "0.00 NITRO (Modo Setup)";
            return;
        }

        // Conecta ao Contrato usando a v6
        const contratoToken = new ethers.Contract(ENDERECO_DO_TOKEN, ABI_SIMPLIFICADA_TOKEN, provider);

        // Chama as funções do contrato de forma assíncrona
        const decimals = await contratoToken.decimals();
        const saldoBruto = await contratoToken.balanceOf(usuarioEndereco);

        // O Ethers v6 formata os números gigantes da blockchain para legíveis humanos
        const saldoFormatado = ethers.formatUnits(saldoBruto, decimals);

        // Atualiza na tela do Nitrogênio!
        txtSaldoToken.innerText = `${parseFloat(saldoFormatado).toFixed(2)} NITRO`;

    } catch (erro) {
        console.error("Erro ao puxar saldo do contrato:", erro);
        txtSaldoToken.innerText = "Erro ao ler Saldo";
    }
}

// 4. Ouvinte de Clique para o botão Conectar do Topo
if (btnConectar) {
    btnConectar.addEventListener('click', gerenciarConexaoMetaMask);
}

/**
 * Consulta o saldo em tempo real da BNB Chain e atualiza a interface da tesouraria.
 * Sem simulações: exibe o valor exato contido no contrato inteligente.
 */
async function atualizarSaldosTesouraria() {
    if (!provider) {
        console.warn("[Web3] Provedor não inicializado. Impossível ler saldo do cofre.");
        return;
    }
    
    const ENDERECO_COFRE = "0x11aBd1b9c71f97ad1df8A0Dbb789f8A96B458219";
    // Endereço oficial do contrato do USDT na BSC (BEP-20)
    const ENDERECO_USDT_BSC = "0x55d398326f99059fF775485246999027B3197955";
    
    // ABI mínima para consultar saldo e decimais de um token padrão ERC-20
    const abiErc20Minima = [
        "function balanceOf(address account) view returns (uint256)",
        "function decimals() view returns (uint8)"
    ];
    
    // Captura dos elementos do DOM
    const txtPatrimonio = document.getElementById('txt-patrimonio-real');
    const txtBnbTesouraria = document.getElementById('txt-bnb-tesouraria');
    const txtBnbFiat = document.getElementById('txt-bnb-fiat');
    const txtUsdtTesouraria = document.getElementById('txt-usdt-tesouraria');
    const txtUsdtFiat = document.getElementById('txt-usdt-fiat');
    
    if (txtPatrimonio) txtPatrimonio.innerText = "Atualizando...";

    try {
        // ==========================================
        // 1. BUSCA SALDO DO BNB NATIVO
        // ==========================================
        const saldoWei = await provider.getBalance(ENDERECO_COFRE);
        const saldoBNBString = ethers.formatEther(saldoWei);
        const saldoBNB = parseFloat(saldoBNBString);
        
        if (txtBnbTesouraria) {
            txtBnbTesouraria.innerText = saldoBNB === 0 ? "0.00 BNB" : 
                                         saldoBNB < 0.0001 ? `${saldoBNB.toFixed(8)} BNB` : `${saldoBNB.toFixed(4)} BNB`;
        }

        // ==========================================
        // 2. BUSCA SALDO DO USDT (CONTRATO BEP-20)
        // ==========================================
        let saldoUSDT = 0;
        try {
            const contratoUsdt = new ethers.Contract(ENDERECO_USDT_BSC, abiErc20Minima, provider);
            const [decimaisUsdt, saldoBrutoUsdt] = await Promise.all([
                contratoUsdt.decimals(),
                contratoUsdt.balanceOf(ENDERECO_COFRE)
            ]);
            const saldoUsdtFormatado = ethers.formatUnits(saldoBrutoUsdt, decimaisUsdt);
            saldoUSDT = parseFloat(saldoUsdtFormatado);
        } catch (erroUsdt) {
            console.error("[Web3 Erro] Falha ao consultar contrato USDT:", erroUsdt);
        }

        if (txtUsdtTesouraria) {
            txtUsdtTesouraria.innerText = `${saldoUSDT.toFixed(2)} USDT`;
        }

        // ==========================================
        // 3. BUSCA COTAÇÕES DE MERCADO (BINANCE API)
        // ==========================================
        let cotacaoBnbBrl = 3450.00; // Fallbacks estáveis de contingência
        let cotacaoUsdtBrl = 5.00;
        
        try {
            // Busca cotação simultânea para otimizar velocidade
            const [resBnb, resUsdt] = await Promise.all([
                fetch("https://api.binance.com/api/v3/ticker/price?symbol=BNBBRL"),
                fetch("https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL")
            ]);
            
            if (resBnb.ok) {
                const dadosBnb = await resBnb.json();
                if (dadosBnb.price) cotacaoBnbBrl = parseFloat(dadosBnb.price);
            }
            if (resUsdt.ok) {
                const dadosUsdt = await resUsdt.json();
                if (txtPatrimonio.innerText = "Erro de conexão";
    }
}

// Configuração da API da Safe Wallet (Rede Binance Smart Chain)
const SAFE_API_URL = "https://safe-transaction-bsc.safe.global/api/v1";
const ENDERECO_COFRE_DAO = "0x11aBd1b9c71f97ad1df8A0Dbb789f8A96B458219";

// Variável para guardar temporariamente os dados da transação que precisa de assinatura
let transacaoPendenteAtual = null;

/**
 * Carrega os dados de governança multi-sig vindos da API oficial da Safe.
 * Deve ser invocada quando o usuário conecta a carteira ou clica na aba DAO.
 */
async function atualizarSaldosTesouraria() {
    // Captura dos elementos do DOM
    const txtPatrimonio = document.getElementById('txt-patrimonio-real');
    const txtBnbTesouraria = document.getElementById('txt-bnb-tesouraria');
    const txtBnbFiat = document.getElementById('txt-bnb-fiat');
    const txtUsdtTesouraria = document.getElementById('txt-usdt-tesouraria');
    const txtUsdtFiat = document.getElementById('txt-usdt-fiat');

    // 🔒 BARREIRA DE SEGURANÇA: Se não tiver provider (MetaMask desconectada), zera tudo e para aqui!
    if (!provider) {
        console.warn("[Web3] Carteira desconectada. Saldos da tesouraria ocultados.");
        if (txtPatrimonio) txtPatrimonio.innerText = "R$ 0,00";
        if (txtBnbTesouraria) txtBnbTesouraria.innerText = "0.00 BNB";
        if (txtBnbFiat) txtBnbFiat.innerText = "R$ 0,00";
        if (txtUsdtTesouraria) txtUsdtTesouraria.innerText = "0.00 USDT";
        if (txtUsdtFiat) txtUsdtFiat.innerText = "R$ 0,00";
        return; // Encerra a função aqui mesmo
    }
    
    const ENDERECO_COFRE = "0x11aBd1b9c71f97ad1df8A0Dbb789f8A96B458219";
    const ENDERECO_USDT_BSC = "0x55d398326f99059fF775485246999027B3197955";
    
    const abiErc20Minima = [
        "function balanceOf(address account) view returns (uint256)",
        "function decimals() view returns (uint8)"
    ];
    
    if (txtPatrimonio) txtPatrimonio.innerText = "Atualizando...";

    try {
        // ==========================================
        // 1. BUSCA SALDO DO BNB NATIVO
        // ==========================================
        const saldoWei = await provider.getBalance(ENDERECO_COFRE);
        const saldoBNBString = ethers.formatEther(saldoWei);
        const saldoBNB = parseFloat(saldoBNBString);
        
        if (txtBnbTesouraria) {
            txtBnbTesouraria.innerText = saldoBNB === 0 ? "0.00 BNB" : 
                                         saldoBNB < 0.0001 ? `${saldoBNB.toFixed(8)} BNB` : `${saldoBNB.toFixed(4)} BNB`;
        }

        // ==========================================
        // 2. BUSCA SALDO DO USDT (CONTRATO BEP-20)
        // ==========================================
        let saldoUSDT = 0;
        try {
            const contratoUsdt = new ethers.Contract(ENDERECO_USDT_BSC, abiErc20Minima, provider);
            const [decimaisUsdt, saldoBrutoUsdt] = await Promise.all([
                contratoUsdt.decimals(),
                contratoUsdt.balanceOf(ENDERECO_COFRE)
            ]);
            const saldoUsdtFormatado = ethers.formatUnits(saldoBrutoUsdt, decimaisUsdt);
            saldoUSDT = parseFloat(saldoUsdtFormatado);
        } catch (erroUsdt) {
            console.error("[Web3 Erro] Falha ao consultar contrato USDT:", erroUsdt);
        }

        if (txtUsdtTesouraria) {
            txtUsdtTesouraria.innerText = `${saldoUSDT.toFixed(2)} USDT`;
        }

        // ==========================================
        // 3. BUSCA COTAÇÕES DE MERCADO (BINANCE API)
        // ==========================================
        let cotacaoBnbBrl = 3450.00; 
        let cotacaoUsdtBrl = 5.00;
        
        try {
            const [resBnb, resUsdt] = await Promise.all([
                fetch("https://api.binance.com/api/v3/ticker/price?symbol=BNBBRL"),
                fetch("https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL")
            ]);
            
            if (resBnb.ok) {
                const dadosBnb = await resBnb.json();
                if (dadosBnb.price) cotacaoBnbBrl = parseFloat(dadosBnb.price);
            }
            if (resUsdt.ok) {
                const dadosUsdt = await resUsdt.json();
                if (dadosUsdt.price) cotacaoUsdtBrl = parseFloat(dadosUsdt.price);
            }
        } catch (erroApi) {
            console.error("[Web3 API] Falha ao buscar cotações online. Usando fallback.", erroApi);
        }

        // ==========================================
        // 4. CÁLCULO E RENDERIZAÇÃO FINANCEIRA
        // ==========================================
        const patrimonioBnbFiat = saldoBNB * cotacaoBnbBrl;
        const patrimonioUsdtFiat = saldoUSDT * cotacaoUsdtBrl;
        const patrimonioTotalCalculado = patrimonioBnbFiat + patrimonioUsdtFiat;

        const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });

        if (txtBnbFiat) txtBnbFiat.innerText = formatadorMoeda.format(patrimonioBnbFiat);
        if (txtUsdtFiat) txtUsdtFiat.innerText = formatadorMoeda.format(patrimonioUsdtFiat);
        if (txtPatrimonio) txtPatrimonio.innerText = formatadorMoeda.format(patrimonioTotalCalculado);

        console.log(`[Web3 Audit] Sincronização concluída. Total: R$ ${patrimonioTotalCalculado.toFixed(2)}`);

    } catch (erro) {
        console.error("[Web3 Erro] Falha crítica ao auditar cofre:", erro);
        if (txtPatrimonio) txtPatrimonio.innerText = "Erro de conexão";
    }
}

        // ========================================================
        // 2. REQUISIÇÃO: Histórico dos últimos itens já aprovados
        // ========================================================
        const respostaHistorico = await fetch(`${SAFE_API_URL}/safes/${ENDERECO_COFRE_DAO}/multisig-transactions/?executed=true&limit=5`);
        const dadosHistorico = await respostaHistorico.json();

        if (containerHistorico && dadosHistorico && dadosHistorico.results) {
            containerHistorico.innerHTML = ""; // Limpa texto de carregamento
            
            if (dadosHistorico.results.length === 0) {
                containerHistorico.innerHTML = `<p style="font-size: 0.8rem; color: #999; text-align: center;">Nenhuma transação anterior encontrada.</p>`;
            } else {
                dadosHistorico.results.forEach(tx => {
                    const itemHtml = `
                        <div class="safe-history-item">
                            <div>
                                <span class="badge badge-success">EXECUTADO</span>
                                <strong style="font-size: 0.8rem; margin-left: 5px;">Nonce ${tx.nonce}</strong>
                            </div>
                            <span style="font-size: 0.75rem; color: #666;">
                                ${tx.value !== "0" ? parseFloat(ethers.formatEther(tx.value)).toFixed(4) + " BNB" : "Contrato"}
                            </span>
                        </div>
                    `;
                    containerHistorico.insertAdjacentHTML('beforeend', itemHtml);
                });
            }
        }

    } catch (erro) {
        console.error("[Safe API Erro] Falha ao renderizar governança:", erro);
    }
}

/**
 * Executa a assinatura criptográfica (padrão EIP-712 ou Hash da Safe) via MetaMask 
 * e envia de volta para a API da Safe para contabilizar o voto de aprovação.
 */
async function assinarTransacaoSafePendente() {
    if (!signer || !transacaoPendenteAtual) {
        alert("Por favor, conecte sua carteira primeiro.");
        return;
    }

    try {
        const btnAssinar = document.getElementById('btn-assinar-safe-tx');
        if (btnAssinar) {
            btnAssinar.disabled = true;
            btnAssinar.innerText = "ASSINANDO...";
        }

        // 1. Captura o hash da transação gerado pela própria infraestrutura da Safe
        const hashTransacaoSafe = transacaoPendenteAtual.safeTxHash;

        // 2. Solicita assinatura pessoal (Personal Sign) via MetaMask do hash da transação
        // O Ethers v6 simplifica isso com o método .signMessage
        // Como o hash é uma string hexadecimal de dados, transformamos em Bytes para assinar o valor real
        const dadosEmBytes = ethers.getBytes(hashTransacaoSafe);
        const assinaturaCriptografica = await signer.signMessage(dadosEmBytes);

        // 3. POST: Envia a assinatura gerada para a API da Safe computar o voto/aprovação
        const urlEnvioAssinatura = `${SAFE_API_URL}/multisig-transactions/${hashTransacaoSafe}/confirmations/`;
        
        const respostaPost = await fetch(urlEnvioAssinatura, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                signature: assinaturaCriptografica
            })
        });

        if (respostaPost.ok || respostaPost.status === 201) {
            alert(`Sucesso! Aprovação do Nonce ${transacaoPendenteAtual.nonce} enviada com sucesso para a DAO.`);
            // Recarrega o painel para atualizar a contagem de assinaturas na tela
            await atualizarPainelSafeDAO();
        } else {
            const erroCorpo = await respostaPost.text();
            console.error("Erro no retorno da API da Safe:", erroCorpo);
            alert("Falha ao registrar aprovação no servidor da Safe.");
            if (btnAssinar) {
                btnAssinar.disabled = false;
                btnAssinar.innerText = "TENTAR NOVAMENTE";
            }
        }

    } catch (erro) {
        console.error("[Web3 Safe Sign] Erro na assinatura:", erro);
        alert("Assinatura rejeitada pelo usuário ou erro de comunicação.");
        const btnAssinar = document.getElementById('btn-assinar-safe-tx');
        if (btnAssinar) {
            btnAssinar.disabled = false;
            btnAssinar.innerText = "ASSINAR VIA METAMASK";
        }
    }
}

// ========================================================
// GATILHOS DE EXECUÇÃO
// ========================================================

// Certifique-se de disparar a atualização do painel após a conexão bem sucedida da carteira
// Adicione isso ao final do seu bloco `gerenciarConexaoMetaMask()` atual:
// ...
// await atualizarSaldoDoToken();
// await atualizarSaldosTesouraria();
// await atualizarPainelSafeDAO(); // <-- ADICIONE ESTA LINHA LÁ EM CIMA

// Ouvinte do clique do botão de aprovação da Safe
document.addEventListener('DOMContentLoaded', () => {
    navegarPara('tela-home');
    atualizarSaldosTesouraria(); // Vai forçar o estado zerado visualmente
});
