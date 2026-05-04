/**
 * NITROGÊNIO PROTOCOLO - Motor de Gestão Web3 e Interface Circular
 * Foco: Autonomia do entregador e Governança Descentralizada
 */

// CONFIGURAÇÕES TÉCNICAS
const ENDERECO_COFRE_SAFE = "0x11aBd1b9c71f97ad1df8A0Dbb789f8A96B458219"; 
const TOTAL_SUPPLY_N = "1.000.000.000,00"; // 1 Bilhão de Token N fixos
let provider, signer, userAccount;
let modoPrivacidade = false;

// 1. GERENCIAMENTO DE INTERFACE (SISTEMA DE SALAS)
function abrirSala(id) {
    const sala = document.getElementById(id);
    if (sala) {
        sala.classList.add('ativa');
        document.body.style.overflow = 'hidden'; 
        console.log(`Nitrogênio: Acessando sala ${id.replace('sala-', '').toUpperCase()}`);
        
        // Carregamento dinâmico de dados conforme a sala
        if(id === 'sala-cofre') carregarDadosCofre();
        if(id === 'sala-governo') carregarStatusGuardioes();
    }
}

function fecharSala(id) {
    const sala = document.getElementById(id);
    if (sala) {
        sala.classList.remove('ativa');
        document.body.style.overflow = 'auto'; 
    }
}

function giroHome() {
    const salas = document.querySelectorAll('.sala-card');
    salas.forEach(s => s.classList.remove('ativa'));
    document.body.style.overflow = 'auto';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 2. LÓGICA DE PRIVACIDADE (OLHO PRETO)
function alternarPrivacidade() {
    modoPrivacidade = !modoPrivacidade;
    const btnIcon = document.querySelector('.btn-eye-black i');
    const displayN = document.querySelector('.currency');
    const displayBNB = document.querySelector('.conversion p');

    if (modoPrivacidade) {
        btnIcon.classList.replace('fa-eye', 'fa-eye-slash');
        displayN.innerText = "••••";
        displayBNB.innerText = "≈ BNB ••••";
    } else {
        btnIcon.classList.replace('fa-eye-slash', 'fa-eye');
        displayN.innerText = "1.000,00"; // Saldo estático Nitrogenio
        updateUI(); // Atualiza o BNB real
    }
}

// 3. MOTOR WEB3 (CONEXÃO E SALDOS REAIS)
async function conectarCarteira() {
    if (!window.ethereum) return alert("Instale a MetaMask para operar o protocolo.");
    
    try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send("eth_requestAccounts", []);
        userAccount = accounts[0];
        provider = browserProvider;
        signer = await browserProvider.getSigner();
        
        updateUI();
    } catch (err) {
        console.error("Erro na ignição do motor:", err);
    }
}

function updateUI() {
    const btnWallet = document.querySelector('.btn-wallet');
    const displayBNB = document.querySelector('.conversion p');

    if (userAccount && btnWallet) {
        btnWallet.innerText = userAccount.substring(0, 6) + "..." + userAccount.substring(38);
        
        provider.getBalance(userAccount).then(bal => {
            const bnbFormatado = parseFloat(ethers.formatEther(bal)).toFixed(4);
            if (displayBNB && !modoPrivacidade) {
                displayBNB.innerHTML = `<span style="color: #007AFF; font-weight: 800;">${bnbFormatado} BNB</span>`;
            }
        });
    }
}

// 4. FUNÇÕES ESPECÍFICAS DAS SALAS
async function carregarDadosCofre() {
    if (!provider) return;
    const saldoCofre = await provider.getBalance(ENDERECO_COFRE_SAFE);
    console.log("Monitorando Cofre dos Guardiões...");
    // Aqui injetaremos a lista de ativos bloqueados na sala-cofre
}

function carregarStatusGuardioes() {
    // Foco: 11 de 21 assinaturas necessárias
    console.log("Protocolo de Governança: Quórum exigido 11/21");
}

// 5. INICIALIZAÇÃO DO SISTEMA
document.addEventListener('DOMContentLoaded', () => {
    // Eventos de botões fixos
    document.querySelector('.btn-wallet')?.addEventListener('click', conectarCarteira);
    document.querySelector('.btn-eye-black')?.addEventListener('click', alternarPrivacidade);

    // Auto-reconexão
    if (window.ethereum && window.ethereum.selectedAddress) {
        conectarCarteira();
    }
});
