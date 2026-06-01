/* ==========================================================================
   Navegação Dinâmica: O Cérebro do Nitrogênio Protocolo
   ========================================================================== */

// 1. Função para trocar de tela
function navegarPara(idTela) {
    // Esconde todas as seções
    document.querySelectorAll('main section').forEach(section => {
        section.classList.remove('ativa');
    });
    // Mostra apenas a tela solicitada
    document.getElementById(idTela).classList.add('ativa');
}

// 2. Eventos dos botões do Rodapé (Fixo)
document.getElementById('btn-menu-home').addEventListener('click', () => navegarPara('tela-home'));
document.getElementById('btn-menu-nft').addEventListener('click', () => navegarPara('tela-nft'));
document.getElementById('btn-menu-dao').addEventListener('click', () => navegarPara('tela-dao'));
document.getElementById('btn-menu-redes').addEventListener('click', () => navegarPara('tela-redes'));
document.getElementById('btn-menu-perfil').addEventListener('click', () => navegarPara('tela-perfil'));

// 3. Eventos dos Cards da Home (Navegação interna)
document.getElementById('nav-pagar').addEventListener('click', () => navegarPara('tela-pagar'));
document.getElementById('nav-receber').addEventListener('click', () => navegarPara('tela-receber'));
document.getElementById('nav-coletar').addEventListener('click', () => navegarPara('tela-coletar'));
document.getElementById('nav-trocar').addEventListener('click', () => navegarPara('tela-trocar'));

// 4. Eventos de Sub-telas (Leitor, Gerar QR, Swap, etc)
document.getElementById('card-pagar-leitor').addEventListener('click', () => navegarPara('sub-pagar-leitor'));
document.getElementById('card-receber-gerar').addEventListener('click', () => navegarPara('sub-receber-gerar-qr'));
document.getElementById('card-coletar-executar').addEventListener('click', () => navegarPara('sub-coletar-executar'));
document.getElementById('card-trocar-pancake').addEventListener('click', () => navegarPara('sub-trocar-pancakeswap'));
document.getElementById('card-dao-recompensas').addEventListener('click', () => navegarPara('sub-recompensas'));

// 5. Sub-recompensas
document.getElementById('card-recompensa-poupanca').addEventListener('click', () => navegarPara('folha-poupanca'));
document.getElementById('card-recompensa-quiz').addEventListener('click', () => navegarPara('folha-quiz'));
document.getElementById('card-recompensa-checkin').addEventListener('click', () => navegarPara('folha-checkin'));
document.getElementById('card-recompensa-roleta').addEventListener('click', () => navegarPara('folha-roleta'));

// 6. Botões de Voltar (Pega todos os botões com a classe .btn-voltar)
document.querySelectorAll('.btn-voltar').forEach(btn => {
    btn.addEventListener('click', () => {
        // Volta sempre para a tela Home
        navegarPara('tela-home');
    });
});

console.log("Nitrogênio Protocolo: Navegação carregada com sucesso!");




Aí já aproveita, aí já dá uma analisada como a gente removeu aqueles botões lá e substituiu pelos mais simples. Aí já vê se tem alguma coisa para mim remover aí no JS também.
