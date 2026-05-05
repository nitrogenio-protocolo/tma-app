/**
 * NITROGÊNIO PROTOCOLO - Versão Manual por Clique
 */

let precoBNB = 3300; 
let provider, signer, userAccount;
let html5QrCode = null;

// 1. Cotação (Pode rodar no fundo, não afeta o saldo)
async function atualizarPrecoBNB() {
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBBRL');
        const data = await response.json();
        if(data.price) precoBNB = parseFloat(data.price);
    } catch (e) { console.log("Erro cotação"); }
}
atualizarPrecoBNB();

// 2. FUNÇÃO ÚNICA DE CONEXÃO (Só dispara no clique)
async function conectarCarteira() {
    if (typeof window.ethereum === 'undefined') {
        return alert("Por favor, abra este site dentro do navegador da MetaMask ou Trust Wallet.");
    }

    try {
        // Reinicia estados para evitar conflito de cache
        userAccount = null;
        
        // Solicita conexão ativa ao usuário
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAccount = accounts[0];
        
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        
        // Só agora buscamos o saldo e atualizamos a tela
        const balanceWei = await provider.getBalance(userAccount);
        const balanceBNB = ethers.formatEther(balanceWei);
        
        // Atualiza Botão
        document.querySelector('.btn-wallet').innerText = userAccount.substring(0,6) + "..." + userAccount.substring(userAccount.length-4);
        
        // Atualiza Saldo e BRL
        document.getElementById('display-balance').innerText = parseFloat(balanceBNB).toFixed(4);
        const valorEmReais = (parseFloat(balanceBNB) * precoBNB).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
        document.getElementById('balance-brl').innerText = "≈ " + valorEmReais;

        console.log("Carteira conectada com sucesso.");
    } catch (err) {
        console.error(err);
        alert("Falha ao conectar: Verifique se sua carteira está aberta e na rede correta.");
    }
}

// 3. Gestão de Salas e Limpeza (Conforme solicitado)
function abrirSala(id) {
    if (!userAccount) {
        alert("Clique no botão CONECTAR primeiro.");
        return;
    }
    document.getElementById(id).classList.add('ativa');
    if(id === 'sala-receber') logicaReceber();
}

function fecharSala(id) {
    const sala = document.getElementById(id);
    if(sala) {
        sala.classList.remove('ativa');
        document.body.style.overflow = 'auto';
        
        // Limpa inputs para evitar pagamentos/recebimentos errados
        const inputs = sala.querySelectorAll('input');
        inputs.forEach(i => i.value = ''); 

        if (id === 'sala-pagar') pararScanner();
        if (id === 'sala-receber') {
            document.getElementById('img-qrcode').style.display = 'none';
            document.getElementById('placeholder-qr').style.display = 'flex';
            document.getElementById('conversao-preview').innerText = '≈ 0.0000 BNB';
        }
    }
}

// 4. Lógica de Pagamento
async function confirmarPagamento() {
    const destino = document.getElementById('chave-pagamento').value;
    const valorBRL = document.getElementById('valor-pagar-brl').value;

    if (!destino || !valorBRL || !userAccount) return alert("Dados insuficientes.");

    try {
        const valorBNB = (parseFloat(valorBRL) / precoBNB).toFixed(18);
        const tx = await signer.sendTransaction({
            to: destino,
            value: ethers.parseEther(valorBNB)
        });
        alert("Transação enviada!");
        fecharSala('sala-pagar');
    } catch (e) {
        alert("Erro na transação. Verifique saldo ou conexão.");
    }
}

// 5. Lógica de Recebimento
function logicaReceber() {
    const input = document.getElementById('valor-brl');
    input.oninput = () => {
        const bnb = (parseFloat(input.value) / precoBNB).toFixed(6);
        document.getElementById('conversao-preview').innerText = `≈ ${isNaN(bnb) ? '0.0000' : bnb} BNB`;
    };

    document.getElementById('btn-confirmar-receber').onclick = () => {
        const bnb = (parseFloat(input.value) / precoBNB).toFixed(6);
        const link = `ethereum:${userAccount}?value=${bnb}`;
        const img = document.getElementById('img-qrcode');
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(link)}`;
        img.style.display = 'block';
        document.getElementById('placeholder-qr').style.display = 'none';
    };
}

// 6. Scanner
function iniciarScanner() {
    document.getElementById('reader').style.display = 'block';
    document.querySelector('.btn-camera').style.display = 'none';
    html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (text) => {
        document.getElementById('chave-pagamento').value = text.replace('ethereum:', '').split('?')[0];
        pararScanner();
    }).catch(() => {});
}

function pararScanner() {
    if(html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('reader').style.display = 'none';
            document.querySelector('.btn-camera').style.display = 'block';
            html5QrCode = null;
        }).catch(() => {});
    }
}

// 7. Inicialização estritamente passiva
document.addEventListener('DOMContentLoaded', () => {
    // Vincula o clique do botão CONECTAR à função
    document.querySelector('.btn-wallet').onclick = conectarCarteira;
    
    // Vincula o clique de confirmação de pagamento
    const btnPagar = document.getElementById('btn-confirmar-pagar');
    if(btnPagar) btnPagar.onclick = confirmarPagamento;
});
