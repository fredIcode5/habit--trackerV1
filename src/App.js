import { useState, useEffect, useRef } from "react";

// ═════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═════════════════════════════════════════════════════════════════════════════

const MAX_HABITS = 16;

const JOURS_FR    = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const DAY_LTRS    = ["L","M","M","J","V","S","D"];
const JOURS_SEMAINE = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const MOIS_ANNEE  = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const FLAME_PALIERS = [
  { jours: 80, couleur: "#00008B", label: "Légendaire"    },
  { jours: 75, couleur: "#1E90FF", label: "Maître"        },
  { jours: 60, couleur: "#40E0D0", label: "Expert"        },
  { jours: 45, couleur: "#FFD700", label: "Avancé"        },
  { jours: 30, couleur: "#FF8C00", label: "Confirmé"      },
  { jours: 15, couleur: "#FF4500", label: "Intermédiaire" },
  { jours:  1, couleur: "#FF0000", label: "Débutant"      },
];

// ═════════════════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ═════════════════════════════════════════════════════════════════════════════

// Retourne la date du jour au format "2026-02-28"
function aujourdhuiISO() {
  return new Date().toISOString().slice(0, 10);
}

// Génère un ID unique
function genererID() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// Retourne le palier de flamme selon le nombre de jours de streak
function getPalier(streak) {
  if (streak < 1) return { couleur: "#2a2a2a", label: "Éteinte" };
  for (const p of FLAME_PALIERS) {
    if (streak >= p.jours) return p;
  }
  return { couleur: "#FF0000", label: "Débutant" };
}

// Calcule le streak (jours consécutifs validés) d'une habitude
function calcStreak(habitId, completions) {
  const aujourdhui = new Date();
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date(aujourdhui);
    d.setDate(aujourdhui.getDate() - i);
    const dateISO = d.toISOString().slice(0, 10);
    const trouve = completions.some((c) => c.habitId === habitId && c.date === dateISO);
    if (trouve) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// Calcule le nombre de fois où le streak a été brisé (extinctions)
function calcExtinctions(habitId, completions) {
  const dates = completions
    .filter((c) => c.habitId === habitId)
    .map((c) => c.date)
    .sort();
  if (dates.length === 0) return 0;
  let count = 0;
  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i]) - new Date(dates[i - 1])) / 86400000;
    if (diff > 1) count++;
  }
  return count;
}

// Retourne la date de début du streak actuel
function calcDebutStreak(habitId, completions) {
  const aujourdhui = new Date();
  let debut = null;
  for (let i = 0; i < 400; i++) {
    const d = new Date(aujourdhui);
    d.setDate(aujourdhui.getDate() - i);
    const dateISO = d.toISOString().slice(0, 10);
    const trouve = completions.some((c) => c.habitId === habitId && c.date === dateISO);
    if (trouve) {
      debut = dateISO;
    } else {
      break;
    }
  }
  return debut;
}

// Formate une date ISO en "12 jan. 2026"
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

// Calcule le niveau et l'XP à partir du total d'XP
function calculerNiveau(xpTotal) {
  function xpPourNiveau(n) {
    return Math.round(500 * n * (1 + n * 0.3));
  }
  let niveau = 1;
  let xp = xpTotal;
  while (xp >= xpPourNiveau(niveau)) {
    xp -= xpPourNiveau(niveau);
    niveau++;
  }
  return { niveau, xpRestant: xp, xpNiveau: xpPourNiveau(niveau) };
}

// Retourne les 7 dates de la semaine courante
function getDatesLaSemaine() {
  const aujourdhui = new Date();
  const jourSemaine = aujourdhui.getDay();
  const lundi = new Date(aujourdhui);
  lundi.setDate(aujourdhui.getDate() - (jourSemaine === 0 ? 6 : jourSemaine - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lundi);
    d.setDate(lundi.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

// Retourne tous les jours du mois courant
function getJoursDuMois() {
  const aujourdhui = new Date();
  const nbJours = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() + 1, 0).getDate();
  return Array.from({ length: nbJours }, (_, i) => {
    const d = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), i + 1);
    return {
      date: d.toISOString().slice(0, 10),
      dow: d.getDay() === 0 ? 6 : d.getDay() - 1, // 0=lundi ... 6=dimanche
    };
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPOSANT : FLAMME SVG
// ═════════════════════════════════════════════════════════════════════════════

function FlameIcon({ color, size = 36, lit }) {
  const FLAME_PATH = "M457 471.85 c0 -0.95 0.30 -2.35 0.70 -3.15 0.40 -0.80 2.05 -4.60 3.70 -8.45 1.65 -3.85 3.75 -8.55 4.60 -10.50 1.85 -4.15 6 -14.35 8.10 -20 3.60 -9.70 5.55 -15.20 6.40 -18 0.50 -1.65 1.70 -5.60 2.65 -8.75 11.85 -38.80 16.10 -64.55 13.65 -82.75 -1.80 -13.35 -7.45 -32 -13.10 -43.35 -7.75 -15.60 -15.30 -26.05 -28.95 -40.35 -7.25 -7.60 -20.80 -20.20 -21.20 -19.70 -0.25 0.20 -0.80 1.75 -1.30 3.40 -1.80 6.10 -10.35 26.80 -14.90 36.30 -9.15 18.85 -21.05 38.25 -36.40 58.95 -10 13.60 -13.30 18.35 -16.25 23.40 -7.55 13.10 -10.70 28.65 -8.40 41.85 2.70 15.80 11.60 35.20 24.90 54.25 5.60 8 10.85 14.40 22.90 27.90 1.30 1.45 1.90 2.65 1.90 3.65 0 1.40 -0.10 1.45 -2.10 1.45 -3.10 0 -22.85 -5.05 -28.25 -7.25 -12.40 -5 -33.25 -20 -48.10 -34.75 -12.30 -12.15 -21.55 -24.10 -29.55 -38.15 -7.45 -13.10 -11.90 -25.25 -15.30 -41.85 -1.35 -6.45 -1.40 -7.40 -1.40 -21.25 -0.05 -16.15 0.55 -22.35 3.30 -33.75 5.25 -21.85 13.55 -38.15 32.15 -63.25 2.25 -3 6.55 -9 9.60 -13.25 3 -4.25 6.60 -9.30 8 -11.25 2.40 -3.25 12.30 -19.45 15.55 -25.35 9.20 -16.80 15.50 -31.70 22.60 -53.40 4.75 -14.60 9.85 -37 13.50 -59 l2.15 -12.75 3.45 -2.10 c2.10 -1.30 4.15 -2.15 5.05 -2.15 1.10 0 3.10 1.20 7.80 4.65 3.45 2.60 9.35 6.90 13.05 9.60 9.75 7.15 27.10 21.05 35.50 28.55 4 3.55 8.30 7.30 9.50 8.35 4.25 3.65 23.65 23.10 30 30.10 29.85 32.95 52.55 69 64.40 102.25 13.10 36.95 15.55 76.45 6.85 110.75 -1.15 4.70 -2.95 10.65 -3.90 13.25 -0.95 2.60 -2.25 6.20 -2.90 8 -0.65 1.80 -2.55 6.05 -4.20 9.50 -1.70 3.45 -3.50 7.15 -4.05 8.25 -0.90 1.95 -7.15 12.45 -10.45 17.50 -3.25 5.05 -12.50 16.65 -18.25 23 -13.70 15.10 -27.65 27.40 -49.40 43.65 -8.50 6.40 -10.40 7.60 -11.85 7.60 -1.65 0 -1.75 -0.10 -1.75 -1.65z";
  return (
    <svg width={size} height={size * 2} viewBox="300 45 240 445" style={{ display: "block" }}>
      <path d={FLAME_PATH} fill={lit ? color : "#2e2e2e"} />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPOSANT : TOOLTIP DE FLAMME
// ═════════════════════════════════════════════════════════════════════════════

function FlameTooltip({ habit, streak, palier, extinctions, debutStreak }) {
  return (
    <div style={{
      position: "absolute", top: "calc(10% + 1px)", left: "0%",
      transform: "translateX(-150%)", background: "#111",
      border: `1px solid ${palier.couleur}`, borderRadius: 9,
      padding: "10px 13px", width: 186, zIndex: 300, pointerEvents: "none",
      boxShadow: `0 6px 24px ${palier.couleur}44`,
    }}>
      <div style={{ color: "white", fontWeight: 700, fontSize: 12, marginBottom: 7, borderBottom: "1px solid #252525", paddingBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{habit.nom}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: palier.couleur }} />
        <span style={{ color: palier.couleur, fontSize: 11, fontWeight: "bold" }}>{palier.label}</span>
      </div>
      {[
        { label: "Allumée depuis",    value: formatDate(debutStreak) },
        { label: "Jours consécutifs", value: streak > 0 ? `${streak}j` : "Éteinte" },
        { label: "Extinctions",       value: String(extinctions), color: extinctions > 0 ? "#ff7070" : "#6bff9b" },
      ].map(({ label, value, color }) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
          <span style={{ color: "#555", fontSize: 10 }}>{label}</span>
          <span style={{ color: color || "#bbb", fontSize: 10, fontWeight: "bold" }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPOSANT : CELLULE FLAMME (dans la grille)
// ═════════════════════════════════════════════════════════════════════════════

function FlameCell({ habit, completions }) {
  const [hovered, setHovered] = useState(false);

  // On calcule toutes les stats de cette flamme
  const streak      = calcStreak(habit.id, completions);
  const extinctions = calcExtinctions(habit.id, completions);
  const debutStreak = calcDebutStreak(habit.id, completions);
  const palier      = getPalier(streak);
  const estAllumee  = streak > 0;

  return (
    <div
      style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", cursor: "default" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tooltip visible au survol */}
      {hovered && (
        <FlameTooltip
          habit={habit} streak={streak} palier={palier}
          extinctions={extinctions} debutStreak={debutStreak}
        />
      )}
      <div style={{
        transition: "transform 0.2s ease",
        transform: hovered ? "scale(1.18) translateY(-3px)" : "scale(1)",
        filter: estAllumee ? `drop-shadow(0 0 7px ${palier.couleur}90)` : "none",
      }}>
        <FlameIcon color={palier.couleur} size={24} lit={estAllumee} />
      </div>
      <div style={{ color: estAllumee ? palier.couleur : "#3a3a3a", fontSize: 8, textAlign: "center", marginTop: 1, maxWidth: 52, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {habit.nom}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPOSANT : GRILLE DE FLAMMES
// ═════════════════════════════════════════════════════════════════════════════

function GrilleFlammes({ habits, completions }) {
  // On crée 16 cases, certaines vides
  const cases = Array.from({ length: MAX_HABITS }, (_, i) => habits[i] || null);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
      <div style={{ color: "#555", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        Mes Foyers &nbsp;<span style={{ color: "#444" }}>{habits.length}/{MAX_HABITS}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 56px)", gridTemplateRows: "repeat(2, 66px)", gap: "0px 4px" }}>
        {cases.map((habit, i) =>
          habit ? (
            <FlameCell key={habit.id} habit={habit} completions={completions} />
          ) : (
            <div key={`vide_${i}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 2, opacity: 0.18 }}>
              <FlameIcon color="#333" size={34} lit={false} />
              <div style={{ color: "#333", fontSize: 8, marginTop: 1 }}>—</div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPOSANT : MINI GRAPHIQUE SVG
// ═════════════════════════════════════════════════════════════════════════════

function MiniGraphique({ completions }) {
  const W = 290, H = 118;
  const PAD = { top: 10, right: 8, bottom: 28, left: 26 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;

  // On récupère les 14 derniers jours
  const derniers14Jours = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });

  // Pour chaque jour, on compte combien d'habitudes ont été validées
  const donnees = derniers14Jours.map((date) => ({
    date,
    count: completions.filter((c) => c.date === date).length,
  }));

  const maxCount = Math.max(...donnees.map((d) => d.count), 1);
  const aujourdhui = aujourdhuiISO();

  // On calcule les coordonnées de chaque point du graphique
  const points = donnees.map((d, i) => ({
    x: PAD.left + (i / 13) * iW,
    y: PAD.top + iH - (d.count / maxCount) * iH,
    count: d.count,
    date: d.date,
  }));

  const aireRemplie = [
    `M ${points[0].x},${PAD.top + iH}`,
    ...points.map((p) => `L ${p.x},${p.y}`),
    `L ${points[13].x},${PAD.top + iH}`,
    "Z",
  ].join(" ");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ color: "#555", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        Validations — 14 derniers jours
      </div>
      <svg width={W} height={H} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#ce6e14" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ce6e14" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top}    x2={PAD.left}        y2={PAD.top+iH} stroke="#2e2e2e" strokeWidth="1" />
        <line x1={PAD.left} y1={PAD.top+iH} x2={PAD.left+iW}     y2={PAD.top+iH} stroke="#2e2e2e" strokeWidth="1" />
        {/* Lignes horizontales de référence */}
        {[0, 0.5, 1].map((ratio) => {
          const y = PAD.top + iH - ratio * iH;
          return (
            <g key={ratio}>
              <line x1={PAD.left} y1={y} x2={PAD.left+iW} y2={y} stroke="#222" strokeWidth="1" strokeDasharray="3,4" />
              <text x={PAD.left-4} y={y+4} textAnchor="end" fill="#3a3a3a" fontSize="8">{Math.round(ratio * maxCount)}</text>
            </g>
          );
        })}
        {/* Labels de l'axe X */}
        {[{ i:0, l:"J-13" }, { i:6, l:"J-7" }, { i:13, l:"Auj" }].map(({ i, l }) => (
          <text key={i} x={points[i].x} y={PAD.top+iH+16} textAnchor="middle" fill="#444" fontSize="8">{l}</text>
        ))}
        {/* Aire remplie + courbe */}
        <path d={aireRemplie} fill="url(#gradient)" />
        <polyline points={points.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#ce6e14" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
        {/* Points */}
        {points.map((p, i) => p.count > 0 && (
          <circle key={i} cx={p.x} cy={p.y}
            r={p.date === aujourdhui ? 4.5 : 2.5}
            fill={p.date === aujourdhui ? "#ff9040" : "#ce6e14"}
            stroke={p.date === aujourdhui ? "white" : "#1a1a1a"}
            strokeWidth={p.date === aujourdhui ? 1.5 : 0.8}
          />
        ))}
      </svg>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPOSANT : HEADER
// ═════════════════════════════════════════════════════════════════════════════

function AppHeader() {
  // Style de base pour les boutons du header
  const styleBtn = {
    background: "transparent", color: "white", border: "none",
    padding: "10px 20px", borderRadius: 25, fontSize: 15,
    cursor: "pointer", transition: "background 0.2s",
  };

  return (
    <header style={{ background: "#1a1a1a", display: "flex", alignItems: "center", padding: "10px 24px", justifyContent: "space-between", borderBottom: "1px solid #2a2a2a" }}>
      {/* Logo */}
      <button style={{ ...styleBtn, fontWeight: "bold", fontSize: 17, color: "#ce6e14" }}>
        Daily-Flame
      </button>

      {/* Navigation centrale */}
      <nav style={{ display: "flex", gap: 8 }}>
        {["Social", "Stats", "Settings"].map((label) => (
          <button
            key={label}
            style={styleBtn}
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(206,110,20,0.15)"}
            onMouseOut={(e)  => e.currentTarget.style.background = "transparent"}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Boutons droite */}
      <div style={{ display: "flex", gap: 8 }}>
        <button style={{ ...styleBtn, color: "#aaa" }}>Inscription</button>
        <button style={{ ...styleBtn, border: "1px solid #ce6e14", color: "#ce6e14" }}>Connexion</button>
      </div>
    </header>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPOSANT : LÉGENDE DES RANGS
// ═════════════════════════════════════════════════════════════════════════════

function LegendeFlammes() {
  const rangs = [
    { range: "7–14j",  c: "#FF0000", l: "Débutant"      },
    { range: "15–29j", c: "#FF4500", l: "Intermédiaire" },
    { range: "30–44j", c: "#FF8C00", l: "Confirmé"      },
    { range: "45–59j", c: "#FFD700", l: "Avancé"        },
    { range: "60–74j", c: "#40E0D0", l: "Expert"        },
    { range: "75–79j", c: "#1E90FF", l: "Maître"        },
    { range: "80j+",   c: "#00008B", l: "Légendaire"    },
  ];
  return (
    <div style={{ background: "#141414", padding: "6px 24px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", borderBottom: "1px solid #222" }}>
      <span style={{ color: "#444", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0 }}>Rangs flamme :</span>
      {rangs.map(({ range, c, l }) => (
        <div key={range} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: c, boxShadow: `0 0 5px ${c}` }} />
          <span style={{ fontSize: 9, color: "#555" }}>
            <span style={{ color: c }}>{l}</span>&nbsp;{range}
          </span>
        </div>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPOSANT : SECTION HERO (XP + graphique + flammes)
// ═════════════════════════════════════════════════════════════════════════════

function Hero({ xpTotal, habits, completions }) {
  const { niveau, xpRestant, xpNiveau } = calculerNiveau(xpTotal);
  const pourcentage = Math.round((xpRestant / xpNiveau) * 100);

  return (
    <main style={{
      background: "linear-gradient(135deg, #141414 0%, #1c1410 100%)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      minHeight: 190, padding: "14px 36px", borderBottom: "1px solid #2a2a2a", gap: 20,
    }}>
      {/* Bloc XP à gauche */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
        <div>
          <div style={{ color: "#555", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" }}>Habit Tracker</div>
          <div style={{ color: "white", fontSize: 22, fontWeight: 800, marginTop: 3 }}>Track your Habits</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ color: "white", fontSize: 11 }}>
            🔥 Niveau {niveau} — {xpRestant} / {xpNiveau} XP
          </div>
          {/* Barre de progression XP */}
          <div style={{ width: 190, height: 7, background: "#2a2a2a", borderRadius: 10, overflow: "hidden", border: "1px solid #333" }}>
            <div style={{ height: "100%", width: `${pourcentage}%`, background: "linear-gradient(90deg,#ce6e14,#ff9040)", borderRadius: 10, transition: "width 0.6s ease" }} />
          </div>
        </div>
      </div>

      {/* Graphique au centre */}
      <MiniGraphique completions={completions} />

      {/* Grille de flammes à droite */}
      <GrilleFlammes habits={habits} completions={completions} />
    </main>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPOSANT : BARRE DU HAUT (sélecteur de date semaine/mois + bouton modal)
// ═════════════════════════════════════════════════════════════════════════════

function BarreDate({ dateSelectionnee, onSelectionnerDate, onOuvrirModal, completions }) {
  // "semaine" ou "mois"
  const [vue, setVue] = useState("semaine");

  const datesDeLaSemaine = getDatesLaSemaine();
  const joursDuMois      = getJoursDuMois();
  const aujourdhui       = aujourdhuiISO();

  // Label de la date du jour en français
  const labelDate = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // Est-ce que cette date a au moins une validation ?
  function aDesValidations(date) {
    return completions.some((c) => c.date === date);
  }

  // Style pour les boutons Semaine / Mois
  function styleBoutonVue(actif) {
    return {
      background: actif ? "#ce6e14" : "#ccc",
      color: actif ? "white" : "#444",
      border: "none", borderRadius: 7, padding: "5px 14px",
      fontSize: 13, cursor: "pointer",
    };
  }

  return (
    <div style={{ background: "#e8e8e8", padding: "10px 24px", display: "flex", gap: 10, alignItems: "stretch" }}>

      {/* Bouton ouvrir la modal */}
      <button
        onClick={onOuvrirModal}
        style={{
          background: "#ce6e14", color: "white", border: "none",
          borderRadius: 10, fontSize: 15, cursor: "pointer",
          padding: "0 20px", flexShrink: 0, width: "22%",
        }}
        onMouseOver={(e) => e.currentTarget.style.background = "#b85c10"}
        onMouseOut={(e)  => e.currentTarget.style.background = "#ce6e14"}
      >
        + Gérer les habitudes
      </button>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>

        {/* Boutons Semaine / Mois + label de date */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button style={styleBoutonVue(vue === "semaine")} onClick={() => setVue("semaine")}>Semaine</button>
          <button style={styleBoutonVue(vue === "mois")}    onClick={() => setVue("mois")}>Mois</button>
          <div style={{ marginLeft: "auto", background: "#d4d4d4", borderRadius: 7, padding: "4px 12px", fontSize: 13, color: "#333" }}>
            {labelDate}
          </div>
        </div>

        {/* Calendrier */}
        <div style={{ background: "rgba(0,0,0,0.65)", border: "1px solid #333", borderRadius: 7, height: 80, display: "flex", alignItems: "center", padding: "0 10px", overflow: "hidden" }}>

          {/* VUE SEMAINE */}
          {vue === "semaine" && (
            <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "space-around" }}>
              {JOURS_FR.map((jour, i) => {
                const date          = datesDeLaSemaine[i];
                const estSelectionne = dateSelectionnee === date;
                const estAujourdhui  = date === aujourdhui;
                return (
                  <div
                    key={jour}
                    onClick={() => onSelectionnerDate(date)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center",
                      flex: 1, cursor: "pointer", borderRadius: 10, padding: "4px 2px",
                      border: `2px solid ${estSelectionne ? "#ce6e14" : "transparent"}`,
                      background: estSelectionne ? "rgba(206,110,20,0.25)" : "transparent",
                      transition: "all 0.2s",
                    }}
                  >
                    <span style={{ color: estAujourdhui ? "#ce6e14" : "#ebebeb", fontSize: 13 }}>
                      {jour.slice(0, 3)}
                    </span>
                    <div style={{
                      width: 20, height: 20, margin: "5px 0",
                      background: aDesValidations(date) ? "#26ac14" : "#3a3a3a",
                      borderRadius: 6,
                      border: estAujourdhui ? "2px solid white" : "none",
                    }} />
                  </div>
                );
              })}
            </div>
          )}

          {/* VUE MOIS */}
          {vue === "mois" && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, overflowX: "auto", width: "100%", padding: "0 4px" }}>
              {joursDuMois.map(({ date, dow }, i) => {
                const estSelectionne = dateSelectionnee === date;
                const estAujourdhui  = date === aujourdhui;
                // Séparateur visuel entre les semaines
                const debutSemaine   = dow === 0 && i > 0;
                return (
                  <div key={date} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {debutSemaine && (
                      <div style={{ width: 1, height: 36, background: "rgba(255,255,255,0.3)", margin: "0 2px" }} />
                    )}
                    <div
                      onClick={() => onSelectionnerDate(date)}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer" }}
                    >
                      <span style={{ color: "#aaa", fontSize: 9, fontWeight: "bold" }}>{DAY_LTRS[dow]}</span>
                      <div style={{
                        width: 20, height: 20, borderRadius: 6,
                        background: aDesValidations(date) ? "#26ac14" : "#3a3a3a",
                        outline: estSelectionne ? "2px solid #ce6e14" : estAujourdhui ? "2px solid white" : "none",
                        transition: "all 0.2s",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPOSANT : CARTE D'UNE HABITUDE
// ═════════════════════════════════════════════════════════════════════════════

function CarteHabit({ habit, estValidee, completions, onToggle, estVerrouille }) {
  const [pulse, setPulse] = useState(false);
  const streak = calcStreak(habit.id, completions);
  const palier = getPalier(streak);

  function handleClick() {
    if (estVerrouille) return;
    setPulse(true);
    setTimeout(() => setPulse(false), 300);
    onToggle(habit.id);
  }

  return (
    <div
      onClick={handleClick}
      style={{
        width: "85%",
        background: estValidee ? "#ce6e14" : "white",
        border: `1px solid ${estValidee ? "#a85510" : "#ccc"}`,
        borderRadius: 8, padding: "10px 14px",
        cursor: estVerrouille ? "not-allowed" : "pointer",
        opacity: estVerrouille ? 0.6 : 1,
        userSelect: "none", fontSize: 14,
        color: estValidee ? "white" : "#333",
        transform: pulse ? "scale(0.97)" : "scale(1)",
        transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        boxShadow: estValidee ? "0 4px 16px rgba(206,110,20,0.35)" : "0 1px 4px rgba(0,0,0,0.08)",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>{habit.nom}</strong>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {streak > 0 && (
            <span style={{
              fontSize: 9, color: estValidee ? "white" : palier.couleur,
              background: estValidee ? "rgba(255,255,255,0.2)" : `${palier.couleur}22`,
              border: `1px solid ${estValidee ? "rgba(255,255,255,0.3)" : palier.couleur}`,
              borderRadius: 10, padding: "1px 6px",
            }}>
              🔥 {streak}j
            </span>
          )}
          <span style={{ fontSize: 15 }}>{estValidee ? "✓" : "○"}</span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: estValidee ? "#ffd9b3" : "#999", marginTop: 3 }}>
        {habit.type}{habit.frequence ? ` · ${habit.frequence}` : ""}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPOSANT : COLONNE (Matin / Après-midi / Soir)
// ═════════════════════════════════════════════════════════════════════════════

function Colonne({ titre, habits, completions, dateSelectionnee, onToggle, estVerrouille }) {
  // Combien d'habitudes sont validées ce jour ?
  const nbValidees = habits.filter((h) =>
    completions.some((c) => c.habitId === h.id && c.date === dateSelectionnee)
  ).length;
  const nbTotal = habits.length;
  const toutFait = nbTotal > 0 && nbValidees === nbTotal;

  return (
    <div style={{
      background: "#ececec", border: "1px solid rgba(58,58,58,0.5)", borderRadius: 10,
      padding: 14, flex: 1, minWidth: 0, height: "100%",
      display: "flex", flexDirection: "column", gap: 10, boxSizing: "border-box",
    }}>
      {/* Titre + compteur */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 13, color: "#222", fontWeight: 700, letterSpacing: "0.08em" }}>
          {titre}
          {estVerrouille && <span style={{ fontSize: 10, color: "#7700e6", fontWeight: 400 }}> 🔒 lock</span>}
        </h2>
        <span style={{
          fontSize: 12, color: toutFait ? "white" : "#888",
          background: toutFait ? "#ce6e14" : "#ddd",
          borderRadius: 20, padding: "2px 8px", transition: "all 0.3s",
        }}>
          {nbValidees}/{nbTotal}
        </span>
      </div>

      {/* Liste des habitudes */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {habits.length === 0 ? (
          <div style={{ color: "#bbb", fontSize: 13, fontStyle: "italic", textAlign: "center", marginTop: 20 }}>
            Aucune habitude
          </div>
        ) : (
          habits.map((h) => (
            <CarteHabit
              key={h.id}
              habit={h}
              estValidee={completions.some((c) => c.habitId === h.id && c.date === dateSelectionnee)}
              completions={completions}
              onToggle={onToggle}
              estVerrouille={estVerrouille}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPOSANT : LISTE DES HABITUDES (panneau gauche)
// ═════════════════════════════════════════════════════════════════════════════

function ListeHabitudes({ habits, completions, dateSelectionnee, onToggle, estVerrouille }) {
  const [recherche, setRecherche]   = useState("");
  const [filtreType, setFiltreType] = useState("");

  // On filtre selon la recherche et le type sélectionné
  const habitsFiltrees = habits.filter((h) =>
    h.nom.toLowerCase().includes(recherche.toLowerCase()) &&
    (filtreType ? h.type === filtreType : true)
  );

  return (
    <div style={{
      background: "#ececec", border: "1px solid rgba(58,58,58,0.5)", borderRadius: 10,
      padding: 14, width: "100%", height: "100%",
      display: "flex", flexDirection: "column", gap: 10, boxSizing: "border-box",
    }}>
      <h2 style={{ margin: 0, fontSize: 13, color: "#222", fontWeight: 700, flexShrink: 0 }}>Mes Habitudes</h2>

      {/* Champ de recherche */}
      <input
        type="text"
        placeholder="Rechercher..."
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 8, fontSize: 13, outline: "none", background: "#f9f9f9", width: "100%", boxSizing: "border-box", flexShrink: 0 }}
      />

      {/* Filtre par type */}
      <select
        value={filtreType}
        onChange={(e) => setFiltreType(e.target.value)}
        style={{ padding: "8px 10px", border: "1px solid #ccc", borderRadius: 8, fontSize: 13, background: "#f9f9f9", cursor: "pointer", outline: "none", width: "100%", flexShrink: 0 }}
      >
        <option value="">Tous les types</option>
        {["Santé", "Travail", "Projet", "Sport", "Autre"].map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <h3 style={{ margin: "4px 0 0", fontSize: 10, color: "#888", letterSpacing: "0.1em", flexShrink: 0 }}>
        LISTE ({habitsFiltrees.length})
      </h3>

      {/* Liste scrollable */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {habitsFiltrees.map((h) => {
          const estValidee = completions.some((c) => c.habitId === h.id && c.date === dateSelectionnee);
          const streak     = calcStreak(h.id, completions);
          const palier     = getPalier(streak);
          return (
            <div
              key={h.id}
              onClick={() => { if (!estVerrouille) onToggle(h.id); }}
              style={{
                background: estValidee ? "#fff3e8" : "white",
                border: `1px solid ${estValidee ? "#ce6e14" : "#ddd"}`,
                borderLeft: `4px solid ${streak > 0 ? palier.couleur : "#eee"}`,
                borderRadius: 7, padding: "10px 12px",
                cursor: estVerrouille ? "not-allowed" : "pointer",
                fontSize: 13, transition: "all 0.2s", flexShrink: 0,
              }}
            >
              <div style={{ fontWeight: "bold", color: "#222", display: "flex", justifyContent: "space-between" }}>
                <span>{h.nom}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {estVerrouille && <span style={{ fontSize: 9, color: "#b10fe2" }}>🔒 lock</span>}
                  <span style={{ fontSize: 10, color: streak > 0 ? palier.couleur : "#bbb" }}>
                    {streak > 0 ? `🔥 ${streak}j` : "—"}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#999", marginTop: 3 }}>
                {h.type} · {h.periode} · {h.frequence}
              </div>
            </div>
          );
        })}
        {habitsFiltrees.length === 0 && (
          <div style={{ color: "#bbb", fontSize: 13, fontStyle: "italic", textAlign: "center", marginTop: 20 }}>
            Aucune habitude trouvée
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPOSANT : DIALOG CONFIRMATION SUPPRESSION
// ═════════════════════════════════════════════════════════════════════════════

function DialogSuppression({ habit, onConfirmer, onAnnuler }) {
  if (!habit) return null;
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onAnnuler()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", justifyContent: "center", alignItems: "center" }}
    >
      <div style={{
        background: "#1a1a1a", border: "1px solid #ff4444", borderRadius: 14,
        padding: "30px 36px", width: 380, maxWidth: "90vw",
        display: "flex", flexDirection: "column", gap: 18, alignItems: "center",
      }}>
        <div style={{ width: 54, height: 54, borderRadius: "50%", background: "rgba(255,68,68,0.12)", border: "2px solid #ff4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🗑️</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "white", fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Supprimer l'habitude ?</div>
          <div style={{ color: "#aaa", fontSize: 13, lineHeight: 1.6 }}>
            Vous allez supprimer <strong style={{ color: "#ff9090" }}>« {habit.nom} »</strong> et tout son historique.
            <br /><span style={{ color: "#ff4444", fontSize: 11 }}>Cette action est irréversible.</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, width: "100%" }}>
          <button onClick={onAnnuler} style={{ flex: 1, padding: "10px 0", background: "transparent", border: "1px solid #444", color: "#aaa", borderRadius: 9, fontSize: 14, cursor: "pointer" }}>
            Annuler
          </button>
          <button onClick={onConfirmer} style={{ flex: 1, padding: "10px 0", background: "#c0392b", border: "1px solid #ff4444", color: "white", borderRadius: 9, fontSize: 14, cursor: "pointer", fontWeight: "bold" }}>
            🗑️ Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPOSANT : MODAL DE GESTION DES HABITUDES
// ═════════════════════════════════════════════════════════════════════════════

function Modal({ habits, onAjouter, onModifier, onSupprimer, onFermer }) {

  // ── État du formulaire ──
  const [nom, setNom]             = useState("");
  const [frequence, setFrequence] = useState("");
  const [periode, setPeriode]     = useState("");
  const [type, setType]           = useState("");
  const [joursHebdo, setJoursHebdo] = useState([]);
  const [moisAnnee, setMoisAnnee]   = useState([]);

  // ── État de l'édition ──
  const [idEnEdition, setIdEnEdition]     = useState(null); // null = création, sinon = modification
  const [habitASupprimer, setHabitASupprimer] = useState(null);

  const nomRef = useRef();

  // Quand on clique sur une habitude dans la liste → on pré-remplit le formulaire
  function selectionnerHabit(habit) {
    setIdEnEdition(habit.id);
    setNom(habit.nom);
    setFrequence(habit.frequence);
    setPeriode(habit.periode);
    setType(habit.type);
    setJoursHebdo(habit.joursHebdo || []);
    setMoisAnnee(habit.moisAnnee || []);
    setTimeout(() => nomRef.current?.focus(), 80);
  }

  // Réinitialise le formulaire
  function reinitialiserFormulaire() {
    setIdEnEdition(null);
    setNom("");
    setFrequence("");
    setPeriode("");
    setType("");
    setJoursHebdo([]);
    setMoisAnnee([]);
  }

  // Quand on valide le formulaire
  function handleSoumettre() {
    if (!nom.trim()) {
      nomRef.current?.focus();
      return;
    }
    const donnees = { nom: nom.trim(), frequence, periode, type, joursHebdo, moisAnnee };

    if (idEnEdition) {
      // On modifie une habitude existante
      onModifier({ id: idEnEdition, ...donnees });
    } else {
      // On crée une nouvelle habitude
      onAjouter(donnees);
    }
    reinitialiserFormulaire();
  }

  // Toggle un jour dans la liste joursHebdo
  function toggleJour(jour) {
    if (joursHebdo.includes(jour)) {
      setJoursHebdo(joursHebdo.filter((j) => j !== jour));
    } else {
      setJoursHebdo([...joursHebdo, jour]);
    }
  }

  // Toggle un mois dans la liste moisAnnee
  function toggleMois(mois) {
    if (moisAnnee.includes(mois)) {
      setMoisAnnee(moisAnnee.filter((m) => m !== mois));
    } else {
      setMoisAnnee([...moisAnnee, mois]);
    }
  }

  // Coche / décoche tous les mois
  function toggleTousMois() {
    if (moisAnnee.length === MOIS_ANNEE.length) {
      setMoisAnnee([]);
    } else {
      setMoisAnnee([...MOIS_ANNEE]);
    }
  }

  const estPlein    = habits.length >= MAX_HABITS && !idEnEdition;
  const enEdition   = !!idEnEdition;

  const styleInput = {
    padding: "10px 12px", border: "1px solid #444", borderRadius: 8, fontSize: 14,
    background: "#2a2a2a", color: "white", outline: "none", width: "100%", boxSizing: "border-box",
  };

  // Style pour les chips (jours / mois)
  function styleChip(actif) {
    return {
      padding: "4px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer", userSelect: "none",
      border: `1px solid ${actif ? "#ce6e14" : "#444"}`,
      background: actif ? "rgba(206,110,20,0.22)" : "#2a2a2a",
      color: actif ? "#ff9040" : "#666",
      transition: "all 0.15s",
    };
  }

  return (
    <>
      {/* Dialog de confirmation de suppression */}
      {habitASupprimer && (
        <DialogSuppression
          habit={habitASupprimer}
          onConfirmer={() => {
            onSupprimer(habitASupprimer.id);
            if (idEnEdition === habitASupprimer.id) reinitialiserFormulaire();
            setHabitASupprimer(null);
          }}
          onAnnuler={() => setHabitASupprimer(null)}
        />
      )}

      {/* Fond sombre */}
      <div
        onClick={(e) => e.target === e.currentTarget && onFermer()}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        {/* Boîte de la modal */}
        <div style={{
          background: "#1e1e1e", borderRadius: 14, padding: 30, width: 760, maxWidth: "95vw",
          maxHeight: "88vh", overflowY: "auto", display: "flex", gap: 30,
          position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.6)", color: "white",
        }}>
          {/* Bouton fermer */}
          <button onClick={onFermer} style={{ position: "absolute", top: 14, left: 16, background: "none", border: "none", color: "#aaa", fontSize: 22, cursor: "pointer" }}>✕</button>

          {/* ── Formulaire gauche ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, paddingTop: 20 }}>

            {/* Titre + bouton annuler édition */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>
                {enEdition ? "✏️ Modifier l'habitude" : "Nouvelle habitude"}
              </h2>
              {estPlein && !enEdition && <span style={{ color: "#ff6b6b", fontSize: 13 }}>(max {MAX_HABITS} atteint)</span>}
              {enEdition && (
                <button onClick={reinitialiserFormulaire} style={{ marginLeft: "auto", background: "transparent", border: "1px solid #555", color: "#aaa", borderRadius: 7, padding: "3px 10px", fontSize: 12, cursor: "pointer" }}>
                  Annuler
                </button>
              )}
            </div>

            {/* Bandeau bleu si on est en édition */}
            {enEdition && (
              <div style={{ background: "rgba(206,110,20,0.12)", border: "1px solid rgba(206,110,20,0.35)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#ce6e14" }}>
                Modification de <strong>{habits.find((h) => h.id === idEnEdition)?.nom}</strong>
              </div>
            )}

            {/* Champ Nom */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, color: "#aaa" }}>Nom</label>
              <input
                ref={nomRef} type="text" value={nom}
                onChange={(e) => setNom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSoumettre()}
                placeholder="Ex : Méditation, Course..."
                style={styleInput} disabled={estPlein}
              />
            </div>

            {/* Champ Fréquence */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, color: "#aaa" }}>Fréquence</label>
              <select
                value={frequence}
                onChange={(e) => { setFrequence(e.target.value); setJoursHebdo([]); setMoisAnnee([]); }}
                style={styleInput} disabled={estPlein}
              >
                <option value="">-- Choisir --</option>
                <option value="Quotidien">Quotidien</option>
                <option value="Hebdomadaire">Hebdomadaire</option>
                <option value="Mensuel">Mensuel</option>
              </select>

              {/* Options jours si fréquence = Hebdomadaire */}
              {frequence === "Hebdomadaire" && (
                <div style={{ background: "#252525", border: "1px solid #383838", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>
                    Jours concernés ({joursHebdo.length} sélectionné{joursHebdo.length > 1 ? "s" : ""})
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {JOURS_SEMAINE.map((jour) => (
                      <span key={jour} style={styleChip(joursHebdo.includes(jour))} onClick={() => toggleJour(jour)}>
                        {jour.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Options mois si fréquence = Mensuel */}
              {frequence === "Mensuel" && (
                <div style={{ background: "#252525", border: "1px solid #383838", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: "#888" }}>Mois concernés ({moisAnnee.length}/12)</div>
                    <span
                      onClick={toggleTousMois}
                      style={styleChip(moisAnnee.length === MOIS_ANNEE.length)}
                    >
                      {moisAnnee.length === MOIS_ANNEE.length ? "✓ Tous" : "Tous"}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {MOIS_ANNEE.map((mois) => (
                      <span key={mois} style={styleChip(moisAnnee.includes(mois))} onClick={() => toggleMois(mois)}>
                        {mois.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Champ Période */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, color: "#aaa" }}>Période</label>
              <select value={periode} onChange={(e) => setPeriode(e.target.value)} style={styleInput} disabled={estPlein}>
                <option value="">-- Choisir --</option>
                <option value="matin">Matin</option>
                <option value="aprem">Après-midi</option>
                <option value="soir">Soir</option>
              </select>
            </div>

            {/* Champ Type */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, color: "#aaa" }}>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} style={styleInput} disabled={estPlein}>
                <option value="">-- Choisir --</option>
                {["Santé", "Travail", "Projet", "Sport", "Autre"].map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            {/* Bouton Enregistrer / Sauvegarder */}
            <button
              onClick={handleSoumettre}
              disabled={estPlein}
              style={{
                marginTop: 8, padding: 12,
                background: estPlein ? "#444" : enEdition ? "#1e7bcf" : "#ce6e14",
                color: "white", border: "none", borderRadius: 10, fontSize: 15,
                cursor: estPlein ? "not-allowed" : "pointer", transition: "background 0.2s",
              }}
            >
              {enEdition ? "💾 Sauvegarder les modifications" : "Enregistrer"}
            </button>
          </div>

          {/* ── Liste des habitudes à droite ── */}
          <div style={{ width: 230, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10, paddingTop: 20 }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 14, color: "#aaa", borderBottom: "1px solid #333", paddingBottom: 6 }}>
              Habitudes ({habits.length}/{MAX_HABITS})
            </h3>
            <p style={{ margin: 0, fontSize: 10, color: "#555", lineHeight: 1.4 }}>
              Cliquez sur une habitude pour la modifier.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", maxHeight: 460 }}>
              {habits.length === 0 ? (
                <p style={{ fontSize: 13, color: "#555", fontStyle: "italic" }}>Aucune habitude.</p>
              ) : (
                habits.map((h) => {
                  const estSelectionne = idEnEdition === h.id;
                  return (
                    <div
                      key={h.id}
                      onClick={() => selectionnerHabit(h)}
                      style={{
                        background: estSelectionne ? "rgba(30,123,207,0.18)" : "#2a2a2a",
                        border: `1px solid ${estSelectionne ? "#1e7bcf" : "#444"}`,
                        borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "#ddd",
                        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                        cursor: "pointer", transition: "all 0.18s",
                        transform: estSelectionne ? "translateX(-3px)" : "translateX(0)",
                        boxShadow: estSelectionne ? "4px 0 0 #1e7bcf inset" : "none",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: estSelectionne ? "#5db8ff" : "#ddd" }}>
                          {h.nom}
                        </strong>
                        <span style={{ display: "block", fontSize: 11, color: "#888", marginTop: 2 }}>
                          {h.type} · {h.periode} · {h.frequence}
                          {h.joursHebdo?.length > 0 && ` · ${h.joursHebdo.map((j) => j.slice(0, 3)).join(", ")}`}
                          {h.moisAnnee?.length > 0 && h.moisAnnee.length < 12 && ` · ${h.moisAnnee.length} mois`}
                          {h.moisAnnee?.length === 12 && " · toute l'année"}
                        </span>
                        {estSelectionne && (
                          <span style={{ fontSize: 10, color: "#1e7bcf", marginTop: 3, display: "block" }}>✏️ En cours de modification</span>
                        )}
                      </div>
                      {/* Bouton supprimer */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setHabitASupprimer(h); }}
                        title="Supprimer"
                        style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 14, padding: "0 0 0 6px", flexShrink: 0 }}
                        onMouseOver={(e) => e.currentTarget.style.color = "#ff4444"}
                        onMouseOut={(e)  => e.currentTarget.style.color = "#555"}
                      >✕</button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPOSANT : TOAST XP
// ═════════════════════════════════════════════════════════════════════════════

function ToastXP({ xp, visible }) {
  return (
    <div style={{
      position: "fixed", bottom: 32, right: 32, zIndex: 999,
      background: "#ce6e14", color: "white", padding: "10px 20px",
      borderRadius: 30, fontSize: 18, fontWeight: "bold",
      boxShadow: "0 8px 30px rgba(206,110,20,0.5)",
      transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.8)",
      opacity: visible ? 1 : 0,
      transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
      pointerEvents: "none",
    }}>
      +{xp} XP 🔥
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// APP PRINCIPALE
// ═════════════════════════════════════════════════════════════════════════════

export default function App() {

  // ── Données principales (chargées depuis localStorage) ──
  const [habits, setHabits] = useState(() => {
    const sauvegarde = localStorage.getItem("df_habits");
    return sauvegarde ? JSON.parse(sauvegarde) : [];
  });

  const [completions, setCompletions] = useState(() => {
    const sauvegarde = localStorage.getItem("df_completions");
    return sauvegarde ? JSON.parse(sauvegarde) : [];
  });

  const [xpTotal, setXpTotal] = useState(() => {
    const sauvegarde = localStorage.getItem("df_xp");
    return sauvegarde ? JSON.parse(sauvegarde) : 650;
  });

  // ── États de l'interface ──
  const [dateSelectionnee, setDateSelectionnee] = useState(aujourdhuiISO());
  const [modalOuverte, setModalOuverte]         = useState(false);
  const [toast, setToast]                       = useState({ visible: false, xp: 0 });
  const timerToast = useRef(null);

  // ── Sauvegarde automatique dans localStorage quand les données changent ──
  useEffect(() => { localStorage.setItem("df_habits",      JSON.stringify(habits));      }, [habits]);
  useEffect(() => { localStorage.setItem("df_completions", JSON.stringify(completions)); }, [completions]);
  useEffect(() => { localStorage.setItem("df_xp",          JSON.stringify(xpTotal));    }, [xpTotal]);

  // ─────────────────────────────────────────────────────────────────────────
  // FONCTIONS DE MODIFICATION DES DONNÉES
  // ─────────────────────────────────────────────────────────────────────────

  // Ajouter une habitude
  function ajouterHabit({ nom, frequence, periode, type, joursHebdo, moisAnnee }) {
    if (habits.length >= MAX_HABITS) return;
    const nouvelleHabit = {
      id: genererID(),
      nom, frequence, periode, type,
      joursHebdo: joursHebdo || [],
      moisAnnee: moisAnnee || [],
      xpParValid: 10,
      creeLe: aujourdhuiISO(),
      actif: true,
    };
    setHabits([...habits, nouvelleHabit]);
  }

  // Modifier une habitude existante
  function modifierHabit({ id, nom, frequence, periode, type, joursHebdo, moisAnnee }) {
    setHabits(habits.map((h) =>
      h.id === id ? { ...h, nom, frequence, periode, type, joursHebdo, moisAnnee } : h
    ));
  }

  // Supprimer une habitude et toutes ses validations
  function supprimerHabit(id) {
    setHabits(habits.filter((h) => h.id !== id));
    setCompletions(completions.filter((c) => c.habitId !== id));
  }

  // Valider ou dévalider une habitude pour la date sélectionnée
  function toggleValidation(habitId) {
    const dejaValidee = completions.some(
      (c) => c.habitId === habitId && c.date === dateSelectionnee
    );
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    if (dejaValidee) {
      // On retire la validation et on enlève les XP
      const completion = completions.find((c) => c.habitId === habitId && c.date === dateSelectionnee);
      setCompletions(completions.filter((c) => !(c.habitId === habitId && c.date === dateSelectionnee)));
      setXpTotal(Math.max(0, xpTotal - (completion?.xpGagne || 0)));
    } else {
      // On ajoute la validation et on ajoute les XP
      const nouvelleCompletion = {
        id: genererID(),
        habitId,
        date: dateSelectionnee,
        xpGagne: habit.xpParValid,
        timestamp: Date.now(),
      };
      setCompletions([...completions, nouvelleCompletion]);
      setXpTotal(xpTotal + habit.xpParValid);

      // On affiche le toast XP
      clearTimeout(timerToast.current);
      setToast({ visible: true, xp: habit.xpParValid });
      timerToast.current = setTimeout(() => setToast({ visible: false, xp: 0 }), 2000);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DONNÉES CALCULÉES
  // ─────────────────────────────────────────────────────────────────────────

  const habitsMatin = habits.filter((h) => h.periode === "matin");
  const habitsAprem = habits.filter((h) => h.periode === "aprem");
  const habitsSoir  = habits.filter((h) => h.periode === "soir");

  // La date d'aujourd'hui est-elle sélectionnée ou dans le passé ?
  const estVerrouille = dateSelectionnee < aujourdhuiISO();

  // ─────────────────────────────────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "'DM Mono', monospace", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ce6e14; border-radius: 3px; }
      `}</style>

      {/* Header avec navigation */}
      <AppHeader />

      {/* Légende des rangs de flammes */}
      <LegendeFlammes />

      {/* Zone Hero : XP + graphique + flammes */}
      <Hero xpTotal={xpTotal} habits={habits} completions={completions} />

      {/* Barre de sélection de date (semaine/mois) */}
      <BarreDate
        dateSelectionnee={dateSelectionnee}
        onSelectionnerDate={setDateSelectionnee}
        onOuvrirModal={() => setModalOuverte(true)}
        completions={completions}
      />

      {/* Board principal : liste + 3 colonnes */}
      <div style={{ display: "flex", gap: 10, padding: "10px 24px", background: "#e7e7e7", flex: 1, minHeight: 300, boxSizing: "border-box", overflow: "hidden" }}>

        {/* Panneau gauche : liste de toutes les habitudes */}
        <div style={{ width: "22%", flexShrink: 0, height: "100%" }}>
          <ListeHabitudes
            habits={habits}
            completions={completions}
            dateSelectionnee={dateSelectionnee}
            onToggle={toggleValidation}
            estVerrouille={estVerrouille}
          />
        </div>

        {/* Les 3 colonnes Matin / Après-midi / Soir */}
        <div style={{ flex: 1, display: "flex", gap: 10, minWidth: 0, height: "100%" }}>
          <Colonne titre="MATIN"      habits={habitsMatin} completions={completions} dateSelectionnee={dateSelectionnee} onToggle={toggleValidation} estVerrouille={estVerrouille} />
          <Colonne titre="APRÈS-MIDI" habits={habitsAprem} completions={completions} dateSelectionnee={dateSelectionnee} onToggle={toggleValidation} estVerrouille={estVerrouille} />
          <Colonne titre="SOIR"       habits={habitsSoir}  completions={completions} dateSelectionnee={dateSelectionnee} onToggle={toggleValidation} estVerrouille={estVerrouille} />
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: "#1a1a1a", color: "#555", textAlign: "center", padding: "16px", fontSize: 13 }}>
        © 2026 – DailyFlame mANU
      </footer>

      {/* Modal de gestion des habitudes */}
      {modalOuverte && (
        <Modal
          habits={habits}
          onAjouter={ajouterHabit}
          onModifier={modifierHabit}
          onSupprimer={supprimerHabit}
          onFermer={() => setModalOuverte(false)}
        />
      )}

      {/* Toast XP */}
      <ToastXP xp={toast.xp} visible={toast.visible} />
    </div>
  );
}
