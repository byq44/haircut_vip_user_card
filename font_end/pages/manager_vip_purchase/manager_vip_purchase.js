
import { showToast, callCloudContainer } from '../../utils/utils'

Page({
  data: {
    purchaseOptions:'',
    phone:'',
    methodInfo:[],
    notes: '',
  },

  async onLoad(options) {
    var action = '建卡'
    if (options.phone) {
      action = '充值'
    }
    this.setData({
      phone: options.phone,
      notes: options.notes,
      purchaseOptions: action,
      methodInfo: await this.getCardMethod()
    })
  },

  onPhoneChange(e) {
      this.data.phone = e.detail.value
  }, 

  onNoteChange(e) {
      this.data.notes = e.detail.value
  },

  // 会员充值，无需判断号码是否存在
  vipPurchase(e) {
    const phone = this.data.phone
    const notes = this.data.notes
    if (phone) {
      if (/^\d{6,11}$/.test(phone)) {
        wx.showModal({
          title: '确认充值吗?',
          cancelText: '检查一下',
          success: (res_confirm_again) => {
            if (res_confirm_again.confirm) {
              this.vipPurchaseFun(phone, e.currentTarget.dataset.methodid, notes)
            }
          }
        })
      } else {
        showToast('号码格式不对')
      }
    } else {
      showToast('需先输入号码')
    }
  },

  async vipPurchaseFun(phoneIn, methodIdIn, notes) {
    var notesVal = ""
    if (notes){
      notesVal = notes
    }
    const res = await callCloudContainer({
      path: "/vip_user_card/api/vipPruchase",
      method: "POST",
      data: {
        methodId: methodIdIn,
        phone: phoneIn,
        notes: notesVal,
      }
    })

    if (res.result == 'failed') {
      showToast("程序错误")
    } else if (res.result == 'not_allowed_manager_phone') {
      showToast("此号码为管理员")
    } else {
      // 获取结果的notes，是为避免建卡时为已有用户输入了新备注，跳转消费时备注与数据库不一致
      wx.showModal({
        title: '提示',
        content: '充值成功',
        showCancel: false,
        success () {
          wx.redirectTo({
            url: '../manager_vip_expense/manager_vip_expense?phone=' + phoneIn + '&notes=' + res.notes,
          })
        }
      })
    }
  },

  async getCardMethod() {
    const res = await callCloudContainer({
      path: "/manager_card/api/getCardMethod",
      method: "GET"
    })
    if (res.result == 'failed') {
      showToast("程序错误")
    } else if (res.data.length != 0) {
      return res.data
    } else {
      showToast("没有添加卡类型")
    }
  },
  
})