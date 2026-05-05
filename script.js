/**
 * NITROGÊNIO PROTOCOLO - Motor de Gestão Web3 e Interface Circular
 * Versão: 2.0 (Real Assets Integration)
 */

// CONFIGURAÇÕES TÉCNICAS
const ENDERECO_COFRE_SAFE = "0x11aBd1b9c71f97ad1df8A0Dbb789f8A96B458219"; 
let precoBNB = 3300; 
let provider, signer, userAccount;
let html5QrCode;

// --- 1. MOTOR DE PREÇO (ORÁCULO BINANCE) ---
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

// --- 2. CONEXÃO WEB3 REAL ---
async function conectarCarteira() {
    if (!window.ethereum) return alert("Por favor, abra pelo navegador da sua Carteira (MetaMask/Trust).");
    try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send("eth_requestAccounts", []);
        userAccount = accounts[0];
        provider = browserProvider;
        signer = await browserProvider.getSigner();
        
        await updateUI();
    } catch (err) { 
        console.error("Erro na conexão:", err); 
        alert("Falha ao conectar carteira.");
    }
}

async function updateUI() {
    const btnWallet = document.querySelector('.btn-wallet');
    const displayBalance = document.querySelector('.currency');
    const symbolText = document.querySelector('.symbol');

    if (userAccount && provider) {
        // Exibe endereço curto no botão (ex: 0x71ca...d87a)
        btnWallet.innerText = userAccount.substring(0, 6) + "..." + userAccount.substring(userAccount.length - 4);
        
        // BUSCA SALDO REAL DE BNB NA REDE
        const balanceWei = await provider.getBalance(userAccount);
        const balanceBNB = ethers.formatEther(balanceWei);
        
        if(displayBalance) displayBalance.innerText = parseFloat(balanceBNB).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
        if(symbolText) symbolText.innerText = "BNB"; // Identificador real enquanto o Token N não é lançado
    }
}

// --- 3. GESTÃO DE INTERFACE E TRAVAS ---
function abrirSala(id) {
    // SEGURANÇA: Impede uso de funções financeiras sem conexão
    if (!userAccount && (id === 'sala-pagar' || id === 'sala-receber')) {
        alert("Conecte sua carteira para acessar esta função.");
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
    if (sala) {
        sala.classList.remove('ativa');
        document.body.style.overflow = 'auto';
        if (id === 'sala-pagar') pararScanner();
    }
}

function giroHome() {
    const salas = document.querySelectorAll('.sala-card');
    salas.forEach(s => s.classList.remove('ativa'));
    document.body.style.overflow = 'auto';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- 4. TERMINAL DE PAGAMENTO (ENVIO REAL) ---
async function processarPagamento() {
    const destino = document.getElementById('chave-pagamento').value;
    const valorBRL = prompt("Confirme o valor do pagamento em R$:");

    if (!destino || !destino.startsWith('0x')) return alert("Endereço de destino inválido.");
    if (!valorBRL || isNaN(valorBRL)) return alert("Valor inválido.");

    try {
        const valorBNB = (parseFloat(valorBRL) / precoBNB).toFixed(18);
        const valorEmWei = ethers.parseEther(valorBNB);

        alert(`Enviando ${valorBNB} BNB para ${destino.substring(0,8)}...`);

        const tx = await signer.sendTransaction({
            to: destino,
            value: valorEmWei
        });

        alert("Transação enviada! Aguardando confirmação...");
        await tx.wait();
        alert("Pagamento concluído com sucesso!");
        
        giroHome();
        updateUI();
    } catch (err) {
        console.error(err);
        alert("Erro na transação: " + (err.reason || "Falha no envio"));
    }
}

// --- 5. TERMINAL DE RECEBIMENTO (QR CODE DINÂMICO) ---
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
            preview.innerText = `≈ 0.0000 BNB`;
            btnConfirmar.disabled = true;
        }
    };

    btnConfirmar.onclick = () => {
        const valor = inputBRL.value;
        const calculoBNB = (valor / precoBNB).toFixed(6);
        const imgQr = document.getElementById('img-qrcode');
        const placeholder = document.getElementById('placeholder-qr');

        // GERA QR CODE COM O ENDEREÇO DE QUEM ESTÁ LOGADO
        const qrData = `ethereum:${userAccount}@56?value=${calculoBNB}`;
        imgQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData)}`;
        imgQr.style.display = 'block';
        placeholder.style.display = 'none';
    };
}

// --- 6. MOTOR DO SCANNER ---
function iniciarScanner() {
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
            const enderecoLimpo = decodedText.includes(':') ? decodedText.split(':')[1].split('@')[0] : decodedText;
            document.getElementById('chave-pagamento').value = enderecoLimpo;
            pararScanner();
        }
    ).catch((err) => {
        alert("Erro na câmera: " + err);
        pararScanner();
    });
}

function pararScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            document.querySelector('.btn-camera').style.display = 'block';
            document.getElementById('reader').style.display = 'none';
        });
    }
}

// --- 7. GATILHOS DE INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.btn-wallet')?.addEventListener('click', conectarCarteira);
    document.getElementById('btn-confirmar-pagar')?.addEventListener('click', processarPagamento);

    // Auto-conecta se já houver permissão
    if (window.ethereum && window.ethereum.selectedAddress) conectarCarteira();
});
