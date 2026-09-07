(() => {
  const STYLE_ID = 'decision-lab-final-polish';
  const PLAYSTYLE_BASE = {
    'Tight-Aggressive': 15,
    'Loose-Aggressive': 30,
    'Calling Station': 40,
    Nit: 5,
  };

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .review-felt-polished {
        min-height: 500px !important;
        padding-bottom: 1.5rem !important;
      }

      .review-card-area {
        padding-top: 2rem !important;
        padding-bottom: 0 !important;
      }

      .review-hole-section {
        margin-top: 1.75rem !important;
      }

      .review-felt-polished > fieldset {
        margin-top: 1.75rem !important;
      }

      .felt > fieldset::after {
        content: 'Base % is the preflop range before position adjusts it.' !important;
        margin-top: 0.65rem !important;
      }

      .best-action-card {
        transition: border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease;
      }

      .best-action-card[data-has-best='true'] {
        border-color: rgba(214, 188, 121, 0.62) !important;
        background: linear-gradient(135deg, rgba(214, 188, 121, 0.12), rgba(214, 188, 121, 0.045)) !important;
        box-shadow: inset 3px 0 0 rgba(214, 188, 121, 0.72);
        padding: 1.35rem !important;
      }

      .best-action-card[data-has-best='true'] #best-action-heading {
        color: #8a6d2f !important;
        letter-spacing: 0.18em !important;
      }

      .best-action-card[data-has-best='true'] #best-action-heading + p {
        font-size: 1.35rem !important;
        line-height: 1.3 !important;
        font-weight: 650 !important;
      }

      .fold-info {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1rem;
        height: 1rem;
        margin-left: 0.4rem;
        border: 1px solid rgba(95, 92, 86, 0.32);
        border-radius: 999px;
        color: #8d8880;
        font-size: 0.65rem;
        font-weight: 700;
        line-height: 1;
        cursor: help;
        vertical-align: 1px;
      }

      .practice-base-range {
        color: rgba(245, 241, 232, 0.58);
        white-space: nowrap;
      }

      @media (max-width: 639px) {
        .review-card-area {
          padding-top: 1.5rem !important;
        }
        .review-hole-section {
          margin-top: 1.5rem !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function polishReviewLayout(root) {
    const heading = [...root.querySelectorAll('h1')].find(
      (node) => node.textContent?.trim() === 'Compare the decision tree',
    );
    const felt = heading?.closest('section.felt');
    if (!felt) return;

    felt.classList.add('review-felt-polished');

    const communityHeading = [...felt.querySelectorAll('h2')].find(
      (node) => node.textContent?.trim() === 'Community cards',
    );
    const communitySection = communityHeading?.closest('section');
    const cardArea = communitySection?.parentElement;
    cardArea?.classList.add('review-card-area');

    const holeHeading = [...felt.querySelectorAll('h2')].find(
      (node) => node.textContent?.trim() === 'Your hole cards',
    );
    holeHeading?.closest('section')?.classList.add('review-hole-section');
  }

  function polishFoldAssumption(root) {
    const label = root.querySelector('label[for="fold-to-raise"]');
    if (!label || label.querySelector('.fold-info')) return;

    const info = document.createElement('span');
    info.className = 'fold-info';
    info.textContent = 'i';
    info.setAttribute('role', 'img');
    info.setAttribute('aria-label', 'About villain folds to raise');
    info.title =
      'Your estimate of how often the opponent folds to this raise size. Higher values increase the modeled value of raising.';
    label.appendChild(info);
  }

  function polishBestAction(root) {
    const heading = root.querySelector('#best-action-heading');
    const section = heading?.closest('section');
    if (!section) return;

    section.classList.add('best-action-card');
    const title = heading.nextElementSibling?.textContent?.trim() ?? '';
    section.dataset.hasBest = String(Boolean(title && title !== 'Complete your hand'));
  }

  function polishPracticeRange(root) {
    const villainLine = [...root.querySelectorAll('p')].find((node) =>
      node.textContent?.trim().startsWith('Villain:'),
    );
    if (!villainLine) return;

    const text = villainLine.textContent ?? '';
    const playstyle = Object.keys(PLAYSTYLE_BASE).find((name) => text.includes(name));
    if (!playstyle) return;

    const desired = ` · Base range: ${PLAYSTYLE_BASE[playstyle]}%`;
    const existing = villainLine.querySelector('.practice-base-range');
    if (existing) {
      if (existing.textContent !== desired) existing.textContent = desired;
      return;
    }

    const range = document.createElement('span');
    range.className = 'practice-base-range';
    range.textContent = desired;
    villainLine.appendChild(range);
  }

  function simplifyDisclaimers(root) {
    for (const paragraph of root.querySelectorAll('p')) {
      const text = paragraph.textContent?.trim() ?? '';
      if (text.startsWith('Model assumes full showdown equity')) {
        paragraph.textContent =
          'Simplified model: no rake or future betting; raise EV is sensitivity analysis, not a GTO recommendation.';
      }
      if (text.startsWith('Practice mode is a study model, not a solver.')) {
        paragraph.textContent =
          'Practice uses simplified opponent ranges and fold assumptions to teach EV, not prescribe GTO play.';
      }
    }
  }

  let applying = false;
  function applyPolish() {
    if (applying) return;
    applying = true;
    try {
      ensureStyles();
      const root = document.getElementById('root');
      if (!root) return;
      polishReviewLayout(root);
      polishFoldAssumption(root);
      polishBestAction(root);
      polishPracticeRange(root);
      simplifyDisclaimers(root);
    } finally {
      applying = false;
    }
  }

  const observer = new MutationObserver(() => queueMicrotask(applyPolish));
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  applyPolish();
})();
