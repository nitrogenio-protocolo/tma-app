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

        // Limpa campos da sala PAGAR
        if (id === 'sala-pagar') {
            pararScanner();
            document.getElementById('chave-pagamento').value = '';
            // Se você tiver um campo de valor na tela de pagar, limpe-o aqui também:
            if(document.getElementById('valor-pagar-brl')) document.getElementById('valor-pagar-brl').value = '';
        }

        // Limpa campos da sala RECEBER
        if (id === 'sala-receber') {
            document.getElementById('valor-brl').value = '';
            document.getElementById('conversao-preview').innerText = '≈ 0.0000 BNB';
            document.getElementById('btn-confirmar-receber').disabled = true;
            document.getElementById('img-qrcode').style.display = 'none';
            document.getElementById('placeholder-qr').style.display = 'flex';
        }
    }
}

// --- AJUSTE NO LEITOR (CAPTURAR VALOR DO QR CODE) ---
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
            // Lógica para separar Endereço e Valor
            // Exemplo de decodedText: "ethereum:0x123...89?value=0.01"
            let endereco = decodedText;
            let valorBNB = "";

            if (decodedText.includes('?value=')) {
                const partes = decodedText.split('?value=');
                endereco = partes[0].replace('ethereum:', '');
                valorBNB = partes[1];
            } else {
                endereco = decodedText.replace('ethereum:', '');
            }

            // Preenche o campo da carteira
            document.getElementById('chave-pagamento').value = endereco;

            // Se o QR Code trouxe valor, convertemos de volta para BRL para mostrar ao pagador
            if (valorBNB && document.getElementById('valor-pagar-brl')) {
                const valorBRL = (parseFloat(valorBNB) * precoBNB).toFixed(2);
                document.getElementById('valor-pagar-brl').value = valorBRL;
            }

            pararScanner();
        }
    ).catch((err) => {
        alert("Erro na câmera: " + err);
        pararScanner();
    });
}

// --- AJUSTE NO GERADOR (EMBUTIR VALOR NO QR CODE) ---
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
            btnConfirmar.disabled = true;
        }
    };

    btnConfirmar.onclick = () => {
        const valorBRL = inputBRL.value;
        const calculoBNB = (valorBRL / precoBNB).toFixed(6);
        const imgQr = document.getElementById('img-qrcode');
        const placeholder = document.getElementById('placeholder-qr');

        // IMPORTANTE: Incluímos o valor após o '?' para o leitor identificar
        const qrData = `ethereum:${userAccount}?value=${calculoBNB}`;
        
        imgQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData)}`;
        imgQr.style.display = 'block';
        placeholder.style.display = 'none';
    };
}

// --- 7. GATILHOS DE INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.btn-wallet')?.addEventListener('click', conectarCarteira);
    document.getElementById('btn-confirmar-pagar')?.addEventListener('click', processarPagamento);

    // Auto-conecta se já houver permissão
    if (window.ethereum && window.ethereum.selectedAddress) conectarCarteira();
});
