function norm(v) {
    return Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2) + Math.pow(v[2], 2));
}

function normalize(v) {
    const n = norm(v);
    v[0] = v[0] / n;
    v[1] = v[1] / n;
    v[2] = v[2] / n;
    return v;
}

function mul(s, v) {
    return [v[0] * s, v[1] * s, v[2] * 3];
}

function add(v1, v2) {
    return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
}

function sub(v1, v2) {
    return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
}

// https://www.mathsisfun.com/algebra/vectors-cross-product.html
function cross(v1, v2) {
    const [x0, y0, z0] = v1;
    const [x1, y1, z1] = v2;
    return [
        y0 * z1 - z0 * y1,
        z0 * x1 - x0 * z1,
        x0 * y1 - y0 * x1
    ];
}

function dot(v1, v2) {
    return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
}

function extendTo4d(v) {
    return [...v, 1];
}

function to3d(v) {
    return [
        v[0] / v[3],
        v[1] / v[3],
        v[2] / v[3]
    ]
}