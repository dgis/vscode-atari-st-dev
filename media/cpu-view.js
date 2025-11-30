// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const debug = true;
    const vscode = acquireVsCodeApi();
    const currentState = vscode.getState() || {
        d0: 0,
        d1: 0,
        d2: 0,
        d3: 0,
        d4: 0,
        d5: 0,
        d6: 0,
        d7: 0,
        a0: 0,
        a1: 0,
        a2: 0,
        a3: 0,
        a4: 0,
        a5: 0,
        a6: 0,
        a7: 0,
        usp: 0,
        isp: 0,
        sr: 0,
        pc: 0,
        nextInstruction: "",
        nextPC: 0,
        vbl: 0,
        hbl: 0
    };
    let previousState = {
        d0: 0,
        d1: 0,
        d2: 0,
        d3: 0,
        d4: 0,
        d5: 0,
        d6: 0,
        d7: 0,
        a0: 0,
        a1: 0,
        a2: 0,
        a3: 0,
        a4: 0,
        a5: 0,
        a6: 0,
        a7: 0,
        usp: 0,
        isp: 0,
        sr: 0,
        pc: 0,
        nextInstruction: "",
        nextPC: 0,
        vbl: 0,
        hbl: 0
    };

    let debuggingActivate = false;

    const domCpureg = document.querySelector(".cpureg");
    const domCpuregDisabled = document.querySelector(".cpureg-disabled");
    const domCpuregActive = document.querySelector(".cpureg-active");

    const domCpuPC = document.querySelector(".pc");
    const domCpuSR = document.querySelector(".sr");
    const domCpuNextInstruction = document.querySelector(".nextInstruction");

    const domCpuD0 = document.querySelector(".d0");
    const domCpuD1 = document.querySelector(".d1");
    const domCpuD2 = document.querySelector(".d2");
    const domCpuD3 = document.querySelector(".d3");
    const domCpuD4 = document.querySelector(".d4");
    const domCpuD5 = document.querySelector(".d5");
    const domCpuD6 = document.querySelector(".d6");
    const domCpuD7 = document.querySelector(".d7");

    const domCpuA0 = document.querySelector(".a0");
    const domCpuA1 = document.querySelector(".a1");
    const domCpuA2 = document.querySelector(".a2");
    const domCpuA3 = document.querySelector(".a3");
    const domCpuA4 = document.querySelector(".a4");
    const domCpuA5 = document.querySelector(".a5");
    const domCpuA6 = document.querySelector(".a6");
    const domCpuA7 = document.querySelector(".a7");

    const domCpuISP = document.querySelector(".isp");
    const domCpuUSP = document.querySelector(".usp");

    const domCpuVBL = document.querySelector(".vbl");
    const domCpuHBL = document.querySelector(".hbl");

    const domElementForInMemoryContextMenu = [
        domCpuPC, domCpuD0, domCpuD1, domCpuD2, domCpuD3, domCpuD4, domCpuD5, domCpuD6, domCpuD7,
        domCpuA0, domCpuA1, domCpuA2, domCpuA3, domCpuA4, domCpuA5, domCpuA6, domCpuA7,
        domCpuISP, domCpuUSP
    ];

    // Handle messages sent from the extension to the webview
    window.addEventListener("message", event => {
        debug && console.log(`message(${JSON.stringify(event, null, '\t')})`);
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case "initialize":
                debuggingActivate = message.debugSessionStarted;
                if (debuggingActivate) {
                    requestCPURegisters();
                }
                break;
            case "debugSessionStarted":
                debuggingActivate = true;
                requestCPURegisters();
                break;
            case "debugSessionUpdated":
                requestCPURegisters();
                break;
            case "debugSessionEnded":
                debuggingActivate = false;
                refresh();
                break;
            case "cpuRegistersRead":
                updateCPURegisters(message.registers);
                break;
            case "showInMemory":
                requestCPURegisters(message?.address);
                break;
        }
    });

    function requestStartInfo() {
        debug && console.log(`requestStartInfo()`);
        vscode.postMessage({
            type: "initialize"
        });
    }

    function requestCPURegisters() {
        debug && console.log(`requestCPURegisters()`);
        vscode.postMessage({
            type: "readCPURegisters"
        });
    }

    const registersDxAxRegexp = /\s+D0 ([0-9A-F]+)\s+D1 ([0-9A-F]+)\s+D2 ([0-9A-F]+)\s+D3 ([0-9A-F]+)\s+D4 ([0-9A-F]+)\s+D5 ([0-9A-F]+)\s+D6 ([0-9A-F]+)\s+D7 ([0-9A-F]+)\s+A0 ([0-9A-F]+)\s+A1 ([0-9A-F]+)\s+A2 ([0-9A-F]+)\s+A3 ([0-9A-F]+)\s+A4 ([0-9A-F]+)\s+A5 ([0-9A-F]+)\s+A6 ([0-9A-F]+)\s+A7 ([0-9A-F]+)/;
    const registersUSPISPRegexp = /USP\s+([0-9A-F]+)\s+ISP\s+([0-9A-F]+)/;
    const registersSRRegexp = /SR=([0-9A-F]+)\s+T=([0-9A-F]+)\s+S=([0-9A-F]+)\s+M=([0-9A-F]+)\s+X=([0-9A-F]+)\s+N=([0-9A-F]+)\s+Z=([0-9A-F]+)\s+V=([0-9A-F]+)\s+C=([0-9A-F]+)\s+IM=([0-9A-F]+)\s+STP=([0-9A-F]+)/;
    const registersPCRegexp = /\n(([0-9a-fA-F]+).*)\nNext PC: ([0-9a-fA-F]+)/;
    const videoRegexp = /\nVBL counter\s+:\s+([0-9]+)\nHBL line\s+:\s+([0-9]+)/;

    function updateCPURegisters(registersToExtract) {
        debug && console.log(`updateCPURegisters(registersToExtract: ${registersToExtract})`);

        if (!registersToExtract)
            return;

        previousState = structuredClone(currentState);

        // Registers contains the following lines:
        //   D0 00000000   D1 00000000   D2 00002DA4   D3 00000001 
        //   D4 00000004   D5 00000000   D6 00000000   D7 00000000 
        //   A0 0002B40E   A1 0002B454   A2 00000000   A3 0001B448 
        //   A4 0001B438   A5 FFFFFFFF   A6 0002B400   A7 0002B400 
        // USP  0002B400 ISP  00007FCC 
        // SR=0310 T=00 S=0 M=0 X=1 N=0 Z=0 V=0 C=0 IM=3 STP=0
        // Prefetch 4eba (JSR) ff8a (ILLEGAL) Chip latch 00000000
        // 00018906 4eba ff8a                jsr (-$0076,pc) == $00018892 printBanner
        // Next PC: 0001890a

        // Video base   : 0xf8000
        // VBL counter  : 358
        // HBL line     : 49
        // V-overscan   : none
        // Refresh rate : 60 Hz
        // Frame skips  : 5

        const registersDxAx = registersDxAxRegexp.exec(registersToExtract);
        if (registersDxAx.length === 17) {
            currentState.d0 = Number.parseInt(registersDxAx[1], 16) >>> 0;
            currentState.d1 = Number.parseInt(registersDxAx[2], 16) >>> 0;
            currentState.d2 = Number.parseInt(registersDxAx[3], 16) >>> 0;
            currentState.d3 = Number.parseInt(registersDxAx[4], 16) >>> 0;
            currentState.d4 = Number.parseInt(registersDxAx[5], 16) >>> 0;
            currentState.d5 = Number.parseInt(registersDxAx[6], 16) >>> 0;
            currentState.d6 = Number.parseInt(registersDxAx[7], 16) >>> 0;
            currentState.d7 = Number.parseInt(registersDxAx[8], 16) >>> 0;
            currentState.a0 = Number.parseInt(registersDxAx[9], 16) >>> 0;
            currentState.a1 = Number.parseInt(registersDxAx[10], 16) >>> 0;
            currentState.a2 = Number.parseInt(registersDxAx[11], 16) >>> 0;
            currentState.a3 = Number.parseInt(registersDxAx[12], 16) >>> 0;
            currentState.a4 = Number.parseInt(registersDxAx[13], 16) >>> 0;
            currentState.a5 = Number.parseInt(registersDxAx[14], 16) >>> 0;
            currentState.a6 = Number.parseInt(registersDxAx[15], 16) >>> 0;
            currentState.a7 = Number.parseInt(registersDxAx[16], 16) >>> 0;
        }

        const registersUSPISP = registersUSPISPRegexp.exec(registersToExtract);
        if (registersUSPISP.length === 3) {
            currentState.usp = Number.parseInt(registersUSPISP[1], 16) >>> 0;
            currentState.isp = Number.parseInt(registersUSPISP[2], 16) >>> 0;
        }

        const registersSR = registersSRRegexp.exec(registersToExtract);
        if (registersSR.length === 12) {
            currentState.sr = Number.parseInt(registersSR[1], 16) >>> 0;
            currentState.srT = Number.parseInt(registersSR[2], 16) >>> 0;
            currentState.srS = Number.parseInt(registersSR[3], 16) >>> 0;
            currentState.srM = Number.parseInt(registersSR[4], 16) >>> 0;
            currentState.srX = Number.parseInt(registersSR[5], 16) >>> 0;
            currentState.srN = Number.parseInt(registersSR[6], 16) >>> 0;
            currentState.srZ = Number.parseInt(registersSR[7], 16) >>> 0;
            currentState.srV = Number.parseInt(registersSR[8], 16) >>> 0;
            currentState.srC = Number.parseInt(registersSR[9], 16) >>> 0;
            currentState.srIM = Number.parseInt(registersSR[10], 16) >>> 0;
            currentState.srSTP = Number.parseInt(registersSR[11], 16) >>> 0;
        }

        const registersPC = registersPCRegexp.exec(registersToExtract);
        if (registersPC.length === 4) {
            currentState.nextInstruction = registersPC[1].trim();
            currentState.pc = Number.parseInt(registersPC[2], 16) >>> 0;
            currentState.nextPC = Number.parseInt(registersPC[3], 16) >>> 0;
        }

        const video = videoRegexp.exec(registersToExtract);
        if (video.length === 3) {
            currentState.vbl = Number.parseInt(video[1]) >>> 0;
            currentState.hbl = Number.parseInt(video[2]) >>> 0;
        }

        vscode.setState(currentState);
        refresh();
    }

    function refresh() {
        debug && console.log(`refresh()`);

        if (debuggingActivate) {
            domCpuregDisabled.style = "display: none;";
            domCpuregActive.style = "display: block;";

            domCpuPC.innerHTML = currentState.pc?.toString(16).padStart(8, '0');
            domCpuPC.class = currentState.pc === previousState.pc ? "" : "modified-byte";
            domCpuSR.innerHTML = currentState.sr?.toString(16).padStart(8, '0');
            domCpuSR.class = currentState.sr === previousState.sr ? "" : "modified-byte";
            domCpuNextInstruction.innerHTML = currentState.nextInstruction;

            domCpuD0.innerHTML = currentState.d0?.toString(16).padStart(8, '0');
            currentState.d0 === previousState.d0 ? domCpuD0.classList.remove("modified-byte") : domCpuD0.classList.add("modified-byte");
            domCpuD1.innerHTML = currentState.d1?.toString(16).padStart(8, '0');
            currentState.d1 === previousState.d1 ? domCpuD1.classList.remove("modified-byte") : domCpuD1.classList.add("modified-byte");
            domCpuD2.innerHTML = currentState.d2?.toString(16).padStart(8, '0');
            currentState.d2 === previousState.d2 ? domCpuD2.classList.remove("modified-byte") : domCpuD2.classList.add("modified-byte");
            domCpuD3.innerHTML = currentState.d3?.toString(16).padStart(8, '0');
            currentState.d3 === previousState.d3 ? domCpuD3.classList.remove("modified-byte") : domCpuD3.classList.add("modified-byte");
            domCpuD4.innerHTML = currentState.d4?.toString(16).padStart(8, '0');
            currentState.d4 === previousState.d4 ? domCpuD4.classList.remove("modified-byte") : domCpuD4.classList.add("modified-byte");
            domCpuD5.innerHTML = currentState.d5?.toString(16).padStart(8, '0');
            currentState.d5 === previousState.d5 ? domCpuD5.classList.remove("modified-byte") : domCpuD5.classList.add("modified-byte");
            domCpuD6.innerHTML = currentState.d6?.toString(16).padStart(8, '0');
            currentState.d6 === previousState.d6 ? domCpuD6.classList.remove("modified-byte") : domCpuD6.classList.add("modified-byte");
            domCpuD7.innerHTML = currentState.d7?.toString(16).padStart(8, '0');
            currentState.d7 === previousState.d7 ? domCpuD7.classList.remove("modified-byte") : domCpuD7.classList.add("modified-byte");

            domCpuA0.innerHTML = currentState.a0?.toString(16).padStart(8, '0');
            currentState.a0 === previousState.a0 ? domCpuA0.classList.remove("modified-byte") : domCpuA0.classList.add("modified-byte");
            domCpuA1.innerHTML = currentState.a1?.toString(16).padStart(8, '0');
            currentState.a1 === previousState.a1 ? domCpuA1.classList.remove("modified-byte") : domCpuA1.classList.add("modified-byte");
            domCpuA2.innerHTML = currentState.a2?.toString(16).padStart(8, '0');
            currentState.a2 === previousState.a2 ? domCpuA2.classList.remove("modified-byte") : domCpuA2.classList.add("modified-byte");
            domCpuA3.innerHTML = currentState.a3?.toString(16).padStart(8, '0');
            currentState.a3 === previousState.a3 ? domCpuA3.classList.remove("modified-byte") : domCpuA3.classList.add("modified-byte");
            domCpuA4.innerHTML = currentState.a4?.toString(16).padStart(8, '0');
            currentState.a4 === previousState.a4 ? domCpuA4.classList.remove("modified-byte") : domCpuA4.classList.add("modified-byte");
            domCpuA5.innerHTML = currentState.a5?.toString(16).padStart(8, '0');
            currentState.a5 === previousState.a5 ? domCpuA5.classList.remove("modified-byte") : domCpuA5.classList.add("modified-byte");
            domCpuA6.innerHTML = currentState.a6?.toString(16).padStart(8, '0');
            currentState.a6 === previousState.a6 ? domCpuA6.classList.remove("modified-byte") : domCpuA6.classList.add("modified-byte");
            domCpuA7.innerHTML = currentState.a7?.toString(16).padStart(8, '0');
            currentState.a7 === previousState.a7 ? domCpuA7.classList.remove("modified-byte") : domCpuA7.classList.add("modified-byte");

            domCpuUSP.innerHTML = currentState.usp?.toString(16).padStart(8, '0');
            currentState.usp === previousState.usp ? domCpuUSP.classList.remove("modified-byte") : domCpuUSP.classList.add("modified-byte");
            domCpuISP.innerHTML = currentState.isp?.toString(16).padStart(8, '0');
            currentState.isp === previousState.isp ? domCpuISP.classList.remove("modified-byte") : domCpuISP.classList.add("modified-byte");

            domCpuVBL.innerHTML = currentState.vbl?.toString();
            currentState.vbl === previousState.vbl ? domCpuVBL.classList.remove("modified-byte") : domCpuVBL.classList.add("modified-byte");
            domCpuHBL.innerHTML = currentState.hbl?.toString();
            currentState.hbl === previousState.hbl ? domCpuHBL.classList.remove("modified-byte") : domCpuHBL.classList.add("modified-byte");
        } else {
            domCpuregDisabled.style = "display: block;";
            domCpuregActive.style = "display: none;";

            domCpuPC.innerHTML = "";
            domCpuSR.innerHTML = "";
            domCpuNextInstruction.innerHTML = "";
            
            domCpuD0.innerHTML = "";
            domCpuD1.innerHTML = "";
            domCpuD2.innerHTML = "";
            domCpuD3.innerHTML = "";
            domCpuD4.innerHTML = "";
            domCpuD5.innerHTML = "";
            domCpuD6.innerHTML = "";
            domCpuD7.innerHTML = "";

            domCpuA0.innerHTML = "";
            domCpuA1.innerHTML = "";
            domCpuA2.innerHTML = "";
            domCpuA3.innerHTML = "";
            domCpuA4.innerHTML = "";
            domCpuA5.innerHTML = "";
            domCpuA6.innerHTML = "";
            domCpuA7.innerHTML = "";

            domCpuISP.innerHTML = "";
            domCpuUSP.innerHTML = "";

            domCpuVBL.innerHTML = "";
            domCpuHBL.innerHTML = "";
        }
    }

    domElementForInMemoryContextMenu.forEach(element => {
        element.addEventListener("contextmenu", function (e) {
            const selection = e?.currentTarget?.innerText || "";
            vscode.postMessage({ type: "contextSelection", selection: selection.replaceAll(" ", "") });
        });
    });

    requestStartInfo();
    refresh();
}());


