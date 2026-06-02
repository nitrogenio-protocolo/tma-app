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
ligarAcao('card-pagar-leitor', 'sub-pagar-leitor');
ligarAcao('card-receber-gerar', 'sub-receber-gerar-qr');
ligarAcao('card-coletar-executar', 'sub-coletar-executar');
ligarAcao('card-trocar-pancake', 'sub-trocar-pancakeswap');

ligarAcao('card-recompensa-poupanca', 'folha-poupanca');
ligarAcao('card-recompensa-quiz', 'folha-quiz');
ligarAcao('card-recompensa-checkin', 'folha-checkin');
ligarAcao('card-recompensa-roleta', 'folha-roleta');

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
    'tela-trocar': 'tela-home'
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
