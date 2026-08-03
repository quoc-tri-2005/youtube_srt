/* =========================================
   merge.js
   SRT MERGE TOOL
========================================= */


/* =========================================
   PARSE FILE GỐC
========================================= */

function parseOriginalSRT(srt) {

    const result = [];

    if (!srt.trim()) {
        return result;
    }


    const blocks =
        srt
        .replace(/\r/g, "")
        .trim()
        .split(/\n\s*\n+/);



    for (const block of blocks) {


        const lines =
            block
            .split("\n")
            .map(x => x.trim());


        if (lines.length < 3) {
            continue;
        }


        result.push({

            index:
                lines[0],

            time:
                lines[1],

            text:
                lines
                .slice(2)
                .join("\n")

        });


    }


    return result;

}





/* =========================================
   PARSE FILE DỊCH

   File dịch không cần chuẩn SRT

========================================= */

function parseTranslatedSRT(
    srt,
    originalIndexes
) {


    const map =
        new Map();


    const duplicates =
        [];


    const invalid =
        [];



    const lines =
        srt
        .replace(/\r/g, "")
        .split("\n")
        .map(x => x.trim())
        .filter(x => x);



    let currentIndex = null;

    let buffer = [];




    function saveCurrent() {


        if (
            currentIndex === null
        ) {
            return;
        }



        const text =
            buffer
            .join("\n")
            .trim();



        if (
            map.has(currentIndex)
        ) {


            duplicates.push({

                index:
                    currentIndex,

                old:
                    map.get(currentIndex),

                current:
                    text

            });


        }
        else {


            map.set(

                currentIndex,

                text

            );


        }


    }





    for (
        const line of lines
    ) {



        // Chỉ nhận index có trong file gốc

        if (
            originalIndexes.has(line)
        ) {


            saveCurrent();


            currentIndex =
                line;


            buffer = [];


        }

        else {


            if (
                currentIndex !== null
            ) {

                buffer.push(
                    line
                );

            }

            else {

                invalid.push(
                    line
                );

            }


        }


    }



    saveCurrent();



    return {

        map,

        duplicates,

        invalid

    };


}





/* =========================================
   TỰ XUỐNG DÒNG
========================================= */

function wrapText(
    text,
    maxLen
) {


    if (
        !maxLen ||
        maxLen <= 0
    ) {

        return text;

    }



    const words =
        text.split(/\s+/);



    const result = [];

    let line = "";



    for (
        const word of words
    ) {


        if (!line) {

            line = word;

            continue;

        }



        const test =
            line + " " + word;



        if (
            test.length <= maxLen
        ) {

            line = test;

        }
        else {

            result.push(
                line
            );

            line = word;

        }


    }



    if (line) {

        result.push(line);

    }



    return result.join("\n");

}





/* =========================================
   TIME
========================================= */

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

        String(h).padStart(2,"0")
        + ":"
        +
        String(m).padStart(2,"0")
        + ":"
        +
        String(s).padStart(2,"0")
        + ","
        +
        String(ms).padStart(3,"0")

    );

}





function fixOverlap(items) {


    for (
        let i = 0;
        i < items.length - 1;
        i++
    ) {


        const [
            ,
            currentEnd
        ] =
            items[i]
            .time
            .split(" --> ");



        const [
            nextStart,
            nextEnd
        ] =
            items[i+1]
            .time
            .split(" --> ");



        if (
            currentEnd === nextStart
        ) {


            items[i+1].time =

            `${msToTime(
                timeToMs(nextStart)+1
            )} --> ${nextEnd}`;


        }


    }



    return items;

}

/* =========================================
   REPORT
========================================= */


function resetReport() {


    const ids = [

        "totalCount",

        "mergedCount",

        "missingCount",

        "extraCount"

    ];


    ids.forEach(id => {

        const el =
            document.getElementById(id);


        if (el) {

            el.textContent = "0";

        }

    });


    const missing =
        document.getElementById(
            "missingList"
        );


    const extra =
        document.getElementById(
            "extraList"
        );


    if (missing) {

        missing.value =
            "";

    }


    if (extra) {

        extra.value =
            "";

    }

}




function updateReport(report) {


    const total =
        document.getElementById(
            "totalCount"
        );


    const merged =
        document.getElementById(
            "mergedCount"
        );


    const missing =
        document.getElementById(
            "missingCount"
        );


    const extra =
        document.getElementById(
            "extraCount"
        );



    if (total)
        total.textContent =
            report.total;


    if (merged)
        merged.textContent =
            report.merged;


    if (missing)
        missing.textContent =
            report.missing.length;


    if (extra)
        extra.textContent =
            report.extra.length;




    const missingList =
        document.getElementById(
            "missingList"
        );


    const extraList =
        document.getElementById(
            "extraList"
        );



    if (missingList) {


        missingList.value =

            report.missing.length

            ?

            report.missing
            .map(item =>

`${item.index}
${item.time}
${item.text}`

            )
            .join(

"\n\n----------------------\n\n"

            )

            :

            "Không có.";

    }





    if (extraList) {


        extraList.value =

            report.extra.length

            ?

            report.extra
            .map(item =>

`${item.index}
${item.text}`

            )
            .join(

"\n\n----------------------\n\n"

            )

            :

            "Không có.";

    }


}







/* =========================================
   MERGE SRT
========================================= */


function merge() {


    resetReport();



    /*
       Đọc file gốc
    */


    let original =
        parseOriginalSRT(

            document
            .getElementById(
                "original"
            )
            .value

        );



    original =
        fixOverlap(
            original
        );





    /*
       Tạo danh sách index gốc
    */


    const originalIndexes =
        new Set(

            original.map(

                item =>
                    item.index

            )

        );





    /*
       Đọc file dịch
    */


    const translatedData =
        parseTranslatedSRT(

            document
            .getElementById(
                "translated"
            )
            .value,

            originalIndexes

        );



    const translated =
        translatedData.map;






    /*
       Option
    */


    const enableWrap =
        document
        .getElementById(
            "enableWrap"
        )
        .checked;



    const maxLen =
        enableWrap

        ?

        Number(

            document
            .getElementById(
                "maxLen"
            )
            .value

        )

        :

        0;





    const keepOriginal =
        document
        .getElementById(
            "keepOriginal"
        )

        ?

        document
        .getElementById(
            "keepOriginal"
        )
        .checked

        :

        false;






    /*
       Report
    */


    const report = {


        total:
            original.length,


        merged:
            0,


        missing:
            [],


        extra:
            [],


        duplicate:
            translatedData.duplicates,


        invalid:
            translatedData.invalid


    };





    const used =
        new Set();



    const output =
        [];







    /*
       Ghép theo index
    */


    for (
        const item of original
    ) {



        let text =
            translated.get(
                item.index
            );




        if (
            text === undefined
        ) {



            report.missing.push({

                index:
                    item.index,

                time:
                    item.time,

                text:
                    item.text

            });



            text =
                keepOriginal
                ?

                item.text

                :

                "";



        }

        else {



            report.merged++;


            used.add(
                item.index
            );


        }





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







    /*
       Tìm subtitle dư
    */


    for (
        const [
            index,
            text
        ]

        of translated
    ) {



        if (
            !used.has(index)
        ) {



            report.extra.push({

                index,

                text

            });


        }


    }







    /*
       Xuất kết quả
    */


    document
    .getElementById(
        "result"
    )
    .value =

        output.join(

            "\n\n"

        );





    updateReport(
        report
    );





    /*
       Console kiểm tra
    */


    console.table({

        Total:
            report.total,

        Merged:
            report.merged,

        Missing:
            report.missing.length,

        Extra:
            report.extra.length,

        Duplicate:
            report.duplicate.length,

        Invalid:
            report.invalid.length

    });



}









/* =========================================
   COPY
========================================= */


function copyResult() {


    const result =
        document
        .getElementById(
            "result"
        );



    result.select();


    document.execCommand(
        "copy"
    );


    alert(
        "Đã copy kết quả"
    );


}








/* =========================================
   DOWNLOAD SRT
========================================= */


function downloadSRT() {


    const text =
        document
        .getElementById(
            "result"
        )
        .value;



    if (
        !text.trim()
    ) {


        alert(
            "Chưa có kết quả"
        );


        return;

    }





    const blob =
        new Blob(

            [
                text
            ],

            {
                type:
                "text/plain;charset=utf-8"
            }

        );





    const url =
        URL.createObjectURL(
            blob
        );





    const a =
        document.createElement(
            "a"
        );



    a.href =
        url;



    a.download =
        "merged.srt";



    a.click();



    URL.revokeObjectURL(
        url
    );


}
