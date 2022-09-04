import {Parser} from "demo-inspector";
import {RequestMessageData, ResponseMessageData} from "./rpc";

declare function postMessage(message: ResponseMessageData): void;

let parser: Parser | null = null;

onmessage = function (event: MessageEvent<RequestMessageData>) {
    const data = event.data;
    const sequence = data.sequence;
    switch (data.type) {
        case "data":
            import("demo-inspector")
                .then(({Parser}) => {
                    parser = new Parser(new Uint8Array(data.data), (progress: number) => {
                        postMessage({type: "progress", progress, sequence})
                    });
                    postMessage({
                        type: "done",
                        packets: parser.packets(),
                        header: parser.header(),
                        prop_names: parser.prop_names(),
                        class_names: parser.class_names(),
                        sequence
                    })
                })
            break;
        case "search":
            if (parser) {
                const matches = parser.search(data.filter);
                postMessage({type: "search_result", matches: Array.prototype.slice.call(matches), sequence})
            }
            break;
        case "get":
            if (parser) {
                const packet = parser.packet(data.packet);
                postMessage({type: "packet", packet, sequence})
            }
            break;
    }
};