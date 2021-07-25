import {Parser} from "demo-inspector";

declare function postMessage(message: any): void;

onmessage = function (event) {
    let data = event.data as ArrayBuffer;
    import("demo-inspector")
        .then(({Parser}) => {
            console.log(data);
            let parser = new Parser(new Uint8Array(data));

            postMessage({type: "header", header: parser.header()})

            let packet;
            do {
                packet = parser.next();
                if (packet) {
                    postMessage({type: "packet", packet})
                }
            } while (packet);
            postMessage({type: "done"})
        })
};