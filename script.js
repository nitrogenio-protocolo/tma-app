// Troca de Telas Iniciais
function irParaFolha2() {
    document.getElementById('folha1').classList.remove('visivel');
    setTimeout(() => { document.getElementById('folha2').classList.add('visivel'); }, 600);
}

function irParaFolha3() {
    document.getElementById('folha2').classList.remove('visivel');
    setTimeout(() => { document.getElementById('folha3').classList.add('visivel'); }, 600);
}

// Bloqueio por Checkbox
const c1 = document.getElementById('check-whitepaper');
const c2 = document.getElementById('check-governanca');
const btnEntrar = document.getElementById('btn-entrar');

function validarChecks() {
    btnEntrar.disabled = !(c1.checked && c2.checked);
}
c1.addEventListener('change', validarChecks);
c2.addEventListener('change', validarChecks);

function acessarHome() {
    document.getElementById('intro-layer').style.display = 'none';
    document.getElementById('home-app').style.display = 'block';
}

// Lógica da Folha do Mint
function abrirMint() {
    document.getElementById('folha-mint').classList.add('metade');
}

function expandirMint() {
    document.getElementById('folha-mint').classList.add('cheia');
    document.getElementById('extra-info').style.display = 'block';
}

function voltarMint() {
    const mint = document.getElementById('folha-mint');
    if (mint.classList.contains('cheia')) {
        mint.classList.remove('cheia');
        document.getElementById('extra-info').style.display = 'none';
    } else {
        mint.classList.remove('metade');
    }
}
