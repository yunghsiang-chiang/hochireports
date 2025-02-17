using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace HochiReports
{
    public partial class Site : System.Web.UI.MasterPage
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            // 根據需求隱藏或顯示側邊欄
            if (Request.Path.Contains("FormalReport"))
            {
                SidebarContent.Visible = false;
            }
            else
            {
                SidebarContent.Visible = true;
            }
        }
    }
}