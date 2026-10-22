// グラフの表示間隔
// "all": 最大500件に等間隔で間引く / "3h": 3時間ごと
export type Interval = "all" | "3h";

const MAX_POINTS = 500;

// 表示間隔ごとの、1点あたりの横幅(px)
export function getPxPerPoint(interval: Interval): number {
    return interval === "3h" ? 35 : 35;
}

// 表示間隔に合わせてデータを間引く
export function thinRows(rows: any[], interval: Interval): any[] {
    if (interval === "3h") {
        // 日本時間で 0:00, 3:00, 6:00... ちょうどの行だけ残す
        return rows.filter((row: any) => {
            const date = new Date(row[1]);
            const jstHours = (date.getUTCHours() + 9) % 24;
            return date.getUTCMinutes() === 0 && jstHours % 3 === 0;
        });
    }

    // 全体: 最大500件。最新の行を必ず含める（古い側を間引く）
    const step = Math.max(1, Math.ceil(rows.length / MAX_POINTS));
    const lastIndex = rows.length - 1;
    return rows.filter((_, index) => (lastIndex - index) % step === 0);
}
