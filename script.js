/**
 * NITROGÊNIO PROTOCOLO - Lógica Operacional Profissional
 */

// --- 1. CONFIGURAÇÕES E VARIÁVEIS GLOBAIS ---
let userAccount = null;
let provider, signer;
let scannerAtivo = null;

// --- 2. TELA DE SPLASH ---
window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        setTimeout(() => {
            splash.classList.add('fade-out');
            setTimeout(() => splash.remove(), 800);
        }, 4000);
    }
});

// --- 3. CONEXÃO WEB3 ---
async function syncWallet() {
    if (!window.ethereum) return alert("Abra o app dentro da MetaMask ou Trust Wallet.");
    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAccount = accounts[0];
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        const balance = await provider.getBalance(userAccount);
        
        document.querySelector('.balance-amount').innerText = parseFloat(ethers.formatEther(balance)).toFixed(4) + " BNB";
        document.getElementById('connect-trigger').innerText = `${userAccount.substring(0, 6)}...${userAccount.substring(38)}`;
    } catch (err) { 
        console.error(err);
        alert("Falha na conexão."); 
    }
}

document.getElementById('connect-trigger')?.addEventListener('click', syncWallet);

// --- 4. MOTOR DE NAVEGAÇÃO ---
function abrirPagar() {
    document.getElementById('home-app').style.display = 'none';
    document.getElementById('area-pagar').style.display = 'block';
}

function fecharPagar() {
    if (scannerAtivo) pararScanner();
    document.getElementById('area-pagar').style.display = 'none';
    document.getElementById('home-app').style.display = 'block';
    
    // Reset campos
    document.getElementById('valor-pagar').value = "";
    document.getElementById('wallet-address').value = "";
    validarPagar();
}

function abrirReceber() {
    document.getElementById('home-app').style.display = 'none';
    document.getElementById('area-receber').style.display = 'block';
}

function fecharReceber() {
    document.getElementById('area-receber').style.display = 'none';
    document.getElementById('home-app').style.display = 'block';
    document.getElementById('brl-input').value = "";
    document.getElementById('qrcode-container').innerHTML = "";
    document.getElementById('bnb-display').innerText = "0.000000";
}

// --- 5. LÓGICA DE PREÇOS E VALIDAÇÃO ---
async function getBnbPrice() {
    try {
        const res = await fetch('https://api.coingecko.com/v3/simple/price?ids=binancecoin&vs_currencies=brl');
        const data = await res.json();
        return data.binancecoin.brl;
    } catch (e) { return 3500; }
}

const brlInput = document.getElementById('brl-input');
const btnGerar = document.getElementById('btn-gerar-qr');

brlInput?.addEventListener('input', async (e) => {
    const bnbDisplay = document.getElementById('bnb-display');
    if (e.target.value > 0) {
        btnGerar.classList.add('active');
        const price = await getBnbPrice();
        bnbDisplay.innerText = (e.target.value / price).toFixed(6);
    } else {
        btnGerar.classList.remove('active');
        bnbDisplay.innerText = "0.000000";
    }
});

const valorPagarInput = document.getElementById('valor-pagar');
const addressInput = document.getElementById('wallet-address');
const btnConfirmarPagar = document.getElementById('btn-confirmar-pagar');

function validarPagar() {
    const valor = document.getElementById('valor-pagar').value;
    const endereco = document.getElementById('wallet-address').value;
    const btnPagar = document.getElementById('btn-confirmar-pagar');

    // Verifica se tem valor e se o endereço começa com 0x e tem 42 caracteres
    if (valor > 0 && endereco.startsWith('0x') && endereco.length === 42) {
        btnPagar.classList.add('active'); // Deixa o botão azul/clicável
        btnPagar.disabled = false;
    } else {
        btnPagar.classList.remove('active');
        btnPagar.disabled = true;
    }
}

    if (valorValido && enderecoValido) {
        btnConfirmarPagar.classList.add('active');
    } else {
        btnConfirmarPagar.classList.remove('active');
    }
}

valorPagarInput?.addEventListener('input', validarPagar);
addressInput?.addEventListener('input', validarPagar);
addressInput?.addEventListener('paste', () => setTimeout(validarPagar, 100));

// --- 6. LEITOR DE QR CODE (SCANNER) ---
function toggleScanner() {
    const readerDiv = document.getElementById('reader');
    
    if (scannerAtivo) {
        pararScanner();
    } else {
        readerDiv.style.display = 'block';
        scannerAtivo = new Html5Qrcode("reader");
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        scannerAtivo.start(
            { facingMode: "environment" },
            config,
            (text) => {
                // Limpa o endereço caso venha no formato ethereum:0x...
                const cleanAddress = text.includes(':') ? text.split(':')[1].split('@')[0] : text;
                addressInput.value = cleanAddress;
                pararScanner();
                validarPagar();
            },
            (err) => {} // Erros silenciosos de leitura
        ).catch(err => {
            alert("Erro na câmera. Verifique as permissões de HTTPS.");
            readerDiv.style.display = 'none';
        });
    }
}

function pararScanner() {
    if (scannerAtivo) {
        scannerAtivo.stop().then(() => {
            document.getElementById('reader').style.display = 'none';
            scannerAtivo = null;
        });
    }
}

// --- 7. EMISSÃO DE QR CODE (RECEBER) ---
function gerarCobranca() {
    const bnbValor = document.getElementById('bnb-display').innerText;
    const container = document.getElementById('qrcode-container');
    
    if (!userAccount) return alert("Conecte a carteira primeiro.");
    
    container.innerHTML = "";
    // Formato EIP-681 para carteiras cripto
    const uri = `ethereum:${userAccount}@56?value=${ethers.parseUnits(bnbValor, 18)}`;
    new QRCode(container, { text: uri, width: 220, height: 220 });
}
