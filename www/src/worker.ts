import {Parser} from "demo-inspector";

declare function postMessage(message: any): void;

let parser: Parser | null = null;

type MessageData = {type: "data", data: ArrayBuffer} | {type: "get", packet: number}

onmessage = function (event: MessageEvent<MessageData>) {
    const data = event.data;
    switch (data.type) {
        case "data":
            import("demo-inspector")
                .then(({Parser}) => {
                    parser = new Parser(new Uint8Array(data.data), (progress: number) => {
                        postMessage({type: "progress", progress})
                    });
                    postMessage({
                        type: "done",
                        packets: parser.packets(),
                        header: parser.header(),
                        prop_names: parser.prop_names(),
                        class_names: parser.class_names()
                    })
                })
            break;
        case "get":
            if (parser) {
                const packet = parser.packet(data.packet);
                postMessage({type: "packet", packet})
            }
            break;
    }
};