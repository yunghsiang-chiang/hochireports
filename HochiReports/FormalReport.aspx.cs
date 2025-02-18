using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Net.Http;

namespace HochiReports
{
    public partial class FormalReport : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            Master.FindControl("SidebarContent").Visible = false;

            string shareCode = Request.QueryString["share"];
            
            if (!string.IsNullOrEmpty(shareCode))
            {
                LoadSharedReport(shareCode);
            }
        }

        // 讀取分享報表
        private async void LoadSharedReport(string shareCode)
        {
            string apiUrl = $"http://internal.hochi.org.tw:8082/api/HochiReports/GetReportByShareCode/{shareCode}";

            using (HttpClient client = new HttpClient())
            {
                try
                {
                    HttpResponseMessage response = await client.GetAsync(apiUrl);
                    if (response.IsSuccessStatusCode)
                    {
                        string jsonResponse = await response.Content.ReadAsStringAsync();

                        // 將 API 回應的 JSON 轉換成 JavaScript 格式，讓前端的 JS 處理
                        string script = $"loadReportFromShare({jsonResponse});";
                        ClientScript.RegisterStartupScript(this.GetType(), "LoadSharedReport", script, true);
                    }
                    else
                    {
                        ClientScript.RegisterStartupScript(this.GetType(), "LoadError", "alert('找不到對應的分享報表');", true);
                    }
                }
                catch (Exception ex)
                {
                    ClientScript.RegisterStartupScript(this.GetType(), "LoadError", $"alert('讀取分享報表時發生錯誤: {ex.Message}');", true);
                }
            }
        }
    }
}