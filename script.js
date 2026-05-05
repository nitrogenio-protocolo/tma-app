/**
 * NITROGÊNIO PROTOCOLO - Motor de Gestão Web3
 */

// CONFIGURAÇÕES TÉCNICAS
const ENDERECO_COFRE_SAFE = "0x11aBd1b9c71f97ad1df8A0Dbb789f8A96B458219"; 
let precoBNB = 3300; 
let provider, signer, userAccount;
let html5QrCode;

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
        // Atualiza botão com endereço curto
        btnWallet.innerText = userAccount.substring(0, 6) + "..." + userAccount.substring(userAccount.length - 4);
        
        // Busca saldo real na rede
        const balanceWei = await provider.getBalance(userAccount);
        const balanceBNB = parseFloat(ethers.formatEther(balanceWei));
        
        // Atualiza Interface
        if(displayBalance) displayBalance.innerText = balanceBNB.toFixed(4);
        if(displaySymbol) displaySymbol.innerText = "BNB";
        
        if(displayBRL) {
            const valorEmReais = (balanceBNB * precoBNB).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            displayBRL.innerText = `≈ ${valorEmReais}`;
        }
    }
}

// --- 3. GESTÃO DE INTERFACE E LIMPEZA ---
function abrirSala(id) {
    if (!userAccount && (id === 'sala-pagar' || id === 'sala-receber')) {
        alert("Conecte sua carteira primeiro.");
        conectarCarteira();
        return;
    }

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
    if (!sala) return;

    sala.classList.remove('ativa');
    document.body.style.overflow = 'auto';

    // --- LIMPEZA DE SEGURANÇA ---
    if (id === 'sala-pagar') {
        document.getElementById('chave-pagamento').value = '';
        document.getElementById('valor-pagar-brl').value = '';
        pararScanner();
    }

    if (id === 'sala-receber') {
        document.getElementById('valor-brl').value = '';
        document.getElementById('conversao-preview').innerText = '≈ 0.0000 BNB';
        document.getElementById('img-qrcode').style.display = 'none';
        document.getElementById('img-qrcode').src = '';
        document.getElementById('placeholder-qr').style.display = 'flex';
        document.getElementById('btn-confirmar-receber').disabled = true;
    }
}

// --- 4. SCANNER (PAGAR) ---
function iniciarScanner() {
    const btnCamera = document.querySelector('.btn-camera');
    const readerDiv = document.getElementById('reader');
    
    btnCamera.style.display = 'none';
    readerDiv.style.display = 'block';

    html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: 250 },
        (decodedText) => {
            let endereco = decodedText;
            if (decodedText.includes('?value=')) {
                const partes = decodedText.split('?value=');
                endereco = partes[0].replace('ethereum:', '');
                const valorBNB = partes[1];
                const valorBRL = (parseFloat(valorBNB) * precoBNB).toFixed(2);
                document.getElementById('valor-pagar-brl').value = valorBRL;
            }
            document.getElementById('chave-pagamento').value = endereco.replace('ethereum:', '');
            pararScanner();
        }
    ).catch(err => console.error(err));
}

function pararScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('reader').style.display = 'none';
            document.querySelector('.btn-camera').style.display = 'block';
        });
    }
}

// --- 5. GERADOR (RECEBER) ---
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
        } else {
            preview.innerText = '≈ 0.0000 BNB';
            btnConfirmar.disabled = true;
        }
    };

    btnConfirmar.onclick = () => {
        const calculoBNB = (parseFloat(inputBRL.value) / precoBNB).toFixed(6);
        const imgQr = document.getElementById('img-qrcode');
        const placeholder = document.getElementById('placeholder-qr');
        const qrData = `ethereum:${userAccount}?value=${calculoBNB}`;
        
        imgQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData)}`;
        imgQr.style.display = 'block';
        placeholder.style.display = 'none';
    };
}

// --- 6. INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.btn-wallet')?.addEventListener('click', conectarCarteira);
    if (window.ethereum && window.ethereum.selectedAddress) conectarCarteira();
});
