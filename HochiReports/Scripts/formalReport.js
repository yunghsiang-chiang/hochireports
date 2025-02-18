document.addEventListener("DOMContentLoaded", function () {
    loadTables();

    document.getElementById("tableSelect").addEventListener("change", function () {
        loadColumns(this.value);
    });

    document.getElementById("generateReport").addEventListener("click", function () {
        generateChart();
    });
});

// 取得所有資料表
function loadTables() {
    fetch("http://internal.hochi.org.tw:8082/api/HochiReports/GetTableSchema")
        .then(response => response.json())
        .then(data => {
            if (!data.$values) {
                console.error("API 回應格式錯誤:", data);
                return;
            }

            const tableSelect = document.getElementById("tableSelect");
            tableSelect.innerHTML = "";

            data.$values.forEach(item => {
                if (!tableSelect.querySelector(`option[value="${item.table_name}"]`)) {
                    let option = document.createElement("option");
                    option.value = item.table_name;
                    option.textContent = item.table_name;
                    tableSelect.appendChild(option);
                }
            });

            if (data.$values.length > 0) {
                loadColumns(data.$values[0].table_name);
            }
        })
        .catch(error => console.error("載入資料表錯誤:", error));
}

// 取得選定資料表的所有欄位
function loadColumns(tableName) {
    fetch("http://internal.hochi.org.tw:8082/api/HochiReports/GetTableSchema")
        .then(response => response.json())
        .then(data => {
            if (!data.$values) {
                console.error("API 回應格式錯誤:", data);
                return;
            }

            const columnSelect = document.getElementById("columnSelect");
            columnSelect.innerHTML = "";

            data.$values.filter(item => item.table_name === tableName).forEach(item => {
                let option = document.createElement("option");
                option.value = item.column_name;
                option.textContent = `${item.column_name} (${item.column_type})`;
                columnSelect.appendChild(option);
            });
        })
        .catch(error => console.error("載入欄位錯誤:", error));
}

// 產生圖表
function generateChart() {
    const table = document.getElementById("tableSelect").value;
    const column = document.getElementById("columnSelect").value;
    const func = document.getElementById("functionSelect").value;
    const chartType = document.getElementById("chartTypeSelect").value; // 讀取圖表類型

    fetch(`http://internal.hochi.org.tw:8082/api/HochiReports/GetReportData?table=${table}&column=${column}&function=${func}`)
        .then(response => response.json())
        .then(data => {
            if (data.$values) {
                console.log(data.$values);
                console.log(chartType);
                drawChart(data.$values, chartType); // ✅ 傳遞圖表類型
            } else {
                console.error("API 回應格式錯誤:", data);
            }
        })
        .catch(error => console.error("載入報表資料錯誤:", error));
}


// 使用 D3.js 繪製長條圖
function drawChart(data, chartType) {
    const svg = d3.select("#chartContainer svg");
    svg.selectAll("*").remove(); // 清空舊圖表

    const margin = { top: 20, right: 30, bottom: 70, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    if (chartType === "bar") {
        drawBarChart(data, svg, margin, width, height);
    } else if (chartType === "line") {
        drawLineChart(data, svg, margin, width, height);
    } else if (chartType === "pie") {
        drawPieChart(data, svg, width, height);
    }
}

// 繪製柱狀圖
function drawBarChart(data, svg, margin, width, height) {
    const x = d3.scaleBand()
        .domain(data.map(d => d.label))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)])
        .nice()
        .range([height, 0]);

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    chart.append("g").call(d3.axisLeft(y));
    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    chart.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.label))
        .attr("y", d => y(d.value))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.value))
        .attr("fill", "steelblue");
}

// 繪製折線圖
function drawLineChart(data, svg, margin, width, height) {
    const x = d3.scalePoint()
        .domain(data.map(d => d.label))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)])
        .nice()
        .range([height, 0]);

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    chart.append("g").call(d3.axisLeft(y));
    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    const line = d3.line()
        .x(d => x(d.label))
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX);

    chart.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);

    chart.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.label))
        .attr("cy", d => y(d.value))
        .attr("r", 4)
        .attr("fill", "red");
}

// 繪製圓餅圖
function drawPieChart(data, svg, width, height) {
    const radius = Math.min(width, height) / 2;
    const pie = d3.pie().value(d => d.value);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const chart = svg.append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    const pieData = pie(data);

    chart.selectAll("path")
        .data(pieData)
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", (d, i) => color(i))
        .attr("stroke", "#fff")
        .style("stroke-width", "2px");

    chart.selectAll("text")
        .data(pieData)
        .enter()
        .append("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "white")
        .text(d => d.data.label);
}


document.addEventListener("DOMContentLoaded", function () {
    const saveReportBtn = document.getElementById("saveReport");
    if (saveReportBtn) {
        saveReportBtn.addEventListener("click", function () {
            saveReport();
        });
    }
});


function saveReport() {
    /*const userId = getCookie("person_id"); // 取得 user_id*/
    const userId = "14081";
    const reportName = prompt("請輸入報表名稱");

    if (!reportName) {
        alert("報表名稱不可空白");
        return;
    }

    const reportData = {
        user_id: userId.toString(),  // ✅ 確保 user_id 是字串
        report_name: reportName,
        table_name: document.getElementById("tableSelect")?.value || "",
        chart_type: document.getElementById("chartTypeSelect")?.value || "",
        x_axis: document.getElementById("columnSelect")?.value || "",
        y_axes: JSON.stringify(["COUNT(HID)"]),  // ✅ 確保 y_axes 是字串
        category_field: null,
        stack_field: null,
        filters: JSON.stringify({})  // ✅ 確保 filters 是字串
    };

    console.log("送出 JSON:", reportData);
    fetch("http://internal.hochi.org.tw:8082/api/HochiReports/SaveReport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData)
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(JSON.stringify(err)); });
            }
            return response.json();
        })
        .then(data => {
            console.log("API 回應:", data);
            if (data.share_code) {
                const shareUrl = `http://internal.hochi.org.tw:8085/FormalReport.aspx?share=${data.share_code}`;
                document.getElementById("shareLink").innerHTML = `<p>報表已儲存！分享連結：</p> <a href="${shareUrl}" target="_blank">${shareUrl}</a>`;
            } else {
                alert("報表儲存失敗");
            }
        })
        .catch(error => console.error("儲存報表錯誤:", error));
}

document.addEventListener("DOMContentLoaded", function () {
    const reportTitle = document.getElementById("reportTitle");
    if (!reportTitle) {
        console.error("❌ 錯誤: 無法找到 #reportTitle，請檢查 HTML");
    }
});


function loadReportFromShare(reportData) {
    console.log("載入分享報表: ", reportData);

    // 檢查報表數據是否有效
    if (!reportData || !reportData.table_name || !reportData.chart_type || !reportData.x_axis || !reportData.y_axes) {
        alert("報表數據無效，無法載入");
        return;
    }

    // 取得報表參數
    const chartType = reportData.chart_type;
    const xAxis = reportData.x_axis;
    const yAxes = typeof reportData.y_axes === "string" ? JSON.parse(reportData.y_axes) : reportData.y_axes;
    if (!Array.isArray(yAxes) || yAxes.length === 0) {
        alert("y_axes 格式錯誤，無法載入報表");
        return;
    }

    const tableName = reportData.table_name;

    // 更新頁面標題
    document.getElementById("reportTitle").innerText = reportData.report_name;
    console.log("取得報表數據 API:", `http://internal.hochi.org.tw:8082/api/HochiReports/GetReportData?table=${tableName}&column=${xAxis}&function=${yAxes[0]}`);


    // 發送 API 取得數據
    fetch(`http://internal.hochi.org.tw:8082/api/HochiReports/GetReportData?table=${tableName}&column=${xAxis}&function=${yAxes[0]}`)
        .then(response => response.json()) // **確保這裡成功解析 JSON**
        .then(data => {
            console.log("📊 取得的報表數據:", data);

            if (!data || !data.$values || data.$values.length === 0) {
                alert("沒有找到對應的數據");
                return;
            }

            // 🛠 修正: 確保 $values 被正確傳遞
            // 清除舊圖表
            document.getElementById("chartContainer").innerHTML = '<svg width="800" height="500"></svg>';
            console.log(data.$values);
            console.log(chartType);
            // 繪製圖表
            drawChart(data.$values, chartType);
        })
        .catch(error => {
            console.error("載入報表數據錯誤: ", error);
            alert("載入報表數據失敗");
        });

    // 確保 reportTitle 存在
    const reportTitle = document.getElementById("reportTitle");
    if (!reportTitle) {
        console.error("❌ 錯誤: 找不到 #reportTitle，無法設定報表名稱");
        return;
    }

    reportTitle.innerText = reportData.report_name || "未命名報表";
}

