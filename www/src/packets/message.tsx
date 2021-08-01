import {EventInfo, GameEventDefinition, Message, PacketEntity, SendPropValue} from "../parser";
import React from "react";
import {filterEntity, filterMessage, Search} from "../search";

export interface MessageInfoProps {
    msg: Message,
    prop_names: Map<number, { table: String, prop: String }>,
    class_names: Map<number, String>,
    search: Search
}

export function MessageInfo({msg, prop_names, class_names, search}: MessageInfoProps) {
    switch (msg.type) {
        case "Print":
            return <>{msg.value}</>
        case "ServerInfo":
            return <>stv: {msg.stv ? 'true' : 'false'}, map: {msg.map}, player count: {msg.player_count},
                map: {msg.map}</>
        case "NetTick":
            return <>Tick {msg.tick}, frame time: {msg.frame_time}, std_dev: {msg.std_dev}</>
        case "ParseSounds":
            return <>{msg.reliable ? 'reliable' : 'unreliable'} {msg.num} sounds: {msg.length} bits</>
        case "VoiceInit":
            return <>{msg.codec} at quality {msg.quality} and sampling rage {msg.sampling_rate}</>
        case "SigOnState":
            return <>state: {msg.state}, count: {msg.count}</>
        case "SetConVar":
            return <>{msg.vars.map(cvar => `${cvar.key}=${cvar.value}`).join(', ')}</>
        case "SetView":
            return <>set view to entity {msg.index}</>
        case "GameEventList":
            return <>{msg.event_list.map(formatEventDefinition).map((str, i) => (<p key={i}>{str}</p>))}</>
        case "PacketEntities":
            let entities = filteredEntities(msg.entities, search).map(entity => formatEntity(entity, prop_names, class_names)).map((str, i) =>
                <p
                    key={i}>{str}</p>);
            let deleted = <></>
            if (msg.removed_entities.length > 0) {
                deleted = <>deleted: {msg.removed_entities.join(', ')}</>
            }
            return <>
                <p>delta: {JSON.stringify(msg.delta)}</p>
                <p>baseline: {JSON.stringify(msg.base_line)}</p>
                <p>max: {JSON.stringify(msg.max_entries)}</p>
                <p>updated base line: {JSON.stringify(msg.updated_base_line)}</p>
                {entities}
                {deleted}
            </>
        case "TempEntities":
            let events = filteredTempEntities(msg.events, search).map(event => {
                let class_name = class_names.get(event.class_id);
                let props = event.props.map(prop => {
                    let names = prop_names.get(prop.identifier);
                    if (names) {
                        return `${names.table}.${names.prop}=${formatPropValue(prop.value)}`;
                    } else {
                        return `[unknown prop]=${prop.value}`;
                    }
                });
                return `temp entity ${class_name}(delay: ${event.fire_delay}, reliable:${JSON.stringify(event.reliable)}): ` + props.join(', ');
            })
            return <>{events.map(event => <p>{event}</p>)}</>
        default:
            let json = msg;
            delete json.type;
            return <>{JSON.stringify(json)}</>
    }
}


function formatPropValue(value: SendPropValue): string {
    if (Array.isArray(value)) {
        return '[' + value.map(formatPropValue).join(',') + ']'
    } else if (typeof value === "number" || typeof value === "string") {
        return `${value}`
    } else {
        return JSON.stringify(value)
    }
}

function formatEntity(entity: PacketEntity, prop_names: Map<number, { table: String, prop: String }>, class_names: Map<number, String>,): string {
    let class_name = class_names.get(entity.server_class);
    let props = entity.props.map(prop => {
        let names = prop_names.get(prop.identifier);
        if (names) {
            return `${names.table}.${names.prop}=${formatPropValue(prop.value)}`;
        } else {
            return `[unknown prop]=${prop.value}`;
        }
    })
    return `entity ${entity.entity_index}(${class_name}) ${entity.pvs}: ` + props.join(', ');
}

function formatEventDefinition(event: GameEventDefinition): string {
    let values = event.entries.map(entry => `${entry.name}: ${entry.kind}`);
    return `${event.event_type}{${values.join(', ')}}`;
}

function filteredEntities(entities: PacketEntity[], search: Search) {
    if (search.filter || search.entity) {
        return entities.filter(entities => {
            return (search.entity == 0 || search.entity == entities.entity_index) &&
            (search.filter.length < 3 || filterEntity(entities.server_class, entities.props, search))
        });
    } else {
        return entities;
    }
}

function filteredTempEntities(entities: EventInfo[], search: Search) {
    if (search.entity) {
        return [];
    }
    if (search.filter) {
        return entities.filter(entities => filterEntity(entities.class_id, entities.props, search));
    } else {
        return entities;
    }
}