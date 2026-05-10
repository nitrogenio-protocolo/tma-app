// 1. Pular a primeira folha automaticamente após 5 segundos
window.onload = function() {
    setTimeout(() => {
        irParaFolha2();
    }, 5000);
};

// Troca de Telas Iniciais
function irParaFolha2() {
    const f1 = document.getElementById('folha1');
    const f2 = document.getElementById('folha2');
    if(f1 && f2) {
        f1.classList.remove('visivel');
        f2.classList.add('visivel');
    }
}

function irParaFolha3() {
    document.getElementById('folha2').classList.remove('visivel');
    document.getElementById('folha3').classList.add('visivel');
}

// Bloqueio por Checkbox
function validarChecks() {
    const c1 = document.getElementById('check-whitepaper');
    const c2 = document.getElementById('check-governanca');
    const btnEntrar = document.getElementById('btn-entrar');
    btnEntrar.disabled = !(c1.checked && c2.checked);
}

function acessarHome() {
    document.getElementById('intro-layer').style.display = 'none';
    document.getElementById('home-app').style.display = 'block';
}

// Lógica do Mint (Folha 4)
function abrirMint() {
    document.getElementById('folha-mint').classList.add('metade');
}

function expandirMint() {
    document.getElementById('folha-mint').classList.add('cheia');
    document.getElementById('extra-info').style.display = 'block';
}

function voltarMint() {
    const mint = document.getElementById('folha-mint');
    mint.classList.remove('cheia');
    mint.classList.remove('metade');
}
