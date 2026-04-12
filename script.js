// CONFIGURAÇÕES DO PROTOCOLO NITROGÊNIO
const CONTRACT_N_ADDRESS = "0x...SEU_CONTRATO_TOKEN_N..."; // Substitua pelo seu contrato
const VAULT_DAO = "0x...ENDERECO_DO_COFRE..."; // Endereço que recebe os 1%
const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // Router da PancakeSwap (BSC)

let currentBalance = "0.00 N";
let cotacaoTokenN = 0; // Valor vindo da PancakeSwap

// 1. Lógica do Olho (Privacidade) - Mantida e Melhorada
const eyeBtn = document.getElementById('toggle-visibility');
const balanceVal = document.getElementById('main-balance');

eyeBtn.addEventListener('click', () => {
    const isVisible = balanceVal.innerText !== "****";
    balanceVal.innerText = isVisible ? "****" : currentBalance;
    eyeBtn.innerHTML = isVisible ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
});

// 2. Conexão e Lógica da Splash (Transição) - Mantida
window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    const home = document.getElementById('home-app');
    setTimeout(() => {
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.remove();
                home.style.display = 'block';
                setTimeout(() => { home.style.opacity = '1'; }, 50);
            }, 800);
        }
    }, 3000); // Reduzi para 3s para agilizar seus testes no celular
});

// 3. CONTROLES DO MODAL (PAGAR / RECEBER)
const modal = document.getElementById('modal-operacao');
const btnFechar = document.getElementById('fechar-modal');
const inputBRL = document.getElementById('input-valor-brl');
const conversaoTexto = document.getElementById('conversao-token');
const btnAcao = document.getElementById('btn-acao-principal');

function abrirOperacao(tipo, destino = "") {
    modal.style.display = 'block';
    document.getElementById('modal-titulo').innerText = tipo.toUpperCase();
    inputBRL.value = "";
    conversaoTexto.innerText = "≈ 0.00 Token N";
    
    if (tipo === 'pagar') {
        document.getElementById('destino-info').innerText = `Destino: ${destino}`;
        document.getElementById('area-qr').style.display = 'none';
        btnAcao.innerText = "CONFIRMAR NA METAMASK";
    } else {
        document.getElementById('destino-info').innerText = "Sua carteira está pronta para receber";
        document.getElementById('area-qr').style.display = 'block';
        btnAcao.innerText = "GERAR QR DE COBRANÇA";
    }
}

btnFechar.onclick = () => modal.style.display = 'none';

// 4. LÓGICA DA CALCULADORA (BRL -> TOKEN N)
inputBRL.addEventListener('input', (e) => {
    const brl = parseFloat(e.target.value) || 0;
    // Lógica simplificada: Aqui você integrará a chamada da PancakeSwap
    // Por enquanto, usaremos uma conversão fictícia (ex: 1 Token N = R$ 0.50)
    const tokens = brl * 2; 
    const taxaDAO = tokens * 0.01;
    const total = tokens + taxaDAO;
    
    conversaoTexto.innerText = `≈ ${total.toFixed(2)} Token N (incl. 1% DAO)`;
});

// 5. INTEGRAÇÃO SCANNER TELEGRAM
document.getElementById('btn-scan').onclick = () => {
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.showScanQrPopup({ text: "Escaneie o QR do Protocolo Nitrogênio" }, (dados) => {
            const endereco = dados.replace(/^(ethereum:|binance:)/, "").split('?')[0];
            abrirOperacao('pagar', endereco);
            return true;
        });
    } else {
        alert("Função disponível apenas dentro do Telegram.");
    }
};

// Gatilhos dos botões da Home
document.getElementById('btn-pagar').onclick = () => document.getElementById('btn-scan').click();
document.getElementById('btn-receber').onclick = () => abrirOperacao('receber');

// 6. GERADOR DE QR CODE (PARA O RECEBER)
btnAcao.onclick = () => {
    if (btnAcao.innerText === "GERAR QR DE COBRANÇA") {
        const qrContainer = document.getElementById('qrcode-container');
        qrContainer.innerHTML = ""; // Limpa anterior
        
        const valorBRL = inputBRL.value || "0";
        // String padrão EIP-681 para MetaMask ler automático
        const dadosQR = `ethereum:${CONTRACT_N_ADDRESS}/transfer?address=${VAULT_DAO}&uint256=${valorBRL}`;
        
        new QRCode(qrContainer, {
            text: dadosQR,
            width: 180,
            height: 180,
            colorDark : "#007AFF",
            colorLight : "#ffffff"
        });
    } else {
        // Lógica de envio real via MetaMask (PAGAR)
        alert("Chamando MetaMask para pagar...");
    }
};
