/**
 * NITROGÊNIO PROTOCOLO - Versão Estabilizada
 */

const ENDERECO_COFRE_SAFE = "0x11aBd1b9c71f97ad1df8A0Dbb789f8A96B458219"; 
let precoBNB = 3300; 
let provider, signer, userAccount;
let html5QrCode = null;

// --- 1. MOTOR DE PREÇO ---
async function atualizarPrecoBNB() {
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBBRL');
        const data = await response.json();
        if(data.price) precoBNB = parseFloat(data.price);
    } catch (e) { console.error("Erro cotação"); }
}
atualizarPrecoBNB();

// --- 2. CONEXÃO WEB3 ---
async function conectarCarteira() {
    if (!window.ethereum) return alert("Abra pelo navegador da sua Carteira.");
    try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send("eth_requestAccounts", []);
        userAccount = accounts[0];
        provider = browserProvider;
        signer = await browserProvider.getSigner();
        await updateUI();
    } catch (err) { console.error(err); }
}

async function updateUI() {
    const btnWallet = document.querySelector('.btn-wallet');
    const displayBalance = document.getElementById('display-balance');
    const displayBRL = document.getElementById('balance-brl');

    if (userAccount && provider) {
        btnWallet.innerText = userAccount.substring(0, 6) + "..." + userAccount.substring(userAccount.length - 4);
        const balanceWei = await provider.getBalance(userAccount);
        const balanceBNB = parseFloat(ethers.formatEther(balanceWei));
        
        if(displayBalance) displayBalance.innerText = balanceBNB.toFixed(4);
        if(displayBRL) {
            const valorEmReais = (balanceBNB * precoBNB).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            displayBRL.innerText = `≈ ${valorEmReais}`;
        }
    }
}

// --- 3. GESTÃO DE SALAS ---
function abrirSala(id) {
    // Se não estiver conectado, força a conexão primeiro
    if (!userAccount) {
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

    // Limpeza Geral
    const inputs = sala.querySelectorAll('input');
    inputs.forEach(i => i.value = '');

    if (id === 'sala-pagar') {
        pararScanner();
    }
    
    if (id === 'sala-receber') {
        document.getElementById('conversao-preview').innerText = '≈ 0.0000 BNB';
        document.getElementById('img-qrcode').style.display = 'none';
        document.getElementById('placeholder-qr').style.display = 'flex';
        document.getElementById('btn-confirmar-receber').disabled = true;
    }
}

// --- 4. SCANNER ---
function iniciarScanner() {
    const readerDiv = document.getElementById('reader');
    const btnCam = document.querySelector('.btn-camera');
    
    readerDiv.style.display = 'block';
    btnCam.style.display = 'none';

    html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (text) => {
            let addr = text.includes('?') ? text.split('?')[0] : text;
            addr = addr.replace('ethereum:', '');
            document.getElementById('chave-pagamento').value = addr;
            
            if (text.includes('value=')) {
                const val = text.split('value=')[1];
                document.getElementById('valor-pagar-brl').value = (parseFloat(val) * precoBNB).toFixed(2);
            }
            pararScanner();
        }
    ).catch(() => pararScanner());
}

function pararScanner() {
    if (html5QrCode) {
        html5QrCode.stop().catch(() => {}).finally(() => {
            document.getElementById('reader').style.display = 'none';
            document.querySelector('.btn-camera').style.display = 'block';
            html5QrCode = null;
        });
    }
}

// --- 5. RECEBER & PAGAR ---
function prepararSalaReceber() {
    const input = document.getElementById('valor-brl');
    const btn = document.getElementById('btn-confirmar-receber');
    
    input.oninput = () => {
        const bnb = (parseFloat(input.value) / precoBNB).toFixed(6);
        document.getElementById('conversao-preview').innerText = `≈ ${isNaN(bnb) ? '0.0000' : bnb} BNB`;
        btn.disabled = !(parseFloat(input.value) > 0);
    };

    btn.onclick = () => {
        const bnb = (parseFloat(input.value) / precoBNB).toFixed(6);
        const uri = `ethereum:${userAccount}?value=${bnb}`;
        const img = document.getElementById('img-qrcode');
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(uri)}`;
        img.style.display = 'block';
        document.getElementById('placeholder-qr').style.display = 'none';
    };
}

async function confirmarPagamento() {
    const para = document.getElementById('chave-pagamento').value;
    const brl = document.getElementById('valor-pagar-brl').value;

    if (!para || !brl) return alert("Dados incompletos");

    try {
        const bnb = (parseFloat(brl) / precoBNB).toFixed(18);
        const tx = await signer.sendTransaction({
            to: para,
            value: ethers.parseEther(bnb)
        });
        alert("Sucesso! Hash: " + tx.hash);
        fecharSala('sala-pagar');
    } catch (e) {
        alert("Erro na transação. Verifique seu saldo ou a carteira de destino.");
    }
}

// --- 6. EVENTOS ---
document.addEventListener('DOMContentLoaded', () => {
    // Vincula o botão de conectar
    document.querySelector('.btn-wallet').onclick = conectarCarteira;
    
    // Vincula o botão de confirmar pagamento da sala
    const btnConfirmarPagar = document.getElementById('btn-confirmar-pagar');
    if (btnConfirmarPagar) btnConfirmarPagar.onclick = confirmarPagamento;

    // Se já estiver logado no navegador, conecta auto
    if (window.ethereum?.selectedAddress) conectarCarteira();
});
