# Spotter logo kit: the bolt-hole hold. Writes the masters into brand/logo/final (all filled outlines, no strokes)
import math, os, sys
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
INK, LIME, CREAM, WHITE = '#111111', '#C2FF01', '#FAF6EB', '#FFFFFF'
f = lambda v: (f'{v:.2f}'.rstrip('0').rstrip('.')) if isinstance(v, float) else str(v)

def svg(w, h, body, title, bg=None):
    rect = f'<rect width="{f(w)}" height="{f(h)}" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f(w)} {f(h)}" width="{f(w)}" height="{f(h)}">'
            f'<title>{title}</title>{rect}{body}</svg>\n')
def save(name, s): open(os.path.join(OUT, name), 'w', encoding='utf-8').write(s)

# ---- the hold. A rounded body with a shallow lip along its top edge (where the fingers go), its right shoulder round.
# Every joint between curves is smooth (control points in line)
HOLD = ('M56 168 C44 120 70 70 116 58 C136 53 150 66 172 64 C190 62 204 52 214 60 '
        'C240 84 236 140 214 168 C192 198 140 214 98 208 C72 205 60 190 56 168 Z')
def ring(cx, cy, r, cw=True):   # a circle as a path; cw False draws it the other way round (a hole under nonzero too)
    s = 1 if cw else 0
    return f'M{f(cx - r)} {f(cy)} A{f(r)} {f(r)} 0 1 {s} {f(cx + r)} {f(cy)} A{f(r)} {f(r)} 0 1 {s} {f(cx - r)} {f(cy)} Z'

# the bolt hole sits a little above and right of the body's middle: the eye looks up the wall
EYE = dict(full=(142, 128, 34, 14), small=(142, 130, 44, 21))
def hold(cut='full', fill=INK, pupil=None, dx=-9, dy=-3):
    cx, cy, ro, ri = EYE[cut]
    body = f'<path fill="{fill}" fill-rule="evenodd" d="{HOLD} {ring(cx, cy, ro)}"/>'
    dot = f'<circle cx="{cx}" cy="{cy}" r="{ri}" fill="{pupil or fill}"/>'
    return f'<g transform="translate({dx} {dy})">{body}{dot}</g>'

# ---- the wordmark "spotter", drawn as filled outlines: each stroke is a band (a line with round ends, or a ring
# segment with round ends), all wound the same way so overlaps add up (nonzero) and a ring's hole is wound the other way
U = lambda a: (math.cos(math.radians(a)), math.sin(math.radians(a)))
class P:   # a closed outline made of lines and circular arcs; angles in degrees, increasing = clockwise on screen
    def __init__(s, start): s.start, s.seg = start, []
    def L(s, p): s.seg.append(('L', p)); return s
    def A(s, c, r, a0, a1): s.seg.append(('A', c, r, a0, a1)); return s
    def ends(s):
        pts, cur = [], s.start
        for g in s.seg:
            if g[0] == 'L': cur = g[1]
            else: c, r, a0, a1 = g[1:]; cur = (c[0] + r * U(a1)[0], c[1] + r * U(a1)[1])
            pts.append(cur)
        return pts
    def area(s):   # signed area of a fine sampling: > 0 is clockwise on screen (y down)
        pts, cur = [s.start], s.start
        for g in s.seg:
            if g[0] == 'L': pts.append(g[1])
            else:
                c, r, a0, a1 = g[1:]
                for k in range(1, 25): a = a0 + (a1 - a0) * k / 24; pts.append((c[0] + r * U(a)[0], c[1] + r * U(a)[1]))
        return sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts))) / 2
    def reversed(s):
        e = s.ends(); n = P(e[-1]); prev = [s.start] + e[:-1]
        for g, p0 in zip(reversed(s.seg), reversed(prev)):
            n.seg.append(('L', p0) if g[0] == 'L' else ('A', g[1], g[2], g[4], g[3]))
        return n
    def d(s):
        out, cur = [f'M{f(s.start[0])} {f(s.start[1])}'], s.start
        for g in s.seg:
            if g[0] == 'L': out.append(f'L{f(g[1][0])} {f(g[1][1])}'); continue
            c, r, a0, a1 = g[1:]
            for b0, b1 in ([(a0, a0 + (a1 - a0) / 2), (a0 + (a1 - a0) / 2, a1)] if abs(a1 - a0) >= 359 else [(a0, a1)]):
                e = (c[0] + r * U(b1)[0], c[1] + r * U(b1)[1])
                out.append(f'A{f(r)} {f(r)} 0 {1 if abs(b1 - b0) > 180 else 0} {1 if b1 > b0 else 0} {f(e[0])} {f(e[1])}')
        return ' '.join(out) + ' Z'
def cw(p, want=True): return p if (p.area() > 0) == want else p.reversed()
SW = 24; H2 = SW / 2
def line(p1, p2):   # a straight stroke with round ends
    dx, dy = p2[0] - p1[0], p2[1] - p1[1]; a = math.degrees(math.atan2(dy, dx))
    n = U(a - 90); q = lambda p, k: (p[0] + n[0] * H2 * k, p[1] + n[1] * H2 * k)
    return [cw(P(q(p1, 1)).L(q(p2, 1)).A(p2, H2, a - 90, a + 90).L(q(p1, -1)).A(p1, H2, a + 90, a + 270))]
def arc(c, r, a0, a1):   # a stroke along a circle from a0 to a1, round ends
    a0, a1 = min(a0, a1), max(a0, a1)
    o, i = r + H2, r - H2
    e1, e0 = (c[0] + r * U(a1)[0], c[1] + r * U(a1)[1]), (c[0] + r * U(a0)[0], c[1] + r * U(a0)[1])
    p = P((c[0] + o * U(a0)[0], c[1] + o * U(a0)[1])).A(c, o, a0, a1).A(e1, H2, a1, a1 + 180).A(c, i, a1, a0).A(e0, H2, a0 + 180, a0 + 360)
    return [cw(p)]
def ringband(c, r):   # a whole ring: outer clockwise, the hole the other way
    o, i = r + H2, r - H2
    return [cw(P((c[0] + o, c[1])).A(c, o, 0, 360)), cw(P((c[0] + i, c[1])).A(c, i, 0, 360), False)]

BASE, XH = 184, 112; TOP = BASE - XH; CY = BASE - XH / 2; RB = (XH - SW) / 2   # bowl radius on the stroke's centre
def wordmark(x=0, track=16):
    sh = []
    # s: two round bowls joined by a short flat spine, so the s is as wide as it is tall-ish (circles alone made it narrow)
    rs, sp = (XH - SW) / 4, 14
    c1, c2 = (x + H2 + rs, TOP + H2 + rs), (x + H2 + rs + sp, TOP + H2 + 3 * rs)
    sh += arc(c1, rs, 90, 325) + line((c1[0], c1[1] + rs), (c2[0], c2[1] - rs)) + arc(c2, rs, -90, 145)
    x = c2[0] + rs + H2 + track
    # p: stem with a descender, a round bowl
    sh += line((x + H2, TOP + H2), (x + H2, BASE + 52)) + ringband((x + H2 + RB, CY), RB); x += SW + 2 * RB + track
    # o
    sh += ringband((x + H2 + RB, CY), RB); x += SW + 2 * RB + track - 4
    # t t: ascenders, feet curling right, one shared crossbar
    def t(x0):
        s0 = x0 + 16 + H2; rf = 20
        return s0, line((s0, TOP - 30), (s0, BASE - H2 - rf)) + arc((s0 + rf, BASE - H2 - rf), rf, 90, 180) + line((s0 + rf, BASE - H2), (s0 + rf + 10, BASE - H2))
    s1, g = t(x); sh += g; x = s1 + 20 + 10 + H2 + track - 18
    s2, g = t(x); sh += g
    sh += line((s1 - 16, TOP + H2), (s2 + 30, TOP + H2)); x = s2 + 30 + H2 + track
    # e: a ring open at the lower right, a bar across
    ce = (x + H2 + RB, CY); sh += arc(ce, RB, 40, 360) + line((ce[0] - RB, CY), (ce[0] + RB, CY)); x += SW + 2 * RB + track
    # r: stem and a shoulder: a quarter ring from the stem up to the right
    sh += line((x + H2, TOP + H2), (x + H2, BASE - H2)) + arc((x + H2 + 40, TOP + H2 + 40), 40, 180, 270)
    x += SW + 40
    return sh, x
def paths(shapes, fill=INK): return f'<path fill="{fill}" d="{" ".join(p.d() for p in shapes)}"/>'

def lockups(fill=INK, eye=None, suffix='', wfill=None):
    wf = wfill or fill
    wm, ww = wordmark()
    # horizontal: the hold as tall as the x-height and a half, its middle on the x-height's; the gap is half an x-height
    k = 0.84; sym_w = 256 * k; gap = 22
    sym = f'<g transform="translate(0 {f(CY - 128 * k)}) scale({k})">{hold(fill=fill, pupil=eye, dx=-14.5, dy=-5)}</g>'
    W = sym_w + gap + ww
    save(f'spotter-horizontal{suffix}.svg', svg(W, 256, sym + f'<g transform="translate({f(sym_w + gap - 26)} 0)">{paths(wm, wf)}</g>', 'Spotter logo'))
    # stacked: the hold on top, the wordmark under it, both centred
    ks = 1.15; top = 256 * ks - 56
    st = (f'<g transform="translate({f((ww - 256 * ks) / 2)} -56) scale({ks})">{hold(fill=fill, pupil=eye, dx=-14.5, dy=-5)}</g>'
          f'<g transform="translate(0 {f(top - 40)})">{paths(wm, wf)}</g>')
    save(f'spotter-stacked{suffix}.svg', svg(ww, top - 40 + 256, st, 'Spotter logo'))
    save(f'spotter-wordmark{suffix}.svg', svg(ww, 256, paths(wm, wf), 'Spotter wordmark'))

if __name__ == '__main__':
    save('spotter-symbol.svg', svg(256, 256, hold(dx=-14.5, dy=-5), 'Spotter symbol'))
    save('spotter-symbol-small.svg', svg(256, 256, hold('small', dx=-14.5, dy=-5), 'Spotter symbol, small sizes (16-32 px)'))
    # the browser tab: the small cut on a lime tile, so it shows on light and dark tab bars alike (ink alone vanished on dark)
    k = 0.9
    save('spotter-favicon-tile.svg', svg(256, 256, f'<rect width="256" height="256" rx="58" fill="{LIME}"/>'
         f'<g transform="translate({f(128 - 128 * k)} {f(128 - 128 * k)}) scale({k})">{hold("small", dx=-14.5, dy=-5)}</g>', 'Spotter'))
    lockups()
    lockups(fill=LIME, suffix='-on-dark', wfill=CREAM)   # on ink: the hold in lime, the name in cream
    print('ok')
