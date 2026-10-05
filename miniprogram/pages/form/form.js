// pages/index/index.js
Page({
  data: {
    date: "",
    region: [],
    regionCode: [],
    hello: "hi",
    count: 0,
    items: [
      {value:'USA',name:'美国'},
      {value:'CHN',name:'中国',checked:'true'},
      {value:'BRA',name:'巴西'},
      {value:'JPN',name:'日本'},
      {value:'ENG',name:'英国'},
      {value:'FRA',name:'法国'},
    ]
  },

  datachange: function (e) {
    console.log("出生年：", e.detail.value);
    this.setData({
      date: e.detail.value,
    });
  },

  regionchange: function (e) {
    console.log("地区：", e.detail.value);
    this.setData({
      region: e.detail.value,
      regionCode: e.detail.code,
    });
  },

  submit: function (e) {
    const form = e.detail.value;
    console.log("表单提交的数据：", form);

    // 本地校验（云函数里还会再校验一次）
    if (!form.nickname || !form.nickname.trim()) {
      wx.showToast({
        title: "请填写昵称",
        icon: "none",
      });
      return;
    }
    if (!form.gender) {
      wx.showToast({
        title: "请选择性别",
        icon: "none",
      });
      return;
    }

    wx.showLoading({
      title: "提交中...",
    });
    wx.cloud.callFunction({
      name: "quickstartFunctions",
      data: {
        type: "saveProfile",
        ...form,
        regionCode: this.data.regionCode,
      },
      success: (res) => {
        wx.hideLoading();
        console.log("云函数返回：", res.result);
        if (res.result && res.result.success) {
          wx.showToast({
            title: "提交成功",
          });
        } else {
          wx.showToast({
            title: (res.result && res.result.errMsg) || "提交失败",
            icon: "none",
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error("调用云函数失败：", err);
        wx.showToast({
          title: "网络异常，请重试",
          icon: "none",
        });
      },
    });
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

  checkboxchange: function (e) {
    console.log("checkbox-group change:", e.detail.value);
    wx.showToast({
      title: "选中 " + e.detail.value.length + " 项",
      icon: "none",
    });
  },

  onLoad() {},
});
