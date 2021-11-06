class FlatShader {

    constructor(model, vLight) {
        this.model = model;
        this.vL = normalize(vLight);
        this.vW = new Array(3);
    }

    vertex(nFace, nVert) {
        const f = this.model.f[nFace];
        const v = this.model.v[f[nVert][0]];
        const v4d = proj.mul(view.mul(extendTo4d(v)));
        this.vW[nVert] = to3d(v4d.toVector());
        return to3d(vp.mul(rotMat.mul(v4d)).toVector());
    }

    _lightIntensity() {
        const vWorld = this.vW;
        const n = normalize(cross(
            sub(vWorld[1], vWorld[0]),
            sub(vWorld[2], vWorld[0])
        ));
        return dot(n, this.vL);
    }

    _gray(intensity) {
        const v = 255 * Math.max(0, Math.min(1, intensity));
        return v << 16 | v << 8 | v;
    }

    fragment(b) {
        return this._gray(this._lightIntensity(b));
    }
}

class GouraudShader extends FlatShader {
    constructor(...args) {
        super(...args);
        this.vi = new Array(3);
    }

    vertex(nFace, nVert) {
        const vN = this.model.vNormal(nFace, nVert);
        this.vi[nVert] = dot(vN, this.vL);
        return super.vertex(nFace, nVert);
    }

    _lightIntensity(b) {
        return dot(this.vi, b);
    }
}

class DiffuseShader extends GouraudShader {

    constructor(...args) {
        super(...args);
        this.uV = new Array(3);
    }

    vertex(nFace, nVert) {
        this.uV[nVert] = this.model.uv(nFace, nVert);
        return super.vertex(nFace, nVert);
    }

    fragment(b) {
        const [B, C, A] = this.uV;
        const tv = add(
            A,
            add(
                mul(
                    b[0],
                    sub(B, A)
                ),
                mul(
                    b[1],
                    sub(C, A)
                )
            )
        )
        return this.model.diffuse(tv, this._lightIntensity(b));
    }
}