// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const debug = false;
    const vscode = acquireVsCodeApi();
    const currentState = vscode.getState() || {
        address: 0,
        data: "",
        width: 0,
        height: 0,
        columnMode: "auto",
        numberOfDisplayColumn: 0,
        numberOfDisplayLine: 0,
        bufferSize: 0
    };
    const previousState = {
        address: 0,
        data: "",
        bufferSize: 0
    };

    let debuggingActivate = false;
    const dumpTextWidthCanvas = document.createElement("canvas");
    const dumpTextWidthCanvasContext = dumpTextWidthCanvas.getContext("2d");
    dumpTextWidthCanvasContext.font = "400 13px Consolas, 'Courier New', monospace";
    const codePageAtari = [ // ATARI charset https://en.wikipedia.org/wiki/Atari_ST_character_set
        /*  0*/'.', /*  1*/'⇧', /*  2*/'⇩', /*  3*/'⇨', /*  4*/'⇦', /*  5*/'.', /*  6*/'.', /*  7*/'.', /*  8*/'✓', /*  9*/'🕒︎',
        /* 10*/'🔔︎', /* 11*/'♪', /* 12*/'␌', /* 13*/'␍', /* 14*/'.', /* 15*/'.', /* 16*/'🯰', /* 17*/'🯱', /* 18*/'🯲', /* 19*/'🯳',
        /* 20*/'🯴', /* 21*/'🯵', /* 22*/'🯶', /* 23*/'🯷', /* 24*/'🯸', /* 25*/'🯹', /* 26*/'ə', /* 27*/'␛', /* 28*/'.', /* 29*/'.',
        /* 30*/'.', /* 31*/'.', /* 32*/'&nbsp;', /* 33*/'!', /* 34*/'"', /* 35*/'#', /* 36*/'$', /* 37*/'%', /* 38*/'&', /* 39*/'\'',
        /* 40*/'(', /* 41*/')', /* 42*/'*', /* 43*/'+', /* 44*/',', /* 45*/'-', /* 46*/'.', /* 47*/'/', /* 48*/'0', /* 49*/'1',
        /* 50*/'2', /* 51*/'3', /* 52*/'4', /* 53*/'5', /* 54*/'6', /* 55*/'7', /* 56*/'8', /* 57*/'9', /* 58*/':', /* 59*/';',
        /* 60*/'&', /* 61*/'=', /* 62*/'&', /* 63*/'?', /* 64*/'@', /* 65*/'A', /* 66*/'B', /* 67*/'C', /* 68*/'D', /* 69*/'E',
        /* 70*/'F', /* 71*/'G', /* 72*/'H', /* 73*/'I', /* 74*/'J', /* 75*/'K', /* 76*/'L', /* 77*/'M', /* 78*/'N', /* 79*/'O',
        /* 80*/'P', /* 81*/'Q', /* 82*/'R', /* 83*/'S', /* 84*/'T', /* 85*/'U', /* 86*/'V', /* 87*/'W', /* 88*/'X', /* 89*/'Y',
        /* 90*/'Z', /* 91*/'[', /* 92*/'\\',/* 93*/']', /* 94*/'^', /* 95*/'_', /* 96*/'`', /* 97*/'a', /* 98*/'b', /* 99*/'c',
        /*100*/'d', /*101*/'e', /*102*/'f', /*103*/'g', /*104*/'h', /*105*/'i', /*106*/'j', /*107*/'k', /*108*/'l', /*109*/'m',
        /*110*/'n', /*111*/'o', /*112*/'p', /*113*/'q', /*114*/'r', /*115*/'s', /*116*/'t', /*117*/'u', /*118*/'v', /*119*/'w',
        /*120*/'x', /*121*/'y', /*122*/'z', /*123*/'{', /*124*/'|', /*125*/'}', /*126*/'~', /*127*/'⌂', /*128*/'Ç', /*129*/'ü',
        /*130*/'é', /*131*/'â', /*132*/'ä', /*133*/'à', /*134*/'å', /*135*/'ç', /*136*/'ê', /*137*/'ë', /*138*/'è', /*139*/'ï',
        /*140*/'î', /*141*/'ì', /*142*/'Ä', /*143*/'Å', /*144*/'É', /*145*/'æ', /*146*/'Æ', /*147*/'ô', /*148*/'ö', /*149*/'ò',
        /*150*/'û', /*151*/'ù', /*152*/'ÿ', /*153*/'Ö', /*154*/'Ü', /*155*/'¢', /*156*/'£', /*157*/'¥', /*158*/'ß', /*159*/'ƒ',
        /*160*/'á', /*161*/'í', /*162*/'ó', /*163*/'ú', /*164*/'ñ', /*165*/'Ñ', /*166*/'ª', /*167*/'º', /*168*/'¿', /*169*/'⌐',
        /*170*/'¬', /*171*/'½', /*172*/'¼', /*173*/'¡', /*174*/'«', /*175*/'»', /*176*/'ã', /*177*/'õ', /*178*/'Ø', /*179*/'ø',
        /*180*/'œ', /*181*/'Œ', /*182*/'À', /*183*/'Ã', /*184*/'Õ', /*185*/'¨', /*186*/'´', /*187*/'†', /*188*/'¶', /*189*/'©',
        /*190*/'®', /*191*/'™', /*192*/'ĳ', /*193*/'Ĳ', /*194*/'א', /*195*/'ב', /*196*/'ג', /*197*/'ד', /*198*/'ה', /*199*/'ו',
        /*200*/'ז', /*201*/'ח', /*202*/'ט', /*203*/'י', /*204*/'כ', /*205*/'ל', /*206*/'מ', /*207*/'נ', /*208*/'ס', /*209*/'ע',
        /*210*/'פ', /*211*/'צ', /*212*/'ק', /*213*/'ר', /*214*/'ש', /*215*/'ת', /*216*/'ן', /*217*/'ך', /*218*/'ם', /*219*/'ף',
        /*220*/'ץ', /*221*/'§', /*222*/'∧', /*223*/'∞', /*224*/'α', /*225*/'β', /*226*/'Γ', /*227*/'π', /*228*/'Σ', /*229*/'σ',
        /*230*/'µ', /*231*/'τ', /*232*/'Φ', /*233*/'Θ', /*234*/'Ω', /*235*/'δ', /*236*/'∮', /*237*/'φ', /*238*/'ε', /*239*/'∩',
        /*240*/'≡', /*241*/'±', /*242*/'≥', /*243*/'≤', /*244*/'⌠', /*245*/'⌡', /*246*/'÷', /*247*/'≈', /*248*/'°', /*249*/'∙',
        /*250*/'·', /*251*/'√', /*252*/'ⁿ', /*253*/'²', /*254*/'³', /*255*/'¯'
    ];

    
    const memoryToolbar = document.querySelector(".memory-toolbar");
    const memoryDump = document.querySelector(".memory-dump");
    const memoryAddressInput = document.querySelector(".memory-address-input");
    const memoryColumnSelect = document.querySelector(".memory-column-select");

    memoryColumnSelect.addEventListener("input", () => {
        debug && console.log(`onMemoryColumnSelectEvent(${memoryColumnSelect.value}`);
        currentState.columnMode = memoryColumnSelect.value;
        if (refreshShape()) {
            requestReadMemory();
        }
    });

    function clickRefreshButton() {
        debug && console.log("Refresh button clicked");

        const addressText = memoryAddressInput.value.toLowerCase();
        const address = addressText.startsWith("0x") ? parseInt(addressText, 16) : parseInt(addressText);
        if (!isNaN(address)) {
            requestReadMemory(address);
        }
    }

    memoryAddressInput.addEventListener("keydown", (event) => {
        switch(event.key) {
            case "Enter":
                clickRefreshButton();
                break;
        }
    });

    function scroll(newAddress) {
        newAddress = Math.max(newAddress, 0);
        debug && console.log(`scroll(address: ${currentState.address.toString(16)} + ${newAddress - currentState.address} = ${(newAddress).toString(16)})`);
        requestReadMemory(newAddress);
    }

    memoryDump.addEventListener("keydown", (event) => {
        switch(event.key) {
            case "Home":
                scroll(0);
                break;
            case "PageUp":
                scroll(currentState.address - currentState.numberOfDisplayColumn * (currentState.numberOfDisplayLine - 2));
                break;
            case "ArrowUp":
                scroll(currentState.address - currentState.numberOfDisplayColumn);
                break;
            case "ArrowDown":
                scroll(currentState.address + currentState.numberOfDisplayColumn);
                break;
            case "PageDown":
                scroll(currentState.address + currentState.numberOfDisplayColumn * (currentState.numberOfDisplayLine - 2));
                break;
            case "End":
                scroll(0xFFFFFFFF - currentState.numberOfDisplayColumn * (currentState.numberOfDisplayLine - 2));
                break;
        }
    });

    memoryDump.addEventListener("wheel", function(event) {
      if (event.deltaY < 0) {
        scroll(currentState.address - currentState.numberOfDisplayColumn * 3);
      } else if (event.deltaY > 0) {
        scroll(currentState.address + currentState.numberOfDisplayColumn * 3);
      }

      debug && console.log(`deltaY: ${event.deltaY}, deltaMode: ${event.deltaMode}`);
    }, { passive: true });


    window.addEventListener("resize", () => {
        debug && console.log(`resize(${window.innerWidth}, ${window.innerHeight}) -> ${getMaxNumberOfBytes(window.innerWidth)}, ${getMaxNumberOfLines(window.innerHeight)}`);
        
        if (refreshShape()) {
            // Buffer size changed, request new memory.
            requestReadMemory(currentState.address);
        } else
            refreshMemory();
    });

    // Handle messages sent from the extension to the webview
    window.addEventListener("message", event => {
        debug && console.log(`message(${JSON.stringify(event, null, '\t')})`);
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case "initialize":
                debuggingActivate = message.debugSessionStarted;
                if (debuggingActivate) {
                    requestReadMemory();
                }
                break;
            case "debugSessionStarted":
                debuggingActivate = true;
                requestReadMemory();
                break;
            case "debugSessionUpdated":
                requestReadMemory();
                break;
            case "debugSessionEnded":
                debuggingActivate = false;
                refreshMemory();
                break;
            case "memoryRead":
                updateMemory(message.address, message.data, message.unreadableBytes);
                break;
            case "memoryWritten":
                requestReadMemory();
                break;
            case "showInMemory":
                requestReadMemory(message?.address);
                break;
            case "refreshMemory":
                clickRefreshButton();
                break;
        }
    });

    function getTextWidth(text) {
        const metrics = dumpTextWidthCanvasContext.measureText(text);
        return metrics.width;
    }
    function getRowDumpSample(numberOfByte) {
        return `00000000 ${"00 ".repeat(numberOfByte)}${".".repeat(numberOfByte)}`;
    }
    function getMaxNumberOfBytes(maxWidth) {
        const maxNumberOfBytes = maxWidth / 4;
        for (let numberOfBytes = 1; numberOfBytes < maxNumberOfBytes; numberOfBytes++) {
            let width = getTextWidth(getRowDumpSample(numberOfBytes)) + 18; // Padding 10px
            if(width > maxWidth)
                return numberOfBytes - 1;
        }
        return maxNumberOfBytes;
    }
    function getTextHeight(numberOfLines) {
        const metrics = dumpTextWidthCanvasContext.measureText("0");
        const fontHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
        return fontHeight * numberOfLines;
    }
    function getMaxNumberOfLines(maxHeight) {
        const maxNumberOfLines = maxHeight / 4;
        for (let numberOfLines = 1; numberOfLines < maxNumberOfLines; numberOfLines++) {
            let height = getTextHeight(numberOfLines) + 35; // Toolbar 35px
            if (height > maxHeight)
                return numberOfLines - 1;
        }
        return maxNumberOfLines;
    }

    
    function requestStartInfo() {
        debug && console.log(`requestStartInfo()`);
        vscode.postMessage({
            type: "initialize"
        });
    }

    function requestWriteMemory(address, data) {
        if (address === undefined)
            address = currentState.address;
        debug && console.log(`requestWriteMemory(address: ${address.toString(16)})`);
        vscode.postMessage({
            type: "writeMemory",
            address: address,
            data: data
        });
    }

    function requestReadMemory(address) {
        if (address === undefined)
            address = currentState.address;
        debug && console.log(`requestReadMemory(address: ${address.toString(16)})`);
        vscode.postMessage({
            type: "readMemory",
            address: address,
            offset: 0,
            count: currentState.bufferSize
        });
    }

    function updateMemory(address, data, unreadableBytes) {
        debug && console.log(`updateMemory(address: ${address.toString(16)}, data(.length): ${data.length} bytes, unreadableBytes: ${unreadableBytes})`);

        previousState.address = currentState.address;
        previousState.data = currentState.data;
        previousState.bufferSize = currentState.bufferSize;

        currentState.address = address;
        currentState.data = data;

        vscode.setState(currentState);
        refreshMemory();

        memoryAddressInput.value = `0x${currentState.address.toString(16)}`;
    }

    function refreshShape() {
        debug && console.log(`refreshShape()`);
        let bufferSizeChanged = false;
        currentState.width = window.innerWidth;
        currentState.height = window.innerHeight;
        currentState.numberOfDisplayColumn = parseInt(currentState.columnMode) || getMaxNumberOfBytes(window.innerWidth);
        currentState.numberOfDisplayLine = getMaxNumberOfLines(window.innerHeight);
        const bufferSize = currentState.numberOfDisplayColumn * currentState.numberOfDisplayLine;
        bufferSizeChanged = bufferSize !== currentState.bufferSize;
        currentState.bufferSize = bufferSize;
        if (bufferSizeChanged)
            vscode.setState(currentState);
        return bufferSizeChanged;
    }

    function diffMemory(address1, data1, address2, data2) {
        address1 = Number(address1) || 0;
        address2 = Number(address2) || 0;
        data1 = data1 || "";
        data2 = data2 || "";

        const length2 = data2.length;
        const diffArray = new Array(length2);

        for (let index2 = 0; index2 < length2; index2++) {
            const absolutAddress = address2 + index2;
            const index1 = absolutAddress - address1;
            if (index1 < 0 || index1 >= data1.length) {
                diffArray[index2] = false;
            } else {
                diffArray[index2] = data2.charCodeAt(index2) !== data1.charCodeAt(index1);
            }
        }

        return diffArray;

    }

    function refreshMemory() {
        debug && console.log(`refreshMemory()`);

        let text = "";
        if (debuggingActivate) {
            const memoryDifferences = diffMemory(previousState.address, previousState.data, currentState.address, currentState.data);
            const buffer = currentState.data;
            const trueBufferLength = buffer.length;
            const firstCharacterAbsoluteOffset = currentState.address;
            let lineOffset = firstCharacterAbsoluteOffset;
            let currentRelativeOffset = 0;
            let endOfFileReached = false;
            let colored = false;
            for (let lineNumber = 0; lineNumber < currentState.numberOfDisplayLine; lineNumber++) {
                let line = lineOffset.toString(16).padStart(8, "0");
                let lineHexa = "";
                let lineAscii = "";
                let column;
                let previouslyColored = false;
                for (column = 0; column < currentState.numberOfDisplayColumn; column++) {
                    if (currentRelativeOffset >= trueBufferLength) {
                        endOfFileReached = true; break;
                    }
                    const currentByte = buffer.charCodeAt(currentRelativeOffset);
                    colored = memoryDifferences[currentRelativeOffset];
                    if (colored && !previouslyColored) {
                        lineHexa += '<span class="modified-byte">';
                        lineAscii += '<span class="modified-byte">';
                        previouslyColored = true;
                    } else if (!colored && previouslyColored) {
                        lineHexa += "</span>";
                        lineAscii += "</span>";
                        previouslyColored = false;
                    }
                    lineHexa += currentByte.toString(16).padStart(2, "0") + " ";
                    lineAscii += (currentByte >= 32) ? codePageAtari[currentByte] : ".";
                    currentRelativeOffset++;
                }
                if (colored) {
                    lineHexa += "</span>";
                    lineAscii += "</span>";
                }
                let padding = currentState.numberOfDisplayColumn - column;
                if (padding < currentState.numberOfDisplayColumn) {
                    for (column = 0; column < padding; column++) {
                        lineHexa += "&nbsp;&nbsp;&nbsp;";
                        lineAscii += "&nbsp;";
                    }
                    text += `${line} ${lineHexa}${lineAscii}`;
                }

                if (endOfFileReached || lineNumber + 1 === currentState.numberOfDisplayLine) break;

                text += "<br>";

                lineOffset += currentState.numberOfDisplayColumn;
            }
        }

        memoryDump.innerHTML = text;
        memoryToolbar.disabled = !debuggingActivate;
    }

    memoryDump.addEventListener("contextmenu", function (e) {
        const selection = document?.getSelection()?.toString() || "";
        vscode.postMessage({ type: "contextSelection", selection: selection.replaceAll(" ", "") });
    });

    requestStartInfo();

    memoryAddressInput.value = `0x${currentState.address.toString(16)}`;
    memoryColumnSelect.value = currentState.columnMode ?? "auto";

    refreshShape();
    refreshMemory();
}());


