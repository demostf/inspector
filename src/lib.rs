mod search;
mod utils;

use crate::search::{packet_matches, SearchFilter};
use bitbuffer::{BitRead, BitReadBuffer, BitReadStream, LittleEndian};
use js_sys::Function;
use serde::Serialize;
use tf_demo_parser::demo::header::Header;
use tf_demo_parser::demo::packet::datatable::{DataTablePacket, SendTableName, ServerClassName};
use tf_demo_parser::demo::packet::Packet;
use tf_demo_parser::demo::parser::DemoHandler;
use tf_demo_parser::demo::parser::RawPacketStream;
use tf_demo_parser::demo::sendprop::SendPropName;
use wasm_bindgen::prelude::*;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[derive(Debug, Serialize)]
pub struct PacketMeta {
    index: usize,
    tick: u32,
    ty: u8,
}

#[wasm_bindgen]
pub struct Parser {
    header: Header,
    packets: Vec<Packet<'static>>,
    prop_names: Vec<(u64, SendTableName, SendPropName)>,
    class_names: Vec<(u16, ServerClassName)>,
}

#[wasm_bindgen]
impl Parser {
    #[wasm_bindgen(constructor)]
    pub fn new(input: Vec<u8>, progress: Function) -> Self {
        let buffer = BitReadBuffer::new_owned(input, LittleEndian);
        let mut stream = BitReadStream::new(buffer);
        let header = Header::read(&mut stream).unwrap();

        let mut packet_stream = RawPacketStream::new(stream);
        let mut handler = DemoHandler::default();
        handler.handle_header(&header);

        let mut packets = Vec::new();

        let mut last_progress = 0.0;

        let mut prop_names = Vec::new();
        let mut class_names = Vec::new();

        while let Some(packet) = packet_stream.next(handler.get_parser_state()).unwrap() {
            let tick = packet.tick();
            packets.push(packet.clone());

            if let Packet::DataTables(DataTablePacket {
                tables,
                server_classes,
                ..
            }) = &packet
            {
                for table in tables {
                    for prop in &table.props {
                        prop_names.push((
                            prop.identifier.into(),
                            prop.identifier
                                .table_name()
                                .unwrap_or_else(|| table.name.clone()),
                            prop.identifier
                                .prop_name()
                                .unwrap_or_else(|| prop.name.clone()),
                        ));
                    }
                }
                for class in server_classes {
                    class_names.push((class.id.into(), class.name.clone()))
                }
            }

            handler.handle_packet(packet).unwrap();

            let new_progress = ((tick as f32 / header.ticks as f32) * 100.0).floor();
            if new_progress > last_progress {
                last_progress = new_progress;
                progress
                    .call1(&JsValue::NULL, &JsValue::from(new_progress))
                    .unwrap();
            }
        }

        Parser {
            header,
            packets,
            prop_names,
            class_names,
        }
    }

    pub fn header(&self) -> JsValue {
        JsValue::from_serde(&self.header).unwrap()
    }

    pub fn packets(&self) -> Vec<JsValue> {
        self.packets
            .iter()
            .enumerate()
            .map(|(index, packet)| PacketMeta {
                index,
                tick: packet.tick(),
                ty: packet.packet_type() as u8,
            })
            .map(|meta| JsValue::from_serde(&meta).unwrap())
            .collect()
    }

    pub fn packet(&self, index: usize) -> JsValue {
        JsValue::from_serde(&self.packets[index]).unwrap()
    }

    pub fn prop_names(&self) -> Vec<JsValue> {
        self.prop_names
            .iter()
            .map(|(identifier, table, prop)| {
                JsValue::from_serde(&PropName {
                    identifier: identifier.to_string(),
                    table: table.to_string(),
                    prop: prop.to_string(),
                })
                .unwrap()
            })
            .collect()
    }

    pub fn class_names(&self) -> Vec<JsValue> {
        self.class_names
            .iter()
            .map(|(identifier, name)| {
                JsValue::from_serde(&ClassName {
                    identifier: *identifier,
                    name: name.to_string(),
                })
                .unwrap()
            })
            .collect()
    }

    pub fn search(&self, filter: JsValue) -> Vec<usize> {
        let filter: SearchFilter = filter.into_serde().expect("failed to parse search filter");
        self.packets
            .iter()
            .enumerate()
            .filter_map(|(index, packet)| packet_matches(packet, &filter).then_some(index))
            .collect()
    }
}

#[derive(Serialize)]
pub struct PropName {
    pub identifier: String,
    pub table: String,
    pub prop: String,
}

#[derive(Serialize)]
pub struct ClassName {
    pub identifier: u16,
    pub name: String,
}
