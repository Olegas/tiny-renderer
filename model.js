(function() {
    class Model {

        get nFaces() {
            return this.f.length;
        }

        constructor(file, textures) {
            this.file = file;
            this.textures = textures;
            this.v = []; // Vertexes
            this.f = []; // Faces
            this.vt = []; //
            this.vn = []; // Normal vector for each vertex
        }

        load() {
            const steps = [
                this._loadObj(),
                ...Object.keys(this.textures).map((type) => this._loadTexture(type, this.textures[type]))
            ];
            return Promise.all(steps);
        }

        _loadTexture(type, file) {
            return (new TGAImage(file)).load().then((img) => {
                this.textures[type] = img;
            });
        }

        _loadObj() {
            return fetch(this.file)
                .then((res) => res.text())
                .then((data) => {
                    data.split('\n')
                        .forEach((l) => {
                            const [item, ...rest] = l.split(' ');
                            switch (item) {
                                case 'v':
                                    this.v.push(rest.map(Number));
                                    break;
                                case 'f':
                                    this.f.push(rest.map((i) => {
                                        return i.split('/').map((v) => +v - 1);
                                    }));
                                    break;
                                case 'vt':
                                case 'vn':
                                    rest.shift();
                                    this[item].push(rest.map(Number));
                                    break;
                            }
                        })
                });
        }

        // Rename?
        uv(nFace, nVert) {
            const f = this.f[nFace];
            const d = f[nVert][1];
            return this.vt[d];
        }

        vNormal(nFace, nVert) {
            if (!this.vn.length)
                throw 'No vertex normal data';
            const f = this.f[nFace];
            const vI = f[nVert][0];
            return this.vn[vI];
        }

        diffuse(uv, intensity = 1) {
            if (!(this.textures.diffuse instanceof TGAImage)) {
                throw 'No diffuse texture loaded';
            }
            const { diffuse } = this.textures;
            const { width, height } = diffuse;
            const [x, y] = uv;
            return diffuse.get(x * width, y * height, intensity);
        }
    }

    window.Model = Model;
})();
