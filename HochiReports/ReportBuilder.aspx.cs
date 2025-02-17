using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace HochiReports
{
    public partial class ReportBuilder : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            Master.FindControl("SidebarContent").Visible = true;
            string shareCode = Request.QueryString["share"];
            if (!string.IsNullOrEmpty(shareCode))
            {
                LoadSharedReport(shareCode);
            }
        }

        private void LoadSharedReport(string shareCode)
        {
            string apiUrl = $"http://internal.hochi.org.tw:8082/api/HochiReports/GetReportByShareCode?shareCode={shareCode}";

            using (var client = new WebClient())
            {
                client.Headers.Add("Content-Type", "application/json");
                string response = client.DownloadString(apiUrl);

                // 把資料回傳到前端 JavaScript
                ClientScript.RegisterStartupScript(this.GetType(), "LoadSharedReport", $"loadReportFromData({response});", true);
            }
        }


    }
}