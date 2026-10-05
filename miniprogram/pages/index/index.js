// pages/index/index.js
Page({
  data: {
    hello: "hi",
    count: 0,
  },

  change: function () {
    const count = this.data.count + 1;
    console.log("tap 触发了，第", count, "次");
    this.setData({
      hello: this.data.hello + "~~",
      count,
    });
    wx.showToast({
      title: "点击已触发 " + count,
      icon: "none",
    });
  },

  onLoad() {},
});
