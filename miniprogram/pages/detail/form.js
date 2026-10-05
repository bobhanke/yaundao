// pages/detail/form.js —— 小组详情（含成员列表、加入/退出）
Page({
  data: {
    groupId: "",
    group: null,
  },

  onLoad(options) {
    this.setData({ groupId: options.id || "" });
    this.loadDetail();
  },

  onShow() {
    if (this.data.group) this.loadDetail();
  },

  loadDetail() {
    const groupId = this.data.groupId;
    if (!groupId) {
      wx.showToast({ title: "缺少小组 ID", icon: "none" });
      return;
    }

    wx.showLoading({ title: "加载中..." });
    wx.cloud.callFunction({
      name: "quickstartFunctions",
      data: { type: "groupDetail", groupId },
      success: (res) => {
        wx.hideLoading();
        const result = res.result || {};
        if (result.success) {
          this.setData({ group: result.data });
          wx.setNavigationBarTitle({ title: result.data.name || "小组详情" });
        } else {
          wx.showToast({ title: result.errMsg || "加载失败", icon: "none" });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error("groupDetail 调用失败：", err);
        wx.showToast({ title: "网络异常，请重试", icon: "none" });
      },
    });
  },

  // 加入
  onJoin() {
    const groupId = this.data.groupId;
    wx.showLoading({ title: "加入中..." });
    wx.cloud.callFunction({
      name: "quickstartFunctions",
      data: { type: "joinGroup", groupId },
      success: (res) => {
        wx.hideLoading();
        const result = res.result || {};
        if (result.success) {
          wx.showToast({ title: "加入成功" });
          this.loadDetail();
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

  // 退出（先确认）
  onLeave() {
    wx.showModal({
      title: "退出小组",
      content: "确定要退出这个小组吗？",
      success: (modalRes) => {
        if (!modalRes.confirm) return;
        const groupId = this.data.groupId;
        wx.showLoading({ title: "处理中..." });
        wx.cloud.callFunction({
          name: "quickstartFunctions",
          data: { type: "leaveGroup", groupId },
          success: (res) => {
            wx.hideLoading();
            const result = res.result || {};
            if (result.success) {
              wx.showToast({ title: "已退出" });
              this.loadDetail();
            } else {
              wx.showToast({ title: result.errMsg || "退出失败", icon: "none" });
            }
          },
          fail: (err) => {
            wx.hideLoading();
            console.error("leaveGroup 调用失败：", err);
            wx.showToast({ title: "网络异常，请重试", icon: "none" });
          },
        });
      },
    });
  },
});
