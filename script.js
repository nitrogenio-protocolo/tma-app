/**
 * NITROGÊNIO PROTOCOLO - Versão QR Code & Estabilidade
 */

let precoBNB = 3100; // Valor base se a API falhar
let provider, signer, userAccount;
let html5QrCode = null;

// 1. Cotação Real
async function atualizarPrecoBNB() {
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBBRL');
        const data = await response.json();
        if(data.price) precoBNB = parseFloat(data.price);
    } catch (e) { console.log("Usando cotação padrão"); }
}
atualizarPrecoBNB();

// 2. Conexão por Clique
async function conectarCarteira() {
    if (typeof window.ethereum === 'undefined') {
        if(confirm("Abra na MetaMask para usar o saldo. Ir agora?")) {
            window.location.href = "https://metamask.app.link/dapp/nitrogenio-protocolo.github.io/";
        }
        return;
    }
    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAccount = accounts[0];
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        
        // Atualiza a tela
        document.querySelector('.btn-wallet').innerText = userAccount.substring(0,6) + "..." + userAccount.substring(userAccount.length-4);
        const balance = await provider.getBalance(userAccount);
        const bnb = ethers.formatEther(balance);
        document.getElementById('display-balance').innerText = parseFloat(bnb).toFixed(4);
        document.getElementById('balance-brl').innerText = "≈ " + (parseFloat(bnb) * precoBNB).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
    } catch (err) { alert("Conexão cancelada."); }
}

// 3. Gestão das Salas (Limpando tudo)
function abrirSala(id) {
    if (!userAccount) return conectarCarteira();
    const sala = document.getElementById(id);
    if(sala) {
        sala.classList.add('ativa');
        if(id === 'sala-receber') iniciarLogicaReceber();
    } else {
        alert("Recurso em desenvolvimento!"); // Para Coletar e Trocar
    }
}

function fecharSala(id) {
    const sala = document.getElementById(id);
    if(sala) {
        sala.classList.remove('ativa');
        const inputs = sala.querySelectorAll('input');
        inputs.forEach(i => i.value = ''); 
        if(id === 'sala-receber') {
            document.getElementById('img-qrcode').style.display = 'none';
            document.getElementById('placeholder-qr').style.display = 'flex';
        }
        if(id === 'sala-pagar') pararScanner();
    }
}

// 4. Lógica de Receber (O que estava falhando no seu print)
function iniciarLogicaReceber() {
    const inputBRL = document.getElementById('valor-brl');
    const btnGerar = document.getElementById('btn-confirmar-receber');
    const displayBNB = document.getElementById('conversao-preview');

    inputBRL.oninput = () => {
        const valor = parseFloat(inputBRL.value);
        if(!isNaN(valor) && valor > 0) {
            const bnb = (valor / precoBNB).toFixed(6);
            displayBNB.innerText = `≈ ${bnb} BNB`;
            btnGerar.style.opacity = "1";
            btnGerar.style.pointerEvents = "auto";
        } else {
            displayBNB.innerText = "≈ 0.0000 BNB";
            btnGerar.style.opacity = "0.5";
        }
    };

    btnGerar.onclick = () => {
        const valorBRL = parseFloat(inputBRL.value);
        const bnb = (valorBRL / precoBNB).toFixed(6);
        const link = `ethereum:${userAccount}?value=${bnb}`;
        
        const img = document.getElementById('img-qrcode');
        const placeholder = document.getElementById('placeholder-qr');
        
        // Gera o QR Code usando API estável
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
        
        img.onload = () => {
            img.style.display = 'block';
            placeholder.style.display = 'none';
        };
    };
}

// 5. Pagar e Scanner
async function confirmarPagamento() {
    const destino = document.getElementById('chave-pagamento').value;
    const valor = document.getElementById('valor-pagar-brl').value;
    if(!destino || !valor) return alert("Dados incompletos");

    try {
        const tx = await signer.sendTransaction({
            to: destino,
            value: ethers.parseEther((parseFloat(valor)/precoBNB).toFixed(18))
        });
        alert("Enviado!");
        fecharSala('sala-pagar');
    } catch (e) { alert("Falha na transação."); }
}

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
        });
    }
}

// 6. Ativação dos botões
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.btn-wallet').onclick = conectarCarteira;
    
    const btnConfirmarPagar = document.getElementById('btn-confirmar-pagar');
    if(btnConfirmarPagar) btnConfirmarPagar.onclick = confirmarPagamento;
});
