import { showToast, callCloudContainer } from '../../utils/utils'

Page({
  data: {
    vipInfo: [],
  },

  userData: {
    phone: '',
    note: '',
  },

  async onLoad() {
    await this.searchVipInfo()
  },

  onPhoneChange(e) {
    this.userData.phone = e.detail.value
  },
  onNoteChange(e) {
    this.userData.note = e.detail.value
  },

  // 单个会员操作菜单
  vipInfoAction(e) {
    var that = this
    wx.showActionSheet({
      itemList: ['充值', '消费', '消费记录', '更改号码', '更改备注'],
      success (res) {
        const phone = e.currentTarget.dataset.userphone
        const notes = e.currentTarget.dataset.usernotes
        if (res.tapIndex == 0) {
          // 充值
          wx.navigateTo({
            url: '../manager_vip_purchase/manager_vip_purchase?phone=' + phone + '&notes=' + notes,
          })
        } else if (res.tapIndex == 1) {
          // 消费
          wx.navigateTo({
            url: '../manager_vip_expense/manager_vip_expense?phone=' + phone + '&notes=' + notes,
          })
        } else if (res.tapIndex == 2) {
          // 消费记录
          wx.navigateTo({
            url: '../manager_vip_manage/manager_vip_manage?phone=' + phone + '&notes=' + notes,
          })
        } else if (res.tapIndex == 3) {
          // 更改号码
          that.changePhone(phone)
        } else {
          // 更改备注
          that.alterNotes(phone, notes)
        }
      }
    })
  },

  // 更改号码
  changePhone(phone) {
    var that = this
    if (phone != undefined && phone != '') {
      wx.showModal({
        title: "注意：号码支持6-11位数字，一号一用户。当前号码：" + phone,
        editable: true,
        placeholderText: '请输入新号码',
        success (res) {
          if (res.confirm) {
            if (/^\d{6,11}$/.test(res.content)) {
              wx.showModal({
                title: '确认将' + phone + '改为以下号码吗?',
                content: res.content,
                editable: true,
                cancelText: '再想想看',
                success: (res_confirm_again) => {
                  if (res_confirm_again.confirm) {
                    if (/^\d{6,11}$/.test(res_confirm_again.content)) {
                      that.changePhoneCallFun(res_confirm_again.content, phone)
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
  },

  async changePhoneCallFun(newphoneIn, oldphoneIn) {
    var res = await callCloudContainer({
      path: "/user/api/vip_change",
      method: "POST",
      data: {
        newphone: newphoneIn,
        oldphone: oldphoneIn
      }
    })
    if (res.result == 'bound') {
      showToast("新号码有人用了")
    }  else if (res.result == 'not_allowed_manager_phone') {
      showToast("此号码为管理员")
    } else if (res.result == 'failed') {
      showToast("程序错误")
    } else {
      showToast("更改成功")
      this.setData({
        vipInfo: await this.searchVipInfo()
      })
    }
  },

  // 更改备注
  alterNotes(phone,oldNotes) {
    var that = this
    wx.showModal({
      title: phone + '号码备注',
      editable: true,
      content: oldNotes,
      placeholderText: '请输入备注',
      success (res) {
        if (res.confirm == true) {
          if (res.content) {
            if (res.content != oldNotes) {
              that.alterNotesCallFun(phone, res.content)
            } else {
              showToast("备注未变")
            }
          } else {
            showToast("备注不能为空")
          }
        }
      }
    })
  },

  // 修改备注
  async alterNotesCallFun(phoneIn, notesIn) {
    const res = await callCloudContainer({
      path: "/user/api/alter_vip_note",
      method: "POST",
      data: {
        phone: phoneIn,
        notes: notesIn
      }
    })

    if (res.result == 'failed') {
      showToast("程序错误")
    } else {
      showToast("修改成功")
      this.setData({
        vipInfo: await this.searchVipInfo()
      })
    }
  },

  // 模糊查询搜索
  async searchVipInfo() {
    const res = await callCloudContainer({
      path: "/user/api/vip_search",
      method: "GET",
      data: {
        phone: this.userData.phone,
        note: this.userData.note
      }
    })

    if (res.result == 'failed') {
      showToast("程序错误")
    } else if (res.data.length != 0) {
      this.setData({
        vipInfo: res.data
      })
    } else {
      showToast("没有查询到结果")
    }
  },

})