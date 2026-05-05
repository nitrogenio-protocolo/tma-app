/**
 * NITROGÊNIO PROTOCOLO - Motor de Gestão Web3 e Interface Circular
 */

// CONFIGURAÇÕES TÉCNICAS
const ENDERECO_COFRE_SAFE = "0x11aBd1b9c71f97ad1df8A0Dbb789f8A96B458219"; 
const PRECO_BNB_BRL = 3300; // Simulação: 1 BNB = R$ 3.300,00
let provider, signer, userAccount;
let modoPrivacidade = false;

// 1. GERENCIAMENTO DE INTERFACE (SISTEMA DE SALAS)
function abrirSala(id) {
    const sala = document.getElementById(id);
    if (sala) {
        sala.classList.add('ativa');
        document.body.style.overflow = 'hidden'; 
        
        // Gatilhos específicos de abertura
        if(id === 'sala-receber') prepararSalaReceber();
        if(id === 'sala-cofre') carregarDadosCofre();
    }
}

function fecharSala(id) {
    const sala = document.getElementById(id);
    if (sala) {
        sala.classList.remove('ativa');
        document.body.style.overflow = 'auto';

        // LIMPEZA AUTOMÁTICA DO TERMINAL
        if (id === 'sala-receber') {
            document.getElementById('valor-brl').value = '';
            document.getElementById('conversao-preview').innerText = '≈ 0.0000 BNB';
            document.getElementById('btn-confirmar-receber').disabled = true;
            document.getElementById('img-qrcode').style.display = 'none';
            document.getElementById('placeholder-qr').style.display = 'flex';
        }
    }
}

function giroHome() {
    const salas = document.querySelectorAll('.sala-card');
    salas.forEach(s => s.classList.remove('ativa'));
    document.body.style.overflow = 'auto';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 2. LÓGICA DE PRIVACIDADE
function alternarPrivacidade() {
    modoPrivacidade = !modoPrivacidade;
    const btnIcon = document.querySelector('.btn-eye-black i');
    const displayN = document.querySelector('.currency');
    const displaySub = document.querySelector('.conversion p');

    if (modoPrivacidade) {
        btnIcon.classList.replace('fa-eye', 'fa-eye-slash');
        displayN.innerText = "••••";
        displaySub.innerText = "Saldo oculto";
    } else {
        btnIcon.classList.replace('fa-eye-slash', 'fa-eye');
        updateUI();
    }
}

// 3. MOTOR WEB3 (CONEXÃO E SALDOS)
async function conectarCarteira() {
    if (!window.ethereum) return alert("Instale a MetaMask.");
    try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send("eth_requestAccounts", []);
        userAccount = accounts[0];
        provider = browserProvider;
        signer = await browserProvider.getSigner();
        updateUI();
    } catch (err) { console.error("Erro na conexão:", err); }
}

async function updateUI() {
    const btnWallet = document.querySelector('.btn-wallet');
    const displayN = document.querySelector('.currency');
    const displaySub = document.querySelector('.conversion p');

    if (userAccount && btnWallet) {
        btnWallet.innerText = userAccount.substring(0, 6) + "..." + userAccount.substring(userAccount.length - 4);
        const bal = await provider.getBalance(userAccount);
        const saldoRealBNB = parseFloat(ethers.formatEther(bal)).toFixed(4);

        if (!modoPrivacidade) {
            displayN.innerText = saldoRealBNB; 
            displaySub.innerHTML = `Saldo real em rede (BNB Chain)`;
        }
    }
}

// 4. TERMINAL DE RECEBIMENTO (COMERCIANTE)
function prepararSalaReceber() {
    const inputBRL = document.getElementById('valor-brl');
    const preview = document.getElementById('conversao-preview');
    const btnConfirmar = document.getElementById('btn-confirmar-receber');
    const imgQr = document.getElementById('img-qrcode');
    const placeholder = document.getElementById('placeholder-qr');
    const endExibicao = document.getElementById('end-completo');

    if (endExibicao && userAccount) endExibicao.innerText = userAccount;

    inputBRL?.addEventListener('input', (e) => {
        const valor = parseFloat(e.target.value);

        if (valor > 0 && userAccount) {
            const calculoBNB = (valor / PRECO_BNB_BRL).toFixed(6);
            preview.innerText = `≈ ${calculoBNB} BNB`;

            // QR Code com valor embutido
            const qrUrl = `https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=ethereum:${userAccount}?value=${calculoBNB}&choe=UTF-8`;
            imgQr.src = qrUrl;
            imgQr.style.display = 'inline-block';
            imgQr.style.opacity = '1';
            placeholder.style.display = 'none';

            btnConfirmar.style.background = '#007AFF';
            btnConfirmar.disabled = false;
        } else {
            preview.innerText = `≈ 0.0000 BNB`;
            imgQr.style.opacity = '0.3';
            btnConfirmar.style.background = '#ddd';
            btnConfirmar.disabled = true;
        }
    });
}

function copiarEndereco() {
    if (userAccount) {
        navigator.clipboard.writeText(userAccount);
        alert("Endereço copiado!");
    }
}

// 5. INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.btn-wallet')?.addEventListener('click', conectarCarteira);
    document.querySelector('.btn-eye-black')?.addEventListener('click', alternarPrivacidade);

    if (window.ethereum && window.ethereum.selectedAddress) {
        conectarCarteira();
    }
});

// Escuta a digitação para ativar o botão azul
document.getElementById('valor-brl').addEventListener('input', function() {
    const btn = document.getElementById('btn-confirmar-receber');
    if (this.value > 0) {
        btn.disabled = false;
        btn.style.background = 'var(--azul-blueberry)';
    } else {
        btn.disabled = true;
        btn.style.background = '#ddd';
    }
});

// Ação de CONFIRMAR (Gera QR Code e força a saída do teclado)
document.getElementById('btn-confirmar-receber').onclick = function() {
    const inputValor = document.getElementById('valor-brl');
    const valor = inputValor.value;
    
    // 1. FORÇA O TECLADO A SUMIR 
    // Além do blur, tiramos o foco específico do input e focamos na janela
    inputValor.blur(); 
    window.focus(); 

    // 2. GERAÇÃO DO QR CODE
    if (valor > 0) {
        const minhaCarteira = "0x71ca...d87a"; // Mantenha seu endereço completo aqui
        const qrArea = document.getElementById('img-qrcode');
        const placeholder = document.getElementById('placeholder-qr');

        // Monta o link para a rede BNB (Chain ID 56)
        qrArea.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=ethereum:${minhaCarteira}@56?value=${valor}`;
        
        placeholder.style.display = 'none';
        qrArea.style.display = 'block';
        qrArea.style.opacity = '1';
        
        console.log("Teclado recolhido e QR Code gerado para R$", valor);
    }
};
