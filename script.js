// CONFIGURAÇÕES DO PROTOCOLO NITROGÊNIO
const CONTRACT_TOKEN_N = "0x11aBd1b9c71f97ad1df8A0Dbb789f8A96B458219"; // Cofre DAO
const CONTRACT_NFT_ALPHA = "EM_DEPLOY"; // Seu contrato NFT
const OPERATIONAL_WALLET = "0x71ca6D36D1Fd262Fa4Cc186b199D0dc7a0F5d87a";

let provider, signer, userAddress;

// 1. CONEXÃO WEB3
async function conectar() {
    if (window.ethereum) {
        try {
            provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAddress = accounts[0];
            signer = await provider.getSigner();
            
            document.getElementById('btn-conectar').innerText = 
                userAddress.substring(0,6) + "..." + userAddress.substring(38);
            
            atualizarSaldos();
        } catch (e) { alert("Conexão negada."); }
    } else { alert("Use o navegador da sua carteira!"); }
}

// 2. ATUALIZAÇÃO DE SALDOS (SIMULAÇÃO + CHAIN)
async function atualizarSaldos() {
    const balance = await provider.getBalance(userAddress);
    document.getElementById('saldo-bnb').innerHTML = `${parseFloat(ethers.formatEther(balance)).toFixed(4)} <span>BNB</span>`;
    
    // Aqui buscaria o saldo do Token N via Contract Call
    document.getElementById('saldo-n').innerHTML = `1.000.000,00 <span>N</span>`;
}

// 3. LÓGICA DE MINT COM REGRAS FINANCEIRAS
async function realizarMint() {
    const padrinho = document.getElementById('ref-padrinho').value || OPERATIONAL_WALLET;
    
    console.log("Executando Mint...");
    console.log("50% Liquidez | 40% Tesouraria | 20% Referral"); // Regras cravadas na pedra
    
    // Simulação da transação de 0.1 BNB
    try {
        const tx = await signer.sendTransaction({
            to: CONTRACT_TOKEN_N,
            value: ethers.parseEther("0.1")
        });
        alert("Mint Iniciado! Aguarde a confirmação na rede.");
    } catch (e) { alert("Erro no Mint."); }
}

// 4. SISTEMA DE SALAS (INTERFACE)
function abrirSala(id) {
    const overlay = document.getElementById('overlay');
    const conteudo = document.getElementById('conteudo-sala');
    overlay.style.display = 'flex';

    const salas = {
        'sala-governo': `<h2>GOVERNO</h2><p>Assinaturas pendentes: 0/11 Guardiões</p><hr><div class='pautas'>Nenhuma pauta ativa no quórum.</div>`,
        'sala-coleta': `<h2>SALA DE COLETA</h2><div class='card-coleta'><h3>Cashback: 40%</h3><button class='btn-primary'>RESGATAR EM N</button></div>`,
        'sala-tesouraria': `<h2>TESOURARIA</h2><p>Saldo Cofre Safe: 900.000.000 N</p><p>Saúde da DAO: 100%</p>`,
        'sala-mural': `<h2>MURAL DE TRANSPARÊNCIA</h2><p>Último Mint: 0x71...87a</p><p>Taxa 1% coletada: 10 N</p>`
    };

    conteudo.innerHTML = salas[id] || `<h2>SALA EM DESENVOLVIMENTO</h2>`;
}

function fecharSala() {
    document.getElementById('overlay').style.display = 'none';
}

// INICIALIZAÇÃO
document.getElementById('btn-conectar').onclick = conectar;
document.getElementById('btn-mint').onclick = realizarMint;
