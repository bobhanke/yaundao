// pages/group/form.js —— 我的小组
Page({
  data: {
    groups: [],
    loading: true,
  },

  onLoad() {
    this.loadGroups();
  },

  onShow() {
    // 从别的页面返回时刷新一次
    if (!this.data.loading) this.loadGroups();
  },

  onPullDownRefresh() {
    this.loadGroups(() => wx.stopPullDownRefresh());
  },

  loadGroups(done) {
    wx.showLoading({ title: "加载中..." });
    wx.cloud.callFunction({
      name: "quickstartFunctions",
      data: { type: "myGroups" },
      success: (res) => {
        wx.hideLoading();
        const result = res.result || {};
        if (result.success) {
          this.setData({ groups: result.data || [], loading: false });
        } else {
          this.setData({ loading: false });
          wx.showToast({ title: result.errMsg || "加载失败", icon: "none" });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        this.setData({ loading: false });
        console.error("myGroups 调用失败：", err);
        wx.showToast({ title: "网络异常，请重试", icon: "none" });
      },
      complete: () => {
        if (typeof done === "function") done();
      },
    });
  },

  // 打开小组详情
  onDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: "/pages/detail/form?id=" + id });
  },
});
