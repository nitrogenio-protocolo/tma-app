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

function abrirScanner() {
    if(!account) return alert("Conecte primeiro!");
    document.getElementById('cam-overlay').style.display = 'block';
    scanner = new Html5Qrcode("reader");
    scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (txt) => {
        scanner.stop();
        document.getElementById('cam-overlay').style.display = 'none';
        const p = txt.split(':');
        destinoAtual = p[0];
        document.getElementById('modal-confirm').style.display = 'block';
        document.getElementById('info-destino').innerText = "DESTINO: " + destinoAtual;
        document.getElementById('valor-input').value = p[1] || "";
    });
}

function fecharTudo() {
    if(scanner) try { scanner.stop(); } catch(e) {}
    document.getElementById('cam-overlay').style.display = 'none';
    document.getElementById('modal-confirm').style.display = 'none';
}

async function executar() {
    const v = document.getElementById('valor-input').value;
    try {
        const tx = await signer.sendTransaction({ to: destinoAtual, value: ethers.parseEther(v) });
        alert("Enviado!");
        fecharTudo();
        setTimeout(atualizarSaldo, 3000);
    } catch(e) { alert("Erro ou Cancelado"); }
}

document.getElementById('btn-conectar').onclick = conectar;
document.getElementById('btn-pagar').onclick = abrirScanner;
document.getElementById('confirmar-pagamento').onclick = executar;
document.getElementById('cancelar-pagamento').onclick = fecharTudo;
document.getElementById('fechar-cam').onclick = fecharTudo;
