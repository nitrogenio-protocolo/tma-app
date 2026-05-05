let provider, signer, account, scanner;
let destinoAtual = "";

async function conectar() {
    if (window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
        const accs = await provider.send("eth_requestAccounts", []);
        account = accs[0];
        signer = await provider.getSigner();
        document.getElementById('btn-conectar').innerText = account.substring(0,6)+"...";
        atualizarSaldo();
    }
}

async function atualizarSaldo() {
    const b = await provider.getBalance(account);
    document.getElementById('display-bnb').innerHTML = ethers.formatEther(b).substring(0,6) + " <span>BNB</span>";
}

function iniciarFluxoPagar() {
    if(!account) return alert("Conecte a carteira!");
    document.getElementById('cam-overlay').style.display = 'flex';
    scanner = new Html5Qrcode("reader");
    scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, processarLeitura);
}

function processarLeitura(texto) {
    scanner.stop();
    document.getElementById('cam-overlay').style.display = 'none';
    const dados = texto.split(':');
    destinoAtual = dados[0];
    document.getElementById('modal-confirm').style.display = 'block';
    document.getElementById('info-destino').innerText = "DESTINO: " + destinoAtual;
    document.getElementById('valor-input').value = dados[1] || "";
}

function limparSala() {
    if(scanner) try { scanner.stop(); } catch(e) {}
    document.getElementById('cam-overlay').style.display = 'none';
    document.getElementById('modal-confirm').style.display = 'none';
    document.getElementById('valor-input').value = "";
    destinoAtual = "";
}

async function assinarPagamento() {
    const valor = document.getElementById('valor-input').value;
    try {
        const tx = await signer.sendTransaction({
            to: destinoAtual,
            value: ethers.parseEther(valor)
        });
        alert("Sucesso!");
        limparSala();
        setTimeout(atualizarSaldo, 3000);
    } catch (e) { alert("Cancelado."); }
}

document.getElementById('btn-conectar').onclick = conectar;
document.getElementById('btn-pagar').onclick = iniciarFluxoPagar;
document.getElementById('btn-executar').onclick = assinarPagamento;
document.getElementById('btn-cancelar').onclick = limparSala;
document.querySelector('.btn-close-cam').onclick = limparSala;
