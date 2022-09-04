import {SearchFilter} from "./search";
import {Packet} from "./parser";
import {Header} from "./header";
import {PacketMeta} from "./App";
import {Simulate} from "react-dom/test-utils";
import progress = Simulate.progress;

export type RequestMessageData = { type: "data", sequence?: number, data: ArrayBuffer }
    | { type: "get", sequence?: number, packet: number }
    | { type: "search", sequence?: number, filter: SearchFilter }

export type ResponseMessageData = { type: "error", sequence: number, e: Error }
    |{ type: "progress", sequence: number, progress: number }
    | { type: "packet", sequence: number, packet: Packet }
    | { type: "done", sequence: number, packets: PacketMeta[], header: Header, prop_names: { identifier: string, table: string, prop: string }[], class_names: { identifier: number, name: string }[] }
    | { type: "search_result", sequence: number, matches: number[] };

const ResponseTypeMap = {
    "search": "search_result",
    "get": "packet",
    "data": "done",
}

export interface ParsedDemo {
    packets: PacketMeta[],
    header: Header,
    prop_names: { identifier: string, table: string, prop: string }[],
    class_names: { identifier: number, name: string }[]
}

export class DemoWorker {
    worker: Worker
    packets: PacketMeta[] = [];
    lastSequence = 0;
    callbacks: Map<number, [(_: ResponseMessageData) => void, (_: Error) => void]>;
    onProgress: null | ((progress: number) => void) = null;

    constructor() {
        this.callbacks = new Map();
        this.worker = new Worker('./worker.js');
        this.worker.addEventListener("message", (event: MessageEvent<ResponseMessageData>) => {
            const data = event.data;
            const sequence = data.sequence;
            const [resolve, reject] = this.callbacks.get(sequence);
            if (data.type == "error") {
                this.callbacks.delete(sequence);
                reject(data.e);
            } else if (data.type === "progress") {
                if (this.onProgress) {
                    this.onProgress(data.progress);
                }
            } else {
                this.callbacks.delete(sequence);
                resolve(event.data);
            }
        });
    }

    postMessage(message: RequestMessageData, transfer: Transferable[] = []): Promise<ResponseMessageData> {
        const sequence = this.lastSequence++;
        message.sequence = sequence;
        this.worker.postMessage(message, transfer);
        return new Promise((resolve, reject) => {
            this.callbacks.set(sequence, [resolve, reject]);
        });
    }

    public async load(data: ArrayBuffer, onProgress: (progress: number) => void): Promise<ParsedDemo> {
        this.onProgress = onProgress;
        const response = await this.postMessage({
            type: "data",
            data,
        }, [data]);
        this.onProgress = null;
        if (response.type === "done") {
            return response;
        } else {
            throw new Error("Invalid response type");
        }
    }

    public async get(packet: number): Promise<Packet> {
        const response = await this.postMessage({
            type: "get",
            packet,
        });
        if (response.type === "packet") {
            return response.packet;
        } else {
            throw new Error("Invalid response type");
        }
    }

    public async search(filter: SearchFilter): Promise<number[]> {
        const response = await this.postMessage({
            type: "search",
            filter,
        });
        if (response.type === "search_result") {
            return response.matches;
        } else {
            throw new Error("Invalid response type");
        }
    }
}