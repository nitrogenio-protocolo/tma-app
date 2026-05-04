// --- 9. NOVOS ESPAÇOS E FUNÇÕES V2.2 ---

// Função do Olho (Privacidade)
let privacidadeAtiva = false;
function togglePrivacy() {
    privacidadeAtiva = !privacidadeAtiva;
    const btnOlho = document.querySelector('#btn-eye i');
    const saldos = document.querySelectorAll('.balance-amount, #saldo-safe-real');
    
    if (privacidadeAtiva) {
        btnOlho.classList.replace('fa-eye', 'fa-eye-slash');
        saldos.forEach(el => {
            el.dataset.valorOriginal = el.innerText; // Guarda o valor
            el.innerText = '•••• BNB'; // Esconde
        });
    } else {
        btnOlho.classList.replace('fa-eye-slash', 'fa-eye');
        saldos.forEach(el => {
            el.innerText = el.dataset.valorOriginal || '0.0000 BNB'; // Restaura
        });
    }
}

// Espaço Lazer (Conteúdo Inexistente - Placeholder)
function carregarConteudoLazer() {
    const container = document.getElementById('conteudo-lazer');
    if (!container) return;
    
    // Simulação de conteúdo para o futuro
    container.innerHTML = `
        <div class="card-lazer" style="background: #f8fafc; padding: 20px; border-radius: 15px; text-align: center;">
            <i class="fa-solid fa-gamepad" style="font-size: 40px; color: #007AFF; margin-bottom: 10px;"></i>
            <h3>Área de Descompressão</h3>
            <p>Em breve: Games Alpha e Rádio Nitrogênio.</p>
            <span class="status-tag">BREVE</span>
        </div>
    `;
}

// Espaço Protocolo (Conteúdo Inexistente - Placeholder)
function carregarDocumentacaoProtocolo() {
    const container = document.getElementById('conteudo-protocolo');
    if (!container) return;
    
    container.innerHTML = `
        <div class="doc-item" style="border-bottom: 1px solid #eee; padding: 15px 0;">
            <h4 style="margin:0">§ 1. O Contrato Safe</h4>
            <p style="font-size: 12px; color: #666;">A tesouraria é regida por 21 guardiões, exigindo 11 assinaturas para qualquer saída de capital.</p>
        </div>
        <div class="doc-item" style="padding: 15px 0;">
            <h4 style="margin:0">§ 2. Token N</h4>
            <p style="font-size: 12px; color: #666;">O suprimento é fixo em 1 bilhão de unidades, sem funções de cunhagem (mint) pós-implantação.</p>
        </div>
    `;
}

// Função para Resetar/Voltar Home (O "Giro")
function giroHome() {
    // Fecha todos os painéis e views abertos
    const paineis = document.querySelectorAll('.painel-lateral.aberto, .view-full');
    paineis.forEach(p => p.classList.remove('aberto'));
    const views = ['area-pagar', 'area-receber', 'area-nft'];
    views.forEach(v => fecharView(v));
    
    // Scroll suave para o topo
    document.querySelector('.main-content').scrollTo({ top: 0, behavior: 'smooth' });
    
    // Feedback visual de atualização
    console.log("Sistema Nitrogênio Reiniciado (Giro OK)");
    atualizarSaldoRealCofre();
}
