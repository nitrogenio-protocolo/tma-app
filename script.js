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

function abrirPagar() {
    document.getElementById('home-app').style.display = 'none';
    document.getElementById('area-receber').style.display = 'none'; 
    document.getElementById('area-pagar').style.display = 'block';
}

function fecharPagar() {
    document.getElementById('area-pagar').style.display = 'none';
    document.getElementById('home-app').style.display = 'block';
    // Limpeza Pagar
    document.getElementById('valor-pagar').value = "";
    document.getElementById('wallet-address').value = "";
    document.getElementById('btn-confirmar-pagar').classList.remove('active');
}

function abrirReceber() {
    document.getElementById('home-app').style.display = 'none';
    document.getElementById('area-pagar').style.display = 'none'; 
    document.getElementById('area-receber').style.display = 'block';
}

function fecharReceber() {
    document.getElementById('area-receber').style.display = 'none';
    document.getElementById('home-app').style.display = 'block';
    
    const brlInput = document.getElementById('brl-input');
    const bnbDisplay = document.getElementById('bnb-display');
    const qrContainer = document.getElementById('qrcode-container');
    const btnGerar = document.getElementById('btn-gerar-qr');

    if (brlInput) brlInput.value = "";
    if (bnbDisplay) bnbDisplay.innerText = "0.000000";
    if (qrContainer) qrContainer.innerHTML = "";
    if (btnGerar) btnGerar.classList.remove('active');
}

// --- 5. MOTOR DE PREÇO (API) ---
async function getBnbPrice() {
    try {
        const response = await fetch('https://api.coingecko.com/v3/simple/price?ids=binancecoin&vs_currencies=brl');
        const data = await response.json();
        return data.binancecoin.brl;
    } catch (e) { return 3000; }
}

// --- 6. LÓGICA DAS PÍLULAS (ACENDER/APAGAR) ---

// Lógica para RECEBER (Monitora R$)
const brlInput = document.getElementById('brl-input');
const btnGerar = document.getElementById('btn-gerar-qr');

if (brlInput) {
    brlInput.addEventListener('input', async (e) => {
        const valorBrl = e.target.value;
        const bnbDisplay = document.getElementById('bnb-display');
        
        if (valorBrl > 0) {
            btnGerar.classList.add('active'); // Acende Azul
            const price = await getBnbPrice();
            bnbDisplay.innerText = (valorBrl / price).toFixed(6);
        } else {
            btnGerar.classList.remove('active'); // Apaga Cinza
            bnbDisplay.innerText = "0.000000";
        }
    });
}

// Lógica para PAGAR (Monitora Valor N e Endereço)
const valorPagarInput = document.getElementById('valor-pagar');
const addressInput = document.getElementById('wallet-address');
const btnPagar = document.getElementById('btn-confirmar-pagar');

function validarPagar() {
    if (valorPagarInput.value > 0 && addressInput.value.length > 10) {
        btnPagar.classList.add('active');
    } else {
        btnPagar.classList.remove('active');
    }
}

if (valorPagarInput) valorPagarInput.addEventListener('input', validarPagar);
if (addressInput) addressInput.addEventListener('input', validarPagar);

// --- 7. FUNÇÕES DE EXECUÇÃO ---

function gerarCobranca() {
    if (!btnGerar.classList.contains('active')) return; // Só funciona se estiver azul

    const bnbDisplay = document.getElementById('bnb-display');
    const valorBNB = bnbDisplay ? bnbDisplay.innerText : "0";
    const container = document.getElementById('qrcode-container');
    
    if (!userAccount) return alert("Conecte sua carteira primeiro!");

    container.innerHTML = ""; 
    const uri = `ethereum:${userAccount}@56?value=${ethers.parseEther(valorBNB)}`;
    qrcode = new QRCode(container, { text: uri, width: 200, height: 200 });
}

function abrirScanner() {
    alert("Câmera será ativada para ler QR Code.");
}
