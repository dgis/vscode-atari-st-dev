import { makeDeferred } from "./helpers.js";

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const debug = true;
    const vscode = acquireVsCodeApi();
    const currentState = vscode.getState() || {};
    currentState.screenAddress ??= 0xf8000;
    currentState.screenData ??= "";
    currentState.format ??= "4";
    currentState.bytesPerLine ??= 160;
    currentState.width ??= 0;
    currentState.height ??= 200;
    currentState.screenBufferSize ??= 0;
    currentState.paletteAddress ??= 0xffff8240;
    currentState.paletteData ??= "";
    let requestId = 1;
    const requestList = {};

    let symbols = null;

    let screenZoom = 1.0;
    let paletteZoom = 1.0;
    let paletteWidth = 8;

    let debuggingActivate = false;
    
    const screenToolbar = document.querySelector(".inspector-screen-toolbar");
    const screenCanvasContainer = document.querySelector(".inspector-screen-container");
    const screenCanvas = document.querySelector(".inspector-screen-canvas");
    const screenAddressInput = document.querySelector(".inspector-screen-address-input");
    const symbolDatalist = document.getElementById("symbolList");
    const formatSelect = document.querySelector(".inspector-format-select");
    const bytesPerLineInput = document.querySelector(".inspector-bytes-per-line-input");
    const heightInput = document.querySelector(".inspector-height-input");

    const paletteToolbar = document.querySelector(".inspector-palette-toolbar");
    const paletteCanvas = document.querySelector(".inspector-palette-canvas");
    const paletteCanvasContainer = document.querySelector(".inspector-palette-container");
    const paletteAddressInput = document.querySelector(".inspector-palette-address-input");

    // Create tooltip element
    const tooltip = document.createElement("div");
    tooltip.className = "pixel-tooltip";
    document.body.appendChild(tooltip);

    let cachedPalette = [];
    let cachedTruePalette = [];

    formatSelect.addEventListener("input", () => {
        debug && console.log(`onInspectorFormatSelectEvent(${formatSelect.value}`);
        currentState.format = formatSelect.value;
        refreshShape();
        requestReadMemory();
    });

    function symbolToAddress(addressInput) {
        if (symbols && symbols[addressInput] !== undefined)
            return symbols[addressInput];
        else {
            const addressText = addressInput.toLowerCase();
            return addressText.startsWith("0x") ? parseInt(addressText, 16) : parseInt(addressText);
        }
    }

    function clickRefreshButton() {
        debug && console.log("clickRefreshButton()");

        requestReadMemory(symbolToAddress(screenAddressInput.value), symbolToAddress(paletteAddressInput.value));
    }

    screenAddressInput.addEventListener("keydown", (event) => {
        switch(event.key) {
            case "Enter":
                clickRefreshButton();
                break;
        }
    });

    bytesPerLineInput.addEventListener("keydown", (event) => {
        switch(event.key) {
            case "Enter":
                currentState.bytesPerLine = parseInt(bytesPerLineInput.value);
                if (currentState.bytesPerLine === NaN || currentState.bytesPerLine < 1)
                    currentState.bytesPerLine = 1;
                refreshShape();
                requestReadMemory();
                break;
        }
    });
    
    heightInput.addEventListener("keydown", (event) => {
        switch(event.key) {
            case "Enter":
                currentState.height = parseInt(heightInput.value);
                if (currentState.height === NaN || currentState.height < 1)
                    currentState.height = 1;
                refreshShape();
                requestReadMemory();
                break;
        }
    });

    paletteAddressInput.addEventListener("keydown", (event) => {
        switch(event.key) {
            case "Enter":
                refreshShape();
                clickRefreshButton();
                break;
        }
    });

    screenCanvas.addEventListener("wheel", function(event) {
        if (!event.ctrlKey) return;
        if (event.deltaY < 0) {
            screenZoom *= 1.25;
        } else if (event.deltaY > 0) {
            screenZoom /= 1.25;
        }
        if (screenZoom < 0.1)
            screenZoom = 0.1;
        screenCanvas.style = `zoom: ${screenZoom};`;

        debug && console.log(`deltaY: ${event.deltaY}, deltaMode: ${event.deltaMode}`);
    }, { passive: true });

    // Get color at pixel position from screen data
    function getPixelColor(pixelX, pixelY) {
        if (pixelY < 0 || pixelY >= currentState.height || pixelX < 0 || pixelX >= currentState.width) {
            return null;
        }

        const buffer = currentState.screenData;
        const byteOffset = pixelY * currentState.bytesPerLine;
        const pixelChunk = 16; // 4 bits per pixel -> 16 pixels -> 8 bytes
        const pixelIndex = Math.floor(pixelX / pixelChunk);
        const byteIndex = byteOffset + pixelIndex * 8;
        const bitPosition = pixelX % 16;
        const byte0 = buffer.charCodeAt(byteIndex);
        const byte1 = buffer.charCodeAt(byteIndex + 1);
        const byte2 = buffer.charCodeAt(byteIndex + 2);
        const byte3 = buffer.charCodeAt(byteIndex + 3);
        const byte4 = buffer.charCodeAt(byteIndex + 4);
        const byte5 = buffer.charCodeAt(byteIndex + 5);
        const byte6 = buffer.charCodeAt(byteIndex + 6);
        const byte7 = buffer.charCodeAt(byteIndex + 7);

        let colorIndex;
        if (bitPosition < 8) {
            const bit = 7 - bitPosition;
            colorIndex = ((byte0 >> bit) & 0x01) << 0
                       | ((byte2 >> bit) & 0x01) << 1
                       | ((byte4 >> bit) & 0x01) << 2
                       | ((byte6 >> bit) & 0x01) << 3;
        } else {
            const bit = 15 - bitPosition;
            colorIndex = ((byte1 >> bit) & 0x01) << 0
                       | ((byte3 >> bit) & 0x01) << 1
                       | ((byte5 >> bit) & 0x01) << 2
                       | ((byte7 >> bit) & 0x01) << 3;
        }

        return { colorIndex, color: cachedPalette[colorIndex] };
    }

    // Mouse move event for tooltip
    screenCanvas.addEventListener("mousemove", function(event) {
        const rect = screenCanvas.getBoundingClientRect();
        const pixelX = Math.floor(event.clientX / screenZoom - rect.x);
        const pixelY = Math.floor(event.clientY / screenZoom - rect.y);
        const pixelInfo = getPixelColor(pixelX, pixelY);
        if (pixelInfo) {
            tooltip.innerHTML = `(${pixelX}, ${pixelY}) [${pixelInfo.colorIndex}]=0x${cachedTruePalette[pixelInfo.colorIndex]} <div class="pixel-tooltip-color"></div>`;
            tooltip.style.setProperty('--tooltip-color', pixelInfo.color);
            tooltip.classList.add("visible");
            const containerRect = screenCanvasContainer.getBoundingClientRect();
            const mouseXInCanvasContainer = event.clientX - containerRect.left;
            const mouseYInCanvasContainer = event.clientY - containerRect.top;
            if (mouseXInCanvasContainer > containerRect.width / 2)
                tooltip.style.left = (event.clientX - 150) + "px";
            else
                tooltip.style.left = (event.clientX + 10) + "px";
            if (mouseYInCanvasContainer > containerRect.height / 2)
                tooltip.style.top = (event.clientY - 50) + "px";
            else
                tooltip.style.top = (event.clientY + 10) + "px";
        } else
            tooltip.classList.remove("visible");
    });

    // Hide tooltip on mouse leave
    screenCanvas.addEventListener("mouseleave", function() {
        tooltip.classList.remove("visible");
    });

    // Mouse move event for tooltip
    paletteCanvas.addEventListener("mousemove", function(event) {
        const rect = paletteCanvas.getBoundingClientRect();
        const pixelX = Math.floor(event.clientX / paletteZoom - rect.x);
        const colorIndex = Math.floor(pixelX / paletteWidth);
        if (colorIndex >= 0 && colorIndex < 16) {
            const containerRect = paletteCanvasContainer.getBoundingClientRect();
            const mouseXInCanvasContainer = event.clientX - containerRect.left;
            tooltip.innerHTML = `[${colorIndex}]=0x${cachedTruePalette[colorIndex]} <div class="pixel-tooltip-color"></div>`;
            tooltip.style.setProperty('--tooltip-color', cachedPalette[colorIndex]);
            tooltip.classList.add("visible");
            if (mouseXInCanvasContainer > containerRect.width / 2)
                tooltip.style.left = (event.clientX - 80) + "px";
            else
                tooltip.style.left = (event.clientX + 10) + "px";
            tooltip.style.top = (event.clientY - 50) + "px";
        } else
            tooltip.classList.remove("visible");
    });

    // Hide tooltip on mouse leave
    paletteCanvas.addEventListener("mouseleave", function() {
        tooltip.classList.remove("visible");
    });

    // screenCanvas.addEventListener("mousemove", function(event) {
    //     const rect = screenCanvas.getBoundingClientRect();
        
    //     // Get mouse position relative to the canvas element
    //     const canvasX = event.clientX - rect.left;
    //     const canvasY = event.clientY - rect.top;
        
    //     // Account for zoom level
    //     const actualPixelX = Math.floor(canvasX / screenZoom);
    //     const actualPixelY = Math.floor(canvasY / screenZoom);
        
    //     // Log or use the coordinates
    //     debug && console.log(`Pixel: (${actualPixelX}, ${actualPixelY})`);
    // });

    paletteCanvas.addEventListener("wheel", function (event) {
        if (!event.ctrlKey) return;
        if (event.deltaY < 0) {
            paletteZoom *= 1.25;
        } else if (event.deltaY > 0) {
            paletteZoom /= 1.25;
        }
        if (paletteZoom < 1.0)
            paletteZoom = 1.0;
        paletteCanvas.style = `zoom: ${paletteZoom};`;

        debug && console.log(`deltaY: ${event.deltaY}, deltaMode: ${event.deltaMode}`);
    }, { passive: true });

    // Handle messages sent from the extension to the webview
    window.addEventListener("message", event => {
        debug && console.log(`message(${JSON.stringify(event, null, '\t')})`);
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case "initialize":
                debuggingActivate = message.debugSessionStarted;
                if (debuggingActivate) {
                    requestReadMemory();
                    loadSymbolsIntoDatalist(message.symbols);
                }
                break;
            case "debugSessionStarted":
                debuggingActivate = true;
                requestReadMemory();
                break;
            case "debugSessionUpdated":
                requestReadMemory();
                loadSymbolsIntoDatalist(message.symbols);
                break;
            case "debugSessionEnded":
                debuggingActivate = false;
                refreshMemory();
                clearSymbolsIntoDatalist();
                break;
            case "memoryRead":
                memoryRead(message);
                break;
            case "showInMemory":
                requestReadMemory(message?.address);
                break;
            case "refreshMemory":
                clickRefreshButton();
                break;
        }
    });

    function loadSymbolsIntoDatalist(symbolsList) {
        if (symbolsList && !symbols) {
            symbols = symbolsList;
            symbolDatalist.innerHTML = "";
            for (const [name, address] of Object.entries(symbols)) {
                const option = document.createElement("option");
                option.value = name;
                symbolDatalist.appendChild(option);
            }
        }
    }
    function clearSymbolsIntoDatalist() {
        symbols = null;
        symbolDatalist.innerHTML = "";
    }
    
    function requestStartInfo() {
        debug && console.log(`requestStartInfo()`);
        vscode.postMessage({
            type: "initialize"
        });
    }

    async function requestReadMemoryAsync(address, count) {
        const request = requestList[requestId] = {
            deferred: makeDeferred(),
            message: {
                requestId: requestId++,
                type: "readMemory",
                address,
                offset: 0,
                count
            }
        };
        debug && console.log(`requestReadMemoryAsync(address: ${address.toString(16)}, count: ${count}) -> requestId: ${request.message.requestId}`);

        vscode.postMessage(request.message);
        return request.deferred.promise;
    }

    async function requestReadMemory(screenAddress, paletteAddress) {
        debug && console.log(`requestReadMemory(screenAddress: ${screenAddress?.toString(16)}, paletteAddress: ${paletteAddress?.toString(16)})`);
        if (screenAddress === undefined)
            screenAddress = currentState.screenAddress;
        if (paletteAddress === undefined)
            paletteAddress = currentState.paletteAddress;

        const screenAddressResponse = await requestReadMemoryAsync(screenAddress, currentState.screenBufferSize);
        const paletteAddressResponse = await requestReadMemoryAsync(paletteAddress, 2 * 16);

        // previousState.screenAddress = currentState.screenAddress;
        // previousState.screenData = currentState.screenData;
        // previousState.screenBufferSize = currentState.screenBufferSize;
        // previousState.paletteAddress = currentState.paletteAddress;
        // previousState.paletteData = currentState.paletteData;

        currentState.screenAddress = screenAddressResponse.address;
        currentState.screenData = screenAddressResponse.data;

        currentState.paletteAddress = paletteAddressResponse.address;
        currentState.paletteData = paletteAddressResponse.data;

        vscode.setState(currentState);
        refreshMemory();

        screenAddressInput.value = `0x${currentState.screenAddress.toString(16)}`;
        paletteAddressInput.value = `0x${currentState.paletteAddress.toString(16)}`;
    }

    function memoryRead(message) {
        debug && console.log(`memoryRead(address: ${message.address.toString(16)}, data(.length): ${message.data.length} bytes, requestId: ${message.requestId})`);
        const request = requestList[message.requestId];
        if (request) {
            request.deferred.resolve(message);
            delete requestList[message.requestId];
            return;
        }
    }

    function refreshShape() {
        debug && console.log(`refreshShape()`);
        currentState.width = 320;
        switch (currentState.format) {
            case "1":
                currentState.width = currentState.bytesPerLine * 8;
                break;
            case "2":
                currentState.width = currentState.bytesPerLine * 4;
                break;
            case "4":
                currentState.width = currentState.bytesPerLine * 2;
                break;
        }
        //currentState.height = 200;
        // const screenBufferSize = 4 * currentState.width * currentState.height / 8;
        const screenBufferSize = currentState.bytesPerLine * currentState.height;
        // let bufferSizeChanged = false;
        // bufferSizeChanged = screenBufferSize !== currentState.screenBufferSize;
        currentState.screenBufferSize = screenBufferSize;
        // if (bufferSizeChanged)
        vscode.setState(currentState);
        // return bufferSizeChanged;
    }

    function refreshMemory() {
        debug && console.log(`refreshMemory()`);

        if (debuggingActivate) {

            const palette = [];
            for (let i = 0; i < 16; i++) {
                const byte1 = currentState.paletteData.charCodeAt(2 * i);
                const r = byte1 & 0x07;
                const byte2 = currentState.paletteData.charCodeAt(2 * i + 1);
                const g = (byte2 >> 4) & 0x07;
                const b = byte2 & 0x07;
                cachedTruePalette[i] = ((byte1 << 8) | byte2).toString(16).padStart(4, '0');
                palette[i] = `#${(r << 1).toString(16)}${(g << 1).toString(16)}${(b << 1).toString(16)}`;
            }
            // Cache palette for tooltip
            cachedPalette = palette;
            const paletteContex = paletteCanvas.getContext("2d", { alpha: false });
            paletteContex.clearRect(0, 0, paletteCanvas.width, paletteCanvas.height);
            for (let i = 0; i < 16; i++) {
                paletteContex.fillStyle = palette[i];
                paletteContex.fillRect(i * paletteWidth, 0, paletteWidth, paletteWidth);
            }


            const screenContex = screenCanvas.getContext("2d", { alpha: false });
            screenCanvas.width = currentState.width;
            screenCanvas.height = currentState.height;
            screenContex.clearRect(0, 0, screenCanvas.width, screenCanvas.height);

            const buffer = currentState.screenData;
            let currentRelativeOffset = 0;
            const pixelChunk = 16; // 4 bits per pixel -> 16 pixels -> 8 bytes
            const octetChunk = 8; // 4 bits per pixel -> 16 pixels -> 8 bytes
            for (let y = 0; y < currentState.height; y++) {
                for (let x = 0; x < currentState.width; x += pixelChunk) {
                    const byte0 = buffer.charCodeAt(currentRelativeOffset);
                    const byte1 = buffer.charCodeAt(currentRelativeOffset + 1);
                    const byte2 = buffer.charCodeAt(currentRelativeOffset + 2);
                    const byte3 = buffer.charCodeAt(currentRelativeOffset + 3);
                    const byte4 = buffer.charCodeAt(currentRelativeOffset + 4);
                    const byte5 = buffer.charCodeAt(currentRelativeOffset + 5);
                    const byte6 = buffer.charCodeAt(currentRelativeOffset + 6);
                    const byte7 = buffer.charCodeAt(currentRelativeOffset + 7);
                    for (let bit = 0; bit < 8; bit++) {
                        const colorIndex = ((byte0 >> (7 - bit)) & 0x01) << 0
                                          | ((byte2 >> (7 - bit)) & 0x01) << 1
                                          | ((byte4 >> (7 - bit)) & 0x01) << 2
                                          | ((byte6 >> (7 - bit)) & 0x01) << 3;

                        screenContex.fillStyle = palette[colorIndex];
                        screenContex.fillRect(x + bit, y, 1, 1);
                    }
                    for (let bit = 0; bit < 8; bit++) {
                        const colorIndex = ((byte1 >> (7 - bit)) & 0x01) << 0
                                          | ((byte3 >> (7 - bit)) & 0x01) << 1
                                          | ((byte5 >> (7 - bit)) & 0x01) << 2
                                          | ((byte7 >> (7 - bit)) & 0x01) << 3;
                        screenContex.fillStyle = palette[colorIndex];
                        screenContex.fillRect(x + bit + 8, y, 1, 1);
                    }

                    currentRelativeOffset += octetChunk;
                }
            }
        }

        screenToolbar.disabled = paletteToolbar.disabled = !debuggingActivate;
    }

    requestStartInfo();

    screenAddressInput.value = `0x${currentState.screenAddress.toString(16)}`;
    paletteAddressInput.value = `0x${currentState.paletteAddress.toString(16)}`;
    // memoryColumnSelect.value = currentState.columnMode ?? "auto";
    bytesPerLineInput.value = currentState.bytesPerLine;
    heightInput.value = currentState.height;

    // screenToolbar.disabled = paletteToolbar.disabled = !debuggingActivate;
    
    refreshShape();
    refreshMemory();
}());


