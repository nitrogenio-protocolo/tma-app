// 1. Lógica do Olho (Privacidade)
const eyeBtn = document.getElementById('toggle-visibility');
const balanceVal = document.querySelector('.balance-amount');
let currentBalance = "0.00 N"; 

eyeBtn.addEventListener('click', () => {
    eyeBtn.classList.toggle('active');
    if (eyeBtn.classList.contains('active')) {
        balanceVal.innerText = currentBalance;
        eyeBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
    } else {
        balanceVal.innerText = "****";
        eyeBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    }
});

// 2. Conexão com a Carteira (Focada no seu saldo pessoal de 6.71)
const connectBtn = document.getElementById('connect-trigger');

connectBtn.addEventListener('click', async () => {
    if (window.ethereum) {
        try {
            // Pede para conectar
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            
            // FORÇA A REDE BNB (Para achar seus 6.71)
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x38' }], 
                });
            } catch (err) {
                console.log("Rede já está certa ou precisa ser aceita.");
            }

            connectBtn.innerText = "LENDO SALDO...";
            
            const provider = new ethers.BrowserProvider(window.ethereum);
            const balance = await provider.getBalance(account);
            const ethBalance = ethers.formatEther(balance);
            
            // Atualiza com seu valor real
            currentBalance = parseFloat(ethBalance).toFixed(4) + " BNB";
            balanceVal.innerText = currentBalance;
            connectBtn.innerText = account.substring(0, 6) + "..." + account.substring(38);
            
            alert("Sua carteira pessoal foi lida com sucesso!");
        } catch (error) {
            alert("Erro ao ler sua carteira pessoal.");
        }
    } else {
        alert("Abra este site dentro da sua MetaMask.");
    }
});

// 3. Lógica da Splash (Transição)
window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    const home = document.getElementById('home-app');
    setTimeout(() => {
        if (splash) {
            splash.classList.add('fade-out');
            setTimeout(() => {
                splash.remove();
                home.style.display = 'block';
                setTimeout(() => { home.style.opacity = '1'; }, 50);
            }, 800);
        }
    }, 7500); 
});
