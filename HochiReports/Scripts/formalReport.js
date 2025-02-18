let tableSchema = {}; // 🔥 確保 schemaData 全域可用

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
            console.log("📊 TableSchema:", data);

            if (!data || !data.$values) {
                console.error("❌ 無法載入 TableSchema");
                return;
            }

            tableSchema = data; // 🔥 儲存全域變數，確保 `loadColumns` 取得正確 `schemaData`

            const tableSelect = document.getElementById("tableSelect");
            tableSelect.innerHTML = ""; // 清空

            const tables = [...new Set(data.$values.map(item => item.table_name))];
            tables.forEach(table => {
                const option = document.createElement("option");
                option.value = table;
                option.innerText = table;
                tableSelect.appendChild(option);
            });

            // 自動載入第一個資料表
            if (tables.length > 0) {
                tableSelect.value = tables[0];
                loadColumns(tables[0], tableSchema);
            }

            // 監聽變更事件
            tableSelect.addEventListener("change", () => {
                console.log("📌 選擇的資料表:", tableSelect.value);
                loadColumns(tableSelect.value, tableSchema);
            });
        })
        .catch(error => console.error("載入資料表錯誤:", error));
}

// 取得選定資料表的所有欄位
function loadColumns(tableName, schemaData) {
    if (!schemaData || !schemaData.$values) {
        console.error("❌ 錯誤: schemaData 沒有 $values，請檢查 API 回應", schemaData);
        return;
    }

    console.log("📊 嘗試載入欄位:", tableName, schemaData);

    const columnSelect = document.getElementById("columnSelect");
    columnSelect.innerHTML = ""; // 清空選項

    // 🔥 確保 `tableName` 是合法的
    if (!tableName) {
        console.warn("⚠️ 選擇的 tableName 為空，請檢查表單");
        return;
    }

    // 🔍 檢查該 `tableName` 是否有欄位
    const columns = schemaData.$values.filter(item => item.table_name === tableName);

    if (columns.length === 0) {
        console.warn(`⚠️ 找不到 ${tableName} 的欄位，請確認 API 回應`);
        return;
    }

    // 加入預設選項
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.innerText = "請選擇欄位";
    columnSelect.appendChild(defaultOption);

    // 插入 API 返回的所有欄位
    columns.forEach(column => {
        const option = document.createElement("option");
        option.value = column.column_name;
        option.innerText = column.column_name;
        columnSelect.appendChild(option);
    });

    console.log("✅ 成功載入欄位:", columns.map(c => c.column_name));

    // 監聽變更事件
    columnSelect.addEventListener("change", () => {
        loadFunctions(tableName, columnSelect.value, schemaData);
    });

    // 預設選擇第一個欄位
    if (columns.length > 0) {
        columnSelect.value = columns[0].column_name;
        loadFunctions(tableName, columnSelect.value, schemaData);
    }
}





function loadFunctions(tableName, columnName, schemaData) {
    console.log(`🔍 嘗試載入函數: ${tableName}.${columnName}`);

    const functionSelect = document.getElementById("functionSelect");
    functionSelect.innerHTML = ""; // 清空選項

    const column = schemaData.$values.find(item => item.table_name === tableName && item.column_name === columnName);

    if (!column) {
        console.warn(`⚠️ 找不到欄位 ${columnName}，請檢查 TableSchema`, schemaData);
        return;
    }

    if (!column.allowed_functions || !column.allowed_functions.$values) {
        console.warn(`⚠️ 欄位 ${columnName} 沒有允許的函數`, column);
        return;
    }

    try {
        const functions = column.allowed_functions.$values;
        if (!Array.isArray(functions) || functions.length === 0) {
            console.warn(`⚠️ 統計函數清單為空: ${columnName}`);
            return;
        }

        functions.forEach(func => {
            const option = document.createElement("option");
            option.value = func;
            option.innerText = func;
            functionSelect.appendChild(option);
        });

        console.log(`✅ 成功載入 ${columnName} 的函數:`, functions);
    } catch (error) {
        console.error("❌ 解析 allowed_functions 失敗", error);
    }
}



// 產生圖表
function generateChart() {
    const table = document.getElementById("tableSelect").value;
    const column = document.getElementById("columnSelect").value;
    let func = document.getElementById("functionSelect").value;

    if (func.includes("(") && func.includes(")")) {
        // 允許函數內部帶有欄位名稱，例如 "COUNT(HID)"
        func = encodeURIComponent(func);
    } else {
        func = encodeURIComponent(func);
    }

    let apiUrl = `http://internal.hochi.org.tw:8082/api/HochiReports/GetReportData?table=${table}&column=${column}&function=${func}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.$values) {
                console.log("API 回應資料:", data);
                drawChart(data.$values, document.getElementById("chartTypeSelect").value);
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

document.getElementById("functionSelect").addEventListener("change", function () {
    if (this.value === "FILTER BY KEYWORD") {
        document.getElementById("keywordDiv").style.display = "block";
    } else {
        document.getElementById("keywordDiv").style.display = "none";
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

    // 獲取選擇的 function 值
    const selectedFunction = document.getElementById("functionSelect")?.value || "";

    // 根據 functionSelect 動態設定 y_axes
    let y_axes_value;
    if (selectedFunction.includes("(") && selectedFunction.includes(")")) {
        // 例如 COUNT(HID)
        y_axes_value = [selectedFunction];
    } else if (selectedFunction === "GROUP BY") {
        // GROUP BY 不需要 COUNT(HID)，而是用 COUNT(*)
        y_axes_value = ["COUNT(*)"];
    } else {
        // 其他情況，例如 COUNT、SUM、AVG 這類函數
        y_axes_value = [selectedFunction];
    }

    const reportData = {
        user_id: userId.toString(),  // ✅ 確保 user_id 是字串
        report_name: reportName,
        table_name: document.getElementById("tableSelect")?.value || "",
        chart_type: document.getElementById("chartTypeSelect")?.value || "",
        x_axis: document.getElementById("columnSelect")?.value || "",
        y_axes: JSON.stringify(y_axes_value),  // ✅ y_axes 正確儲存
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

