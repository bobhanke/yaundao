// pages/list/form.js —— 加入小组
Page({
  data: {
    groups: [],
    loading: true,
  },

  onLoad() {
    this.loadGroups();
  },

  onPullDownRefresh() {
    this.loadGroups(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 拉取小组列表
  loadGroups(done) {
    wx.showLoading({ title: "加载中..." });
    wx.cloud.callFunction({
      name: "quickstartFunctions",
      data: { type: "listGroups" },
      success: (res) => {
        wx.hideLoading();
        const result = res.result || {};
        if (result.success) {
          this.setData({
            groups: result.data || [],
            loading: false,
          });
        } else {
          this.setData({ loading: false });
          wx.showToast({
            title: result.errMsg || "加载失败",
            icon: "none",
          });
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

  // 加入小组
  onJoin(e) {
    const index = e.currentTarget.dataset.index;
    const group = this.data.groups[index];
    if (!group || group.joined) return;

    wx.showLoading({ title: "加入中..." });
    wx.cloud.callFunction({
      name: "quickstartFunctions",
      data: {
        type: "joinGroup",
        groupId: group._id,
      },
      success: (res) => {
        wx.hideLoading();
        const result = res.result || {};
        if (result.success) {
          const groups = this.data.groups.slice();
          groups[index] = Object.assign({}, group, {
            joined: true,
            memberCount:
              typeof result.memberCount === "number"
                ? result.memberCount
                : group.memberCount + 1,
          });
          this.setData({ groups });
          wx.showToast({
            title: result.already ? "你已经在这个小组里了" : "加入成功",
            icon: "none",
          });
        } else {
          wx.showToast({
            title: result.errMsg || "加入失败",
            icon: "none",
          });
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
