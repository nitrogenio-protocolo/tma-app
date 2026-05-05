/**
 * NITROGÊNIO PROTOCOLO - Motor de Gestão Web3 e Interface Circular
 */

// CONFIGURAÇÕES TÉCNICAS E GLOBAIS
const ENDERECO_COFRE_SAFE = "0x11aBd1b9c71f97ad1df8A0Dbb789f8A96B458219"; 
const MINHA_CARTEIRA = "0x71caB1b9c71f97ad1024340a631A33434690d87a"; 
let precoBNB = 3300; 
let provider, signer, userAccount;
let html5QrCode;

// --- FUNÇÃO PARA BUSCAR PREÇO REAL ---
async function atualizarPrecoBNB() {
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBBRL');
        const data = await response.json();
        precoBNB = parseFloat(data.price);
    } catch (error) {
        console.error("Erro na API, usando preço base.");
    }
}
atualizarPrecoBNB();

// 1. GERENCIAMENTO DE INTERFACE (SISTEMA DE SALAS)
function abrirSala(id) {
    // Fecha outras salas abertas para não encavalar
    const salasAbertas = document.querySelectorAll('.sala-card.ativa');
    salasAbertas.forEach(s => s.classList.remove('ativa'));

    const sala = document.getElementById(id);
    if (sala) {
        sala.classList.add('ativa');
        document.body.style.overflow = 'hidden'; 
        if(id === 'sala-receber') prepararSalaReceber();
    }
}

function fecharSala(id) {
    const sala = document.getElementById(id);
    if (sala) {
        sala.classList.remove('ativa');
        document.body.style.overflow = 'auto';

        if (id === 'sala-pagar') pararScanner();

        if (id === 'sala-receber') {
            document.getElementById('valor-brl').value = '';
            document.getElementById('conversao-preview').innerText = '≈ 0.0000 BNB';
            document.getElementById('btn-confirmar-receber').disabled = true;
            document.getElementById('img-qrcode').style.display = 'none';
            document.getElementById('placeholder-qr').style.display = 'flex';
        }
    }
}

function giroHome() {
    const salas = document.querySelectorAll('.sala-card');
    salas.forEach(s => s.classList.remove('ativa'));
    document.body.style.overflow = 'auto';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 2. MOTOR WEB3 (CONEXÃO E PAGAMENTO)
async function conectarCarteira() {
    if (!window.ethereum) return alert("Por favor, abra pelo navegador da sua Carteira (MetaMask/Trust).");
    try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send("eth_requestAccounts", []);
        userAccount = accounts[0];
        provider = browserProvider;
        signer = await browserProvider.getSigner();
        updateUI();
    } catch (err) { console.error("Erro na conexão:", err); }
}

async function updateUI() {
    const btnWallet = document.querySelector('.btn-wallet');
    const displayN = document.querySelector('.currency');
    if (userAccount && btnWallet) {
        btnWallet.innerText = userAccount.substring(0, 6) + "..." + userAccount.substring(userAccount.length - 4);
        const bal = await provider.getBalance(userAccount);
        if(displayN) displayN.innerText = parseFloat(ethers.formatEther(bal)).toFixed(4);
    }
}

// Lógica de Envio de Pagamento
async function processarPagamento() {
    const destino = document.getElementById('chave-pagamento').value;
    if (!destino || !destino.startsWith('0x')) return alert("Insira um endereço de carteira válido.");
    
    alert("Iniciando transação para: " + destino);
    // Aqui entra a lógica de transação ethers.js que faremos a seguir
}

// 3. TERMINAL DE RECEBIMENTO
function prepararSalaReceber() {
    const inputBRL = document.getElementById('valor-brl');
    const preview = document.getElementById('conversao-preview');
    const btnConfirmar = document.getElementById('btn-confirmar-receber');

    inputBRL.oninput = () => {
        const valor = parseFloat(inputBRL.value);
        if (valor > 0) {
            const calculoBNB = (valor / precoBNB).toFixed(6);
            preview.innerText = `≈ ${calculoBNB} BNB`;
            btnConfirmar.disabled = false;
            btnConfirmar.style.background = 'var(--azul-blueberry)';
        } else {
            preview.innerText = `≈ 0.0000 BNB`;
            btnConfirmar.disabled = true;
            btnConfirmar.style.background = '#ddd';
        }
    };

    btnConfirmar.onclick = () => {
        const valor = inputBRL.value;
        const calculoBNB = (valor / precoBNB).toFixed(6);
        const imgQr = document.getElementById('img-qrcode');
        const placeholder = document.getElementById('placeholder-qr');

        inputBRL.blur();
        const qrData = `ethereum:${MINHA_CARTEIRA}@56?value=${calculoBNB}`;
        imgQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData)}`;
        imgQr.style.display = 'block';
        imgQr.style.opacity = '1';
        placeholder.style.display = 'none';
    };
}

// 4. MOTOR DO SCANNER (SALA PAGAR)
function iniciarScanner() {
    // Pegamos o botão pela CLASSE agora, já que você usou class="btn-camera"
    const btnCamera = document.querySelector('.btn-camera');
    const readerDiv = document.getElementById('reader');
    
    if(btnCamera) btnCamera.style.display = 'none';
    if(readerDiv) readerDiv.style.display = 'block';

    html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 15, qrbox: { width: 250, height: 250 } };

    html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
            // Limpa endereços que venham com prefixos de carteira
            const enderecoLimpo = decodedText.includes(':') ? decodedText.split(':')[1].split('@')[0] : decodedText;
            document.getElementById('chave-pagamento').value = enderecoLimpo;
            pararScanner();
        },
        (errorMessage) => { }
    ).catch((err) => {
        alert("Erro na câmera: " + err);
        pararScanner();
    });
}

function pararScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            const btnCamera = document.querySelector('.btn-camera');
            const readerDiv = document.getElementById('reader');
            if(btnCamera) btnCamera.style.display = 'block';
            if(readerDiv) readerDiv.style.display = 'none';
        });
    }
}

// 5. INICIALIZAÇÃO DE GATILHOS
document.addEventListener('DOMContentLoaded', () => {
    // Botão Conectar
    document.querySelector('.btn-wallet')?.addEventListener('click', conectarCarteira);
    
    // Botão Continuar Pagamento
    document.getElementById('btn-confirmar-pagar')?.addEventListener('click', processarPagamento);

    if (window.ethereum && window.ethereum.selectedAddress) conectarCarteira();
});
