// pages/tip/form.js —— 其他小组（我还没加入的）
Page({
  data: {
    groups: [],
    loading: true,
  },

  onLoad() {
    this.loadGroups();
  },

  onShow() {
    if (!this.data.loading) this.loadGroups();
  },

  onPullDownRefresh() {
    this.loadGroups(() => wx.stopPullDownRefresh());
  },

  loadGroups(done) {
    wx.showLoading({ title: "加载中..." });
    wx.cloud.callFunction({
      name: "quickstartFunctions",
      data: { type: "listGroups" },
      success: (res) => {
        wx.hideLoading();
        const result = res.result || {};
        if (result.success) {
          const others = (result.data || []).filter((g) => !g.joined);
          this.setData({ groups: others, loading: false });
        } else {
          this.setData({ loading: false });
          wx.showToast({ title: result.errMsg || "加载失败", icon: "none" });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        this.setData({ loading: false });
        console.error("listGroups 调用失败：", err);
        wx.showToast({ title: "网络异常，请重试", icon: "none" });
      },
      complete: () => {
        if (typeof done === "function") done();
      },
    });
  },

  onJoin(e) {
    const index = e.currentTarget.dataset.index;
    const group = this.data.groups[index];
    if (!group) return;

    wx.showLoading({ title: "加入中..." });
    wx.cloud.callFunction({
      name: "quickstartFunctions",
      data: { type: "joinGroup", groupId: group._id },
      success: (res) => {
        wx.hideLoading();
        const result = res.result || {};
        if (result.success) {
          // 加入成功后从「其他小组」列表里移除
          const groups = this.data.groups.filter((g) => g._id !== group._id);
          this.setData({ groups });
          wx.showToast({
            title: result.already ? "你已经在这个小组里了" : "加入成功",
            icon: "none",
          });
        } else {
          wx.showToast({ title: result.errMsg || "加入失败", icon: "none" });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error("joinGroup 调用失败：", err);
        wx.showToast({ title: "网络异常，请重试", icon: "none" });
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
