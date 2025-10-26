document.addEventListener("DOMContentLoaded", () => {
    let palavraSecreta = palavras[Math.floor(Math.random() * palavras.length)];
    console.log("Palavra secreta:", palavraSecreta);

    const linhas = document.querySelectorAll(".linha");
    const teclado = document.querySelectorAll("#keyboard .key");
    let linhaAtual = 0;
    let colunaAtual = 0;
    let jogoAtivo = true;

    // Sons
    const somAcerto = new Audio('audio/bell.mp3');
    somAcerto.preload = 'auto';
    const somTecla = new Audio('audio/tecla.mp3');
    somTecla.preload = 'auto';

    // Modais
    const modal = document.getElementById("fimJogoModal");
    const textoModal = document.getElementById("mensagemFim");
    const btnReiniciar = document.getElementById("btnReiniciar");
    const btnFechar = document.getElementById("btnFechar");
    const modal2 = document.getElementById("comojogarModal");
    const openComoJogar = document.getElementById("comojogar");
    const modal3 = document.getElementById("sobreModal");
    const openSobre = document.getElementById("sobre");
    const fecharSobre = document.getElementById("fechar");

    // Modal estatísticas
    const modalEstatisticas = document.getElementById("estatisticasModal");
    const openEstatisticas = document.getElementById("estatisticas");
    const fecharEstatisticas = document.getElementById("fecharEstatisticas");

    // Abrir/fechar modais
    openComoJogar.onclick = () => modal2.style.display = "flex";
    window.onclick = e => { if (e.target === modal2) modal2.style.display = "none"; };
    openSobre.onclick = () => modal3.style.display = "flex";
    fecharSobre.onclick = () => modal3.style.display = "none";
    openEstatisticas.onclick = () => {
        atualizarEstatisticasDOM();
        modalEstatisticas.style.display = "flex";
    };
    fecharEstatisticas.onclick = () => modalEstatisticas.style.display = "none";

    // Modos de jogo
    const tentativasPorModo = { facil: 6, medio: 5, dificil: 4 };
    let modoAtual = 'facil';
    let maxTentativas = tentativasPorModo[modoAtual];

    const seletorModo = document.getElementById('modoJogo');
    seletorModo.addEventListener('change', () => {
        modoAtual = seletorModo.value;
        maxTentativas = tentativasPorModo[modoAtual];
        reiniciarJogo();
    });

    // Estatísticas
    const stats = {
        partidas: 0,
        vitorias: 0,
        derrotas: 0,
        streak: 0,
        bestStreak: 0,
        carregar: function() {
            const data = JSON.parse(localStorage.getItem('dialetraStats'));
            if (data) {
                this.partidas = data.partidas;
                this.vitorias = data.vitorias;
                this.derrotas = data.derrotas;
                this.streak = data.streak;
                this.bestStreak = data.bestStreak;
            }
        },
        salvar: function() {
            localStorage.setItem('dialetraStats', JSON.stringify(this));
        }
    };
    stats.carregar();
   
    teclado.forEach(tecla => {
        tecla.addEventListener("click", () => {
            if (!jogoAtivo) return;
            const letra = tecla.dataset.letter;
            const action = tecla.dataset.key;
            if (letra) digitarLetra(letra);
            else if (action === "backspace") apagarLetra();
            else if (action === "enter") enviarPalavra();
        });
    });

    document.addEventListener('keydown', event => {
        if (!jogoAtivo) return;
        if (linhaAtual >= maxTentativas) return;
        const key = event.key.toUpperCase();
        if (/^[A-Z]$/.test(key)) digitarLetra(key);
        if (event.key === "Backspace") apagarLetra();
        if (event.key === "Enter") enviarPalavra();
    });

    // ---------------- FUNÇÕES PRINCIPAIS ---------------- //

    function enviarPalavra() {
        if (!jogoAtivo || getPalavraAtual().length !== 5) return;

        const palavraDigitada = getPalavraAtual().toLowerCase();
        const palavraSecretaNormalizada = palavraSecreta.toLowerCase();

        if (!palavras.includes(palavraDigitada)) {
            alert("Palavra inválida!");
            return;
        }

        verificarPalavra(palavraDigitada, palavraSecretaNormalizada);

        if (palavraDigitada === palavraSecretaNormalizada) {
            jogoAtivo = false;
            stats.partidas++;
            stats.vitorias++;
            stats.streak++;
            if (stats.streak > stats.bestStreak) stats.bestStreak = stats.streak;
            stats.salvar();
            mostrarFimJogo("Parabéns! Você acertou a palavra!");
            return;
        }

        if (linhaAtual >= maxTentativas - 1) {
            jogoAtivo = false;
            stats.partidas++;
            stats.derrotas++;
            stats.streak = 0;
            stats.salvar();
            mostrarFimJogo(`Fim de jogo! A palavra era: ${palavraSecreta}`);
            return;
        }

        linhaAtual++;
        colunaAtual = 0;
        atualizarAtiva();
        atualizarClicavel();
    }

    function verificarPalavra(palavra, palavraSecreta) {
        const linha = linhas[linhaAtual];
        const resultado = [];
        const letrasDisponiveis = {};

        for (let letra of palavraSecreta)
            letrasDisponiveis[letra] = (letrasDisponiveis[letra] || 0) + 1;

        // Verdes primeiro
        for (let i = 0; i < 5; i++) {
            if (palavra[i] === palavraSecreta[i]) {
                resultado[i] = 'verde';
                letrasDisponiveis[palavra[i]]--;
            }
        }
        // Amarelos / Cinzas
        for (let i = 0; i < 5; i++) {
            if (!resultado[i]) {
                const letra = palavra[i];
                if (letrasDisponiveis[letra] > 0) {
                    resultado[i] = 'amarelo';
                    letrasDisponiveis[letra]--;
                } else {
                    resultado[i] = 'cinza';
                }
            }
        }

        for (let i = 0; i < 5; i++) {
            const celula = linha.children[i];
            celula.style.backgroundColor =
                resultado[i] === 'verde' ? 'green' :
                resultado[i] === 'amarelo' ? 'gold' : 'red';
            atualizarTeclado(palavra[i].toUpperCase(), resultado[i]);
        }
    }

    function mostrarFimJogo(mensagem) {
        textoModal.textContent = mensagem;
        modal.style.display = "flex";
    }

    // ---------------- FUNÇÕES AUXILIARES ---------------- //

    function digitarLetra(key) {
        const celula = linhas[linhaAtual].children[colunaAtual];
        celula.textContent = key;
        tocarTecla();
        if (colunaAtual < 4) colunaAtual++;
        atualizarAtiva();
    }

    function apagarLetra() {
        const celulas = linhas[linhaAtual].children;
        if (celulas[colunaAtual].textContent === "" && colunaAtual > 0) colunaAtual--;
        celulas[colunaAtual].textContent = "";
        tocarTecla();
        atualizarAtiva();
    }

    function getPalavraAtual() {
        return Array.from(linhas[linhaAtual].children)
            .map(c => c.textContent)
            .join("");
    }

    function tocarTecla() {
        somTecla.currentTime = 0;
        somTecla.play();
    }

    function atualizarAtiva() {
        linhas.forEach((linha, li) => {
            linha.querySelectorAll(".celula").forEach((cel, ci) => {
                if (li === linhaAtual && ci === colunaAtual && jogoAtivo) {
                    cel.classList.add("ativa");
                } else {
                    cel.classList.remove("ativa");
                }
            });
        });
    }

    function atualizarClicavel() {
        linhas.forEach(linha => {
            linha.querySelectorAll(".celula").forEach(c => {
                c.replaceWith(c.cloneNode(true));
            });
        });

        linhas[linhaAtual].querySelectorAll(".celula").forEach((celula, ci) => {
            celula.addEventListener("click", () => {
                if (!jogoAtivo) return;
                colunaAtual = ci;
                atualizarAtiva();
            });
        });
    }

    function atualizarTeclado(letra, status) {
        const key = document.querySelector(`#keyboard .key[data-letter="${letra}"]`);
        if (!key) return;
        if (key.classList.contains("verde")) return;
        if (key.classList.contains("amarelo") && status === "cinza") return;
        key.classList.remove("verde", "amarelo", "cinza");
        key.classList.add(status);
    }

    function reiniciarJogo() {
        linhaAtual = 0;
        colunaAtual = 0;
        jogoAtivo = true;
        palavraSecreta = palavras[Math.floor(Math.random() * palavras.length)];
        console.log("Nova palavra secreta:", palavraSecreta);

        linhas.forEach((linha, index) => {
            linha.querySelectorAll(".celula").forEach(celula => {
                celula.textContent = "";
                celula.style.backgroundColor = "#5f5f5f";
            });
            linha.style.display = index < maxTentativas ? "flex" : "none";
        });

        teclado.forEach(tecla => {
            tecla.classList.remove("verde", "amarelo", "cinza");
        });

        atualizarAtiva();
        atualizarClicavel();
    }

    function atualizarEstatisticasDOM() {
        document.getElementById("estat-partidas").textContent = stats.partidas;
        document.getElementById("estat-vitorias").textContent = stats.vitorias;
        document.getElementById("estat-derrotas").textContent = stats.derrotas;
        document.getElementById("estat-streak").textContent = stats.streak;
        document.getElementById("estat-best").textContent = stats.bestStreak;
    }


    btnReiniciar.addEventListener("click", () => {
        reiniciarJogo();
        modal.style.display = "none";
    });
    btnFechar.addEventListener("click", () => modal.style.display = "none");

    atualizarAtiva();
    atualizarClicavel();
});
