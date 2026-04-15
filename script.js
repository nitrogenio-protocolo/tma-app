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
