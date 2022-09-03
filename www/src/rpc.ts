import {SearchFilter} from "./search";
import {Packet} from "./parser";
import {Header} from "./header";
import {PacketMeta} from "./index";

export type RequestMessageData = {type: "data", data: ArrayBuffer}
    | {type: "get", packet: number}
    | {type: "search", filter: SearchFilter}

export type ResponseMessageData = { type: "progress", progress: number }
    | { type: "packet", packet: Packet }
    | { type: "done", packets: PacketMeta[], header: Header, prop_names: { identifier: number, table: string, prop: string }[], class_names: { identifier: number, name: string }[] }
    | { type: "packet_names", packet: {} }
    | { type: "search_result", matches: number[] };