const app = getApp()
Page({

  data: {
    helloUser: app.globalData.userInfo.hello
  },

  userData: {
    helloUser: ''
  },

  onLoad() {
    wx.hideHomeButton();
  },

  // 会员充值
  vipPurchase() {
    wx.navigateTo({
      url: '../manager_vip_purchase/manager_vip_purchase',
    })
  },

  // 会员查询及功能页面
  vipSearchFun() {
    wx.navigateTo({
      url: '../manager_vip_search_fun/manager_vip_search_fun',
    })
  },

  // 卡类型管理
  cardMethodManage() {
    wx.navigateTo({
      url: '../manager_card_method_manage/manager_card_method_manage',
    })
  },

  // 消费项目管理
  expenseProjectManage() {
    wx.navigateTo({
      url: '../manager_expense_project_manage/manager_expense_project_manage',
    })
  }

})