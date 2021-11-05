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