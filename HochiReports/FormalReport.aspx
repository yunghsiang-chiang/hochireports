<%@ Page Title="正式報表" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="FormalReport.aspx.cs" Inherits="HochiReports.FormalReport" Async="true" %>

<asp:Content ID="Content1" ContentPlaceHolderID="MainContent" runat="server">
    <div class="container">
        <div class="row">
            <!-- 左側選單 -->
            <div class="col-md-3">
                <h5>選擇資料表</h5>
                <select id="tableSelect" class="form-control"></select>

                <h5 class="mt-3">選擇欄位</h5>
                <select id="columnSelect" class="form-control"></select>

                <h5 class="mt-3">選擇統計函數</h5>
                <select id="functionSelect" class="form-control">
                    <option value="COUNT">計數 (COUNT)</option>
                    <option value="SUM">總和 (SUM)</option>
                    <option value="AVG">平均 (AVG)</option>
                    <option value="MAX">最大值 (MAX)</option>
                    <option value="MIN">最小值 (MIN)</option>
                </select>

                <h5 class="mt-3">選擇圖表類型</h5>
                <select id="chartTypeSelect" class="form-control">
                    <option value="bar">柱狀圖</option>
                    <option value="line">折線圖</option>
                    <option value="pie">圓餅圖</option>
                </select>

                <div id="keywordDiv" style="display: none;">
                    <label for="keywordInput">請輸入關鍵字</label>
                    <input type="text" id="keywordInput" class="form-control">
                </div>


                <button type="button" id="generateReport" class="btn btn-primary mt-3">產生報表</button>
                <hr />
                <button type="button" id="saveReport" class="btn btn-success mt-3">儲存報表</button>
                <div id="shareLink"></div>

            </div>

            <!-- 右側圖表 -->
            <div class="col-md-9">
                <h1 id="reportTitle">報表標題</h1>

                <h3 class="text-center">報表結果</h3>
                <div id="chartContainer">
                    <svg width="800" height="500"></svg>
                </div>
            </div>
        </div>
    </div>

    <script src="https://d3js.org/d3.v6.min.js"></script>
    <script src="/Scripts/formalReport.js"></script>
</asp:Content>
