/**
 * NITROGÊNIO PROTOCOLO - Versão Simplificada e Funcional
 */

let precoBNB = 3300; 
let provider, signer, userAccount;
let html5QrCode = null;

// 1. Cotação
async function atualizarPrecoBNB() {
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBBRL');
        const data = await response.json();
        if(data.price) precoBNB = parseFloat(data.price);
    } catch (e) { console.log("Erro na cotação, usando padrão."); }
}
atualizarPrecoBNB();

// 2. Conectar Carteira
async function conectarCarteira() {
    if (!window.ethereum) return alert("Use o navegador da sua carteira!");
    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAccount = accounts[0];
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        
        // Atualiza Botão e Saldo
        document.querySelector('.btn-wallet').innerText = userAccount.substring(0,6) + "..." + userAccount.substring(userAccount.length-4);
        const balance = await provider.getBalance(userAccount);
        document.getElementById('display-balance').innerText = parseFloat(ethers.formatEther(balance)).toFixed(4);
        document.getElementById('balance-brl').innerText = "≈ " + (parseFloat(ethers.formatEther(balance)) * precoBNB).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
    } catch (err) { alert("Erro ao conectar."); }
}

// 3. Abrir e Fechar Salas (Com a limpeza que você pediu)
function abrirSala(id) {
    if (!userAccount) return conectarCarteira();
    document.getElementById(id).classList.add('ativa');
    if(id === 'sala-receber') logicaReceber();
}

function fecharSala(id) {
    const sala = document.getElementById(id);
    sala.classList.remove('ativa');
    
    // LIMPEZA: Aqui limpamos os inputs quando o usuário cancela
    const inputs = sala.querySelectorAll('input');
    inputs.forEach(i => i.value = ''); 

    if (id === 'sala-pagar') pararScanner();
    if (id === 'sala-receber') {
        document.getElementById('img-qrcode').style.display = 'none';
        document.getElementById('placeholder-qr').style.display = 'flex';
        document.getElementById('conversao-preview').innerText = '≈ 0.0000 BNB';
    }
}

// 4. Lógica de Receber (Gerar QR)
function logicaReceber() {
    const inputBRL = document.getElementById('valor-brl');
    const btnGerar = document.getElementById('btn-confirmar-receber');
    
    inputBRL.oninput = () => {
        const bnb = (parseFloat(inputBRL.value) / precoBNB).toFixed(6);
        document.getElementById('conversao-preview').innerText = `≈ ${isNaN(bnb) ? '0.0000' : bnb} BNB`;
        btnGerar.disabled = !(parseFloat(inputBRL.value) > 0);
    };

    btnGerar.onclick = () => {
        const bnb = (parseFloat(inputBRL.value) / precoBNB).toFixed(6);
        const link = `ethereum:${userAccount}?value=${bnb}`;
        const img = document.getElementById('img-qrcode');
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(link)}`;
        img.style.display = 'block';
        document.getElementById('placeholder-qr').style.display = 'none';
    };
}

// 5. Lógica de Pagar (Confirmar Envio)
async function confirmarPagamento() {
    const destino = document.getElementById('chave-pagamento').value;
    const valorBRL = document.getElementById('valor-pagar-brl').value;

    if (!destino || !valorBRL) return alert("Preencha o endereço e o valor!");

    try {
        const valorBNB = (parseFloat(valorBRL) / precoBNB).toFixed(18);
        const tx = await signer.sendTransaction({
            to: destino,
            value: ethers.parseEther(valorBNB)
        });
        alert("Enviado com sucesso!");
        fecharSala('sala-pagar');
    } catch (e) {
        alert("Falha na transação.");
    }
}

// 6. Scanner
function iniciarScanner() {
    document.getElementById('reader').style.display = 'block';
    document.querySelector('.btn-camera').style.display = 'none';
    html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (text) => {
        let cleanText = text.replace('ethereum:', '').split('?')[0];
        document.getElementById('chave-pagamento').value = cleanText;
        pararScanner();
    }).catch(e => console.log("Erro camera"));
}

function pararScanner() {
    if(html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('reader').style.display = 'none';
            document.querySelector('.btn-camera').style.display = 'block';
        }).catch(e => console.log(e));
    }
}

// Inicialização dos botões
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.btn-wallet').onclick = conectarCarteira;
    document.getElementById('btn-confirmar-pagar').onclick = confirmarPagamento;
});
