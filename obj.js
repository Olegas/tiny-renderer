function loadObj(path) {
    return fetch(path)
        .then((res) => res.text())
        .then((data) => {
            const res = {
                v: [],
                f: [],
                vt: [],
                vn: []
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
                        case 'vn':
                            rest.shift();
                            res.vn.push(rest.map(Number));
                    }
                })
            return res;
        });
}