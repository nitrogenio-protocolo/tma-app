/* ==========================================================================
   Navegação Dinâmica Corrigida e Segura - Nitrogênio Protocolo
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
        console.warn(`Aviso: A tela "${idTela}" ainda não foi criada no HTML.`);
    }
}

// Função auxiliar para evitar que o código quebre caso o ID não exista no HTML
function adicionarCliqueSeguro(idBotao, idTelaDestino) {
    const elemento = document.getElementById(idBotao);
    if (elemento) {
        elemento.addEventListener('click', () => navegarPara(idTelaDestino));
    }
}

// 2. Eventos dos botões do Rodapé (Fixo)
adicionarCliqueSeguro('btn-menu-home', 'tela-home');
adicionarCliqueSeguro('btn-menu-nft', 'tela-nft');
adicionarCliqueSeguro('btn-menu-dao', 'tela-dao');
adicionarCliqueSeguro('btn-menu-redes', 'tela-redes');
adicionarCliqueSeguro('btn-menu-perfil', 'tela-perfil');

// 3. Eventos dos Novos Botões Rápidos da Home
adicionarCliqueSeguro('nav-pagar', 'tela-pagar');
adicionarCliqueSeguro('nav-receber', 'tela-receber');
adicionarCliqueSeguro('nav-trocar', 'tela-trocar');
adicionarCliqueSeguro('nav-coletar', 'tela-coletar');

// 4. Eventos de Sub-telas internas (Ações dos Cards) - Protegidos contra travamento!
adicionarCliqueSeguro('card-pagar-leitor', 'sub-pagar-leitor');
adicionarCliqueSeguro('card-receber-gerar', 'sub-receber-gerar-qr');
adicionarCliqueSeguro('card-coletar-executar', 'sub-coletar-executar');
adicionarCliqueSeguro('card-trocar-pancake', 'sub-trocar-pancakeswap');
adicionarCliqueSeguro('card-dao-recompensas', 'sub-recompensas');

// 5. Sub-recompensas da DAO
adicionarCliqueSeguro('card-recompensa-poupanca', 'folha-poupanca');
adicionarCliqueSeguro('card-recompensa-quiz', 'folha-quiz');
adicionarCliqueSeguro('card-recompensa-checkin', 'folha-checkin');
adicionarCliqueSeguro('card-recompensa-roleta', 'folha-roleta');

// 6. Mapa de Retorno Exato (Mapeia qual tela volta para onde, sem erros)
const mapaDeRetorno = {
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

// 7. Aplica a lógica em todos os botões "Voltar"
document.querySelectorAll('.btn-voltar').forEach(botao => {
    botao.addEventListener('click', () => {
        const telaAtual = botao.closest('section');
        if (!telaAtual) return;

        const idTelaDestino = mapaDeRetorno[telaAtual.id];

        if (idTelaDestino) {
            navegarPara(idTelaDestino);
        } else {
            navegarPara('tela-home');
        }
    });
});

console.log("Nitrogênio Protocolo: Proteção ativa. Central de Recompensas destravada!");
