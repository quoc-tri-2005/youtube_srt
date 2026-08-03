/* =====================================================
   merge.js
   PHẦN 1
   Utilities + Parse + Report
===================================================== */

/* ============================================
   Parse SRT gốc
============================================ */

function parseOriginalSRT(srt) {

    if (!srt.trim()) {
        return [];
    }

    const result = [];

    const blocks =
        srt
            .trim()
            .split(/\r?\n\r?\n+/);

    for (const block of blocks) {

        const lines =
            block
                .trim()
                .split(/\r?\n/);

        if (lines.length < 3)
            continue;

        const index =
            lines[0].trim();

        const time =
            lines[1].trim();

        const text =
            lines
                .slice(2)
                .join("\n")
                .trim();

        result.push({

            index,

            time,

            text

        });

    }

    return result;

}

/* ============================================
   Parse file dịch

   Trả về

   {
       map,
       duplicates,
       invalid
   }

============================================ */

const original =
    parseOriginalSRT(
        document.getElementById("original").value
    );

const originalIndexes =
    new Set(
        original.map(
            item => item.index
        )
    );

const translated =
    parseTranslatedSRT(
        document.getElementById("translated").value,
        originalIndexes
    );
function parseTranslatedSRT(
    srt,
    originalIndexes
){

    const map = new Map();
    const duplicates = [];
    const invalid = [];

    if (!srt.trim()) {

        return {
            map,
            duplicates,
            invalid
        };

    }

    const blocks =
        srt
            .replace(/\r/g, "")
            .trim()
            .split(/\n{2,}/);

    for (const block of blocks) {

        const lines =
            block
                .split("\n")
                .map(v => v.trim())
                .filter(v => v !== "");

        if (lines.length < 2)
            continue;

        const index =
            lines[0];

        const text =
            lines
                .slice(1)
                .join("\n");

        if (!/^\d+$/.test(index)) {

            invalid.push({
                index,
                text
            });

            continue;

        }

        if (map.has(index)) {

            duplicates.push({
                index,
                old: map.get(index),
                current: text
            });

            continue;

        }

        map.set(
            index,
            text
        );

    }

    return {

        map,

        duplicates,

        invalid

    };

}
/* ============================================
   Tự động xuống dòng
============================================ */

function wrapText(

    text,

    maxLen

) {

    if (!text)
        return "";

    text =
        text.trim();

    if (

        !maxLen ||

        maxLen <= 0

    ) {

        return text;

    }

    const words =
        text.split(/\s+/);

    const output =
        [];

    let line =
        "";

    for (const word of words) {

        if (!line) {

            line = word;

            continue;

        }

        const test =
            line +
            " " +
            word;

        if (

            test.length <=
            maxLen

        ) {

            line =
                test;

        }

        else {

            output.push(
                line
            );

            line =
                word;

        }

    }

    if (line) {

        output.push(
            line
        );

    }

    return output.join("\n");

}

/* ============================================
   Time -> ms
============================================ */

function timeToMs(time) {

    const [

        h,

        m,

        rest

    ] =
        time.split(":");

    const [

        s,

        ms

    ] =
        rest.split(",");

    return (

        Number(h) * 3600000 +

        Number(m) * 60000 +

        Number(s) * 1000 +

        Number(ms)

    );

}

/* ============================================
   ms -> Time
============================================ */

function msToTime(ms) {

    const h =
        Math.floor(
            ms / 3600000
        );

    ms %= 3600000;

    const m =
        Math.floor(
            ms / 60000
        );

    ms %= 60000;

    const s =
        Math.floor(
            ms / 1000
        );

    ms %= 1000;

    return (

        String(h)
            .padStart(2, "0")

        + ":"

        + String(m)
            .padStart(2, "0")

        + ":"

        + String(s)
            .padStart(2, "0")

        + ","

        + String(ms)
            .padStart(3, "0")

    );

}

/* ============================================
   Fix timestamp trùng nhau
============================================ */

function fixOverlap(items) {

    for (

        let i = 0;

        i < items.length - 1;

        i++

    ) {

        const [

            ,

            end

        ] =
            items[i]
                .time
                .split(" --> ");

        const [

            nextStart,

            nextEnd

        ] =
            items[
                i + 1
            ]
                .time
                .split(" --> ");

        if (

            end ===
            nextStart

        ) {

            const newStart =

                msToTime(

                    timeToMs(
                        nextStart
                    ) + 1

                );

            items[
                i + 1
            ].time =

`${newStart} --> ${nextEnd}`;

        }

    }

    return items;

}

/* ============================================
   Reset báo cáo
============================================ */

function resetReport() {

    document.getElementById(
        "totalCount"
    ).textContent = 0;

    document.getElementById(
        "mergedCount"
    ).textContent = 0;

    document.getElementById(
        "missingCount"
    ).textContent = 0;

    document.getElementById(
        "extraCount"
    ).textContent = 0;

    document.getElementById(
        "missingList"
    ).value = "";

    document.getElementById(
        "extraList"
    ).value = "";

}

/* ============================================
   Hiển thị báo cáo
============================================ */

function updateReport(report) {

    document.getElementById(
        "totalCount"
    ).textContent =
        report.total;

    document.getElementById(
        "mergedCount"
    ).textContent =
        report.merged;

    document.getElementById(
        "missingCount"
    ).textContent =
        report.missing.length;

    document.getElementById(
        "extraCount"
    ).textContent =
        report.extra.length;

    document.getElementById(
        "missingList"
    ).value =

        report.missing.length

        ? report.missing
            .map(item =>

`${item.index}
${item.time}
${item.text}`)

            .join("\n\n----------------------\n\n")

        : "Không có.";

    document.getElementById(
        "extraList"
    ).value =

        report.extra.length

        ? report.extra
            .map(item =>

`${item.index}
${item.text}`)

            .join("\n\n----------------------\n\n")

        : "Không có.";

}

/* =====================================================
   merge.js
   PHẦN 2
   Merge SRT
===================================================== */

function merge() {

    resetReport();

    /* ===========================
       Đọc dữ liệu
    =========================== */

    let original =
        parseOriginalSRT(
            document
                .getElementById("original")
                .value
        );

    const translatedData =
        parseTranslatedSRT(
            document
                .getElementById("translated")
                .value
        );

    original =
        fixOverlap(original);

    const translated =
        translatedData.map;

    /* ===========================
       Tuỳ chọn
    =========================== */

    const enableWrap =
        document
            .getElementById(
                "enableWrap"
            )
            .checked;

    const maxLen =
        enableWrap
            ? Number(
                  document
                      .getElementById(
                          "maxLen"
                      )
                      .value
              )
            : 0;

    const keepOriginal =
        document
            .getElementById(
                "keepOriginal"
            )
            .checked;

    /* ===========================
       Report
    =========================== */

    const report = {

        total:
            original.length,

        merged: 0,

        missing: [],

        extra: [],

        duplicate:
            translatedData.duplicates,

        invalid:
            translatedData.invalid

    };

    const used =
        new Set();

    const output =
        [];

    /* ===========================
       Merge theo index
    =========================== */

    for (const item of original) {

        let text =
            translated.get(
                item.index
            );

        /* Không tìm thấy */

        if (
            text === undefined
        ) {

            report
                .missing
                .push({

                    index:
                        item.index,

                    time:
                        item.time,

                    text:
                        item.text

                });

            text =
                keepOriginal
                    ? item.text
                    : "";

        }

        else {

            report
                .merged++;

            used.add(
                item.index
            );

        }

        /* Wrap */

        if (
            enableWrap
        ) {

            text =
                wrapText(

                    text,

                    maxLen

                );

        }

        output.push(

`${item.index}
${item.time}
${text}`

        );

    }

    /* ===========================
       Subtitle dư
    =========================== */

    for (

        const [

            index,

            text

        ]

        of translated

    ) {

        if (

            used.has(
                index
            )

        ) {

            continue;

        }

        report
            .extra
            .push({

                index,

                text

            });

    }

    /* ===========================
       Hiển thị Report
    =========================== */

    updateReport(
        report
    );

    /* ===========================
       Kết quả
    =========================== */

    document
        .getElementById(
            "result"
        )
        .value =

        output.join(
            "\n\n"
        );

    /* ===========================
       Console
    =========================== */

    console.table({

        total:
            report.total,

        merged:
            report.merged,

        missing:
            report.missing.length,

        extra:
            report.extra.length,

        duplicate:
            report.duplicate.length,

        invalid:
            report.invalid.length

    });

    if (
        report
            .duplicate
            .length
    ) {

        console.warn(
            "Duplicate Index",
            report.duplicate
        );

    }

    if (
        report
            .invalid
            .length
    ) {

        console.warn(
            "Invalid Index",
            report.invalid
        );

    }

}
