function parseSRT(srt) {
    return srt
        .trim()
        .split(/\n{2,}/)
        .map(block => {
            const lines = block.trim().split("\n");

            return {
                index: lines[0],
                time: lines[1]
            };
        });
}

function getTranslatedTexts(srt) {
    const lines = srt
        .split("\n")
        .map(line => line.trim());

    const result = [];
    let temp = [];

    for (const line of lines) {

        if (/^\d+$/.test(line)) {
            if (temp.length) {
                result.push(temp.join("\n"));
                temp = [];
            }
            continue;
        }

        if (line.includes("-->")) {
            continue;
        }

        if (line !== "") {
            temp.push(line);
        }
    }

    if (temp.length) {
        result.push(temp.join("\n"));
    }

    return result;
}

function timeToMs(timeStr) {
    const [h, m, rest] = timeStr.split(":");
    const [s, ms] = rest.split(",");

    return (
        Number(h) * 3600000 +
        Number(m) * 60000 +
        Number(s) * 1000 +
        Number(ms)
    );
}

function msToTime(ms) {
    const h = Math.floor(ms / 3600000);
    ms %= 3600000;

    const m = Math.floor(ms / 60000);
    ms %= 60000;

    const s = Math.floor(ms / 1000);
    ms %= 1000;

    return (
        String(h).padStart(2, "0") + ":" +
        String(m).padStart(2, "0") + ":" +
        String(s).padStart(2, "0") + "," +
        String(ms).padStart(3, "0")
    );
}

function fixOverlap(items) {

    for (let i = 0; i < items.length - 1; i++) {

        const [, currentEnd] =
            items[i].time.split(" --> ");

        const [nextStart, nextEnd] =
            items[i + 1].time.split(" --> ");

        if (currentEnd === nextStart) {

            const newStart =
                msToTime(
                    timeToMs(nextStart) + 1
                );

            items[i + 1].time =
                `${newStart} --> ${nextEnd}`;
        }
    }

    return items;
}

function merge() {

    let original = parseSRT(
        document.getElementById("original").value
    );

    const translated = getTranslatedTexts(
        document.getElementById("translated").value
    );

    original = fixOverlap(original);

    const result = original.map((item, i) => {

        return `${item.index}
${item.time}
${translated[i] || ""}`;

    }).join("\n\n");

    document.getElementById("result").value = result;
}
