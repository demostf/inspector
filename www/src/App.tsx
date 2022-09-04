import {Packet} from "./parser";
import React, {useCallback, Component} from 'react'
import {useDropzone} from 'react-dropzone'
import {Header} from "./header";
import {PacketDetails, PacketTable} from "./table";
import {isSearchEmpty, SearchBar, SearchFilter} from "./search";
import {DemoWorker, ResponseMessageData} from "./rpc";

let _style = require('../styles/style.css');

export interface PacketMeta {
    index: number,
    tick: number,
    ty: PacketType,
}

export enum PacketType {
    Signon = 1,
    Message = 2,
    SyncTick = 3,
    ConsoleCmd = 4,
    UserCmd = 5,
    DataTables = 6,
    Stop = 7,
    StringTables = 8,
}

interface AppState {
    loading: boolean,
    header: Header | null,
    progress: number,
    packets: PacketMeta[],
    prop_names: Map<string, { table: string, prop: string }>,
    class_names: Map<number, string>,
    active: Packet | null,
    activeIndex: number | null,
    search: SearchFilter,
    matches: number[],
    worker: DemoWorker | null,
}

export class App extends Component<{}, AppState> {
    state: AppState = {
        loading: false,
        header: null,
        progress: 0,
        packets: [],
        prop_names: new Map(),
        class_names: new Map(),
        active: null,
        activeIndex: null,
        search: {
            entity: 0,
            search: "",
            class_ids: [],
            prop_ids: [],
        },
        matches: [],
        worker: null
    }

    onSearch = debounce((search: SearchFilter) => {
        if (!isSearchEmpty(search) && this.state.worker) {
            console.log(search);
            this.state.worker.search(search).then(matches => this.setState({matches}));
        }
        this.setState({search});
    }, 500)

    selectPacket = (packet: number) => {
        this.state.worker.get(packet).then(packet => this.setState({active: packet}));
    }

    async load(data: ArrayBuffer) {
        this.setState({loading: true});
        const worker = new DemoWorker();
        this.setState({worker});
        const parsed = await worker.load(data, (progress) => {
            this.setState({progress});
        });

        const prop_names = new Map();
        for (let prop of parsed.prop_names) {
            prop_names.set(prop.identifier, prop);
        }
        const class_names = new Map();
        for (let c of parsed.class_names) {
            class_names.set(c.identifier, c.name);
        }
        this.setState({
            loading: false,
            packets: parsed.packets,
            header: parsed.header,
            prop_names,
            class_names
        });
    }

    filteredPackets(): PacketMeta[] {
        if (isSearchEmpty(this.state.search)) {
            return this.state.packets;
        } else {
            return this.state.matches.map(index => this.state.packets[index]);
        }
    }

    render() {
        if (this.state.loading && this.state.progress > 0) {
            return (
                <>
                    <h1>Loading</h1>
                    <progress value={this.state.progress} max={100}/>
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
            const packets = this.filteredPackets();
            if (this.state.active) {
                active = <div className="details"><PacketDetails packet={this.state.active}
                                                                 search={this.state.search}
                                                                 prop_names={this.state.prop_names}
                                                                 class_names={this.state.class_names}/></div>
            }
            return (
                <>
                    <SearchBar onSearch={this.onSearch} class_names={this.state.class_names}
                               prop_names={this.state.prop_names}/>
                    <div className="packets">
                        <PacketTable packets={packets} class_names={this.state.class_names}
                                     activeIndex={this.state.activeIndex}
                                     prop_names={this.state.prop_names}
                                     onClick={this.selectPacket}/>
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

function DemoDropzone({onDrop}: { onDrop: (data: ArrayBuffer) => void }) {
    const onDropCb = useCallback((acceptedFiles: File[]) => {
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
                    <p>Drag 'n' drop a demo here, or click to select a file</p>
            }
        </div>
    )
}

function debounce(func: Function, timeout = 300) {
    let timer: any;
    return (...args: any[]) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, timeout);
    };
}