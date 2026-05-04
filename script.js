/**
 * NITROGÊNIO PROTOCOLO - v3.5 Stable
 * Motor: Web3, Governança & Sistema de Salas (Bottom Sheets)
 */

// --- 1. CONFIGURAÇÕES E ESTADO GLOBAL ---
const ENDERECO_COFRE_SAFE = "0x11aBd1b9c71f97ad1df8A0Dbb789f8A96B458219"; 
let provider, signer, userAccount;
let privacidadeAtiva = false;

// --- 2. SISTEMA DE SALAS (CARDS QUE SOBEM) ---
function abrirSala(id) {
    const sala = document.getElementById(id);
    if (sala) {
        sala.classList.add('ativa');
        document.body.style.overflow = 'hidden'; // Trava a home ao fundo
        
        // Gatilhos específicos ao abrir cada sala
        if (id === 'sala-governo' || id === 'sala-mural') carregarPautasReaisDoCofre();
        if (id === 'sala-comunidade') carregarVotacaoComunidade();
        if (id === 'sala-cofre') atualizarSaldoRealCofre();
    }
}

function fecharSala(id) {
    const sala = document.getElementById(id);
    if (sala) {
        sala.classList.remove('ativa');
        document.body.style.overflow = 'auto'; // Libera o scroll da home
    }
}

// O "Giro Home" - Reseta tudo e volta ao topo
function giroHome() {
    const salas = document.querySelectorAll('.sala-card');
    salas.forEach(s => s.classList.remove('ativa'));
    document.body.style.overflow = 'auto';
    
    const mainContent = document.querySelector('.main-content');
    if(mainContent) {
        mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
    console.log("Nitrogênio: Giro Home Executado");
}

// --- 3. PRIVACIDADE (OLHO PRETO) ---
function togglePrivacy() {
    privacidadeAtiva = !privacidadeAtiva;
    const btnIcon = document.querySelector('.btn-eye-black i');
    const valorSaldo = document.querySelector('.currency');
    const valorFiat = document.querySelector('.conversion p');
    
    if (privacidadeAtiva) {
        btnIcon.classList.replace('fa-eye', 'fa-eye-slash');
        valorSaldo.dataset.original = valorSaldo.innerText;
        valorFiat.dataset.original = valorFiat.innerText;
        valorSaldo.innerText = '••••'; 
        valorFiat.innerText = '≈ R$ ••••';
    } else {
        btnIcon.classList.replace('fa-eye-slash', 'fa-eye');
        valorSaldo.innerText = valorSaldo.dataset.original || '1.000,00';
        valorFiat.innerText = valorFiat.dataset.original || '≈ R$ 5.420,00';
    }
}

// --- 4. WEB3: CONEXÃO E CARTEIRA ---
async function syncWallet() {
    if (!window.ethereum) return alert("Por favor, use o navegador da MetaMask.");
    try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send("eth_requestAccounts", []);
        userAccount = accounts[0];
        provider = browserProvider;
        signer = await browserProvider.getSigner();
        
        updateUI();
        atualizarSaldoRealCofre();
    } catch (err) { 
        console.error("Erro na conexão:", err); 
    }
}

function updateUI() {
    const btnConectar = document.querySelector('.btn-wallet');
    const displaySaldo = document.querySelector('.currency');

    if (userAccount && btnConectar) {
        btnConectar.innerText = `${userAccount.substring(0, 4)}...${userAccount.substring(38)}`;
        provider.getBalance(userAccount).then(bal => {
            const formatBal = parseFloat(ethers.formatEther(bal)).toFixed(2);
            if (displaySaldo) displaySaldo.innerText = formatBal;
        });
    }
}

async function atualizarSaldoRealCofre() {
    if (!provider) return;
    try {
        const saldoCofre = await provider.getBalance(ENDERECO_COFRE_SAFE);
        const formatado = parseFloat(ethers.formatEther(saldoCofre)).toFixed(4);
        console.log("Saldo no Cofre dos Guardiões:", formatado, "BNB");
    } catch (err) { console.error("Erro ao ler Safe:", err); }
}

// --- 5. INICIALIZAÇÃO E ESCUTA DE EVENTOS ---
document.addEventListener('DOMContentLoaded', () => {
    // Evento do Olho de Privacidade
    document.querySelector('.btn-eye-black')?.addEventListener('click', togglePrivacy);
    
    // Evento de Conectar Carteira
    document.querySelector('.btn-wallet')?.addEventListener('click', syncWallet);

    // Motor de Governança (Relógios e Pautas)
    if (typeof motorGovernançaNitrogenio === "function") {
        motorGovernançaNitrogenio();
    }

    // Reconexão Automática
    if (window.ethereum && window.ethereum.selectedAddress) {
        syncWallet();
    }
});

// Exemplo de carregamento de pautas para a Sala Governo
async function carregarPautasReaisDoCofre() {
    console.log("Conectando ao oráculo da Safe...");
    // A lógica de fetch que você já tem será inserida aqui conforme as salas forem povoadas
}
