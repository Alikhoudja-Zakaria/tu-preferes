/* ═══════════════════════════════════════════
   TU PRÉFÈRES — Logique du jeu
   fait pour Assia ❤️
   ═══════════════════════════════════════════ */

const questionsDisponibles = typeof QUESTIONS !== 'undefined' ? QUESTIONS : [];
const TOTAL_QUESTIONS = questionsDisponibles.length;

let questionsDeJeu = [];
let indexQuestionCourante = 0;
let idQuestionsRepondues = [];
let questionsDansSession = 0; // compteur de la session en cours

// Animations surprise disponibles
const SURPRISE_ANIMS = [
    'anim-slide-up',
    'anim-slide-down',
    'anim-peek-left',
    'anim-peek-right',
    'anim-zoom-center',
    'anim-spin-in'
];
let surpriseEnCours = false;

// ── Éléments du DOM ──────────────────────────
const dom = {
    landing:      document.getElementById('landing-screen'),
    game:         document.getElementById('game-screen'),
    end:          document.getElementById('end-screen'),
    
    btnJouer:     document.getElementById('btn-jouer'),
    btnRejouer:   document.getElementById('btn-rejouer'),
    
    counter:      document.getElementById('question-counter'),
    progressBar:  document.getElementById('progress-bar'),
    
    btnA:         document.getElementById('btn-option-a'),
    textA:        document.getElementById('text-option-a'),
    barA:         document.getElementById('bar-option-a'),
    pctA:         document.getElementById('pct-option-a'),
    
    btnB:         document.getElementById('btn-option-b'),
    textB:        document.getElementById('text-option-b'),
    barB:         document.getElementById('bar-option-b'),
    pctB:         document.getElementById('pct-option-b'),
    
    reaction:     document.getElementById('reaction-message'),
    btnNext:      document.getElementById('btn-next'),
    
    // Bottom nav
    bottomNav:    document.getElementById('bottom-nav'),
    navPlay:      document.getElementById('nav-play'),
    navStats:     document.getElementById('nav-stats'),
    navReset:     document.getElementById('nav-reset'),
    
    // Stats modal
    statsModal:   document.getElementById('stats-modal'),
    closeStats:   document.getElementById('close-stats'),
    statAnswered: document.getElementById('stat-answered'),
    statRemaining:document.getElementById('stat-remaining'),
    statPercent:  document.getElementById('stat-percent'),
    statStreak:   document.getElementById('stat-streak'),
    
    // Surprise
    surprise:     document.getElementById('surprise-img')
};

// ── Initialisation ───────────────────────────
function init() {
    // Restaurer la progression
    const saved = localStorage.getItem('tu_preferes_answered');
    if (saved) {
        try { idQuestionsRepondues = JSON.parse(saved); }
        catch { idQuestionsRepondues = []; }
    }

    // Événements principaux
    dom.btnJouer.addEventListener('click', demarrerJeu);
    dom.btnRejouer.addEventListener('click', reinitialiserJeu);
    dom.btnA.addEventListener('click', () => gererVote('A'));
    dom.btnB.addEventListener('click', () => gererVote('B'));
    dom.btnNext.addEventListener('click', questionSuivante);
    
    // Bottom nav
    dom.navStats.addEventListener('click', ouvrirStats);
    dom.navReset.addEventListener('click', confirmerReset);
    dom.closeStats.addEventListener('click', fermerStats);
    
    // Fermer modal en cliquant le backdrop
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.addEventListener('click', fermerStats);

    // Support clavier
    document.addEventListener('keydown', (e) => {
        if (dom.game.classList.contains('hidden')) return;
        if (!dom.statsModal.classList.contains('hidden')) {
            if (e.key === 'Escape') fermerStats();
            return;
        }
        
        if (e.key === '1' || e.key === 'a' || e.key === 'A') {
            if (!dom.btnA.disabled) gererVote('A');
        } else if (e.key === '2' || e.key === 'b' || e.key === 'B') {
            if (!dom.btnB.disabled) gererVote('B');
        } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
            if (!dom.btnNext.classList.contains('hidden')) {
                e.preventDefault();
                questionSuivante();
            }
        }
    });

    // Haptic feedback sur mobile (si supporté)
    document.querySelectorAll('.option-btn, .neon-button, .next-btn, .nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            if (navigator.vibrate) navigator.vibrate(10);
        });
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
    dom.bottomNav.classList.remove('hidden');
    
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
    questionsDansSession = 0;
    
    majProgressBar();
    afficherQuestion();
}

// ── Réinitialiser ────────────────────────────
function reinitialiserJeu() {
    idQuestionsRepondues = [];
    questionsDansSession = 0;
    sauvegarder();
    dom.end.classList.add('hidden');
    dom.bottomNav.classList.remove('hidden');
    demarrerJeu();
}

function confirmerReset() {
    if (confirm('Remettre à zéro ta progression ? 🗑️')) {
        idQuestionsRepondues = [];
        questionsDansSession = 0;
        sauvegarder();
        // Recharger les questions
        let restantes = [...questionsDisponibles];
        questionsDeJeu = melanger(restantes);
        indexQuestionCourante = 0;
        majProgressBar();
        afficherQuestion();
    }
}

// ── Sauvegarde ───────────────────────────────
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
    
    dom.counter.textContent = `${num} / ${TOTAL_QUESTIONS}`;
    
    dom.textA.textContent = q.a;
    dom.textB.textContent = q.b;
    
    dom.btnA.disabled = false;
    dom.btnB.disabled = false;
    
    dom.btnA.classList.remove('selected', 'dimmed', 'show-result');
    dom.btnB.classList.remove('selected', 'dimmed', 'show-result');
    
    dom.barA.style.width = '0%';
    dom.barB.style.width = '0%';
    
    dom.pctA.textContent = '';
    dom.pctB.textContent = '';
    
    dom.reaction.classList.add('hidden');
    dom.reaction.classList.remove('show');
    dom.btnNext.classList.add('hidden');
}

// ── Gérer un vote ────────────────────────────
function gererVote(choix) {
    const q = questionsDeJeu[indexQuestionCourante];
    const pctA = q.pctA;
    const pctB = 100 - pctA;
    
    idQuestionsRepondues.push(q.id);
    questionsDansSession++;
    sauvegarder();
    
    dom.btnA.disabled = true;
    dom.btnB.disabled = true;
    
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
    
    // Animer les barres
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            dom.barA.style.width = `${pctA}%`;
            dom.barB.style.width = `${pctB}%`;
        });
    });
    
    animerNombre(dom.pctA, pctA, 900);
    animerNombre(dom.pctB, pctB, 900);
    
    afficherReaction(pctUtilisateur);
    majProgressBar();
    
    // Surprise photo — pop toutes les 5-8 questions
    verifierSurprise();
    
    setTimeout(() => {
        dom.btnNext.classList.remove('hidden');
    }, 800);
}

// ── Surprise photo d'Assia ───────────────────
function verifierSurprise() {
    if (surpriseEnCours) return;
    
    // Pop toutes les 5-8 questions aléatoirement
    const intervalle = 5 + Math.floor(Math.random() * 4);
    if (questionsDansSession > 0 && questionsDansSession % intervalle === 0) {
        declencherSurprise();
    }
}

function declencherSurprise() {
    if (surpriseEnCours) return;
    surpriseEnCours = true;
    
    // Retirer toutes les anciennes classes d'animation
    SURPRISE_ANIMS.forEach(cls => dom.surprise.classList.remove(cls));
    
    // Choisir une animation au hasard
    const anim = SURPRISE_ANIMS[Math.floor(Math.random() * SURPRISE_ANIMS.length)];
    
    // Reset des styles inline (pour les positions)
    dom.surprise.style = '';
    
    // Activer
    dom.surprise.classList.add('active', anim);
    
    // Retirer après l'animation
    setTimeout(() => {
        dom.surprise.classList.remove('active', anim);
        surpriseEnCours = false;
    }, 3200);
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
    dom.bottomNav.classList.add('hidden');
    dom.end.classList.remove('hidden');
}

// ── Stats ────────────────────────────────────
function ouvrirStats() {
    const answered = idQuestionsRepondues.length;
    const remaining = TOTAL_QUESTIONS - answered;
    const percent = TOTAL_QUESTIONS > 0 ? Math.round((answered / TOTAL_QUESTIONS) * 100) : 0;
    
    dom.statAnswered.textContent = answered;
    dom.statRemaining.textContent = remaining;
    dom.statPercent.textContent = `${percent}%`;
    dom.statStreak.textContent = questionsDansSession;
    
    dom.statsModal.classList.remove('hidden');
}

function fermerStats() {
    dom.statsModal.classList.add('hidden');
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
