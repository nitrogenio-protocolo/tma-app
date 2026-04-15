/**
 * NITROGÊNIO PROTOCOLO - v2.0 stable
 * Lógica: Web3 Flow & Splash Control
 */

// 1. Splash Control (Animação Sequencial)
window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    const textDao = document.getElementById('text-dao');
    const textNitrogenio = document.getElementById('text-nitrogenio');
    const splashLogo = document.getElementById('splash-logo');

    if (!splash) return;

    // Tempo de cada fade-in (milissegundos)
    const delay = 800; 

    setTimeout(() => { textDao.classList.add('fade-in'); }, delay);
    setTimeout(() => { textDao.style.display = 'none'; textNitrogenio.classList.add('fade-in'); }, delay * 2);
    setTimeout(() => { textNitrogenio.style.display = 'none'; splashLogo.classList.add('fade-in'); }, delay * 3);

    // Some tudo
    setTimeout(() => {
        splash.style.transition = 'opacity 0.6s ease';
        splash.style.opacity = '0';
        setTimeout(() => { splash.remove(); }, 600);
    }, delay * 5); // Tchau splash
});

// 2. Web3 Connection (Core)
let userAccount = null;
let provider, signer, scannerAtivo;

async function syncWallet() {
    if (!window.ethereum) return alert("Abra o app dentro da MetaMask Browser.");

    try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send("eth_requestAccounts", []);
        userAccount = accounts[0];
        provider = browserProvider;
        signer = await browserProvider.getSigner();

        updateUI();
    } catch (err) { console.error("Conexão falhou:", err); }
}

function updateUI() {
    const btn = document.getElementById('connect-trigger');
    const balanceDisplay = document.querySelector('.balance-amount');
    const nftBalanceDisplay = document.getElementById('nft-balance');

    if (userAccount) {
        // Formata o endereço (0xabcd...efgh)
        btn.innerText = `${userAccount.substring(0, 6)}...${userAccount.substring(38)}`;
        
        // Pega Saldo Principal
        provider.getBalance(userAccount).then(bal => {
            const formatBal = parseFloat(ethers.formatEther(bal)).toFixed(4);
            balanceDisplay.innerText = `${formatBal} BNB`;
            // Por enquanto, vou mostrar o mesmo saldo no NFT, para provar que funciona
            // Quando você tiver o contrato, a gente muda a função de leitura
            nftBalanceDisplay.innerText = `Saldo NFT: ${formatBal} BNB`;
        });
    }
}

document.getElementById('connect-trigger')?.addEventListener('click', syncWallet);

// 3. Navigation Engine
function abrirView(viewId) {
    document.getElementById('home-app').style.display = 'none';
    document.querySelectorAll('.area-interna').forEach(a => a.style.display = 'none');
    document.getElementById(viewId).style.display = 'block';
}

function fecharView(viewId) {
    if (scannerAtivo) pararScanner();
    document.getElementById(viewId).style.display = 'none';
    document.getElementById('home-app').style.display = 'block';
}

function abrirPagar() { abrirView('area-pagar'); }
function fecharPagar() { fecharView('area-pagar'); }
function abrirReceber() { abrirView('area-receber'); }
function fecharReceber() { fecharView('area-receber'); }

// 4. Validations
const valorPagarInput = document.getElementById('valor-pagar');
const addrInput = document.getElementById('wallet-address');

const validatePagar = () => {
    const btn = document.getElementById('btn-confirmar-pagar');
    const valor = parseFloat(valorPagarInput.value);
    const endereco = addrInput.value.trim(); // O .trim() remove espaços vazios

    // Se tiver valor maior que zero e o endereço tiver pelo menos 42 caracteres
    const isValid = valor > 0 && endereco.length >= 42;
    
    btn.disabled = !isValid;
    btn.classList.toggle('active', isValid);
};

valorPagarInput?.addEventListener('input', validatePagar);
addrInput?.addEventListener('input', validatePagar);

// 5. QR Code & Scanner
function gerarCobranca() {
    const balInput = document.getElementById('bnb-receber');
    const bnbValor = balInput.value;
    const container = document.getElementById('qrcode-container');
    if (!userAccount || !bnbValor) return alert("Conecte a carteira e insira valor!");
    
    container.innerHTML = "";
    // Formato EIP-681 simplificado
    new QRCode(container, { text: `ethereum:${userAccount}?value=${bnbValor}`, width: 200, height: 200 });
}

// --- FUNÇÃO PARA PAGAR DE VERDADE ---
async function executarPagamento() {
    const valorN = document.getElementById('valor-pagar').value;
    const enderecoDestino = document.getElementById('wallet-address').value;

    if (!userAccount || !signer) return alert("Conecte a carteira primeiro!");
    if (!ethers.isAddress(enderecoDestino)) return alert("Endereço de destino inválido!");

    try {
        const btnPagar = document.getElementById('btn-confirmar-pagar');
        btnPagar.innerText = "PROCESSANDO...";
        btnPagar.disabled = true;

        // Isso aqui chama a MetaMask de verdade
        const tx = await signer.sendTransaction({
            to: enderecoDestino,
            value: ethers.parseEther(valorN) 
        });

        alert("Transação enviada! Hash: " + tx.hash);
        await tx.wait(); // Espera confirmar na rede
        
        alert("Pagamento concluído!");
        fecharPagar();
        updateUI(); 

    } catch (err) {
        console.error(err);
        alert("Falha no pagamento. Verifique saldo ou conexão.");
    } finally {
        const btnPagar = document.getElementById('btn-confirmar-pagar');
        btnPagar.innerText = "PAGAR";
        btnPagar.disabled = false;
    }
}

// Ativa o clique do botão
document.getElementById('btn-confirmar-pagar')?.addEventListener('click', executarPagamento);

// --- AJUSTE NO BOTÃO RECEBER (LIMPEZA AUTOMÁTICA) ---
function fecharReceber() {
    // Limpa o valor digitado
    document.getElementById('bnb-receber').value = "";
    // Apaga o QR Code gerado
    document.getElementById('qrcode-container').innerHTML = "";
    // Volta para a home
    fecharView('area-receber');
}

// --- AJUSTE NO SCANNER (PAGAR) ---
let html5QrCode;

async function toggleScanner() {
    const readerDiv = document.getElementById('reader');
    
    if (!scannerAtivo) {
        readerDiv.style.display = 'block';
        scannerAtivo = true;
        
        html5QrCode = new Html5Qrcode("reader");
        
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        try {
            await html5QrCode.start(
                { facingMode: "environment" }, // Usa a câmera traseira
                config,
                (decodedText) => {
                    // Quando ler o QR Code:
                    document.getElementById('wallet-address').value = decodedText;
                    pararScanner(); // Desliga a câmera
                    validatePagar(); // Valida o botão de pagar
                }
            );
        } catch (err) {
            console.error("Erro ao abrir câmera:", err);
            alert("Erro ao acessar a câmera. Verifique as permissões.");
            pararScanner();
        }
    } else {
        pararScanner();
    }
}

function pararScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('reader').style.display = 'none';
            scannerAtivo = false;
        }).catch(err => console.error("Erro ao parar scanner:", err));
    }
}

// Garanta que ao fechar a tela de pagar, a câmera desligue também
function fecharPagar() {
    pararScanner();
    document.getElementById('valor-pagar').value = "";
    document.getElementById('wallet-address').value = "";
    fecharView('area-pagar');
}
