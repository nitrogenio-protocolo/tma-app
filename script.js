/**
 * NITROGÊNIO PROTOCOLO - Motor de Gestão Web3 e Interface Circular
 * Foco: Autonomia do entregador e Governança Descentralizada
 */

// CONFIGURAÇÕES TÉCNICAS
const ENDERECO_COFRE_SAFE = "0x11aBd1b9c71f97ad1df8A0Dbb789f8A96B458219"; 
let provider, signer, userAccount;
let modoPrivacidade = false;
let saldoRealBNB = "0,00"; // Armazena o saldo para alternar privacidade

// 1. GERENCIAMENTO DE INTERFACE (SISTEMA DE SALAS)
function abrirSala(id) {
    const sala = document.getElementById(id);
    if (sala) {
        sala.classList.add('ativa');
        document.body.style.overflow = 'hidden'; 
        console.log(`Nitrogênio: Acessando sala ${id.replace('sala-', '').toUpperCase()}`);
        
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
    const displaySub = document.querySelector('.conversion p');

    if (modoPrivacidade) {
        btnIcon.classList.replace('fa-eye', 'fa-eye-slash');
        displayN.innerText = "••••";
        displaySub.innerText = "Saldo oculto";
    } else {
        btnIcon.classList.replace('fa-eye-slash', 'fa-eye');
        updateUI(); // Restaura os valores reais
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

async function updateUI() {
    const btnWallet = document.querySelector('.btn-wallet');
    const displayN = document.querySelector('.currency');
    const displaySub = document.querySelector('.conversion p');

    if (userAccount && btnWallet) {
        // Atualiza o botão com endereço reduzido
        btnWallet.innerText = userAccount.substring(0, 6) + "..." + userAccount.substring(userAccount.length - 4);
        
        // Busca o saldo real de BNB
        const bal = await provider.getBalance(userAccount);
        saldoRealBNB = parseFloat(ethers.formatEther(bal)).toFixed(4);

        if (!modoPrivacidade) {
            // AQUI ESTÁ A MÁGICA: O saldo de BNB assume o lugar do Token N (sem ruído)
            displayN.innerText = saldoRealBNB; 
            displaySub.innerHTML = `Saldo real em rede (BNB Chain)`;
        }
    }
}

// 4. FUNÇÕES ESPECÍFICAS DAS SALAS
async function carregarDadosCofre() {
    if (!provider) return;
    try {
        const saldoCofre = await provider.getBalance(ENDERECO_COFRE_SAFE);
        const formatado = parseFloat(ethers.formatEther(saldoCofre)).toFixed(4);
        console.log(`Monitorando Cofre: ${formatado} BNB em reserva.`);
    } catch (e) {
        console.log("Erro ao acessar dados do cofre.");
    }
}

function carregarStatusGuardioes() {
    console.log("Protocolo de Governança: Quórum exigido 11/21");
}

// 5. INICIALIZAÇÃO DO SISTEMA
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.btn-wallet')?.addEventListener('click', conectarCarteira);
    document.querySelector('.btn-eye-black')?.addEventListener('click', alternarPrivacidade);

    // Auto-reconexão se já estiver logado
    if (window.ethereum && window.ethereum.selectedAddress) {
        conectarCarteira();
    }
});
