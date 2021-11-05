function line(p1, p2, color) {
    let [x0, y0] = p1;
    let [x1, y1] = p2;

    let r = false;
    if (Math.abs(x1 - x0) < Math.abs(y1 - y0)) {
        [x0, x1, y0, y1] = [y0, y1, x0, x1];
        r = true;
    }

    if (x0 > x1) {
        [x1, x0, y1, y0] = [x0, x1, y0, y1];
    }

    for (let x = x0; x <= x1; x += 1) {
        const t = (x - x0) / (x1 - x0);
        const y = y0 * (1 - t) + y1 * t;
        if (r) {
            // noinspection JSSuspiciousNameCombination
            set(y, x, color);
        } else {
            set(x, y, color);
        }
    }
}

function baricentric(pts, P, b) {
    const [A, B, C] = pts;
    const v = cross([
        B[0] - A[0],
        C[0] - A[0],
        A[0] - P[0]
    ], [
        B[1] - A[1],
        C[1] - A[1],
        A[1] - P[1]
    ]);
    /* `pts` and `P` has integer value as coordinates
       so `abs(v[2])` < 1 means `u[2]` is 0, that means
       triangle is degenerate, in this case return something with negative coordinates */
    if (Math.abs(v[2]) < 1) {
        b[0] = -1;
        return;
    }
    b[0] = 1 - (v[0] + v[1]) / v[2];
    b[1] = v[1] / v[2];
    b[2] = v[0] / v[2];
}