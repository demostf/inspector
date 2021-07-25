import {Packet} from "./parser";
import React, {useCallback, Component} from 'react'
import {useDropzone} from 'react-dropzone'
import ReactDOM from "react-dom";
import {Header} from "./header";

class App extends Component<{}, {
    loading: boolean,
    header: Header | null,
    packets: Packet[]
}> {
    state: {
        loading: boolean,
        header: Header | null,
        packets: Packet[]
    } = {
        loading: false,
        header: null,
        packets: []
    }

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
                    break;
                case "done":
                    this.setState({loading: false});
                    break;

            }
        });
        worker.postMessage(data, [data]);
    }

    render() {
        if (this.state.loading && this.state.header && this.state.packets.length) {
            return (
                <div>
                    <h1>Loading</h1>
                    <p>{this.state.packets.slice(-1)[0].tick}/{this.state.header.ticks}</p>
                </div>
            )
        } else if (this.state.loading) {
            return (
                <div>
                    <h1>Loading</h1>
                </div>
            )
        } else if (this.state.packets.length) {
            return (
                <div>
                    <h1>{this.state.packets.length}</h1>
                </div>
            )
        } else {
            return (
                <div>
                    <DemoDropzone onDrop={(data) => this.load(data)}/>
                </div>
            )
        }
    }
}

ReactDOM.render(
    <App/>,
    document.getElementById("root")
);


function DemoDropzone({onDrop}: { onDrop: (data: ArrayBuffer) => void }) {
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
        <div {...getRootProps()}>
            <input {...getInputProps()} />
            {
                isDragActive ?
                    <p>Drop the files here ...</p> :
                    <p>Drag 'n' drop some files here, or click to select files</p>
            }
        </div>
    )
}
