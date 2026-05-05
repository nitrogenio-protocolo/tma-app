async function conectar() {
    if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        document.getElementById('btn-conectar').innerText = accounts[0].substring(0,6) + "...";
        alert("Conectado à DAO do Nitrogênio!");
    } else { alert("Abra no navegador da sua carteira Web3!"); }
}

function abrirSala(sala) {
    const overlay = document.getElementById('overlay');
    const conteudo = document.getElementById('conteudo-sala');
    overlay.style.display = 'flex';
    conteudo.innerHTML = `<h2>SALA ${sala.toUpperCase()}</h2><p>Carregando dados do Protocolo Nitrogênio...</p>`;
}

function fecharSala() {
    document.getElementById('overlay').style.display = 'none';
}

document.getElementById('btn-conectar').onclick = conectar;
