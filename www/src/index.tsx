import {Packet} from "./parser";
import React, {useCallback, Component} from 'react'
import {useDropzone} from 'react-dropzone'
import ReactDOM from "react-dom";
import {Header} from "./header";
import {PacketDetails, PacketTable} from "./table";
import {filterPacket, Search, SearchBar} from "./search";

let _style = require('../styles/style.css');

interface AppState {
    loading: boolean,
    header: Header | null,
    packets: Packet[],
    prop_names: Map<number, { table: string, prop: string }>,
    class_names: Map<number, string>,
    active: Packet | null,
    activeIndex: number | null,
    search: Search,
}

class App extends Component<{}, AppState> {
    state: AppState = {
        loading: false,
        header: null,
        packets: [],
        prop_names: new Map(),
        class_names: new Map(),
        active: null,
        activeIndex: null,
        search: {
            entity: 0,
            filter: "",
            classIds: [],
            propIds: [],
        }
    }

    onSearch = debounce((search: Search) => this.setState({search}), 500)

    load(data: ArrayBuffer) {
        this.setState({loading: true});
        const worker = new Worker('./worker.js');
        worker.addEventListener("message", (event: MessageEvent<{ type: "header", header: Header } | { type: "packet", packet: Packet } | { type: "done" }>) => {
            switch (event.data.type) {
                case "header":
                    let header = event.data.header;
                    this.setState({header});
                    break;
                case "packet":
                    let packet = event.data.packet;
                    let packets = this.state.packets;
                    packets.push(packet);
                    this.setState({packets});
                    if (packet.type == "DataTables") {
                        let prop_names = this.state.prop_names;
                        let class_names = this.state.class_names;
                        for (let table of packet.tables) {
                            for (let prop of table.props) {
                                prop_names.set(prop.identifier, {table: table.name, prop: prop.name});
                            }
                        }
                        for (let server_class of packet.server_classes) {
                            class_names.set(server_class.id, server_class.name);
                        }
                        this.setState({class_names, prop_names});
                    }
                    break;
                case "done":
                    this.setState({loading: false});
                    break;

            }
        });
        worker.postMessage(data, [data]);
    }

    filteredPackets(): Packet[] {
        if (this.state.search.filter || this.state.search.entity) {
            return this.state.packets.filter(packet => filterPacket(packet, this.state.search));
        } else {
            return this.state.packets;
        }
    }

    render() {
        if (this.state.loading && this.state.header && this.state.packets.length) {
            return (
                <>
                    <h1>Loading</h1>
                    <p>{this.state.packets.slice(-1)[0].tick}/{this.state.header.ticks}</p>
                </>
            )
        } else if (this.state.loading) {
            return (
                <>
                    <h1>Loading</h1>
                </>
            )
        } else if (this.state.packets.length) {
            let active = <></>;
            if (this.state.active) {
                active = <div className="details"><PacketDetails packet={this.state.active}
                                                                 search={this.state.search}
                                                                 prop_names={this.state.prop_names}
                                                                 class_names={this.state.class_names}/></div>
            }
            return (
                <>
                    <SearchBar onSearch={this.onSearch} class_names={this.state.class_names} prop_names={this.state.prop_names}/>
                    <div className="packets">
                        <PacketTable packets={this.filteredPackets()} class_names={this.state.class_names}
                                     activeIndex={this.state.activeIndex}
                                     prop_names={this.state.prop_names}
                                     onClick={(activeIndex, active) => this.setState({activeIndex, active})}/>
                        {active}
                    </div>
                </>
            )
        } else {
            return (
                <>
                    <DemoDropzone onDrop={(data) => this.load(data)}/>
                </>
            )
        }
    }
}

ReactDOM.render(
    <App/>
    ,
    document.getElementById("root")
);


function DemoDropzone(
    {
        onDrop
    }
        :
        {
            onDrop: (data: ArrayBuffer) => void
        }
) {
    const onDropCb = useCallback(acceptedFiles => {
        let reader = new FileReader();
        reader.readAsArrayBuffer(acceptedFiles[0]);
        reader.addEventListener('load', () => {
            let result = reader.result as ArrayBuffer;
            onDrop(result)
        });
    }, [])
    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop: onDropCb})

    return (
        <div className="dropzone"  {...getRootProps()}>
            <input {...getInputProps()} />
            {
                isDragActive ?
                    <p>Drop the demo file here ...</p> :
                    <p>Drag 'n' drop a demo here, or click to a file</p>
            }
            <p className="warning">Warning, loading a 30m demo file can easily take over a gigabyte of memory</p>
        </div>
    )
}

function debounce(func: Function, timeout = 300){
    let timer: any;
    return (...args:any[]) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}