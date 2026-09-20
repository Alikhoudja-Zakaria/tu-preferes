/* ═══════════════════════════════════════════
   TU PRÉFÈRES — Logique du jeu
   ═══════════════════════════════════════════ */

// Récupérer les questions (fallback tableau vide)
const questionsDisponibles = typeof QUESTIONS !== 'undefined' ? QUESTIONS : [];
const TOTAL_QUESTIONS = questionsDisponibles.length;

let questionsDeJeu = [];
let indexQuestionCourante = 0;
let idQuestionsRepondues = [];

// ── Éléments du DOM ──────────────────────────
const dom = {
    landing:    document.getElementById('landing-screen'),
    game:       document.getElementById('game-screen'),
    end:        document.getElementById('end-screen'),
    
    btnJouer:   document.getElementById('btn-jouer'),
    btnRejouer: document.getElementById('btn-rejouer'),
    
    counter:    document.getElementById('question-counter'),
    progressBar: document.getElementById('progress-bar'),
    
    btnA:       document.getElementById('btn-option-a'),
    textA:      document.getElementById('text-option-a'),
    barA:       document.getElementById('bar-option-a'),
    pctA:       document.getElementById('pct-option-a'),
    
    btnB:       document.getElementById('btn-option-b'),
    textB:      document.getElementById('text-option-b'),
    barB:       document.getElementById('bar-option-b'),
    pctB:       document.getElementById('pct-option-b'),
    
    reaction:   document.getElementById('reaction-message'),
    btnNext:    document.getElementById('btn-next')
};

// ── Initialisation ───────────────────────────
function init() {
    // Restaurer la progression
    const saved = localStorage.getItem('tu_preferes_answered');
    if (saved) {
        try { idQuestionsRepondues = JSON.parse(saved); }
        catch { idQuestionsRepondues = []; }
    }

    // Événements
    dom.btnJouer.addEventListener('click', demarrerJeu);
    dom.btnRejouer.addEventListener('click', reinitialiserJeu);
    dom.btnA.addEventListener('click', () => gererVote('A'));
    dom.btnB.addEventListener('click', () => gererVote('B'));
    dom.btnNext.addEventListener('click', questionSuivante);

    // Support clavier
    document.addEventListener('keydown', (e) => {
        if (dom.game.classList.contains('hidden')) return;
        
        if (e.key === '1' || e.key === 'a' || e.key === 'A') {
            if (!dom.btnA.disabled) gererVote('A');
        } else if (e.key === '2' || e.key === 'b' || e.key === 'B') {
            if (!dom.btnB.disabled) gererVote('B');
        } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
            if (!dom.btnNext.classList.contains('hidden')) questionSuivante();
        }
    });
}

// ── Mélange Fisher-Yates ─────────────────────
function melanger(arr) {
    const tab = [...arr];
    for (let i = tab.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tab[i], tab[j]] = [tab[j], tab[i]];
    }
    return tab;
}

// ── Démarrer le jeu ──────────────────────────
function demarrerJeu() {
    dom.landing.classList.add('hidden');
    dom.game.classList.remove('hidden');
    
    // Filtrer les questions déjà répondues
    let restantes = questionsDisponibles.filter(q => !idQuestionsRepondues.includes(q.id));
    
    if (restantes.length === 0) {
        if (questionsDisponibles.length > 0) {
            restantes = [...questionsDisponibles];
            idQuestionsRepondues = [];
            sauvegarder();
        } else {
            return;
        }
    }
    
    questionsDeJeu = melanger(restantes);
    indexQuestionCourante = 0;
    
    majProgressBar();
    afficherQuestion();
}

// ── Réinitialiser ────────────────────────────
function reinitialiserJeu() {
    idQuestionsRepondues = [];
    sauvegarder();
    dom.end.classList.add('hidden');
    demarrerJeu();
}

// ── Sauvegarde localStorage ──────────────────
function sauvegarder() {
    localStorage.setItem('tu_preferes_answered', JSON.stringify(idQuestionsRepondues));
}

// ── Afficher une question ────────────────────
function afficherQuestion() {
    if (indexQuestionCourante >= questionsDeJeu.length) {
        terminerJeu();
        return;
    }

    const q = questionsDeJeu[indexQuestionCourante];
    const num = idQuestionsRepondues.length + 1;
    
    // Compteur
    dom.counter.textContent = `${num} / ${TOTAL_QUESTIONS}`;
    
    // Texte des options
    dom.textA.textContent = q.a;
    dom.textB.textContent = q.b;
    
    // Réactiver les boutons
    dom.btnA.disabled = false;
    dom.btnB.disabled = false;
    
    // Reset des classes
    dom.btnA.classList.remove('selected', 'dimmed', 'show-result');
    dom.btnB.classList.remove('selected', 'dimmed', 'show-result');
    
    // Reset des barres
    dom.barA.style.width = '0%';
    dom.barB.style.width = '0%';
    
    // Reset des pourcentages
    dom.pctA.textContent = '';
    dom.pctB.textContent = '';
    
    // Cacher réaction et bouton next
    dom.reaction.classList.add('hidden');
    dom.reaction.classList.remove('show');
    dom.btnNext.classList.add('hidden');
}

// ── Gérer un vote ────────────────────────────
function gererVote(choix) {
    const q = questionsDeJeu[indexQuestionCourante];
    const pctA = q.pctA;
    const pctB = 100 - pctA;
    
    // Sauvegarder
    idQuestionsRepondues.push(q.id);
    sauvegarder();
    
    // Désactiver les boutons
    dom.btnA.disabled = true;
    dom.btnB.disabled = true;
    
    // Classes visuelles
    dom.btnA.classList.add('show-result');
    dom.btnB.classList.add('show-result');
    
    let pctUtilisateur;
    if (choix === 'A') {
        dom.btnA.classList.add('selected');
        dom.btnB.classList.add('dimmed');
        pctUtilisateur = pctA;
    } else {
        dom.btnB.classList.add('selected');
        dom.btnA.classList.add('dimmed');
        pctUtilisateur = pctB;
    }
    
    // Animer les barres (petit délai pour le repaint)
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            dom.barA.style.width = `${pctA}%`;
            dom.barB.style.width = `${pctB}%`;
        });
    });
    
    // Animer les chiffres
    animerNombre(dom.pctA, pctA, 900);
    animerNombre(dom.pctB, pctB, 900);
    
    // Réaction
    afficherReaction(pctUtilisateur);
    
    // Barre de progression
    majProgressBar();
    
    // Bouton suivant (après animation)
    setTimeout(() => {
        dom.btnNext.classList.remove('hidden');
    }, 800);
}

// ── Messages de réaction ─────────────────────
function afficherReaction(pct) {
    let msg;
    
    if (pct >= 45 && pct <= 55)       msg = "C'est serré ! 🔥";
    else if (pct > 55 && pct <= 70)   msg = "Dans la norme 👥";
    else if (pct > 70 && pct <= 85)   msg = "Classique 😎";
    else if (pct > 85 && pct <= 95)   msg = "Sans surprise 😴";
    else if (pct > 95)                msg = "Évidemment 🙄";
    else if (pct >= 30 && pct < 45)   msg = "T'es spécial toi 🦄";
    else if (pct >= 15 && pct < 30)   msg = "T'es un original ! 🤨";
    else if (pct >= 5 && pct < 15)    msg = "Sérieusement ?! 😳";
    else                              msg = "T'es un GRAND malade 🤯";
    
    dom.reaction.textContent = msg;
    dom.reaction.classList.remove('hidden');
    
    setTimeout(() => dom.reaction.classList.add('show'), 400);
}

// ── Question suivante ────────────────────────
function questionSuivante() {
    indexQuestionCourante++;
    afficherQuestion();
}

// ── Fin du jeu ───────────────────────────────
function terminerJeu() {
    dom.game.classList.add('hidden');
    dom.end.classList.remove('hidden');
}

// ── Barre de progression ─────────────────────
function majProgressBar() {
    if (!dom.progressBar) return;
    const pct = (idQuestionsRepondues.length / TOTAL_QUESTIONS) * 100;
    dom.progressBar.style.width = `${pct}%`;
}

// ── Animation de nombre ──────────────────────
function animerNombre(el, cible, duree) {
    let debut = null;
    
    function step(ts) {
        if (!debut) debut = ts;
        const progress = ts - debut;
        const ratio = Math.min(progress / duree, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - ratio, 3);
        const valeur = Math.round(eased * cible);
        el.textContent = `${valeur}%`;
        
        if (progress < duree) {
            requestAnimationFrame(step);
        } else {
            el.textContent = `${cible}%`;
        }
    }
    
    requestAnimationFrame(step);
}

// ── Lancement ────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
