<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="ReportBuilder.aspx.cs" Inherits="HochiReports.ReportBuilder" %>

<asp:Content ID="Content1" ContentPlaceHolderID="TitleContent" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="MainContent" runat="server">
    <h2>報表製作區</h2>
    <p>這是報表製作區的頁面，包含左側側邊欄。</p>
    <hr />
    <h5 class="mt-3">載入儲存的報表</h5>
    <select id="savedReportsSelect" class="form-control"></select>
    <button id="loadSavedReport" class="btn btn-secondary mt-3">載入報表</button>


    <script src="/Scripts/reportBuilder.js"></script>

</asp:Content>
