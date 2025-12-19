export type NormalizedLandmark = { x: number; y: number; z?: number };
export type HandLandmarks = NormalizedLandmark[];
export type MultiHandLandmarks = HandLandmarks[];

export interface GestureDetectorOptions {
  openPalmStableFrames: number;
  openPalmMinFingerAngleDeg: number;
  openPalmThumbSpreadMin: number;
  crossedHandsStableFrames: number;
  crossedHandsWristsApartMin: number;
}

export interface GestureEvents {
  openPalmActive: boolean;
  openPalmEdge: boolean;
  crossedHandsActive: boolean;
  crossedHandsEdge: boolean;
}

const DEFAULT_OPTIONS: GestureDetectorOptions = {
  openPalmStableFrames: 5,
  openPalmMinFingerAngleDeg: 160,
  openPalmThumbSpreadMin: 0.1,
  crossedHandsStableFrames: 6,
  crossedHandsWristsApartMin: 0.18,
};

const angleDeg = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => {
  const abx = ax - bx;
  const aby = ay - by;
  const cbx = cx - bx;
  const cby = cy - by;
  const abLen = Math.hypot(abx, aby);
  const cbLen = Math.hypot(cbx, cby);
  if (abLen < 1e-6 || cbLen < 1e-6) return 0;
  const dot = abx * cbx + aby * cby;
  const cos = Math.max(-1, Math.min(1, dot / (abLen * cbLen)));
  return (Math.acos(cos) * 180) / Math.PI;
};

const segmentIntersects = (p1: NormalizedLandmark, p2: NormalizedLandmark, q1: NormalizedLandmark, q2: NormalizedLandmark) => {
  const orient = (u: NormalizedLandmark, v: NormalizedLandmark, w: NormalizedLandmark) => {
    const val = (v.y - u.y) * (w.x - v.x) - (v.x - u.x) * (w.y - v.y);
    if (Math.abs(val) < 1e-8) return 0;
    return val > 0 ? 1 : 2;
  };
  const onSeg = (u: NormalizedLandmark, v: NormalizedLandmark, w: NormalizedLandmark) => {
    return (
      Math.min(u.x, w.x) <= v.x &&
      v.x <= Math.max(u.x, w.x) &&
      Math.min(u.y, w.y) <= v.y &&
      v.y <= Math.max(u.y, w.y)
    );
  };

  const o1 = orient(p1, p2, q1);
  const o2 = orient(p1, p2, q2);
  const o3 = orient(q1, q2, p1);
  const o4 = orient(q1, q2, p2);

  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSeg(p1, q1, p2)) return true;
  if (o2 === 0 && onSeg(p1, q2, p2)) return true;
  if (o3 === 0 && onSeg(q1, p1, q2)) return true;
  if (o4 === 0 && onSeg(q1, p2, q2)) return true;
  return false;
};

export const createGestureDetectors = (options?: Partial<GestureDetectorOptions>) => {
  const cfg: GestureDetectorOptions = { ...DEFAULT_OPTIONS, ...(options ?? {}) };

  let openPalmStableCount = 0;
  let openPalmWasActive = false;

  let crossedHandsStableCount = 0;
  let crossedHandsWasActive = false;

  const reset = () => {
    openPalmStableCount = 0;
    openPalmWasActive = false;
    crossedHandsStableCount = 0;
    crossedHandsWasActive = false;
  };

  const update = (multiHandLandmarks: MultiHandLandmarks | null | undefined, enabled: boolean): GestureEvents => {
    if (!enabled) {
      reset();
      return { openPalmActive: false, openPalmEdge: false, crossedHandsActive: false, crossedHandsEdge: false };
    }

    const hands = multiHandLandmarks ?? [];

    // Crossed hands (X)
    let crossedHandsActive = false;
    if (hands.length >= 2) {
      const a = hands[0];
      const b = hands[1];
      const aW = a?.[0];
      const aI = a?.[8];
      const bW = b?.[0];
      const bI = b?.[8];

      if (aW && aI && bW && bI) {
        const wristsApart = Math.hypot(aW.x - bW.x, aW.y - bW.y) > cfg.crossedHandsWristsApartMin;
        const intersects = wristsApart && segmentIntersects(aW, aI, bW, bI);

        if (intersects) crossedHandsStableCount += 1;
        else crossedHandsStableCount = 0;

        crossedHandsActive = crossedHandsStableCount >= cfg.crossedHandsStableFrames;
      } else {
        crossedHandsStableCount = 0;
        crossedHandsActive = false;
      }
    } else {
      crossedHandsStableCount = 0;
      crossedHandsActive = false;
    }

    const crossedHandsEdge = crossedHandsActive && !crossedHandsWasActive;
    crossedHandsWasActive = crossedHandsActive;

    // Open palm
    let openPalmActive = false;
    const primary = hands[0];
    if (primary && primary.length >= 21) {
      const fingerExtended = (mcpIdx: number, pipIdx: number, tipIdx: number) => {
        const m = primary[mcpIdx];
        const p = primary[pipIdx];
        const t = primary[tipIdx];
        return angleDeg(m.x, m.y, p.x, p.y, t.x, t.y) > cfg.openPalmMinFingerAngleDeg;
      };

      const indexExt = fingerExtended(5, 6, 8);
      const middleExt = fingerExtended(9, 10, 12);
      const ringExt = fingerExtended(13, 14, 16);
      const pinkyExt = fingerExtended(17, 18, 20);

      const thumbTip = primary[4];
      const indexMcp = primary[5];
      const thumbSpread = Math.hypot(thumbTip.x - indexMcp.x, thumbTip.y - indexMcp.y) > cfg.openPalmThumbSpreadMin;

      const openPalmCandidate = indexExt && middleExt && ringExt && pinkyExt && thumbSpread;

      if (openPalmCandidate) openPalmStableCount += 1;
      else openPalmStableCount = 0;

      openPalmActive = openPalmStableCount >= cfg.openPalmStableFrames;
    } else {
      openPalmStableCount = 0;
      openPalmActive = false;
    }

    const openPalmEdge = openPalmActive && !openPalmWasActive;
    openPalmWasActive = openPalmActive;

    return { openPalmActive, openPalmEdge, crossedHandsActive, crossedHandsEdge };
  };

  return { reset, update };
};
