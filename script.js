/**
 * NITROGÊNIO PROTOCOLO - Motor de Gestão Web3 e Interface Circular
 */

// CONFIGURAÇÕES TÉCNICAS E GLOBAIS
const ENDERECO_COFRE_SAFE = "0x11aBd1b9c71f97ad1df8A0Dbb789f8A96B458219"; 
const MINHA_CARTEIRA = "0x71caB1b9c71f97ad1024340a631A33434690d87a"; // Coloque seu endereço completo aqui
let precoBNB = 3300; // Começa com fixo, mas atualiza via API
let provider, signer, userAccount;
let modoPrivacidade = false;

// --- FUNÇÃO PARA BUSCAR PREÇO REAL (BINANCE) ---
async function atualizarPrecoBNB() {
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBBRL');
        const data = await response.json();
        precoBNB = parseFloat(data.price);
        console.log("Preço BNB Dinâmico: R$", precoBNB);
    } catch (error) {
        console.error("Erro na API, usando preço base.");
    }
}
atualizarPrecoBNB();

// 1. GERENCIAMENTO DE INTERFACE (SISTEMA DE SALAS)
function abrirSala(id) {
    const sala = document.getElementById(id);
    if (sala) {
        sala.classList.add('ativa'); // Certifique-se que no CSS é .ativa ou .active
        document.body.style.overflow = 'hidden'; 
        if(id === 'sala-receber') prepararSalaReceber();
    }
}

function fecharSala(id) {
    const sala = document.getElementById(id);
    if (sala) {
        sala.classList.remove('ativa');
        document.body.style.overflow = 'auto';

        if (id === 'sala-receber') {
            document.getElementById('valor-brl').value = '';
            document.getElementById('conversao-preview').innerText = '≈ 0.0000 BNB';
            document.getElementById('btn-confirmar-receber').disabled = true;
            document.getElementById('btn-confirmar-receber').style.background = '#ddd';
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

// 2. MOTOR WEB3 (CONEXÃO)
async function conectarCarteira() {
    if (!window.ethereum) return alert("Instale a MetaMask.");
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
        displayN.innerText = parseFloat(ethers.formatEther(bal)).toFixed(4);
    }
}

// 3. TERMINAL DE RECEBIMENTO (LÓGICA UNIFICADA)
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

        // Esconde o teclado
        inputBRL.blur();
        window.focus();

        // Gera QR Code Padrão EIP-681 (Rede BNB @56)
        const qrData = `ethereum:${MINHA_CARTEIRA}@56?value=${calculoBNB}`;
        imgQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData)}`;
        
        imgQr.style.display = 'block';
        imgQr.style.opacity = '1';
        placeholder.style.display = 'none';
    };
}

// 4. INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.btn-wallet')?.addEventListener('click', conectarCarteira);
    if (window.ethereum && window.ethereum.selectedAddress) conectarCarteira();
});

let html5QrCode;

function iniciarScanner() {
    const btnCamera = document.getElementById('btn-abrir-camera');
    const readerDiv = document.getElementById('reader');
    
    btnCamera.style.display = 'none';
    readerDiv.style.display = 'block';

    html5QrCode = new Html5Qrcode("reader");
    
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start(
        { facingMode: "environment" }, // Usa a câmera traseira
        config,
        (decodedText) => {
            // Sucesso ao ler!
            document.getElementById('chave-pagamento').value = decodedText;
            pararScanner();
            alert("QR Code lido com sucesso!");
        },
        (errorMessage) => { /* erro de leitura comum, ignore */ }
    ).catch((err) => {
        alert("Erro ao abrir câmera: " + err);
        pararScanner();
    });
}

function pararScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('btn-abrir-camera').style.display = 'block';
            document.getElementById('reader').style.display = 'none';
        });
    }
}
