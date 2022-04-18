import React, {ChangeEvent, Component} from "react";

import './search.css'
import {Message, Packet, SendProp, StringTable} from "./parser";

export interface Search {
    filter: string,
    entity: number,
    propIds: number[],
    classIds: number[],
}

export interface SearchBarProps {
    onSearch: (search: Search) => void,
    prop_names: Map<number, { table: string, prop: string }>,
    class_names: Map<number, string>,
}

export interface SearchBarState {
    filter: string,
    entity: number
}

export class SearchBar extends Component<SearchBarProps, SearchBarState> {
    state: SearchBarState = {
        filter: "",
        entity: 0
    }

    getSearch(): Search {
        return {
            filter: this.state.filter,
            entity: this.state.entity,
            propIds: filterPropNames(this.props.prop_names, this.state.filter),
            classIds: filterClassNames(this.props.class_names, this.state.filter),
        }
    }

    onFilter(event: ChangeEvent<HTMLInputElement>) {
        let filter = event.target.value;
        this.setState({filter});
        setTimeout(() => this.props.onSearch(this.getSearch()), 1);

    }

    onEntity(event: ChangeEvent<HTMLInputElement>) {
        let entity = parseInt(event.target.value, 10) || 0;
        this.setState({entity});
        setTimeout(() => this.props.onSearch(this.getSearch()), 1);
    }

    render() {
        return (
            <div className="search">
                <form>
                    <label className="filter">
                        Filter
                        <input onInput={this.onFilter.bind(this)}/>
                    </label>
                    <label className="entity">
                        Entity
                        <input onInput={this.onEntity.bind(this)} type="number"/>
                    </label>
                </form>
            </div>
        )
    }
}


export function filterPacket(
    packet: Packet,
    search: Search,
): boolean {
    switch (packet.type) {
        case "Signon":
        case "Message":
            return packet.messages.some(msg => filterMessage(msg, search))
        case "SyncTick":
            return false;
        case "ConsoleCmd":
            return search.entity == 0 && packet.command.includes(search.filter);
        case "UserCmd":
            return false;
        case "DataTables":
            return false;
        case "Stop":
            return false;
        case "StringTables":
            return search.entity == 0 && packet.tables.some(table => filterStringTable(table, search));
    }
}

function filterPropNames(prop_names: Map<number, { table: string, prop: string }>, filter: string): number[] {
    filter = filter.toLowerCase();
    let ids = [];
    for (let [id, {table, prop}] of prop_names.entries()) {
        if (table.toLowerCase().includes(filter) || prop.toLowerCase().includes(filter)) {
            ids.push(id)
        }
    }
    return ids;
}

function filterClassNames(class_names: Map<number, string>, filter: string): number[] {
    filter = filter.toLowerCase();
    let ids = [];
    for (let [id, name] of class_names.entries()) {
        if (name.toLowerCase().includes(filter)) {
            ids.push(id)
        }
    }
    return ids;
}

export function filterMessage(
    message: Message,
    search: Search,
): boolean {
    switch (message.type) {
        case "File":
            return search.entity == 0 && message.file_name.includes(search.filter);
        case "StringCmd":
            return search.entity == 0 && message.command.includes(search.filter);
        case "SetConVar":
            return search.entity == 0 && message.vars.some(cvar => cvar.value.includes(search.filter) || cvar.key.includes(search.filter));
        case "Print":
            return search.entity == 0 && message.value.includes(search.filter);
        case "ClassInfo":
            return search.entity == 0 && message.entries.some(entry => entry.class_name.includes(search.filter) || entry.table_name.includes(search.filter));
        case "CreateStringTable":
            return search.entity == 0 && filterStringTable(message.table, search);
        case "UpdateStringTable":
            return search.entity == 0 && message.entries.some(([_index, entry]) => (entry.text && entry.text.includes(search.filter)));
        case "SetView":
            return search.entity == 0 && message.index === search.entity;
        case "SayText2":
            return search.entity == 0 && ((message.text && message.text.includes(search.filter)) || (message.from && message.from.includes(search.filter)));
        case "Text":
            return search.entity == 0 && message.text.includes(search.filter);
        case "EntityMessage":
            return search.entity == 0 && search.classIds.includes(message.class_id)
        case "GameEvent":
            return search.entity == 0 && message.event.type.includes(search.filter)
        case "PacketEntities":
            return message.removed_entities.includes(search.entity) || message.entities.some(entity => (search.entity == 0 || entity.entity_index == search.entity) && filterEntity(entity.server_class, entity.baseline_props.concat(entity.props), search))
        case "TempEntities":
            return search.entity == 0 && message.events.some(event => filterEntity(event.class_id, event.props, search))
        case "GetCvarValue":
            return search.entity == 0 && message.value.includes(search.filter);
        default:
            return false;
    }
}

export function filterEntity(class_id: number, props: SendProp[], search: Search): boolean {
    return search.classIds.includes(class_id) || props.some(prop => search.propIds.includes(prop.identifier));
}

function filterStringTable(table: StringTable, search: Search): boolean {
    if (table.name.includes(search.filter)) {
        return true;
    } else if (table.entries.some(([_index, entry]) => entry.text.includes(search.filter))) {
        return true;
    }
    return false;
}