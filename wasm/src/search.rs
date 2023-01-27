use serde::{Deserialize, Serialize};
use tf_demo_parser::demo::message::gameevent::GameEventMessage;
use tf_demo_parser::demo::message::packetentities::{PacketEntitiesMessage, PacketEntity};
use tf_demo_parser::demo::message::setconvar::SetConVarMessage;
use tf_demo_parser::demo::message::stringtable::{
    CreateStringTableMessage, UpdateStringTableMessage,
};
use tf_demo_parser::demo::message::tempentities::TempEntitiesMessage;
use tf_demo_parser::demo::message::{
    EntityMessage, FileMessage, GetCvarValueMessage, Message, PrintMessage, SetViewMessage,
    StringCmdMessage,
};
use tf_demo_parser::demo::packet::consolecmd::ConsoleCmdPacket;
use tf_demo_parser::demo::packet::datatable::ClassId;
use tf_demo_parser::demo::packet::message::MessagePacket;
use tf_demo_parser::demo::packet::stringtable::{StringTableEntry, StringTablePacket};
use tf_demo_parser::demo::packet::Packet;
use tf_demo_parser::demo::sendprop::SendPropIdentifier;

#[derive(Serialize, Deserialize)]
pub struct SearchFilter {
    pub entity: u32,
    pub search: String,
    pub prop_ids: Vec<SendPropIdentifier>,
    pub class_ids: Vec<ClassId>,
}

impl SearchFilter {
    pub fn has_entity_filter(&self) -> bool {
        !self.search.is_empty() || !self.prop_ids.is_empty() || !self.class_ids.is_empty()
    }
}

pub fn packet_matches(packet: &Packet, filter: &SearchFilter) -> bool {
    // return false;
    // if packet
    //     .packet_type()
    //     .as_lowercase_str()
    //     .contains(&filter.search)
    // {
    //     return true;
    // }
    match packet {
        Packet::Signon(MessagePacket { messages, .. })
        | Packet::Message(MessagePacket { messages, .. }) => messages
            .iter()
            .any(|message| message_matches(message, filter)),
        Packet::SyncTick(_) => false,
        Packet::ConsoleCmd(ConsoleCmdPacket { command, .. }) => command.contains(&filter.search),
        Packet::UserCmd(_) => false,
        Packet::DataTables(_) => false,
        Packet::Stop(_) => false,
        Packet::StringTables(StringTablePacket { tables, .. }) => tables.iter().any(|table| {
            table.name.contains(&filter.search)
                || table.entries.iter().any(|(_, entry)| {
                    entry
                        .text
                        .as_deref()
                        .map(|text| text.contains(&filter.search))
                        .unwrap_or_default()
                })
        }),
    }
}

fn message_matches(message: &Message, filter: &SearchFilter) -> bool {
    let has_search = !filter.search.is_empty();
    match message {
        Message::File(FileMessage { file_name, .. }) => {
            has_search && file_name.contains(&filter.search)
        }
        Message::StringCmd(StringCmdMessage { command, .. }) => {
            has_search && command.contains(&filter.search)
        }
        Message::SetConVar(SetConVarMessage { vars, .. }) => {
            has_search
                && vars.iter().any(|var| {
                    var.key.contains(&filter.search) || var.value.contains(&filter.search)
                })
        }
        Message::Print(PrintMessage { value }) => {
            has_search && value.as_ref().contains(&filter.search)
        }
        Message::CreateStringTable(CreateStringTableMessage { table, .. }) => {
            has_search && table.name.contains(&filter.search)
                || table
                    .entries
                    .iter()
                    .any(|(_, entry)| string_entry_matches(entry, filter))
        }
        Message::UpdateStringTable(UpdateStringTableMessage { entries, .. }) => {
            has_search
                && entries
                    .iter()
                    .any(|(_, entry)| string_entry_matches(entry, filter))
        }
        Message::SetView(SetViewMessage { index }) => (*index as u32) == filter.entity,
        Message::UserMessage(_) => false,
        Message::EntityMessage(EntityMessage { class_id, .. }) => {
            filter.class_ids.contains(&((*class_id).into()))
        }
        Message::GameEvent(GameEventMessage { event, .. }) => {
            has_search && event.event_type().as_str().contains(&filter.search)
        }
        Message::PacketEntities(PacketEntitiesMessage {
            entities,
            removed_entities,
            ..
        }) => {
            (removed_entities.contains(&filter.entity.into()) && !filter.has_entity_filter())
                || entities.iter().any(|entity| entity_matches(entity, filter))
        }
        Message::TempEntities(TempEntitiesMessage { events }) => events.iter().any(|event| {
            filter
                .class_ids
                .contains(&(u16::from(event.class_id).into()))
        }),
        Message::GetCvarValue(GetCvarValueMessage { value, .. }) => {
            has_search && value.contains(&filter.search)
        }
        _ => false,
    }
}

fn string_entry_matches(entry: &StringTableEntry, filter: &SearchFilter) -> bool {
    (!filter.search.is_empty())
        && entry
            .text
            .as_deref()
            .map(|text| text.contains(&filter.search))
            .unwrap_or_default()
}

fn entity_matches(entity: &PacketEntity, filter: &SearchFilter) -> bool {
    if entity.entity_index != filter.entity && filter.entity != 0 {
        return false;
    }

    if !filter.has_entity_filter() {
        return true;
    }

    if filter
        .class_ids
        .contains(&u16::from(entity.server_class).into())
    {
        return true;
    }

    entity
        .props
        .iter()
        .any(|prop| filter.prop_ids.contains(&prop.identifier.into()))
}
