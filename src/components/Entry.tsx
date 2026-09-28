import { PlayingCard } from './PlayingCard';
import { OPENING_HAND } from './Review';

// The opening is the table itself: two cards are dealt, the question forms
// around them, and the same two cards carry into the review.
export function Entry({
  onEnter,
  onPractice,
}: {
  onEnter: (start: 'blank' | 'example') => void;
  onPractice: () => void;
}) {
  return (
    <main className="entry" id="main">
      <div className="entry-stage" data-table>
        <span className="entry-dealer" data-dealer aria-hidden="true" />
        <div className="entry-hand">
          <p className="sr-only">Your hand: ace of spades, king of spades.</p>
          {OPENING_HAND.map((card, i) => (
            <div key={i} className={`entry-card entry-card-${i}`}>
              <PlayingCard
                card={card}
                motion={{ kind: 'deal', delay: 240 + i * 190 }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="entry-copy">
        <h1 className="entry-title">
          <span className="entry-line">Review the hand.</span>
          <span className="entry-line">Understand the decision.</span>
        </h1>
        <div className="entry-actions">
          <button
            type="button"
            className="btn btn-primary entry-cta"
            onClick={() => onEnter('blank')}
          >
            Review a hand
            <span className="btn-arrow" aria-hidden="true">
              →
            </span>
          </button>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => onEnter('example')}
          >
            See an example
          </button>
        </div>
        <ol className="entry-steps">
          <li>
            <span className="num">01</span> Deal the hand
          </li>
          <li>
            <span className="num">02</span> Set the price
          </li>
          <li>
            <span className="num">03</span> See the decision
          </li>
        </ol>
        <button
          type="button"
          className="text-btn entry-practice"
          onClick={onPractice}
        >
          Or practice with random spots
        </button>
      </div>
    </main>
  );
}
