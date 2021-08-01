import React, {CSSProperties, JSXElementConstructor, ReactElement} from 'react';
import {GameEventDefinition, Message, Packet, PacketEntity, SendPropValue, UserCmd} from "./parser";
import {FixedSizeList as List} from 'react-window';

interface TableProps {
    packets: Packet[],
    prop_names: Map<number, { table: String, prop: String }>,
    class_names: Map<number, String>,
    onClick: (i: number, packet: Packet) => void,
    activeIndex: number | null,
}

export function PacketTable({packets, prop_names, class_names, onClick, activeIndex}: TableProps) {
    const Row: (props: { index: number, style: CSSProperties }) => any = ({index, style}) => (
        <div key={index} onClick={() => {
            onClick(index, packets[index])
        }} style={style} className={(activeIndex == index ? 'active ' : '') + 'prop_row'}>
            <PacketRow packet={packets[index]}/>
        </div>
    );

    return (
        <>
            <List className="list" height={window.innerHeight} itemCount={packets.length} itemSize={30} width={210}>
                {Row}
            </List>
        </>
    )
}

interface RowProps {
    packet: Packet,
}

export function PacketRow({packet}: RowProps) {
    switch (packet.type) {
        case "Sigon":
        case "Message":
            return <>
                <span className="tick">{packet.tick}</span>
                <span className="type">{packet.type}</span>
            </>
        case "SyncTick":
            return <>
                <span className="tick">{packet.tick}</span>
                <span className="type">{packet.type}</span>
            </>;
        case "ConsoleCmd":
            return <>
                <span className="tick">{packet.tick}</span>
                <span className="type">{packet.type}</span>
            </>;
        case "UserCmd":
            return <>
                <span className="tick">{packet.tick}</span>
                <span className="type">{packet.type}</span>
            </>;
        case "DataTables":
            return <>
                <span className="tick">{packet.tick}</span>
                <span className="type">{packet.type}</span>
            </>;
        case "Stop":
            return <>
                <span className="tick">{packet.tick}</span>
                <span className="type">{packet.type}</span>
            </>;
        case "StringTables":
            return <>
                <span className="tick">{packet.tick}</span>
                <span className="type">{packet.type}</span>
            </>;
    }
}

interface DetailProps {
    packet: Packet,
    prop_names: Map<number, { table: String, prop: String }>,
    class_names: Map<number, String>,
}

export function PacketDetails({packet, prop_names, class_names}: DetailProps) {
    switch (packet.type) {
        case "Sigon":
        case "Message":
            let rows = packet.messages.map((message, y) => <tr key={y}>
                <td className="type">{message.type}</td>
                <td>{messageInfoText(message, prop_names, class_names)}</td>
            </tr>)
            return (
                <table>
                    <tbody>
                    {rows}
                    </tbody>
                </table>
            )
        case "SyncTick":
            return <></>
        case "ConsoleCmd":
            return <>{packet.command}</>
        case "UserCmd":
            return <>{formatUserCmd(packet.cmd)}</>
        case "DataTables":
            return <>{packet.tables.length}</>
        case "Stop":
            return <></>
        case "StringTables":
            return <>{packet.tables.length}</>
    }
}

function messageInfoText(msg: Message, prop_names: Map<number, { table: String, prop: String }>, class_names: Map<number, String>) {
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
            let entities = msg.entities.map(entity => formatEntity(entity, prop_names, class_names)).map((str, i) => <p
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
            let events = msg.events.map(event => {
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

function formatUserCmd(cmd: UserCmd): string {
    let out = `${cmd.command_number} - tick ${cmd.tick_count}: `;

    const formatOptionNum = (x: number | null) => x === null ? 0 : x;
    const anyNonNull = (xs: (number | null)[]) => xs.findIndex(x => x !== null) != -1;

    let parts = [];

    if (anyNonNull(cmd.view_angles)) {
        parts.push(`view angles: ${cmd.view_angles.map(formatOptionNum).join(',')}`);
    }
    if (anyNonNull(cmd.movement)) {
        parts.push(`movement: ${cmd.movement.map(formatOptionNum).join(',')}`);
    }
    if (cmd.mouse_dx !== null || cmd.mouse_dy !== null) {
        parts.push(`mouse: ${[cmd.mouse_dx, cmd.mouse_dy].map(formatOptionNum).join(',')}`);
    }
    if (cmd.impulse) {
        parts.push(`impulse ${cmd.impulse}`)
    }
    if (cmd.buttons) {
        parts.push(`buttons ${cmd.buttons}`)
    }
    if (cmd.weapon_select) {
        parts.push(`weapon ${cmd.weapon_select.select}(${cmd.weapon_select.subtype})`)
    }
    if (parts.length == 0) {
        parts.push(`no data`)
    }

    return out + parts.join(', ');
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