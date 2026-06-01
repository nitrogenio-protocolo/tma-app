/* ==========================================================================
   Navegação Dinâmica Corrigida - Nitrogênio Protocolo
   ========================================================================== */

// 1. Função principal para trocar de tela
function navegarPara(idTela) {
    document.querySelectorAll('main section').forEach(section => {
        section.classList.remove('ativa');
    });
    
    const novaTela = document.getElementById(idTela);
    if (novaTela) {
        novaTela.classList.add('ativa');
    } else {
        console.error(`Erro: A tela com ID "${idTela}" não foi encontrada no HTML.`);
    }
}

// 2. Eventos dos botões do Rodapé (Fixo)
document.getElementById('btn-menu-home').addEventListener('click', () => navegarPara('tela-home'));
document.getElementById('btn-menu-nft').addEventListener('click', () => navegarPara('tela-nft'));
document.getElementById('btn-menu-dao').addEventListener('click', () => navegarPara('tela-dao'));
document.getElementById('btn-menu-redes').addEventListener('click', () => navegarPara('tela-redes'));
document.getElementById('btn-menu-perfil').addEventListener('click', () => navegarPara('tela-perfil'));

// 3. Eventos dos Novos Botões Rápidos da Home
document.getElementById('nav-pagar').addEventListener('click', () => navegarPara('tela-pagar'));
document.getElementById('nav-receber').addEventListener('click', () => navegarPara('tela-receber'));
document.getElementById('nav-trocar').addEventListener('click', () => navegarPara('tela-trocar'));
document.getElementById('nav-coletar').addEventListener('click', () => navegarPara('tela-coletar'));

// 4. Eventos de Sub-telas internas (Ações dos Cards)
document.getElementById('card-pagar-leitor').addEventListener('click', () => navegarPara('sub-pagar-leitor'));
document.getElementById('card-receber-gerar').addEventListener('click', () => navegarPara('sub-receber-gerar-qr'));
document.getElementById('card-coletar-executar').addEventListener('click', () => navegarPara('sub-coletar-executar'));
document.getElementById('card-trocar-pancake').addEventListener('click', () => navegarPara('sub-trocar-pancakeswap'));
document.getElementById('card-dao-recompensas').addEventListener('click', () => navegarPara('sub-recompensas'));

// 5. Sub-recompensas da DAO
document.getElementById('card-recompensa-poupanca').addEventListener('click', () => navegarPara('folha-poupanca'));
document.getElementById('card-recompensa-quiz').addEventListener('click', () => navegarPara('folha-quiz'));
document.getElementById('card-recompensa-checkin').addEventListener('click', () => navegarPara('folha-checkin'));
document.getElementById('card-recompensa-roleta').addEventListener('click', () => navegarPara('folha-roleta'));

// 6. Mapa de Retorno Exato (Mapeia qual tela volta para onde, sem erros)
const mapaDeRetorno = {
    // Sub-telas profundas voltam para as telas mães
    'folha-poupanca': 'sub-recompensas',
    'folha-quiz': 'sub-recompensas',
    'folha-checkin': 'sub-recompensas',
    'folha-roleta': 'sub-recompensas',
    'sub-pagar-leitor': 'tela-pagar',
    'sub-receber-gerar-qr': 'tela-receber',
    'sub-coletar-executar': 'tela-coletar',
    'sub-trocar-pancakeswap': 'tela-trocar',
    
    // Telas do primeiro nível e abas do menu voltam para a HOME
    'sub-recompensas': 'tela-home',
    'tela-pagar': 'tela-home',
    'tela-receber': 'tela-home',
    'tela-coletar': 'tela-home',
    'tela-trocar': 'tela-home'
};

// 7. Aplica a lógica em todos os botões "Voltar"
document.querySelectorAll('.btn-voltar').forEach(botao => {
    botao.addEventListener('click', () => {
        const telaAtual = botao.closest('section');
        if (!telaAtual) return;

        const idTelaDestino = mapaDeRetorno[telaAtual.id];

        if (idTelaDestino) {
            navegarPara(idTelaDestino);
        } else {
            // Caso falte mapear alguma tela por segurança ele volta para a home
            navegarPara('tela-home');
        }
    });
});

console.log("Nitrogênio Protocolo: Sistema de navegação mapeado e corrigido!");
