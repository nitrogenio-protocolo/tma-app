/**
 * NITROGÊNIO PROTOCOLO - Motor de Gestão Web3
 */

// CONFIGURAÇÕES TÉCNICAS
const ENDERECO_COFRE_SAFE = "0x11aBd1b9c71f97ad1df8A0Dbb789f8A96B458219"; 
let precoBNB = 3300; 
let provider, signer, userAccount;
let html5QrCode = null; // Inicializado como null

// --- 1. MOTOR DE PREÇO ---
async function atualizarPrecoBNB() {
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBBRL');
        const data = await response.json();
        if(data.price) precoBNB = parseFloat(data.price);
    } catch (error) {
        console.error("Erro ao buscar cotação real.");
    }
}
atualizarPrecoBNB();

// --- 2. CONEXÃO WEB3 ---
async function conectarCarteira() {
    if (!window.ethereum) return alert("Por favor, abra pelo navegador da sua Carteira.");
    try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send("eth_requestAccounts", []);
        userAccount = accounts[0];
        provider = browserProvider;
        signer = await browserProvider.getSigner();
        
        await updateUI();
    } catch (err) { 
        console.error("Erro na conexão:", err); 
    }
}

async function updateUI() {
    const btnWallet = document.querySelector('.btn-wallet');
    const displayBalance = document.getElementById('display-balance');
    const displaySymbol = document.getElementById('display-symbol');
    const displayBRL = document.getElementById('balance-brl');

    if (userAccount && provider) {
        btnWallet.innerText = userAccount.substring(0, 6) + "..." + userAccount.substring(userAccount.length - 4);
        
        const balanceWei = await provider.getBalance(userAccount);
        const balanceBNB = parseFloat(ethers.formatEther(balanceWei));
        
        if(displayBalance) displayBalance.innerText = balanceBNB.toFixed(4);
        if(displaySymbol) displaySymbol.innerText = "BNB";
        
        if(displayBRL) {
            const valorEmReais = (balanceBNB * precoBNB).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            displayBRL.innerText = `≈ ${valorEmReais}`;
        }
    }
}

// --- 3. GESTÃO DE INTERFACE ---
function abrirSala(id) {
    if (!userAccount && (id === 'sala-pagar' || id === 'sala-receber')) {
        alert("Conecte sua carteira para acessar esta função.");
        conectarCarteira();
        return;
    }

    const sala = document.getElementById(id);
    if (sala) {
        sala.classList.add('ativa');
        document.body.style.overflow = 'hidden'; 
        if(id === 'sala-receber') prepararSalaReceber();
    }
}

function fecharSala(id) {
    const sala = document.getElementById(id);
    if (!sala) return;

    sala.classList.remove('ativa');
    document.body.style.overflow = 'auto';

    // Limpeza de campos
    const inputs = sala.querySelectorAll('input');
    inputs.forEach(input => input.value = '');

    if (id === 'sala-pagar') {
        pararScanner();
    }

    if (id === 'sala-receber') {
        const preview = document.getElementById('conversao-preview');
        const imgQr = document.getElementById('img-qrcode');
        const placeholder = document.getElementById('placeholder-qr');
        if(preview) preview.innerText = '≈ 0.0000 BNB';
        if(imgQr) { imgQr.style.display = 'none'; imgQr.src = ''; }
        if(placeholder) placeholder.style.display = 'flex';
        document.getElementById('btn-confirmar-receber').disabled = true;
    }
}

// --- 4. SCANNER E PAGAMENTO ---
function iniciarScanner() {
    const readerDiv = document.getElementById('reader');
    const btnCamera = document.querySelector('.btn-camera');
    
    readerDiv.style.display = 'block';
    btnCamera.style.display = 'none';

    html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
            let endereco = decodedText;
            if (decodedText.includes('?value=')) {
                const partes = decodedText.split('?value=');
                endereco = partes[0].replace('ethereum:', '');
                const valorBNB = partes[1];
                document.getElementById('valor-pagar-brl').value = (parseFloat(valorBNB) * precoBNB).toFixed(2);
            }
            document.getElementById('chave-pagamento').value = endereco.replace('ethereum:', '');
            pararScanner();
        }
    ).catch(err => console.error("Erro na câmera", err));
}

function pararScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            document.getElementById('reader').style.display = 'none';
            document.querySelector('.btn-camera').style.display = 'block';
        }).catch(err => console.log(err));
    }
}

// --- 5. RECEBIMENTO ---
function prepararSalaReceber() {
    const inputBRL = document.getElementById('valor-brl');
    const preview = document.getElementById('conversao-preview');
    const btnConfirmar = document.getElementById('btn-confirmar-receber');

    inputBRL.oninput = () => {
        const valor = parseFloat(inputBRL.value);
        if (valor > 0) {
            preview.innerText = `≈ ${(valor / precoBNB).toFixed(6)} BNB`;
            btnConfirmar.disabled = false;
        } else {
            preview.innerText = '≈ 0.0000 BNB';
            btnConfirmar.disabled = true;
        }
    };

    btnConfirmar.onclick = () => {
        const calculoBNB = (parseFloat(inputBRL.value) / precoBNB).toFixed(6);
        const qrData = `ethereum:${userAccount}?value=${calculoBNB}`;
        const imgQr = document.getElementById('img-qrcode');
        imgQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData)}`;
        imgQr.style.display = 'block';
        document.getElementById('placeholder-qr').style.display = 'none';
    };
}

// --- 6. PROCESSAR PAGAMENTO ---
async function processarPagamento() {
    const endereco = document.getElementById('chave-pagamento').value;
    const valorBRL = document.getElementById('valor-pagar-brl').value;
    
    if (!endereco || !valorBRL) return alert("Preencha todos os campos");

    try {
        const valorBNB = (parseFloat(valorBRL) / precoBNB).toFixed(18);
        const tx = await signer.sendTransaction({
            to: endereco,
            value: ethers.parseEther(valorBNB)
        });
        alert("Pagamento enviado! Hash: " + tx.hash);
        fecharSala('sala-pagar');
    } catch (err) {
        console.error(err);
        alert("Erro ao processar pagamento.");
    }
}

// --- 7. INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.btn-wallet')?.addEventListener('click', conectarCarteira);
    document.getElementById('btn-confirmar-pagar')?.addEventListener('click', processarPagamento);
    if (window.ethereum && window.ethereum.selectedAddress) conectarCarteira();
});
