mod utils;

use wasm_bindgen::prelude::*;
use crate::utils::set_panic_hook;
use tf_demo_parser::demo::parser::{DemoHandler, NullHandler};
use tf_demo_parser::demo::header::Header;
use tf_demo_parser::demo::parser::RawPacketStream;
use bitbuffer::{BitRead, LittleEndian, BitReadBuffer, BitReadStream};

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub struct Parser {
    handler: DemoHandler<'static, NullHandler>,
    header: Header,
    packets: RawPacketStream<'static>,
}

#[wasm_bindgen]
impl Parser {
    #[wasm_bindgen(constructor)]
    pub fn new(input: Vec<u8>) -> Self {
        set_panic_hook();
        let buffer = BitReadBuffer::new_owned(input, LittleEndian);
        let mut stream = BitReadStream::new(buffer);
        let header = Header::read(&mut stream).unwrap();

        let packets = RawPacketStream::new(stream);
        let mut handler = DemoHandler::default();
        handler.handle_header(&header);

        Parser {
            handler,
            header,
            packets
        }
    }

    pub fn header(&self) -> JsValue {
        JsValue::from_serde(&self.header).unwrap()
    }

    pub fn next(&mut self) -> JsValue {
        self.packets.next(&self.handler.state_handler).unwrap().map(|packet| {
            let out = JsValue::from_serde(&packet).unwrap();
            self.handler.handle_packet(packet).unwrap();
            out
        }).unwrap_or(JsValue::NULL)
    }
}
