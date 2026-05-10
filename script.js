// Navegação Inicial
function irParaFolha2() {
    document.getElementById('folha1').classList.remove('visivel');
    setTimeout(() => { document.getElementById('folha2').classList.add('visivel'); }, 600);
}

function irParaFolha3() {
    document.getElementById('folha2').classList.remove('visivel');
    setTimeout(() => { document.getElementById('folha3').classList.add('visivel'); }, 600);
}

// Trava dos Checkboxes
const c1 = document.getElementById('check-whitepaper');
const c2 = document.getElementById('check-governanca');
const btnEntrar = document.getElementById('btn-entrar');

[c1, c2].forEach(check => {
    check.addEventListener('change', () => {
        btnEntrar.disabled = !(c1.checked && c2.checked);
    });
});

function acessarHome() {
    document.getElementById('intro-layer').style.display = 'none';
    document.getElementById('home-app').style.display = 'block';
}

// Lógica do Mint (Folha 4)
function abrirMint() {
    document.getElementById('folha-mint').classList.add('metade');
}

function expandirMint() {
    const mint = document.getElementById('folha-mint');
    if (mint.classList.contains('metade')) {
        mint.classList.replace('metade', 'cheia');
        document.getElementById('extra-info').style.display = 'block';
    }
}

function voltarMint() {
    const mint = document.getElementById('folha-mint');
    if (mint.classList.contains('cheia')) {
        mint.classList.replace('cheia', 'metade');
        document.getElementById('extra-info').style.display = 'none';
    } else {
        mint.classList.remove('metade');
    }
}
