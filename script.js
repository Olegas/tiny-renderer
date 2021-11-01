const cnv = document.getElementById('canvas');
const w = cnv.width;
const h = cnv.height;
const ctx = cnv.getContext('2d');
let id = ctx.getImageData(0, 0, w, h);
const zBuffer = new Array(w * h);
const vLight = [0, 0, -1];
const vEye = [-0, 0, 6];
const vCenter = [0, 0, 0];
const vUp = [0, 1, 0];
const depth = 255;

function loadObj(path) {
    return fetch(path)
        .then((res) => res.text())
        .then((data) => {
            const res = {
                v: [],
                f: [],
                vt: []
            };
            data.split('\n')
                .forEach((l) => {
                    const [item, ...rest] = l.split(' ');
                    switch (item) {
                        case 'v':
                            res.v.push(rest.map(Number));
                            break;
                        case 'f':
                            res.f.push(rest.map((i) => {
                                return i.split('/').map((v) => +v - 1);
                            }));
                            break;
                        case 'vt':
                            rest.shift();
                            res.vt.push(rest.map(Number));
                            break;
                    }
                })
            return res;
        });
}

class M {

    static fromVector(v) {
        return new M(v.length, 1, v);
    }

    static fromVectors(v) {
        const d = [];
        for (const i of v) {
            d.push(...i);
        }
        return new M(v[0].length, v.length, d);
    }

    static fromArray(rows, a) {
        const cols = a.length / rows;
        return new M(cols, rows, a).t;
    }

    static i(d) {
        const _d = new Array(d * d);
        _d.fill(0);
        for (let i = 0; i < d; i++) {
            _d[i + i * d] = 1;
        }
        return new M(d, d, _d);
    }

    static z(d) {
        return new M(d, d, new Array(d * d).fill(0));
    }

    constructor(rows, cols, d) {
        this.w = cols;
        this.h = rows;
        this.d = d;
    }

    get rows() {
        return this.h;
    }

    get cols() {
        return this.w;
    }

    get t() {
        const res = new M(this.cols, this.rows, new Array(this.d.length));
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                res.set(j, i, this.get(i, j));
            }
        }
        return res;
    }

    get(i, j) {
        return this.d[j * this.h + i];
    }

    set(i, j, v) {
        this.d[j * this.h + i] = v;
    }

    mul(v) {
        let _h;
        let _w;
        let _d;
        if (v instanceof M) {
            _h = v.h;
            _w = v.w;
            _d = v.d;
        } else if (v instanceof Array) {
            _h = v.length;
            _w = 1;
            _d = v;
        } else {
            return new M(this.h, this.w, this.d.map((i) => i * v));
        }

        if (this.w !== _h)
            throw 'Incorrect dimensions';

        const d = new Array(_w * _h);
        for (let i = 0; i < _h; i++) { // строка
            for (let j = 0; j < _w; j++) { // столбец
                const idx = i + _h * j;
                d[idx] = 0;
                for (let k = 0; k < _h; k++) {
                    // i строка * j столбец
                    // перебираем столбцы --- перебираем строки
                    d[idx] += this.d[i + this.h * k] * _d[k + _h * j];
                    // console.log(`${i},${k}=${this.d[i + this.h * k]}    ${k},${j}=${_d[k + _h * j]}    -> ${i},${j}`);
                }
                // console.log('');
            }
        }
        return new M(_h, _w, d);
    }

    toString() {
        let ret = '';
        for (let i = 0; i < this.h; i++) {
            for (let j = 0; j < this.w; j++) {
                ret += this.d[j * this.h + i] + ' ';
            }
            ret += '\n';
        }
        return ret;
    }

    toVector() {
        if (this.w !== 1)
            throw 'Incorrect dimension';
        return this.d;
    }

    toVectors() {
        const res = [];
        for (let i = 0; i < this.w; i++) {
            res.push(this.d.slice(i * this.h, i * this.h + this.w + 1));
        }
        return res;
    }
}


function set(x, y, color) {
    //ctx.fillStyle = color;
    //ctx.fillRect(x, y, 1, 1);
    const offset = ((y >> 0) * w + (x >> 0)) * 4;
    let mask = 0xFF0000;
    for (let i = 0; i <= 3; i++) {
        id.data[offset + i] = i < 3 ? (color & mask) >> 8 * (2 - i) : 0xFF;
        mask >>= 8;
    }
}

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
    const u = cross(
        [pts[2][0] - pts[0][0], pts[1][0] - pts[0][0], pts[0][0] - P[0]],
        [pts[2][1] - pts[0][1], pts[1][1] - pts[0][1], pts[0][1] - P[1]]);
    /* `pts` and `P` has integer value as coordinates
       so `abs(u[2])` < 1 means `u[2]` is 0, that means
       triangle is degenerate, in this case return something with negative coordinates */
    if (Math.abs(u[2]) < 1) {
        b[0] = -1;
        return;
    }
    b[0] = 1 - (u[0] + u[1]) / u[2];
    b[1] = u[1] / u[2];
    b[2] = u[0] / u[2];
}

function lookat(eye, center, up) {
    const z = normalize(sub(eye, center));
    const x = normalize(cross(up, z));
    const y = normalize(cross(z, x));
    const res = M.i(4);
    for (let i = 0; i < 3; i++) {
        res.set(0, i, x[i]);
        res.set(1, i, y[i]);
        res.set(2, i, z[i]);
        res.set(i, 3, -center[i]);
    }
    return res;
}

const proj = M.i(4);

const vp = M.fromArray(4, [
    w / 3, 0, 0, w / 2,
    0, -h / 3, 0, h / 2,
    0, 0, depth / 2, depth / 2,
    0, 0, 0, 1
]);

let view;

function updateView() {
    view = lookat(vEye, vCenter, vUp);
    proj.set(3, 2, -1 / norm(sub(vEye, vCenter)));
}


function extendTo3d(v) {
    return [...v, 1];
}

function to2d(v) {
    return [
        v[0] / v[3] >> 0,
        v[1] / v[3] >> 0,
        v[2] / v[3] >> 0
    ]
}

function triangle(points, color) {
    const minX = Math.min(points[0][0], points[1][0], points[2][0]);
    const minY = Math.min(points[0][1], points[1][1], points[2][1]);
    const maxX = Math.max(points[0][0], points[1][0], points[2][0]);
    const maxY = Math.max(points[0][1], points[1][1], points[2][1]);
    const v = [];
    const b = [];
    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            v[0] = x;
            v[1] = y;
            v[2] = 0;
            baricentric(points, v, b);
            if (b[0] < 0 || b[1] < 0 || b[2] < 0) continue;
            v[2] = 0;
            for (let i = 0; i < 3; i++) v[2] += points[i][2] * b[i];
            const zBi = (v[0] + v[1] * w) >> 0;
            if (zBuffer[zBi] < v[2]) {
                zBuffer[zBi] = v[2];
                set(x, y, color);
            }

        }
    }
}

function toScreen(v) {
    return [
        ((v[0] + 1) * w / 2) >> 0,
        (h - (v[1] + 1) * h / 2) >> 0,
        v[2]
    ];
}

function gray(i) {
    const v = 255 * i >> 0;
    return (v << 16) | (v << 8) | v;
}

const vWorld = new Array(3);
const vScreen = new Array(3);

function drawObj(o) {
    o.f.forEach((f) => {
        for (let i = 0; i < 3; i++) {
            vWorld[i] = o.v[f[i][0]];
            vScreen[i] = to2d(vp.mul(proj.mul(view.mul(M.fromVector(extendTo3d(vWorld[i]))))).toVector());
        }
        const n = normalize(cross(
            sub(vWorld[2], vWorld[0]),
            sub(vWorld[1], vWorld[0])
        ));
        const intensity = dot(n, vLight);
        if (intensity > 0) {
            triangle(vScreen, gray(intensity));
        }
    })
}

let currentObject;

function render() {
    updateView();
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    id = ctx.getImageData(0, 0, w, h);
    zBuffer.fill(-Infinity);
    drawObj(currentObject);
    ctx.putImageData(id, 0, 0);
}

loadObj('head.obj').then((o) => {
    currentObject = o;
    render();
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowUp') {
        vEye[1]++;
        render();
    } else if (e.code === 'ArrowDown') {
        vEye[1]--;
        render();
    } else if (e.code === 'ArrowLeft') {
        vEye[0]++;
        render();
    } else if (e.code === 'ArrowRight') {
        vEye[0]--;
        render();
    }
});

const bcr = cnv.getBoundingClientRect();
let frame;
cnv.addEventListener('mousemove', (e) => {
    vEye[0] = w / 2 - (e.pageX - bcr.left);
    vEye[1] = (e.pageY - bcr.top) - h / 2;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(render);
});



