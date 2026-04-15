// --- 1. TELA DE SPLASH ---
window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        setTimeout(() => {
            splash.classList.add('fade-out');
            setTimeout(() => { splash.remove(); }, 800);
        }, 3000);
    }
});

// --- 2. VARIÁVEIS GLOBAIS ---
let userAccount = null;
let provider, signer;
let qrcode = null;

// --- 3. CONEXÃO COM A CARTEIRA ---
async function syncWallet() {
    if (!window.ethereum) return alert("Por favor, abra o app dentro da MetaMask.");
    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAccount = accounts[0];
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        const balance = await provider.getBalance(userAccount);
        
        // Atualiza interface
        document.querySelector('.balance-amount').innerText = parseFloat(ethers.formatEther(balance)).toFixed(6) + " BNB";
        document.getElementById('connect-trigger').innerText = userAccount.substring(0, 6) + "..." + userAccount.substring(38);
    } catch (err) { 
        console.error(err);
        alert("Erro ao conectar."); 
    }
}

const connectBtn = document.getElementById('connect-trigger');
if (connectBtn) connectBtn.addEventListener('click', syncWallet);

// --- 4. NAVEGAÇÃO DO APP ---

// Funções para PAGAR
function abrirPagar() {
    document.getElementById('home-app').style.display = 'none';
    document.getElementById('area-receber').style.display = 'none'; 
    document.getElementById('area-pagar').style.display = 'block';
}

function fecharPagar() {
    document.getElementById('area-pagar').style.display = 'none';
    document.getElementById('home-app').style.display = 'block';
}

// Funções para RECEBER
function abrirReceber() {
    document.getElementById('home-app').style.display = 'none';
    document.getElementById('area-pagar').style.display = 'none'; 
    document.getElementById('area-receber').style.display = 'block';
}

function fecharReceber() {
    document.getElementById('area-receber').style.display = 'none';
    document.getElementById('home-app').style.display = 'block';
    
    // Limpeza técnica
    const brlInput = document.getElementById('brl-input');
    const bnbDisplay = document.getElementById('bnb-display');
    const qrContainer = document.getElementById('qrcode-container');
    if (brlInput) brlInput.value = "";
    if (bnbDisplay) bnbDisplay.innerText = "0.000000";
    if (qrContainer) qrContainer.innerHTML = "";
}

// --- 5. MOTOR DE PREÇO (API) ---
async function getBnbPrice() {
    try {
        const response = await fetch('https://api.coingecko.com/v3/simple/price?ids=binancecoin&vs_currencies=brl');
        const data = await response.json();
        return data.binancecoin.brl;
    } catch (e) { 
        return 3000; // Valor de segurança caso a API falhe
    }
}

// --- 6. CÁLCULO E QR CODE ---

// Listener para conversão automática de R$ para BNB
const brlInput = document.getElementById('brl-input');
if (brlInput) {
    brlInput.addEventListener('input', async (e) => {
        const valorBrl = e.target.value;
        const bnbDisplay = document.getElementById('bnb-display');
        if (valorBrl > 0) {
            const price = await getBnbPrice();
            bnbDisplay.innerText = (valorBrl / price).toFixed(6);
        } else {
            bnbDisplay.innerText = "0.000000";
        }
    });
}

// Função para gerar o QR Code (Acionada por um botão futuro ou ação)
function gerarCobranca() {
    const bnbDisplay = document.getElementById('bnb-display');
    const valorBNB = bnbDisplay ? bnbDisplay.innerText : "0";
    const container = document.getElementById('qrcode-container');
    
    if (!userAccount) return alert("Conecte sua carteira primeiro!");
    if (parseFloat(valorBNB) <= 0) return alert("Digite um valor válido!");

    container.innerHTML = ""; 
    const uri = `ethereum:${userAccount}@56?value=${ethers.parseEther(valorBNB)}`;
    qrcode = new QRCode(container, { text: uri, width: 200, height: 200 });
}

// Placeholder para o Scanner (Área Pagar)
function abrirScanner() {
    alert("Câmera será ativada para ler QR Code.");
}
