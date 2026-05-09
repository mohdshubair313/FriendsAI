/**
 * Map MediaPipe FaceLandmarker blendshapes → coarse expression label.
 *
 * MediaPipe gives us ~52 ARKit-style blendshape scores per frame, each in [0, 1].
 * We collapse the high-dimensional signal into a tiny enum the LLM can react to.
 *
 * Deliberately conservative thresholds: false positives ("AI thinks I'm smiling
 * when I'm not") feel worse than false negatives. Smoother below adds 1s
 * hysteresis on top so a single noisy frame doesn't flip the label.
 */

export type Expression =
  | "neutral"
  | "smiling"
  | "frowning"
  | "surprised"
  | "thinking"
  | "nodding";

export interface Blendshape {
  categoryName: string;
  score: number;
}

/**
 * Pull a single blendshape score by name. Returns 0 if missing.
 */
function score(shapes: Blendshape[], name: string): number {
  return shapes.find((s) => s.categoryName === name)?.score ?? 0;
}

export interface HeadPoseSample {
  /** Pitch in degrees (nod axis). Up = positive, down = negative. */
  pitch: number;
  /** Timestamp in ms (performance.now()). */
  t: number;
}

/**
 * Detect a "nodding" gesture from recent head-pitch samples.
 * A nod is at least one full down→up oscillation > ~10° within ~1s.
 */
export function detectNod(samples: HeadPoseSample[], windowMs = 1000): boolean {
  if (samples.length < 3) return false;
  const now = samples[samples.length - 1].t;
  const recent = samples.filter((s) => now - s.t <= windowMs);
  if (recent.length < 3) return false;
  let min = Infinity;
  let max = -Infinity;
  for (const s of recent) {
    if (s.pitch < min) min = s.pitch;
    if (s.pitch > max) max = s.pitch;
  }
  return max - min > 10;
}

/**
 * Classify a single frame of blendshapes into an Expression.
 * Caller is responsible for nodding (which needs temporal info — see detectNod).
 */
export function classifyFrame(shapes: Blendshape[]): Exclude<Expression, "nodding"> {
  const smile = score(shapes, "mouthSmileLeft") + score(shapes, "mouthSmileRight");
  const frown = score(shapes, "mouthFrownLeft") + score(shapes, "mouthFrownRight");
  const browDown = score(shapes, "browDownLeft") + score(shapes, "browDownRight");
  const browUp = score(shapes, "browInnerUp");
  const eyeWide = score(shapes, "eyeWideLeft") + score(shapes, "eyeWideRight");
  const jawOpen = score(shapes, "jawOpen");

  // Surprised dominates — strong eye widen + jaw drop is unambiguous.
  if (eyeWide > 0.6 && jawOpen > 0.3) return "surprised";

  // Smiling — both corners up, no contradicting frown/brow-down.
  if (smile > 0.5 && frown < 0.2 && browDown < 0.3) return "smiling";

  // Frowning — strong frown OR brow-down without a smile.
  if ((frown > 0.4 || browDown > 0.5) && smile < 0.2) return "frowning";

  // Thinking — brows up + slightly puckered/open mouth, no smile.
  // (Common "hmm" or processing-the-question face.)
  if (browUp > 0.5 && smile < 0.2 && jawOpen < 0.25) return "thinking";

  return "neutral";
}

/**
 * Smooths frame-by-frame classifications over a rolling window so a single
 * noisy frame doesn't whiplash downstream consumers.
 *
 * Algorithm: keep last N labels, return the mode. If neutral and a non-neutral
 * is the second-most-common, prefer the non-neutral (it's more interesting and
 * usually signals a real change that's just under-sampled).
 */
export class ExpressionSmoother {
  private buffer: Expression[] = [];
  constructor(private windowSize = 5) {}

  push(e: Expression): Expression {
    this.buffer.push(e);
    if (this.buffer.length > this.windowSize) this.buffer.shift();

    const counts = new Map<Expression, number>();
    for (const x of this.buffer) counts.set(x, (counts.get(x) ?? 0) + 1);

    let top: Expression = "neutral";
    let topCount = 0;
    let runnerUp: Expression | null = null;
    let runnerCount = 0;
    for (const [k, v] of counts) {
      if (v > topCount) {
        runnerUp = top;
        runnerCount = topCount;
        top = k;
        topCount = v;
      } else if (v > runnerCount) {
        runnerUp = k;
        runnerCount = v;
      }
    }

    // If "neutral" is winning by 1, prefer the runner-up.
    if (top === "neutral" && runnerUp && topCount - runnerCount <= 1) {
      return runnerUp;
    }
    return top;
  }

  reset() {
    this.buffer = [];
  }
}
