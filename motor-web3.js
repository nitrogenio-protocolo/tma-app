/**
 * NITROGÊNIO PROTOCOLO - MOTOR WEB3
 * Gestão de BNB, Token N e NFT Alpha
 */

// ENDEREÇOS OFICIAIS (Ajuste conforme o deploy)
const ENDERECO_COFRE_SAFE = "0x11aBd1b9c71f97ad1df8A0Dbb789f8A96B458219";
const CONTRATO_TOKEN_N = "0x..."; // Coloque o endereço do Token N aqui depois
const CONTRATO_NFT_ALPHA = "0x..."; // Coloque o endereço do NFT aqui depois

let provider, signer, userAccount;

// 1. SINCRONIZAR CARTEIRA
async function syncWallet() {
    if (!window.ethereum) {
        alert("Por favor, acesse pelo navegador da MetaMask ou Trust.");
        return;
    }
    try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send("eth_requestAccounts", []);
        userAccount = accounts[0];
        provider = browserProvider;
        signer = await browserProvider.getSigner();
        
        console.log("Conectado:", userAccount);
        atualizarInterfaceFinanceira();
    } catch (err) {
        console.error("Erro na ignição Web3:", err);
    }
}

// 2. ATUALIZAR SALDOS (BNB E TOKEN N)
async function atualizarInterfaceFinanceira() {
    if (!userAccount) return;

    // Atualiza BNB
    const balBNB = await provider.getBalance(userAccount);
    const bnbFormatado = parseFloat(ethers.formatEther(balBNB)).toFixed(4);
    document.querySelector('.balance-amount').innerText = `${bnbFormatado} BNB`;

    // Atualiza saldo do Cofre Safe (Auditoria)
    const balCofre = await provider.getBalance(ENDERECO_COFRE_SAFE);
    const cofreFormatado = parseFloat(ethers.formatEther(balCofre)).toFixed(4);
    const displayCofre = document.getElementById('saldo-safe-real');
    if (displayCofre) displayCofre.innerText = `${cofreFormatado} BNB`;

    // Trigger para o botão de conexão
    const btn = document.getElementById('connect-trigger');
    if (btn) btn.innerText = `${userAccount.substring(0, 5)}...${userAccount.substring(38)}`;
}

// 3. LÓGICA DO NFT ALPHA (MINT)
async function iniciarMint() {
    if (!signer) return alert("Conecte a carteira primeiro!");
    
    try {
        // Aqui entrará a chamada de contrato para o seu NFT
        alert("Iniciando Mint do NFT Alpha... Aguardando contrato.");
        // Exemplo: const contract = new ethers.Contract(CONTRATO_NFT_ALPHA, ABI, signer);
        // await contract.mint();
    } catch (err) {
        alert("Erro no Mint: " + err.message);
    }
}

// 4. PAGAMENTOS (ENVIAR BNB)
async function confirmarPagamento() {
    const destino = document.getElementById('wallet-address').value;
    const valor = document.getElementById('valor-pagar').value;

    if (!ethers.isAddress(destino)) return alert("Endereço inválido!");
    if (!valor || valor <= 0) return alert("Digite um valor válido!");

    try {
        const tx = await signer.sendTransaction({
            to: destino,
            value: ethers.parseEther(valor)
        });
        alert("Transação enviada! Hash: " + tx.hash);
        await tx.wait();
        alert("Pagamento Confirmado!");
        atualizarInterfaceFinanceira();
    } catch (err) {
        alert("Falha na transação: " + err.message);
    }
}

// Ouvinte do botão de conexão
document.getElementById('connect-trigger')?.addEventListener('click', syncWallet);
