import Chart from "chart.js/auto";
import Papa from "papaparse";
import "./index.css";
import { thinRows, getPxPerPoint, type Interval } from "./thinRows.js"; // 間引き処理

function parseData(data: string) {
    const parsed = Papa.parse(data, {
        header: false,
        skipEmptyLines: true,
    });

    return parsed.data;
}

export function renderChart(
    data: string,
    sensorType: string,
    chartContainer: HTMLElement,
    interval: Interval = "all",
) {
    if (!chartContainer) return;

    if (sensorType === "water") {
        chartContainer.innerHTML =
            `<div class="chart-legend">
                <span class="legend-item">
                    <span class="legend-color water-temp"></span>
                    水温
                </span>

                <span class="legend-item">
                    <span class="legend-color outside-temp"></span>
                    外気温
                </span>
            </div>
            <div class="chart-main">
                <div class="chart-scroll-area">
                    <div class="chart-wrapper">
                        <canvas id="water-chart"></canvas>
                    </div>
                </div>
            </div>`;

        renderWaterChart(data);
    }

    if (sensorType === "salinity") {
        chartContainer.innerHTML =
            `<div class="chart-legend">
                <span class="legend-item">
                    <span class="legend-color translucent-water-temp"></span>
                    水温
                </span>

                <span class="legend-item">
                    <span class="legend-color translucent-outside-temp"></span>
                    外気温
                </span>
    
                <span class="legend-item">
                    <span class="legend-color salinity"></span>
                    塩分
                </span>
            </div>
            <div class="chart-main">
                <div class="chart-scroll-area">
                    <div class="chart-wrapper">
                        <canvas id="salinity-chart"></canvas>
                    </div>
                </div>
            </div>`;

        renderSalinityChart(data, interval);
    }

    if (sensorType === "do1") {
        chartContainer.innerHTML =
            `<div class="chart-legend">
                <span class="legend-item">
                    <span class="legend-color translucent-water-temp"></span>
                    水温
                </span>

                <span class="legend-item">
                    <span class="legend-color translucent-outside-temp"></span>
                    外気温
                </span>
    
                <span class="legend-item">
                    <span class="legend-color do-percent"></span>
                    DO（%）
                </span>

                <span class="legend-item">
                    <span class="legend-color do-MgL"></span>
                    DO（mg/L）
                </span>
            </div>
            <div class="chart-main">
                <div class="chart-scroll-area">
                    <div class="chart-wrapper">
                        <canvas id="do1-chart"></canvas>
                    </div>
                </div>
            </div>`;

        renderDO1Chart(data, interval);
    }

    if (sensorType === "do3") {
        chartContainer.innerHTML =
            `<div class="chart-legend">
                <span class="legend-item">
                    <span class="legend-color translucent-water-temp"></span>
                    水温
                </span>

                <span class="legend-item">
                    <span class="legend-color translucent-outside-temp"></span>
                    外気温
                </span>
    
                <span class="legend-item">
                    <span class="legend-color do-percent"></span>
                    DO（%）
                </span>

                <span class="legend-item">
                    <span class="legend-color do-MgL"></span>
                    DO（mg/L）
                </span>
            </div>
            <div class="chart-main">
                <div class="chart-scroll-area">
                    <div class="chart-wrapper">
                        <canvas id="do3-chart"></canvas>
                    </div>
                </div>
            </div>`;

        renderDO3Chart(data, interval);
    }
}

const CHART_COLORS = {
    waterTemp: "#4FC3F7",
    outsideTemp: "#EF5350",
    salinity: "#ffcd29",
    doPercent: "#1dd626",
    doMgL: "#0c7412",

    translucentWaterTemp: "#4fc2f786",
    translucentOutsideTemp: "#ef53507c",
};
// 水温グラフ
let waterChart: Chart | null = null;

function renderWaterChart(data: string) {
    const rows = parseData(data);

    const labels = rows.map((row: any) => {
        const date = new Date(row[1]);

        return date.toLocaleString("ja-JP", {
            timeZone: "Asia/Tokyo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    });

    const waterTemps = rows.map((row: any) => {
        return Number(row[4]);
    });

    const outsideTemps = rows.map((row: any) => {
        return Number(row[3]);
    });

    const canvas = document.getElementById(
        "water-chart"
    ) as HTMLCanvasElement;

    const chartWidth = Math.max(
        rows.length * 40,
        800
    );
    canvas.width = chartWidth;
    canvas.height = 400;

    if (waterChart) {
        waterChart.destroy();
    }

    waterChart = new Chart(canvas, {
        type: "line",

        data: {
            labels: labels,

            datasets: [
                {
                    label: "水温",
                    data: waterTemps,
                    borderColor: CHART_COLORS.waterTemp,
                    backgroundColor: CHART_COLORS.waterTemp,
                    borderWidth: 2,
                    yAxisID: "yTempLeft"
                },
                {
                    label: "外気温",
                    data: outsideTemps,
                    borderColor: CHART_COLORS.outsideTemp,
                    backgroundColor: CHART_COLORS.outsideTemp,
                    borderWidth: 2,
                    yAxisID: "yTempLeft"
                },
            ],
        },

        options: {
            responsive: false,
            plugins: {
                legend: {
                    display: false,
                },
            },
            scales: {
                yTempLeft: {
                    display: true,
                    position: "left",
                    title: {
                        display: true,
                        text: "℃",
                    },
                    min: 15,
                    max: 40,
                },
                yTempRight: {
                    display: true,
                    position: "right",
                    title: {
                        display: true,
                        text: "℃",
                    },
                    min: 15,
                    max: 40,
                },
            },
        },
    });
    requestAnimationFrame(() => {
        const scrollArea = document.querySelector(
            ".chart-scroll-area"
        ) as HTMLElement;

        if (scrollArea) {
            scrollArea.scrollLeft = scrollArea.scrollWidth;
        }
    });
}

// 塩分グラフ
let salinityChart: Chart | null = null;

function renderSalinityChart(data: string, interval: Interval) {
    const rows = parseData(data);

    console.log("塩分のデータ件数:", rows.length);

    const displayRows = thinRows(rows, interval);

    // 間引き前の全データから縦軸の範囲を計算
    const salinityRange = calcAxisRange(rows, 6, 0.5, 0.5, 1, 45);

    const labels = displayRows.map((row: any) => {
        const date = new Date(row[1]);

        return date.toLocaleString("ja-JP", {
            timeZone: "Asia/Tokyo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    });

    // 水温
    const waterTemps = displayRows.map((row: any) => {
        return Number(row[4]);
    });

    // 外気温
    const outsideTemps = displayRows.map((row: any) => {
        return Number(row[3]);
    });

    // 塩分
    const salinityValues = displayRows.map((row: any) => {
        const v = parseFloat(row[6]);
        return v > 0 ? v : NaN; // 0以下の値は無効として NaN にする（線が途切れるように）
    });

    const canvas = document.getElementById(
        "salinity-chart"
    ) as HTMLCanvasElement;

    // 縦横幅
    const chartWidth = Math.max(
        displayRows.length * getPxPerPoint(interval),
        800
    );
    canvas.width = chartWidth;
    canvas.height = 400;

    // すでにグラフが存在していたら削除
    if (salinityChart) {
        salinityChart.destroy();
    }

    salinityChart = new Chart(canvas, {
        type: "line",

        data: {
            labels: labels,

            datasets: [
                {
                    label: "水温",
                    data: waterTemps,
                    borderColor: CHART_COLORS.translucentWaterTemp,
                    backgroundColor: CHART_COLORS.translucentWaterTemp,
                    borderWidth: 2,
                    yAxisID: "yTemp",
                },
                {
                    label: "外気温",
                    data: outsideTemps,
                    borderColor: CHART_COLORS.translucentOutsideTemp,
                    backgroundColor: CHART_COLORS.translucentOutsideTemp,
                    borderWidth: 2,
                    yAxisID: "yTemp",
                },
                {
                    label: "塩分",
                    data: salinityValues,
                    borderColor: CHART_COLORS.salinity,
                    backgroundColor: CHART_COLORS.salinity,
                    borderWidth: 2,
                    yAxisID: "ySalinityLeft",
                },
            ],
        },
        options: {
            responsive: false,
            plugins: {
                legend: {
                    display: false,
                },
            },
            scales: {
                // 横軸: 00:00 のときだけ日付も表示する
                x: {
                    ticks: {
                        autoSkip: false,
                        maxRotation: 0,
                        minRotation: 0,
                        callback: function (value, index) {
                            const label = this.getLabelForValue(Number(value));
                            const [date = "", time = ""] = label.split(" ");

                            if (time === "00:00" || index === 0) {
                                return [time, date];
                            }

                            return time;
                        },
                    },
                },

                // 温度用の軸
                yTemp: {
                    display: false,
                },

                // 左側の塩分用の軸
                ySalinityLeft: {
                    display: true,
                    position: "left",

                    title: {
                        display: true,
                        text: "psu",
                    },

                    min: salinityRange.min,
                    max: salinityRange.max,
                },

                // 右側の塩分用の軸
                ySalinityRight: {
                    display: true,
                    position: "right",

                    title: {
                        display: true,
                        text: "psu",
                    },

                    min: salinityRange.min,
                    max: salinityRange.max,

                    grid: {
                        drawOnChartArea: false,
                    },
                },
            },
        },
    });
    requestAnimationFrame(() => {
        const scrollArea = document.querySelector(
            ".chart-scroll-area"
        ) as HTMLElement;

        if (scrollArea) {
            scrollArea.scrollLeft = scrollArea.scrollWidth;
        }
    });
}

// DO1号グラフ
let do1Chart: Chart | null = null;

function renderDO1Chart(data: string, interval: Interval) {
    const rows = parseData(data);

    console.log("DO1のデータ件数:", rows.length);

    const displayRows = thinRows(rows, interval);

    const doPercentRange = calcAxisRange(rows, 5, 2, 5, 1, 300);
    const doMgLRange     = calcAxisRange(rows, 6, 0.5, 0.5, 0.1, 30);

    const labels = displayRows.map((row: any) => {
        const date = new Date(row[1]);

        return date.toLocaleString("ja-JP", {
            timeZone: "Asia/Tokyo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    });

    // 外気温
    const outsideTemps = displayRows.map((row: any) => {
        return Number(row[3]);
    });

    // 水温
    const waterTemps = displayRows.map((row: any) => {
        return Number(row[4]);
    });

    // DO(%)
    const doPercent = displayRows.map((row: any) => {
        return Number(row[5]);
    });

    // DO(mg/L)
    const doMgL = displayRows.map((row: any) => {
        return Number(row[6]);
    });

    const canvas = document.getElementById(
        "do1-chart"
    ) as HTMLCanvasElement;

    const chartWidth = Math.max(
        displayRows.length * getPxPerPoint(interval),
        800
    );
    canvas.width = chartWidth;
    canvas.height = 400;



    // すでにグラフが存在していたら削除
    if (do1Chart) {
        do1Chart.destroy();
    }

    do1Chart = new Chart(canvas, {
        type: "line",

        data: {
            labels: labels,

            datasets: [
                {
                    label: "水温",
                    data: waterTemps,
                    borderColor: CHART_COLORS.translucentWaterTemp,
                    backgroundColor: CHART_COLORS.translucentWaterTemp,
                    borderWidth: 2,
                    yAxisID: "yTemp",
                },
                {
                    label: "外気温",
                    data: outsideTemps,
                    borderColor: CHART_COLORS.translucentOutsideTemp,
                    backgroundColor: CHART_COLORS.translucentOutsideTemp,
                    borderWidth: 2,
                    yAxisID: "yTemp",
                },
                {
                    label: "DO(%)",
                    data: doPercent,
                    borderColor: CHART_COLORS.doPercent,
                    backgroundColor: CHART_COLORS.doPercent,
                    borderWidth: 2,
                    yAxisID: "yDO",
                },
                {
                    label: "DO(mg/L)",
                    data: doMgL,
                    borderColor: CHART_COLORS.doMgL,
                    backgroundColor: CHART_COLORS.doMgL,
                    borderWidth: 2,
                    yAxisID: "yDOMgL",
                },
            ],
        },
        options: {
            responsive: false,
            plugins: {
                legend: {
                    display: false,
                },
            },
            scales: {
                // 横軸: 00:00 のときだけ日付も表示する
                x: {
                    ticks: {
                        autoSkip: false,
                        maxRotation: 0,
                        minRotation: 0,
                        callback: function (value, index) {
                            const label = this.getLabelForValue(Number(value));
                            const [date = "", time = ""] = label.split(" ");

                            // 00:00 と、いちばん左のラベルは日付も出す(2行表示)
                            if (time === "00:00" || index === 0) {
                                return [time, date];
                            }

                            // それ以外は時刻だけ
                            return time;
                        },
                    },
                },

                // 温度用
                yTemp: {
                    display: false,
                },

                // DO(%)用
                yDO: {
                    display: true,
                    position: "left",

                    title: {
                        display: true,
                        text: "%",
                    },
                    grid: {
                        drawOnChartArea: false,
                    },

                    min: doPercentRange.min,
                    max: doPercentRange.max
                },

                // DO(mg/L)用
                yDOMgL: {
                    display: true,
                    position: "right",

                    title: {
                        display: true,
                        text: "mg/L",
                    },
                    min: doMgLRange.min,
                    max: doMgLRange.max,
                },
            },
        },
    });
    requestAnimationFrame(() => {
        const scrollArea = document.querySelector(
            ".chart-scroll-area"
        ) as HTMLElement;

        if (scrollArea) {
            scrollArea.scrollLeft = scrollArea.scrollWidth;
        }
    });
}

// DO3号グラフ
let do3Chart: Chart | null = null;

function renderDO3Chart(data: string, interval: Interval) {
    const rows = parseData(data);

    console.log("DO3のデータ件数:", rows.length);

    const displayRows = thinRows(rows, interval);

    const doPercentRange = calcAxisRange(rows, 5, 2, 5, 1, 300);
const doMgLRange     = calcAxisRange(rows, 6, 0.5, 0.5, 0.1, 30);

    const labels = displayRows.map((row: any) => {
        const date = new Date(row[1]);

        return date.toLocaleString("ja-JP", {
            timeZone: "Asia/Tokyo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    });

    // 外気温
    const outsideTemps = displayRows.map((row: any) => {
        return Number(row[3]);
    });

    // 水温
    const waterTemps = displayRows.map((row: any) => {
        return Number(row[4]);
    });

    // DO(%)
    const doPercent = displayRows.map((row: any) => {
        return Number(row[5]);
    });

    // DO(mg/L)
    const doMgL = displayRows.map((row: any) => {
        return Number(row[6]);
    });

    const canvas = document.getElementById(
        "do3-chart"
    ) as HTMLCanvasElement;

    const chartWidth = Math.max(
        displayRows.length * getPxPerPoint(interval),
        800
    );
    canvas.width = chartWidth;
    canvas.height = 400;



    // すでにグラフが存在していたら削除
    if (do3Chart) {
        do3Chart.destroy();
    }

    do3Chart = new Chart(canvas, {
        type: "line",

        data: {
            labels: labels,

            datasets: [
                {
                    label: "水温",
                    data: waterTemps,
                    borderColor: CHART_COLORS.translucentWaterTemp,
                    backgroundColor: CHART_COLORS.translucentWaterTemp,
                    borderWidth: 2,
                    yAxisID: "yTemp",
                },
                {
                    label: "外気温",
                    data: outsideTemps,
                    borderColor: CHART_COLORS.translucentOutsideTemp,
                    backgroundColor: CHART_COLORS.translucentOutsideTemp,
                    borderWidth: 2,
                    yAxisID: "yTemp",
                },
                {
                    label: "DO(%)",
                    data: doPercent,
                    borderColor: CHART_COLORS.doPercent,
                    backgroundColor: CHART_COLORS.doPercent,
                    borderWidth: 2,
                    yAxisID: "yDO",
                },
                {
                    label: "DO(mg/L)",
                    data: doMgL,
                    borderColor: CHART_COLORS.doMgL,
                    backgroundColor: CHART_COLORS.doMgL,
                    borderWidth: 2,
                    yAxisID: "yDOMgL",
                },
            ],
        },
        options: {
            responsive: false,
            plugins: {
                legend: {
                    display: false,
                },
            },
            scales: {
                // 横軸: 00:00 のときだけ日付も表示する
                x: {
                    ticks: {
                        autoSkip: false,
                        maxRotation: 0,
                        minRotation: 0,
                        callback: function (value, index) {
                            const label = this.getLabelForValue(Number(value));
                            const [date = "", time = ""] = label.split(" ");

                            if (time === "00:00" || index === 0) {
                                return [time, date];
                            }

                            return time;
                        },
                    },
                },

                // 温度用
                yTemp: {
                    display: false,
                },

                // DO(%)用
                yDO: {
                    display: true,
                    position: "left",

                    title: {
                        display: true,
                        text: "%",
                    },
                    grid: {
                        drawOnChartArea: false,
                    },

                    min: doPercentRange.min,
                    max: doPercentRange.max,
                },

                // DO(mg/L)用
                yDOMgL: {
                    display: true,
                    position: "right",

                    title: {
                        display: true,
                        text: "mg/L",
                    },
                    min: doMgLRange.min,
                    max: doMgLRange.max,
                },
            },
        },
    });
    requestAnimationFrame(() => {
        const scrollArea = document.querySelector(
            ".chart-scroll-area"
        ) as HTMLElement;

        if (scrollArea) {
            scrollArea.scrollLeft = scrollArea.scrollWidth;
        }
    });
}

// 値の配列から、縦軸の min / max を計算する
// margin: 余白、step: 目盛りが切りのいい数字になるよう丸める単位
function calcAxisRange(
    rows: any[],
    columnIndex: number,
    margin: number,
    step: number,
    validMin: number = -Infinity,
    validMax: number = Infinity,
): { min: number | undefined; max: number | undefined } {
    const values = rows
        .map((row: any) => parseFloat(row[columnIndex]))
        .filter((v) => Number.isFinite(v) && v >= validMin && v <= validMax);

    if (values.length === 0) {
        return { min: undefined, max: undefined }; // 自動に任せる
    }

    const lo = values.reduce((a, b) => Math.min(a, b));
    const hi = values.reduce((a, b) => Math.max(a, b));

    return {
        min: Math.floor((lo - margin) / step) * step,
        max: Math.ceil((hi + margin) / step) * step,
    };
}