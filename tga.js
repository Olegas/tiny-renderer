const GRAYSCALE=1, RGB=3, RGBA=4;

class TGAImage {
    constructor(file) {
        this.file = file;
        this.data = null;
    }

    load() {
        return this._readTga();
    }

    _readTga() {
        return fetch(this.file)
            .then((res) => res.blob())
            .then((blob) => blob.arrayBuffer())
            .then((arr) => {
                const data = new DataView(arr);
                // struct TGA_Header {
                //  0    char idlength;
                //  1    char colormaptype;
                //  2    char datatypecode;
                //  3    short colormaporigin;
                //  5    short colormaplength;
                //  7    char colormapdepth;
                //  8    short x_origin;
                //  10   short y_origin;
                //  12   short width;
                //  14   short height;
                //  16   char  bitsperpixel;
                //  17   char  imagedescriptor;
                // };
                const header = {
                    idlength: data.getInt8(0),
                    colormaptype: data.getInt8(1),
                    datatypecode: data.getInt8(2),
                    colormaporigin: data.getInt16(3, true),
                    colormaplength: data.getInt16(5, true),
                    colormapdepth: data.getInt8(7),
                    x_origin: data.getInt16(8, true),
                    y_origin: data.getInt16(10, true),
                    width: data.getInt16(12, true),
                    height: data.getInt16(14, true),
                    bitsperpixel: data.getInt8(16),
                    imagedescriptor: data.getInt8(17)
                }
                this.width   = header.width;
                this.height  = header.height;
                this.bytespp = header.bitsperpixel>>3;
                if (this.width<=0 || this.height<=0 || (this.bytespp !== GRAYSCALE && this.bytespp !== RGB && this.bytespp !== RGBA)) {
                    throw 'Bad BPP or width/height';
                }

                if (3 === header.datatypecode || 2 === header.datatypecode) {
                    this.data = new DataView(arr.slice(18));
                } else if (10 === header.datatypecode || 11 === header.datatypecode) {
                    const nbytes = this.bytespp * this.width * this.height;
                    this.data = new DataView(new ArrayBuffer(nbytes));
                    return this._loadRLE(arr);
                } else {
                    throw `unknown file format ${header.datatypecode}`;
                }
                if (!(header.imagedescriptor & 0x20)) {
                    throw 'Not implemented (flip_vertically)';
                }
                if (header.imagedescriptor & 0x10) {
                    throw 'Not implemented (flip_horizontally)';
                }
                return this;
            })
    }

    _loadRLE(arr) {
        const dv = new DataView(arr);
        const pixelcount = this.width * this.height;
        let currentpixel = 0;
        let currentbyte  = 0;
        let chunks = 0;
        let pos = 18;
        do {
            chunks++;
            let chunkheader = dv.getUint8(pos++);
            if (chunkheader < 128) {
                chunkheader++;
                for (let i = 0; i < chunkheader; i++) {
                    const buffer = new DataView(arr, pos, this.bytespp);
                    pos += this.bytespp;
                    for (let t = 0; t < this.bytespp; t++)
                        this.data.setInt8(currentbyte++, buffer.getUint8(t));
                    currentpixel++;
                    if (currentpixel>pixelcount) {
                        throw 'Too many pixels read';
                    }
                }
            } else {
                chunkheader -= 127;
                const buffer = new DataView(arr, pos, this.bytespp);
                pos += this.bytespp;
                for (let i = 0; i < chunkheader; i++) {
                    for (let t = 0; t < this.bytespp; t++)
                        this.data.setInt8(currentbyte++, buffer.getUint8(t));
                    currentpixel++;
                    if (currentpixel>pixelcount) {
                        throw 'Too many pixels read';
                    }
                }
            }
        } while (currentpixel < pixelcount);
        return this;
    }

    get(x, y, intensity = 1, gamma = 1) {
        intensity = Math.max(0, Math.min(1, intensity));
        x = x >> 0;
        y = y >> 0;
        const offset = (y * this.width + x) * this.bytespp;
        const b = Math.pow(this.data.getUint8(offset) / 255, gamma) * 255 * intensity;
        const g = Math.pow(this.data.getUint8(offset + 1) / 255, gamma) * 255 * intensity;
        const r = Math.pow(this.data.getUint8(offset + 2) / 255, gamma) * 255 * intensity;
        return (r << 16) | (g << 8) | b;
    }
}
