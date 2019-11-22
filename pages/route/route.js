//route.js
const config = require("../../config")
const api = require("../../utils/requestapi")

//获取应用实例
const app = getApp()

Page({
  data: {
    isHome: false,
    tag: '002',

    loading: config.loading,
    color: config.color,
    background: config.background,
    show: config.show,
    animated: config.animated,
    back: config.back
  },
  onLoad: function () {
  },
  onShow: function () {
  },
  onPullDownRefresh() {
    wx.stopPullDownRefresh()
  },
  tapToBack(e) {
    wx.navigateBack({
      delta: 1
    })
  }
})
