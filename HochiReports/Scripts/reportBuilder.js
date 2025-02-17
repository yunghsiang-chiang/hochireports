document.addEventListener("DOMContentLoaded", function () {
    loadSavedReports();

    document.getElementById("loadSavedReport")?.addEventListener("click", function () {
        loadSelectedReport();
    });

    const urlParams = new URLSearchParams(window.location.search);
    const shareCode = urlParams.get("share");
    if (shareCode) {
        loadSharedReport(shareCode);
    }
});

// 取得已儲存的報表
function loadSavedReports() {
    const userId = getCookie("person_id");

    fetch(`http://internal.hochi.org.tw:8082/api/HochiReports/GetSavedReports/${userId}`)
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById("savedReportsSelect");
            select.innerHTML = "";
            if (data.$values) {
                data.$values.forEach(report => {
                    let option = document.createElement("option");
                    option.value = report.share_code;
                    option.textContent = report.report_name;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => console.error("載入儲存報表錯誤:", error));
}

// 載入選定的報表
function loadSelectedReport() {
    const shareCode = document.getElementById("savedReportsSelect")?.value;
    if (!shareCode) {
        alert("請選擇一個報表");
        return;
    }
    window.location.href = `FormalReport.aspx?share=${shareCode}`;
}

// 透過 API 載入共享報表
function loadSharedReport(shareCode) {
    fetch(`http://internal.hochi.org.tw:8082/api/HochiReports/GetReportByShareCode?shareCode=${shareCode}`)
        .then(response => response.json())
        .then(data => {
            loadReportFromData(data);
        })
        .catch(error => console.error("載入共享報表錯誤:", error));
}

// 將 API 取得的報表套用到畫面
function loadReportFromData(report) {
    document.getElementById("tableSelect").value = report.table_name;
    document.getElementById("chartTypeSelect").value = report.chart_type;
    document.getElementById("columnSelect").value = report.x_axis;

    const yAxes = JSON.parse(report.y_axes);
    console.log("載入的 Y 軸:", yAxes);

    generateChart();
}
