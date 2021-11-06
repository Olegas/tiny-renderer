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

function createOffscreenCanvas(w, h) {
    if (typeof OffscreenCanvas !== 'undefined') {
        return new OffscreenCanvas(w, h);
    } else {
        const elt = document.createElement('canvas');
        elt.id = 'zbCanvas';
        elt.width = w;
        elt.height = h;
        document.body.appendChild(elt);
        return elt;
    }
}



