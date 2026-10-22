import Papa from "papaparse";
import "./index.css";
import { renderChart } from "./graph.js";
import { thinRows, type Interval } from "./thinRows.js";

const API_URLS = {
    water: "/api/water",
    salinity: "/api/salinity",
    do1: "/api/do1",
    do2: "/api/do2", //追加
    do3: "/api/do3", 
};

//グラフの表示/非表示
let isChartVisible = false;
// Vite の環境変数から API URL を取得

// API からデータを取得して表示するためのコード
const app = document.querySelector<HTMLDivElement>("#app");

//センサ種切り替え
function setActiveTab(activeButton: HTMLElement) {
    document.querySelectorAll(".tab").forEach((button) => {
        button.classList.remove("active");
    });

    activeButton.classList.add("active");
}

async function fetchData(apiUrl: string): Promise<string | null> {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        console.error("データの取得に失敗しました:", error);
        return null;
    }
}

function parseData(data: string) {
    const parsed = Papa.parse(data, {
        header: false,
        skipEmptyLines: true,
    });

    return parsed.data;
}

// 表示用に行を準備する（"3h" のときだけ間引く。"all" は全件のまま）
function prepareRows(data: string, interval: Interval): any[] {
    const rows = parseData(data);
    return interval === "3h" ? thinRows(rows, "3h") : rows;
}

const renderTable = (data: string, sensorType: string, interval: Interval): string => {

    if (sensorType === "water") {
        return renderWaterTable(data, interval);
    }

    if (sensorType === "salinity") {
        return renderSalinityTable(data, interval);
    }

    if (sensorType === "do1") {
        return renderDO1Table(data, interval);
    }
    if (sensorType === "do2") {
        return renderDO2Table(data, interval);
    }
    //追加
    if (sensorType === "do3") {
        return renderDO3Table(data, interval);
    }

    return "";
};

function renderWaterTable(data: string, interval: Interval): string {

    const rows = prepareRows(data, interval);

    let tableHtml = `
        <table border="1">
            <thead>
                <tr>
                    <th>センサID</th>
                    <th>日時</th>
                    <th>バッテリ電圧</th>
                    <th>外気温</th>
                    <th>水温</th>
                </tr>
            </thead>
            <tbody>
    `;

    rows.reverse().forEach((row: any) => {

        const utcDate = new Date(row[1]);
        const jst = utcDate.toLocaleString("ja-JP", {
            timeZone: "Asia/Tokyo"
        });

        tableHtml += `
            <tr>
                <td>${row[0]}</td>
                <td>${jst}</td>
                <td>${row[2]} V</td>
                <td>${row[3]} ℃</td>
                <td>${row[4]} ℃</td>
            </tr>
        `;
    });

    tableHtml += `
            </tbody>
        </table>
    `;

    return tableHtml;
}

function renderSalinityTable(data: string, interval: Interval): string {
    const rows = prepareRows(data, interval);

    let tableHtml = `
        <table border="1">
            <thead>
                <tr>
                    <th>センサID</th>
                    <th>日時</th>
                    <th>バッテリ電圧</th>
                    <th>外気温</th>
                    <th>水温</th>
                    <th>電気伝導度</th>
                    <th>塩分</th>
                </tr>
            </thead>
            <tbody>
    `;

    rows.reverse().forEach((row: any) => {

        const utcDate = new Date(row[1]);
        const jst = utcDate.toLocaleString("ja-JP", {
            timeZone: "Asia/Tokyo"
        });

        tableHtml += `
            <tr>
                <td>${row[0]}</td>
                <td>${jst}</td>
                <td>${row[2]} V</td>
                <td>${row[3]} ℃</td>
                <td>${row[4]} ℃</td>
                <td>${row[5]} mS/cm</td>
                <td>${row[6]} psu</td>
            </tr>
        `;
    });

    tableHtml += `
            </tbody>
        </table>
    `;

    return tableHtml;
}

function renderDO1Table(data: string, interval: Interval): string {
    const rows = prepareRows(data, interval);

    let tableHtml = `
        <table border="1">
            <thead>
                <tr>
                    <th>センサID</th>
                    <th>日時</th>
                    <th>バッテリ電圧</th>
                    <th>外気温</th>
                    <th>水温</th>
                    <th>DO(%)</th>
                    <th>DO(mg/L)</th>
                </tr>
            </thead>
            <tbody>
    `;

    rows.reverse().forEach((row: any) => {

        const utcDate = new Date(row[1]);
        const jst = utcDate.toLocaleString("ja-JP", {
            timeZone: "Asia/Tokyo"
        });

        tableHtml += `
            <tr>
                <td>${row[0]}</td>
                <td>${jst}</td>
                <td>${row[2]} V</td>
                <td>${row[3]} ℃</td>
                <td>${row[4]} ℃</td>
                <td>${row[5]} %</td>
                <td>${row[6]} mg/L</td>
            </tr>
        `;
    });

    tableHtml += `
            </tbody>
        </table>
    `;

    return tableHtml;
}
function renderDO2Table(data: string, interval: Interval): string {
    const rows = prepareRows(data, interval);

    let tableHtml = `
        <table border="1">
            <thead>
                <tr>
                    <th>センサID</th>
                    <th>日時</th>
                    <th>値（調整中です！）</th>
                </tr>
            </thead>
            <tbody>
    `;

    rows.reverse().forEach((row: any) => {

        const utcDate = new Date(row[1]);
        const jst = utcDate.toLocaleString("ja-JP", {
            timeZone: "Asia/Tokyo"
        });

        tableHtml += `
            <tr>
                <td>${row[0]}</td>
                <td>${jst}</td>
                <td>${row[2]}</td>
                </tr>
        `;
    });

    tableHtml += `
            </tbody>
        </table>
    `;

    return tableHtml;
}
//追加
function renderDO3Table(data: string, interval: Interval): string {
    const rows = prepareRows(data, interval);

    let tableHtml = `
        <table border="1">
            <thead>
                <tr>
                    <th>センサID</th>
                    <th>日時</th>
                    <th>バッテリ電圧</th>
                    <th>外気温</th>
                    <th>水温</th>
                    <th>DO(%)</th>
                    <th>DO(mg/L)</th>
                </tr>
            </thead>
            <tbody>
    `;

    rows.reverse().forEach((row: any) => {

        const utcDate = new Date(row[1]);
        const jst = utcDate.toLocaleString("ja-JP", {
            timeZone: "Asia/Tokyo"
        });

        tableHtml += `
            <tr>
                <td>${row[0]}</td>
                <td>${jst}</td>
                <td>${row[2]} V</td>
                <td>${row[3]} ℃</td>
                <td>${row[4]} ℃</td>
                <td>${row[5]} %</td>
                <td>${row[6]} mg/L</td>
            </tr>
        `;
    });

    tableHtml += `
            </tbody>
        </table>
    `;

    return tableHtml;
}

if (app) {
    //button追加
    app.innerHTML = `
    <div class="title-row">
        <h2>センサデータ</h2>
        <a href="https://kitsunezaki.vercel.app/data" target="_blank" rel="noopener noreferrer">
            狐崎みるはこちら
        </a>

    </div>

    <div id="tab-container">
        <button id="water-tab" class="tab">水温</button>
        <button id="salinity-tab" class="tab active">塩分</button>
        <button id="do1-tab" class="tab">DO1号</button>
        <button id="do2-tab" class="tab">DO2号</button>
        <button id="do3-tab" class="tab">DO3号</button>
    </div>

    <div class="chart-controls">
        <button id="chart-toggle-button" class="chart-toggle-btn">グラフを表示</button>
        <button id="chart-interval-button" class="interval-btn" aria-pressed="false" style="display: none;">
            3時間ごと
        </button>
    </div>

    <div id="chart-container" style="display: none;">
    </div>

    <div class="interval-buttons table-interval-buttons">
        <button id="table-interval-button" class="interval-btn" aria-pressed="false">
            3時間ごと
        </button>
    </div>
    
    <div id="table-container">
        データを読み込み中...
    </div>
`;
}
const waterTab = document.getElementById("water-tab");
const salinityTab = document.getElementById("salinity-tab");
const do1Tab = document.getElementById("do1-tab");
const do2Tab = document.getElementById("do2-tab");//追加
const do3Tab = document.getElementById("do3-tab");

//グラフ表示ボタン
const chartToggleButton =
    document.getElementById("chart-toggle-button");
const chartContainer =
    document.getElementById("chart-container");

let chartInterval: Interval = "all";
const chartIntervalButton = document.getElementById("chart-interval-button");

// グラフ用ボタンは、グラフ表示中、かつ塩分・DO1号・DO3号のときだけ表示
function updateChartIntervalVisibility() {
    if (!chartIntervalButton) return;
    const hasInterval = ["salinity", "do1", "do3"].includes(currentSensorType);
    chartIntervalButton.style.display = isChartVisible && hasInterval ? "" : "none";
}

// グラフ用ボタンの見た目を状態に合わせる
function updateChartIntervalButton() {
    if (!chartIntervalButton) return;
    const isOn = chartInterval === "3h";
    chartIntervalButton.classList.toggle("active", isOn);
    chartIntervalButton.setAttribute("aria-pressed", String(isOn));
}

chartIntervalButton?.addEventListener("click", () => {
    chartInterval = chartInterval === "3h" ? "all" : "3h";
    updateChartIntervalButton();
    loadChart(
        API_URLS[currentSensorType as keyof typeof API_URLS],
        currentSensorType
    );
});


// 表の表示間隔切り替えボタン
const tableIntervalButton = document.getElementById("table-interval-button");

tableIntervalButton?.addEventListener("click", () => {
    tableInterval = tableInterval === "3h" ? "all" : "3h";

    const isOn = tableInterval === "3h";
    tableIntervalButton.classList.toggle("active", isOn);
    tableIntervalButton.setAttribute("aria-pressed", String(isOn));

    showTable();
});

let currentSensorType = "salinity";

waterTab?.addEventListener("click", () => {
    currentSensorType = "water";
    updateChartIntervalVisibility();
    setActiveTab(waterTab);
    loadTable(API_URLS.water, "water");

    if (isChartVisible) {
    loadChart(API_URLS.water, "water");
}
});

salinityTab?.addEventListener("click", () => {
    currentSensorType = "salinity";
    updateChartIntervalVisibility();
    setActiveTab(salinityTab);
    loadTable(API_URLS.salinity, "salinity");

    if (isChartVisible) {
        loadChart(API_URLS.salinity, "salinity");
    }
});

do1Tab?.addEventListener("click", () => {
    currentSensorType = "do1";
    updateChartIntervalVisibility();

    setActiveTab(do1Tab);
    loadTable(API_URLS.do1, "do1");

    if (isChartVisible) {
        loadChart(API_URLS.do1, "do1");
    }
});

do2Tab?.addEventListener("click", () => {
    currentSensorType = "do2";
    updateChartIntervalVisibility();
    setActiveTab(do2Tab);
    loadTable(API_URLS.do2, "do2");

    if (isChartVisible) {
        loadChart(API_URLS.do2, "do2");
    }
});

do3Tab?.addEventListener("click", () => {
    currentSensorType = "do3";
    updateChartIntervalVisibility();

    setActiveTab(do3Tab);
    loadTable(API_URLS.do3, "do3");

    if (isChartVisible) {
        loadChart(API_URLS.do3, "do3");
    }
});

//グラフ表示ボタン
chartToggleButton?.addEventListener("click", () => {
    isChartVisible = !isChartVisible;

    if (isChartVisible) {
        chartContainer!.style.display = "block";
        chartToggleButton.textContent = "グラフを非表示";
        updateChartIntervalVisibility();

        loadChart(
            API_URLS[currentSensorType as keyof typeof API_URLS],
            currentSensorType
        );
    }
    // グラフを描画
    else {
        chartContainer!.style.display = "none";
        chartToggleButton.textContent = "グラフを表示";
        updateChartIntervalVisibility();
    }
});

//グラフ描画
async function loadChart(
    apiUrl: string,
    sensorType: string
) {
    if (!chartContainer) return;

    // DO2はグラフがないので、取得せずにメッセージだけ出す
    if (sensorType === "do2") {
        chartContainer.textContent = "DO2号のグラフは準備中です。";
        return;
    }

    const data = await fetchData(apiUrl);
    if (!data) return;

    renderChart(data, sensorType, chartContainer, chartInterval);
}

// 表の状態
let tableData: string | null = null;      // 取得済みのデータ
let tableSensorType = "salinity";
let tableInterval: Interval = "all";      // "all": 全件 / "3h": 3時間ごと

// 保持しているデータから表を描画する
function showTable() {
    const container = app?.querySelector("#table-container");
    if (!container || tableData === null) return;

    container.innerHTML = renderTable(tableData, tableSensorType, tableInterval);
}

// API からデータを取得して表を反映
async function loadTable(apiUrl: string, sensorType: string) {
    const container = app?.querySelector("#table-container");
    if (!container) return;

    container.textContent = "読み込み中...";

    const data = await fetchData(apiUrl);

    if (data !== null) {
        tableData = data;
        tableSensorType = sensorType;
        showTable();
    } else {
        tableData = null;
        container.textContent = "データの取得に失敗しました。2~5分ほど待ってからもう一度お試しください。";
    }
}

loadTable(API_URLS.salinity, "salinity");