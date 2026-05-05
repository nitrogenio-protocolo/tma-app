async function conectar() {
    if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        document.getElementById('btn-conectar').innerText = accounts[0].substring(0,6) + "...";
    } else { alert("Abra na sua carteira Web3!"); }
}

function abrir(sala) {
    const modal = document.getElementById('modal');
    const body = document.getElementById('modal-body');
    modal.style.display = 'flex';
    body.innerHTML = `<h2>SALA ${sala.toUpperCase()}</h2><p>Carregando dados do Protocolo Nitrogênio...</p>`;
}

function fechar() { document.getElementById('modal').style.display = 'none'; }

document.getElementById('btn-conectar').onclick = conectar;
