const SENHA_MESTRA = "2026"; 
let senhaDigitada = "", salaDestino = "";

// SPLASH SCREEN
window.addEventListener('load', () => {
    setTimeout(() => { document.getElementById('text-dao').classList.add('fade-in'); }, 500);
    setTimeout(() => { 
        document.getElementById('text-dao').style.display = 'none';
        document.getElementById('text-nitrogenio').classList.add('fade-in'); 
    }, 1500);
    setTimeout(() => { document.getElementById('splash-screen').style.opacity = '0'; }, 3000);
});

// NAVEGAÇÃO DAS SALAS
function abrirPainel(id) {
    salaDestino = id;
    document.getElementById('modal-acesso').style.display = 'flex';
    senhaDigitada = "";
    atualizarDots();
}

function fecharPainel(id) {
    document.getElementById('painel-' + id).classList.remove('aberto');
    document.body.style.overflow = 'auto';
}

// TECLADO DE OURO
function digitar(num) {
    if (senhaDigitada.length < 4) {
        senhaDigitada += num;
        atualizarDots();
        if (senhaDigitada.length === 4) {
            if (senhaDigitada === SENHA_MESTRA) {
                document.getElementById('modal-acesso').style.display = 'none';
                document.getElementById('painel-' + salaDestino).classList.add('aberto');
                if(salaDestino === 'cofre') atualizarSaldoRealCofre();
            } else {
                alert("Senha Incorreta!");
                senhaDigitada = "";
                atualizarDots();
            }
        }
    }
}

function atualizarDots() {
    const spans = document.querySelectorAll('#display-senha span');
    spans.forEach((span, i) => span.className = i < senhaDigitada.length ? 'preenchido' : '');
}

function cancelarAcesso() { document.getElementById('modal-acesso').style.display = 'none'; }
function apagarDigitado() { senhaDigitada = senhaDigitada.slice(0, -1); atualizarDots(); }


function abrirPagar() { 
    alert("Função Pagar: O scanner será integrado aqui."); 
}

function abrirReceber() { 
    if(!userAccount) return alert("Conecte a carteira para ver seu endereço.");
    alert("Seu endereço de recebimento:\n" + userAccount); 
}

function abrirNFT() {
    // Aqui ele abre o Teclado de Ouro antes de entrar na área de NFT
    abrirPainel('nft'); 
}
