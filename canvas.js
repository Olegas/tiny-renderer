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



