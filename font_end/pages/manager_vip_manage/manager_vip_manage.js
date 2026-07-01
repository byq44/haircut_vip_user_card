import { getVipUserCardInfo, showToast, callCloudContainer } from '../../utils/utils'
Page({

  data: {
    phone: '',
    notes: '',
    vipCardInfo:[],
  },

  onLoad: async function(options) {
    if (options.phone != undefined) {
      this.setData({
        phone: options.phone,
        notes: options.notes,
        vipCardInfo: await getVipUserCardInfo(options.phone),
      })
    }
  },

  // 消费记录按钮
  expenseRecord(event) {
    if (typeof(this.data.phone) != 'undefined' && this.data.phone != '' && typeof(this.data.vipCardInfo) != 'undefined' && this.data.vipCardInfo.length > 0) {
      wx.navigateTo({
        url: '../vip_user_expense_record/vip_user_expense_record?cardid=' + event.currentTarget.dataset.cardid + '&phone=' + this.data.phone,
      })
    }
  },

})