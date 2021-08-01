import React, {CSSProperties, JSXElementConstructor, ReactElement} from 'react';
import {GameEventDefinition, Message, Packet, PacketEntity, SendPropValue, UserCmd} from "./parser";
import {FixedSizeList as List} from 'react-window';
import {MessageInfo} from "./packets/message";
import {UserCmdDetails} from "./packets/usercmd";
import {filterMessage, filterPacket, Search} from "./search";

interface TableProps {
    packets: Packet[],
    prop_names: Map<number, { table: string, prop: string }>,
    class_names: Map<number, string>,
    onClick: (i: number, packet: Packet) => void,
    activeIndex: number | null,
}

export function PacketTable({packets, prop_names, class_names, onClick, activeIndex}: TableProps) {
    const Row: (props: { index: number, style: CSSProperties }) => any = ({index, style}) => (
        <p key={index} onClick={() => {
            onClick(index, packets[index])
        }} style={style} className={(activeIndex == index ? 'active ' : '') + 'prop_row'}>
            <PacketRow packet={packets[index]}/>
        </p>
    );

    return (
        <>
            <List className="list" height={window.innerHeight - 31} itemCount={packets.length} itemSize={30} width={210}>
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
    prop_names: Map<number, { table: string, prop: string }>,
    class_names: Map<number, string>,
    search: Search,
}

function filteredMessages(messages: Message[], search: Search) {
    if (search.filter || search.entity) {
        return messages.filter(message => filterMessage(message, search));
    } else {
        return messages;
    }
}

export function PacketDetails({packet, prop_names, class_names, search}: DetailProps) {
    switch (packet.type) {
        case "Sigon":
        case "Message":
            let rows = filteredMessages(packet.messages, search).map((message, y) => <tr key={y}>
                <td className="type">{message.type}</td>
                <td><MessageInfo msg={message} prop_names={prop_names} class_names={class_names} search={search}/></td>
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
            return <UserCmdDetails cmd={packet.cmd}/>
        case "DataTables":
            return <>{packet.tables.length}</>
        case "Stop":
            return <></>
        case "StringTables":
            return <>{packet.tables.length}</>
    }
}
