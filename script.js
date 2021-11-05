const cnv = document.getElementById('canvas');
const w = cnv.width;
const h = cnv.height;
const cnvZB = new OffscreenCanvas(w, h);
const ctx = cnv.getContext('2d');
const ctxZB = cnvZB.getContext('2d');
let id = ctx.getImageData(0, 0, w, h);
const zBuffer = new Array(w * h);
const vLight = [0, 0, -1];
const vEye = [0, 0, 6];
const vCenter = [0, 0, 0];
const vUp = [0, 1, 0];
const depth = 255;
let moveLight = false;
let moveCam = false;

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

let rotMat = rotate(0, 0, 0);

const vp = M.fromArray(4, [
    w/3,    0,       0,     w/2,
    0,   -h/3,       0,     h/2,
    0,      0, depth/3, depth/2,
    0,      0,       0,       1
]);

let view;

function updateView() {
    view = lookat(vEye, vCenter, vUp);
    proj.set(3, 2, -1 / norm(sub(vEye, vCenter)));
}

function triangle(points, vTex, intensity) {
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
            const [A, B, C] = vTex;
            const tv = add(
                B,
                add(
                    mul(
                        b[0],
                        sub(A, B)
                    ),
                    mul(
                        b[1],
                        sub(C, B)
                    )
                )
            );
            const color = currentTexture.get(tv[0] * currentTexture.width, tv[1] * currentTexture.height, intensity);
            const zBi = (v[0] + v[1] * w) >> 0;
            if (zBuffer[zBi] < v[2]) {
                zBuffer[zBi] = v[2];
                set(x, y, color);
            }

        }
    }
}

const vWorld = new Array(3);
const vScreen = new Array(3);
const vTex = new Array(3);

function drawObj(o) {
    const vLightN = normalize([...vLight]);
    o.f.forEach((f) => {
        for (let i = 0; i < 3; i++) {
            vWorld[i] = o.v[f[i][0]];
            vTex[i] = o.vt[f[i][1]];
        }
        const n = normalize(cross(
            sub(vWorld[2], vWorld[0]),
            sub(vWorld[1], vWorld[0])
        ));
        const intensityL = dot(n, vLightN);
        // if (intensityL) {
            for (let i = 0; i < 3; i++) {
                vScreen[i] = to3d(vp.mul(proj.mul(rotMat.mul(view.mul(M.fromVector(extendTo4d(vWorld[i])))))).toVector());
            }
            triangle(vScreen, vTex, Math.max(0, intensityL));
        // }
    })
}

function drawZBuffer() {
    ctxZB.fillStyle = '#000000FF';
    ctxZB.fillRect(0, 0, w, h);
    const d = ctxZB.getImageData(0, 0, w, h);
    for(let i = 0; i < w; i++) {
        for(let j = 0; j < h; j++) {
            let int = zBuffer[i + j * w] >> 0;
            if (!isFinite(int)) int = 0;
            const offset = (j * w + i) * 4;
            for (let i = 0; i <= 3; i++) {
                d.data[offset + i] = i < 3 ? int : 0xFF;
            }
        }
    }
    ctxZB.putImageData(d, 0, 0);
}

let currentObject;
let currentTexture;

function render() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    id = ctx.getImageData(0, 0, w, h);
    zBuffer.fill(-Infinity);
    drawObj(currentObject);
    ctx.putImageData(id, 0, 0);
    drawZBuffer();
    ctx.strokeStyle = '#FFFFFF';
    ctx.rect(0, h - h/3, w/3, h/3);
    ctx.stroke();
    ctx.drawImage(cnvZB, 0, 0, w, h, 0, h - h/3, w/3, h/3);
}

loadObj('head.obj').then((o) => {
    currentObject = o;
    (new TGAImage('./african_head_diffuse.tga')).load().then((t) => {
        currentTexture = t;
        updateView();
        render();
    });
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyL') {
        moveLight = true;
        moveCam = false;
    } else if (e.code === 'KeyC') {
        moveCam = true;
        moveLight = false;
    }
});

document.addEventListener('keyup', (e) => {
    if (moveLight && e.code === 'KeyL') {
        moveLight = false;
    } else if (moveCam && e.code === 'KeyC') {
        moveCam = false;
    }
});

function rotate(x, y, z) {
    const rotX = M.fromArray(4, [
        1, 0, 0, 0,
        0, Math.cos(x), -Math.sin(x), 0,
        0, Math.sin(x), Math.cos(x), 0,
        0, 0, 0, 1
    ]);
    const rotY = M.fromArray(4, [
        Math.cos(y), 0, Math.sin(y), 0,
        0, 1, 0, 0,
        -Math.sin(y), 0, Math.cos(y), 0,
        0, 0, 0, 1
    ]);
    const rotZ = M.fromArray(4, [
        Math.cos(z), -Math.sin(z), 0, 0,
        Math.sin(z), Math.cos(z), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
    return rotX.mul(rotY.mul(rotZ));
}


const bcr = cnv.getBoundingClientRect();
let frame;
cnv.addEventListener('mousemove', (e) => {
    let changes;
    if (moveLight) {
        vLight[0] = 1 - ((e.pageX - bcr.left) / bcr.width) * 2;
        vLight[1] = ((e.pageY - bcr.top) / bcr.height) * 2 - 1;
        changes = true;
    } else if (moveCam) {
        vEye[0] = w / 2 - (e.pageX - bcr.left);
        vEye[1] = (e.pageY - bcr.top) - h / 2;
        updateView();
        changes = true;
    }
    if (changes) {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(render);
    }
});



