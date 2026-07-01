import { getVipUserCardInfo } from '../../utils/utils'
Page({
  data: {
    phone:'',
    notes:'',
    vipCardInfo:[],
  },

  onLoad: async function(options) {
    if (options.phone != undefined) {
      this.setData({
        phone: options.phone,
        notes: options.notes,
        vipCardInfo: await getVipUserCardInfo(options.phone)
      })
    }
  },

  vipExpense(e) {
    wx.navigateTo({
      url: '../manager_vip_expense_detail/manager_vip_expense_detail?cardid=' + e.currentTarget.dataset.cardid +'&name=' + e.currentTarget.dataset.name + '&type=' + e.currentTarget.dataset.type + '&totalamount=' + e.currentTarget.dataset.totalamount + '&remainderamount=' + e.currentTarget.dataset.remainderamount + '&discount=' + e.currentTarget.dataset.discount,
    })
  },

})