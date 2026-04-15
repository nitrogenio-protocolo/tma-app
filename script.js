// --- 1. TELA DE SPLASH (GARANTE ABERTURA) ---
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
    } catch (err) { alert("Erro ao conectar."); }
}

const connectBtn = document.getElementById('connect-trigger');
if (connectBtn) connectBtn.addEventListener('click', syncWallet);

// --- 4. NAVEGAÇÃO ---
const btnReceber = document.getElementById('btn-receber');
if (btnReceber) {
    btnReceber.addEventListener('click', () => {
        document.getElementById('home-app').style.display = 'none';
        document.getElementById('area-receber').style.display = 'block';
    });
}
function abrirPagar() {
    // Esconde a Home e a área de Receber (Garante que só uma apareça)
    document.getElementById('home-app').style.display = 'none';
    document.getElementById('area-receber').style.display = 'none'; 
    
    // Mostra a área de Pagar
    document.getElementById('area-pagar').style.display = 'block';
}

function fecharPagar() {
    document.getElementById('area-pagar').style.display = 'none';
    document.getElementById('home-app').style.display = 'block';
}

// Ajuste rápido na função de Receber também:
if (btnReceber) {
    btnReceber.addEventListener('click', () => {
        document.getElementById('home-app').style.display = 'none';
        document.getElementById('area-pagar').style.display = 'none'; // Esconde o Pagar se estiver aberto
        document.getElementById('area-receber').style.display = 'block';
    });
}
function fecharReceber() {
    // 1. Esconde a área de receber e volta para a home
    document.getElementById('area-receber').style.display = 'none';
    document.getElementById('home-app').style.display = 'block';

    // 2. LIMPEZA: Reseta o valor digitado e apaga o QR Code
    const brlInput = document.getElementById('brl-input');
    const bnbDisplay = document.getElementById('bnb-display');
    const qrContainer = document.getElementById('qrcode-container');

    if (brlInput) brlInput.value = ""; // Limpa o campo de R$
    if (bnbDisplay) bnbDisplay.innerText = "0.000000"; // Zera o cálculo de BNB
    if (qrContainer) qrContainer.innerHTML = ""; // APAGA O QR CODE da tela
}


// --- 5. MOTOR DE PREÇO ---
async function getBnbPrice() {
    try {
        const response = await fetch('https://api.coingecko.com/v3/simple/price?ids=binancecoin&vs_currencies=brl');
        const data = await response.json();
        return data.binancecoin.brl;
    } catch (e) { return 3000; }
}

// --- 6. QR CODE E LÓGICA DO BOTÃO ---
let qrcode = null;
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

function gerarCobranca(valorBNB) {
    const container = document.getElementById('qrcode-container');
    container.innerHTML = ""; 
    if (userAccount && valorBNB > 0) {
        const uri = `ethereum:${userAccount}@56?value=${ethers.parseEther(valorBNB.toString())}`;
        qrcode = new QRCode(container, { text: uri, width: 200, height: 200 });
    } else if (!userAccount) {
        alert("Conecte sua carteira primeiro!");
    }
}

// ... (função gerarCobranca termina aqui em cima)

// --- ESTE É O BLOCO NOVO QUE VOCÊ VAI COLAR NO FINAL ---
document.addEventListener('click', (e) => {
    const btn = e.target.closest('#btn-flutuante-nitro');
    if (!btn) return; // Se não clicou no botão, não faz nada

    const areaReceber = document.getElementById('area-receber');
    const areaPagar = document.getElementById('area-pagar');
    const bnbDisplay = document.getElementById('bnb-display');

    // Lógica para quando a tela de RECEBER está visível
    if (areaReceber && getComputedStyle(areaReceber).display === 'block') {
        const valor = bnbDisplay ? parseFloat(bnbDisplay.innerText) : 0;
        if (valor > 0) {
            gerarCobranca(valor);
        } else {
            alert("Digite um valor para receber!");
        }
    } 
    // Lógica para quando a tela de PAGAR está visível
    else if (areaPagar && getComputedStyle(areaPagar).display === 'block') {
        alert("Confirmando pagamento...");
        // Aqui entrará a função de enviar BNB futuramente
    }
    // Lógica para a HOME (se nenhuma das telas acima estiver aberta)
    else {
        abrirPagar(); // Ou abrirReceber(), conforme sua preferência de atalho
    }
});
