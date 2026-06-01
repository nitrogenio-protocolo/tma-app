/* ==========================================================================
   Navegação Dinâmica Isolada - Nitrogênio Protocolo
   ========================================================================== */

// 1. Função principal para alternar e isolar as telas totalmente
function navegarPara(idTela) {
    // Esconde absolutamente todas as seções do conteúdo principal
    document.querySelectorAll('main#conteudo-principal section').forEach(section => {
        section.classList.remove('ativa');
        section.style.display = 'none'; // Força a tela a sumir e desocupar o espaço
    });
    
    // Alvo que queremos abrir
    const novaTela = document.getElementById(idTela);
    if (novaTela) {
        novaTela.classList.add('ativa');
        novaTela.style.display = 'block'; // Mostra apenas a tela selecionada no topo
        window.scrollTo(0, 0); // Garante que ela abra no início dela
    } else {
        console.warn(`Aviso: A tela "${idTela}" não foi encontrada ou ainda não está criada no HTML.`);
    }
}

// Função auxiliar para aplicar cliques apenas se o elemento existir no HTML
function ligarAcao(idBotao, idTelaDestino) {
    const botao = document.getElementById(idBotao);
    if (botao) {
        botao.addEventListener('click', (e) => {
            e.preventDefault();
            navegarPara(idTelaDestino);
        });
    }
}

// ==========================================================================
// CONFIGURAÇÃO DOS GATILHOS DE CLIQUE
// ==========================================================================

// 2. Menu do Rodapé Fixo
ligarAcao('btn-menu-home', 'tela-home');
ligarAcao('btn-menu-nft', 'tela-nft');
ligarAcao('btn-menu-dao', 'tela-dao');
ligarAcao('btn-menu-redes', 'tela-redes');
ligarAcao('btn-menu-perfil', 'tela-perfil');

// 3. Botões Redondos Rápidos da Home
ligarAcao('nav-pagar', 'tela-pagar');
ligarAcao('nav-receber', 'tela-receber');
ligarAcao('nav-trocar', 'tela-trocar');
ligarAcao('nav-coletar', 'tela-coletar');

// 4. Cards da DAO e Sub-telas
ligarAcao('card-dao-recompensas', 'sub-recompensas');
ligarAcao('card-pagar-leitor', 'sub-pagar-leitor');
ligarAcao('card-receber-gerar', 'sub-receber-gerar-qr');
ligarAcao('card-coletar-executar', 'sub-coletar-executar');
ligarAcao('card-trocar-pancake', 'sub-trocar-pancakeswap');

// 5. Salas de Recompensa da DAO (Poupança, Quiz, Check-in, Roleta)
ligarAcao('card-recompensa-poupanca', 'folha-poupanca');
ligarAcao('card-recompensa-quiz', 'folha-quiz');
ligarAcao('card-recompensa-checkin', 'folha-checkin');
ligarAcao('card-recompensa-roleta', 'folha-roleta');


// ==========================================================================
// LOGICA DO BOTÃO VOLTAR (SETAS DO TOPO)
// ==========================================================================

// 6. Mapa rígido de retorno para as setas
const caminhosVoltar = {
    'folha-poupanca': 'sub-recompensas',
    'folha-quiz': 'sub-recompensas',
    'folha-checkin': 'sub-recompensas',
    'folha-roleta': 'sub-recompensas',
    
    'sub-pagar-leitor': 'tela-pagar',
    'sub-receber-gerar-qr': 'tela-receber',
    'sub-coletar-executar': 'tela-coletar',
    'sub-trocar-pancakeswap': 'tela-trocar',
    
    'sub-recompensas': 'tela-dao',
    'tela-pagar': 'tela-home',
    'tela-receber': 'tela-home',
    'tela-coletar': 'tela-home',
    'tela-trocar': 'tela-home'
};

// 7. Aplica a ação nas setas físicas sem conflito
document.querySelectorAll('.btn-voltar').forEach(botao => {
    botao.addEventListener('click', (e) => {
        e.preventDefault();
        const telaAtual = botao.closest('section');
        if (!telaAtual) return;

        const destino = caminhosVoltar[telaAtual.id];
        if (destino) {
            navegarPara(destino);
        } else {
            navegarPara('tela-home'); // Segurança
        }
    });
});

// Inicialização segura: Garante que a Home comece visível e o resto oculto
document.addEventListener('DOMContentLoaded', () => {
    navegarPara('tela-home');
});

console.log("Nitrogênio Protocolo: Home destravada e isolada com sucesso!");
