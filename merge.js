
const MAX_LINE_LENGTH = 32;

function parseSRT(srt) {
    return srt
        .trim()
        .split(/\n{2,}/)
        .map(block => {
            const lines = block.trim().split("\n");

            return {
                index: lines[0].trim(),
                time: lines[1].trim()
            };
        });
}

function getTranslatedTexts(srt) {

    const lines = srt.split("\n");
    const result = [];
    let current = [];

    for (const rawLine of lines) {

        const line = rawLine.trim();

        if (/^\d+$/.test(line)) {

            if (current.length) {
                result.push(current.join(" "));
                current = [];
            }

            continue;
        }

        if (line.includes("-->")) {
            continue;
        }

        if (line) {
            current.push(line);
        }
    }

    if (current.length) {
        result.push(current.join(" "));
    }

    return result;
}

function wrapText(text, maxLen = MAX_LINE_LENGTH) {

    const words = text.trim().split(/\s+/);

    let lines = [];
    let currentLine = "";

    for (const word of words) {

        if (!currentLine) {
            currentLine = word;
            continue;
        }

        const testLine = currentLine + " " + word;

        if (testLine.length <= maxLen) {

            currentLine = testLine;

        } else {

            lines.push(currentLine);
            currentLine = word;
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines.join("\n");
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

        const text =
            wrapText(
                translated[i] || "",
                MAX_LINE_LENGTH
            );

        return `${item.index}
${item.time}
${text}`;

    }).join("\n\n");

    document.getElementById("result").value =
        result;
}
