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

// 2. Conexão Real com a Carteira (Web3)
const connectBtn = document.getElementById('connect-trigger');

connectBtn.addEventListener('click', async () => {
    if (window.ethereum) {
        try {
            // Solicita autorização de acesso
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            
            connectBtn.innerText = "CONECTANDO...";
            
            // Conecta à rede e busca o saldo real
            const provider = new ethers.BrowserProvider(window.ethereum);
            const balance = await provider.getBalance(account);
            const ethBalance = ethers.formatEther(balance);
            
            // Atualiza o app com seus dados
            currentBalance = parseFloat(ethBalance).toFixed(4) + " BNB";
            balanceVal.innerText = currentBalance;
            connectBtn.innerText = account.substring(0, 6) + "..." + account.substring(38);
            
            alert("Conectado ao Cofre com sucesso!");
        } catch (error) {
            alert("Conexão recusada ou erro na rede.");
        }
    } else {
        alert("Carteira não encontrada. Use o navegador da MetaMask ou Trust Wallet.");
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
