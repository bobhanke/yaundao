// pages/create/form.js —— 创建小组
Page({
  data: {
    name: "",
    intro: "",
    limit: "",
    submitting: false,
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onIntroInput(e) {
    this.setData({ intro: e.detail.value });
  },

  onLimitInput(e) {
    this.setData({ limit: e.detail.value });
  },

  onSubmit() {
    const name = this.data.name.trim();
    if (!name) {
      wx.showToast({ title: "请填写小组名称", icon: "none" });
      return;
    }
    if (this.data.submitting) return;

    this.setData({ submitting: true });
    wx.cloud.callFunction({
      name: "quickstartFunctions",
      data: {
        type: "createGroup",
        name,
        intro: this.data.intro,
        limit: this.data.limit,
      },
      success: (res) => {
        const result = res.result || {};
        if (result.success) {
          this.setData({ submitting: false, name: "", intro: "", limit: "" });
          wx.showToast({ title: "创建成功" });
          setTimeout(() => {
            wx.navigateTo({ url: "/pages/group/form" });
          }, 800);
        } else {
          this.setData({ submitting: false });
          wx.showToast({
            title: result.errMsg || "创建失败",
            icon: "none",
          });
        }
      },
      fail: (err) => {
        this.setData({ submitting: false });
        console.error("createGroup 调用失败：", err);
        wx.showToast({ title: "网络异常，请重试", icon: "none" });
      },
    });
  },
});
