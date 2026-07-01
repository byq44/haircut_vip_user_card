App({
  async onLaunch() {
    wx.cloud.init({
      env: "prod-2growfy37e8b5b3f"
    })
  },

  globalData: {
    userInfo: {
      hello: '',
    }
  }
})
