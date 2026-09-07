// ============================================================
// PARSE SRT
// ============================================================

function parseSRT(srt) {

    if (!srt || !srt.trim()) {
        return [];
    }

    return srt
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .trim()
        .split(/\n\s*\n/)
        .map(block => {

            const lines = block
                .split("\n")
                .map(line => line.trim());

            return {
                index: lines[0] || "",
                time: lines[1] || "",
                text: lines
                    .slice(2)
                    .join(" ")
                    .replace(/\s+/g, " ")
                    .trim()
            };

        })
        .filter(item => item.index);
}


// ============================================================
// CHIA CHUNK
// ============================================================

function chunk(arr, size = 100) {

    const result = [];

    for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
    }

    return result;
}


// ============================================================
// ESCAPE HTML
// Tránh lỗi khi prompt chứa < > & "
// ============================================================

function escapeHTML(text) {

    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// TẠO PROMPT
// ============================================================

function buildPrompt(content) {

    return `Bạn là công cụ dịch phụ đề SRT tuyệt đối chính xác theo cấu trúc gốc.

MỤC TIÊU ƯU TIÊN CAO NHẤT:
GIỮ NGUYÊN SỐ LƯỢNG SUBTITLE VÀ CẤU TRÚC INDEX.

Độ tự nhiên của câu văn KHÔNG quan trọng bằng việc giữ đúng cấu trúc.

QUY TẮC BẮT BUỘC:

* GIỮ NGUYÊN toàn bộ index.
* XÓA toàn bộ timestamp.
* MỖI index chỉ được phép xuất hiện DUY NHẤT 1 dòng dịch.
* KHÔNG được gộp 2 index.
* KHÔNG được chia nhỏ 1 index.
* KHÔNG được nối nội dung giữa subtitle trước và subtitle sau.
* KHÔNG được tự hoàn thiện câu bằng cách tham khảo subtitle kế tiếp.
* KHÔNG được bỏ sót bất kỳ index nào.
* OUTPUT phải có số lượng index CHÍNH XÁC bằng input.
* Mỗi subtitle phải được dịch độc lập.

QUY TẮC VĂN PHONG:

* Dịch sang tiếng Việt phổ thông hiện đại.
* Dịch như lời nói hoặc lời kể chuyện tự nhiên của người Việt.
* KHÔNG dịch theo văn phong truyện chữ Trung Quốc.
* KHÔNG dịch theo văn phong kiếm hiệp, tiên hiệp, ngôn tình hoặc sảng văn.
* Ưu tiên từ ngữ mà người Việt thường dùng hằng ngày.
* Khi có nhiều cách dịch, luôn chọn cách diễn đạt tự nhiên nhất.

HẠN CHẾ TỐI ĐA:

sự tình, phương diện, thực lực, cấp tốc, cáo tri, hồi đáp, minh bạch, phát giác, cơ duyên, thiên phú, nghịch tập, đả kích, đích thân, bất quá, dẫu sao, vô cùng, cực kỳ, đương nhiên, thậm chí

ƯU TIÊN:

chuyện, mặt, khả năng, nhanh chóng, cho biết, trả lời, hiểu rõ, phát hiện, cơ hội, tài năng, lật ngược tình thế, gây ảnh hưởng, tự mình, nhưng, dù sao, rất, tất nhiên, ngay cả

ĐẶC BIỆT QUAN TRỌNG:

Hãy dịch như phụ đề của một video kể chuyện YouTube bằng tiếng Việt.

KHÔNG dịch theo cách thường thấy trong truyện dịch Trung Quốc.

Nếu một câu dịch nghe giống văn dịch Trung Quốc thì hãy đổi sang cách nói tự nhiên hơn của người Việt.

Ví dụ:

明白了 → hiểu rồi
告诉你 → nói cho bạn biết
发现 → phát hiện ra
立刻 → ngay
情况 → tình hình
事情 → chuyện
于是 → nên
因为 → vì
正在 → đang

QUAN TRỌNG:

Nếu subtitle gốc chỉ là cụm từ ngắn hoặc câu chưa hoàn chỉnh thì bản dịch cũng phải giữ nguyên mức độ ngắn gọn tương ứng.

Ví dụ:

Input:

1553
白天要处理工

1554
地的事情

Output đúng:

1553
Ban ngày phải xử lý công

1554
việc ở công trường

KHÔNG được dịch thành:

1553
Ban ngày phải xử lý việc ở công trường

FORMAT BẮT BUỘC:

[index]
[dịch đúng 1 dòng]

Không thêm giải thích.
Không thêm ghi chú.
Không thêm markdown.
Không thêm ký tự ngoài bản dịch.

Bây giờ hãy dịch:

${content}`;
}


// ============================================================
// MỞ CHATGPT VỚI PROMPT
// ============================================================

function openChatGPT(promptText) {

    try {

        // ----------------------------------------------------
        // Lưu lại cửa sổ/tab hiện tại
        // ----------------------------------------------------

        const currentWindow = window;

        // ----------------------------------------------------
        // Chuẩn hóa Unicode tiếng Việt
        // ----------------------------------------------------

        const normalizedPrompt =
            promptText.normalize("NFC");

        // ----------------------------------------------------
        // Mã hóa UTF-8 an toàn cho URL
        // ----------------------------------------------------

        const encodedPrompt =
            encodeURIComponent(normalizedPrompt);

        // ----------------------------------------------------
        // Tạo URL ChatGPT
        // ----------------------------------------------------

        const chatGPTUrl =
            `https://chatgpt.com/?prompt=${encodedPrompt}`;

        // ----------------------------------------------------
        // Mở tab ChatGPT mới
        // ----------------------------------------------------

        const newTab =
            window.open(
                chatGPTUrl,
                "_blank",
                "noopener,noreferrer"
            );

        // ----------------------------------------------------
        // Nếu trình duyệt chặn popup
        // ----------------------------------------------------

        if (!newTab) {
            throw new Error(
                "Popup bị trình duyệt chặn"
            );
        }

        // ----------------------------------------------------
        // Cố gắng giữ tab hiện tại
        // ----------------------------------------------------

        try {
            newTab.blur();
        } catch (e) {
            console.warn(
                "Không thể blur tab ChatGPT",
                e
            );
        }

        try {
            currentWindow.focus();
        } catch (e) {
            console.warn(
                "Không thể focus tab hiện tại",
                e
            );
        }

        // Thử thêm một lần sau khi tab mới được tạo
        setTimeout(() => {

            try {
                newTab.blur();
            } catch (e) {}

            try {
                currentWindow.focus();
            } catch (e) {}

        }, 100);

        return true;

    } catch (error) {

        console.error(
            "Lỗi mở ChatGPT:",
            error
        );

        return false;
    }
}


// ============================================================
// TẠO PROMPT
// ============================================================

function generate() {

    const input =
        document.getElementById("input").value;

    // --------------------------------------------------------
    // Kiểm tra input
    // --------------------------------------------------------

    if (!input.trim()) {

        document.getElementById("info").innerText =
            "⚠️ Chưa có SRT";

        document.getElementById("output").innerHTML =
            "";

        return;
    }


    // --------------------------------------------------------
    // Parse SRT
    // --------------------------------------------------------

    const data =
        parseSRT(input);


    // --------------------------------------------------------
    // Kiểm tra SRT
    // --------------------------------------------------------

    if (data.length === 0) {

        document.getElementById("info").innerText =
            "❌ Không đọc được SRT";

        return;
    }


    // --------------------------------------------------------
    // Chia thành từng chunk 100 subtitle
    // --------------------------------------------------------

    const chunks =
        chunk(data, 100);


    // --------------------------------------------------------
    // Container
    // --------------------------------------------------------

    const container =
        document.getElementById("output");

    container.innerHTML =
        "";


    // ========================================================
    // TẠO TỪNG PROMPT
    // ========================================================

    chunks.forEach((c, i) => {

        const start =
            c[0]?.index || "";

        const end =
            c[c.length - 1]?.index || "";


        // ----------------------------------------------------
        // Nội dung gửi AI
        // ----------------------------------------------------

        const content =
            c
                .map(item => {

                    return `${item.index}
${item.time}
${item.text}`;

                })
                .join("\n");


        // ----------------------------------------------------
        // Tạo prompt
        // ----------------------------------------------------

        const prompt =
            buildPrompt(content);


        // ----------------------------------------------------
        // Tạo box
        // ----------------------------------------------------

        const div =
            document.createElement("div");

        div.className =
            "prompt-box";


        // ====================================================
        // HTML
        // ====================================================

        div.innerHTML = `

            <div class="prompt-actions">

                <b>
                    PROMPT ${i + 1}
                    (${start} → ${end})
                </b>

                <div>

                    <!-- CHỈ COPY -->
                    <button class="copy-only-btn">
                        📋 Copy
                    </button>

                    <!-- COPY + CHATGPT -->
                    <button class="copy-btn">
                        🚀 ChatGPT
                    </button>

                    <!-- OK -->
                    <button class="ok-btn">
                        ✅ OK
                    </button>

                    <!-- LỖI -->
                    <button class="fail-btn">
                        ❌ Lỗi
                    </button>

                </div>

                <span class="status"></span>

            </div>

            <textarea readonly>${escapeHTML(prompt)}</textarea>

        `;


        // ====================================================
        // LẤY ELEMENT
        // ====================================================

        const btnCopyOnly =
            div.querySelector(".copy-only-btn");

        const btnCopy =
            div.querySelector(".copy-btn");

        const btnOK =
            div.querySelector(".ok-btn");

        const btnFail =
            div.querySelector(".fail-btn");

        const textarea =
            div.querySelector("textarea");

        const status =
            div.querySelector(".status");


        // ====================================================
        // COPY CHỈ COPY
        // ====================================================

        btnCopyOnly.onclick =
            async () => {

                try {

                    const promptText =
                        textarea.value;


                    // ----------------------------------------
                    // COPY
                    // ----------------------------------------

                    await navigator.clipboard.writeText(
                        promptText
                    );


                    // ----------------------------------------
                    // THÔNG BÁO
                    // ----------------------------------------

                    status.textContent =
                        "📋 Đã copy";

                    status.style.color =
                        "green";


                } catch (error) {

                    console.error(
                        "Copy lỗi:",
                        error
                    );

                    status.textContent =
                        "❌ Copy lỗi";

                    status.style.color =
                        "red";
                }
            };


        // ====================================================
        // COPY + CHATGPT
        // ====================================================

        btnCopy.onclick =
            async () => {

                try {

                    const promptText =
                        textarea.value;


                    // ----------------------------------------
                    // COPY
                    // ----------------------------------------

                    await navigator.clipboard.writeText(
                        promptText
                    );


                    // ----------------------------------------
                    // MỞ CHATGPT
                    // ----------------------------------------

                    const opened =
                        openChatGPT(promptText);


                    // ----------------------------------------
                    // THÔNG BÁO
                    // ----------------------------------------

                    if (opened) {

                        status.textContent =
                            "📋 Đã copy + 🚀 mở ChatGPT";

                        status.style.color =
                            "blue";

                    } else {

                        status.textContent =
                            "📋 Đã copy nhưng không mở được ChatGPT";

                        status.style.color =
                            "orange";
                    }


                } catch (error) {

                    console.error(
                        "Lỗi:",
                        error
                    );

                    status.textContent =
                        "❌ Copy lỗi";

                    status.style.color =
                        "red";
                }
            };


        // ====================================================
        // OK
        // ====================================================

        btnOK.onclick =
            () => {

                status.textContent =
                    "✅ Dịch OK";

                status.style.color =
                    "green";


                btnOK.classList.add(
                    "active"
                );

                btnFail.classList.remove(
                    "active"
                );
            };


        // ====================================================
        // FAIL
        // ====================================================

        btnFail.onclick =
            () => {

                status.textContent =
                    "❌ Dịch lỗi";

                status.style.color =
                    "red";


                btnFail.classList.add(
                    "active"
                );

                btnOK.classList.remove(
                    "active"
                );
            };


        // ====================================================
        // THÊM VÀO OUTPUT
        // ====================================================

        container.appendChild(div);

    });


    // ========================================================
    // CẬP NHẬT THÔNG TIN
    // ========================================================

    updateInfo(
        chunks.length
    );
}
