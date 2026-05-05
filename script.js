/**
 * NITROGÊNIO PROTOCOLO - Versão Recuperação Total
 */

let precoBNB = 3300; 
let provider, signer, userAccount;
let html5QrCode = null;

// 1. Motor de Cotação
async function atualizarPrecoBNB() {
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBBRL');
        const data = await response.json();
        if(data.price) precoBNB = parseFloat(data.price);
    } catch (e) { console.log("Cotação offline"); }
}
atualizarPrecoBNB();

// 2. Função de Conexão Inteligente
async function conectarCarteira() {
    // Se NÃO detectou carteira (Ex: está no Chrome)
    if (typeof window.ethereum === 'undefined') {
        const confirmGo = confirm("Para ver seu saldo, você precisa abrir o app na MetaMask. Deseja abrir agora?");
        if (confirmGo) {
            // DEEP LINK: Abre o site direto na MetaMask do usuário
            window.location.href = "https://metamask.app.link/dapp/nitrogenio-protocolo.github.io/";
        }
        return;
    }

    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAccount = accounts[0];
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        
        // Atualiza Interface
        document.querySelector('.btn-wallet').innerText = userAccount.substring(0,6) + "..." + userAccount.substring(userAccount.length-4);
        
        const balanceWei = await provider.getBalance(userAccount);
        const balanceBNB = ethers.formatEther(balanceWei);
        
        document.getElementById('display-balance').innerText = parseFloat(balanceBNB).toFixed(4);
        document.getElementById('balance-brl').innerText = "≈ " + (parseFloat(balanceBNB) * precoBNB).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
        
    } catch (err) {
        alert("Acesso recusado ou erro de rede.");
    }
}

// 3. Gestão de Salas e Limpeza (Seu pedido original)
function abrirSala(id) {
    if (!userAccount) {
        conectarCarteira();
        return;
    }
    document.getElementById(id).classList.add('ativa');
    if(id === 'sala-receber') logicaReceber();
}

function fecharSala(id) {
    const sala = document.getElementById(id);
    if(sala) {
        sala.classList.remove('ativa');
        
        // Limpa todos os inputs ao fechar/cancelar
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

// 4. Lógica de Pagar/Receber
async function processarPagamento() {
    const destino = document.getElementById('chave-pagamento').value;
    const valorBRL = document.getElementById('valor-pagar-brl').value;
    if (!destino || !valorBRL) return alert("Preencha os campos!");

    try {
        const valorBNB = (parseFloat(valorBRL) / precoBNB).toFixed(18);
        const tx = await signer.sendTransaction({
            to: destino,
            value: ethers.parseEther(valorBNB)
        });
        alert("Sucesso! Hash: " + tx.hash);
        fecharSala('sala-pagar');
    } catch (e) { alert("Erro na transação."); }
}

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

// 5. Scanner
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

// 6. Inicialização
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.btn-wallet').onclick = conectarCarteira;
    const btnPagar = document.getElementById('btn-confirmar-pagar');
    if(btnPagar) btnPagar.onclick = processarPagamento;
});
