// 1. Lógica do Olho (Privacidade)
const eyeBtn = document.getElementById('toggle-visibility');
const balanceVal = document.querySelector('.balance-amount');

eyeBtn.addEventListener('click', () => {
    eyeBtn.classList.toggle('active');
    if (eyeBtn.classList.contains('active')) {
        balanceVal.innerText = "0.00 N"; // Valor real
        eyeBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
    } else {
        balanceVal.innerText = "****"; // Valor oculto
        eyeBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    }
});

// 2. Pedir Autorização ao Conectar
const connectBtn = document.getElementById('connect-trigger');

connectBtn.addEventListener('click', () => {
    const consent = confirm("O Nitrogênio Protocolo solicita autorização para visualizar o endereço da sua carteira e saldo. Deseja prosseguir?");
    
    if (consent) {
        connectBtn.innerText = "CONECTANDO...";
        connectBtn.style.background = "#86868b";
        
        setTimeout(() => {
            alert("Autorização concedida com sucesso!");
            connectBtn.innerText = "0x...F4A2"; // Simula carteira conectada
        }, 1500);
    } else {
        alert("Acesso negado pelo usuário.");
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
