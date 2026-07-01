import { getVipUserCardInfo, showToast, callCloudContainer, getHelloUser } from '../../utils/utils'
const app = getApp()
Page({
  data: {
    helloUser: '',
    userPhone: '',
    vipCardInfo:[],
  },

  userData: {
    getRecordTime: 0,
    timerFlag: 0,
    timer: ''
  },

   onLoad: async function(options) {
    // 页面创建时执行
    wx.hideHomeButton();
    if (options.phone != undefined) {
      this.setData({
        helloUser: options.helloUser,
        userPhone: options.phone,
        vipCardInfo: await getVipUserCardInfo(options.phone)
      })
    } else if (options.phone == undefined) {
      this.setData({
        helloUser: options.helloUser,
      })
    }
  },

  onUnload: function() {
    clearTimeout(this.userData.timer)
  },

  bindUser() {
    var that = this
    wx.showModal({
      title: '提示',
      content: '只限有往来的用户绑定，每个号码只限一个用户',
      success (e) {
        if (e.confirm) {

        wx.showModal({
          title: "注意：号码为6-11位数字。若有需要请联系店主修改",
          editable: true,
          placeholderText: '请输入号码',
          success (res) {
            if (res.confirm) {
              if (/^\d{6,11}$/.test(res.content)) {
                wx.showModal({
                  title: '确认是该号吗?',
                  content: res.content,
                  editable: true,
                  cancelText: '再想想看',
                  success: (res_confirm_again) => {
                    if (res_confirm_again.confirm) {
                      if (/^\d{6,11}$/.test(res_confirm_again.content)) {
                        that.bindUserFunc(res_confirm_again.content)
                      }else {
                        showToast('格式不正确')
                      }
                    }
                  }
                })
              }else {
                showToast('格式不正确')
              }
            }
          }
        })

        }
      }
    })
  },

  async bindUserFunc(phoneIn) {
    const res = await callCloudContainer({
      path: "/user/api/bind_user",
      method: "POST",
      data: {
        phone: phoneIn,
      }
    })
    
    if (res.result == 'bound' || res.result == 'not_allowed_manager_phone') {
      // 号码已被绑定时
      showToast("该号码有人用了")
    } else if (res.result == 'failed') {
      showToast("程序错误")
    } else if (res.result == 'empty') {
      showToast("号码还未被添加")
    } else if (res.result == 'manager_login') {
      app.globalData.userInfo.hello = getHelloUser('，店长')
        wx.redirectTo({
          url: '../manager_index/manager_index'
        })
    } else {
      // 刷新页面号码显示 刷新会员卡及充值信息
      this.setData({
        userPhone: phoneIn,
        vipCardInfo: await getVipUserCardInfo(phoneIn)
      })

    }
  },

  // 消费记录按钮
  expenseRecord(event) {
    if (typeof(this.data.userPhone) != 'undefined' && this.data.userPhone != '' && typeof(this.data.vipCardInfo) != 'undefined' && this.data.vipCardInfo.length > 0) {
      // 限制查询次数
      if (this.userData.getRecordTime < 10) {
        if (this.userData.timerFlag == 1) {
          clearTimeout(this.userData.timer)
          this.userData.timerFlag = 0
        }
        this.userData.getRecordTime++
        wx.navigateTo({
          url: '../vip_user_expense_record/vip_user_expense_record?cardid=' + event.currentTarget.dataset.cardid + '&phone=' + this.data.userPhone,
        })
      } else {
        if (this.userData.timerFlag == 0) {
          this.startTimer()
        }
        showToast("繁忙：稍后再试")
      }
    }
  },

  startTimer : function(){
    var that = this;
    this.userData.timerFlag = 1
    this.userData.timer = setTimeout(
        function () {
            // 45秒等待
            that.userData.getRecordTime = 0
        }, 45000);
  },
  
})