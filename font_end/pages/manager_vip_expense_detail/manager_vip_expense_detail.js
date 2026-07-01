import { showToast, callCloudContainer, calculateRemainder } from '../../utils/utils'

Page({
  data: {
    name: '',
    type: '',
    projectname: '',
    totalamount: 0,
    remainderamount: 0,
    expenseamount: '(点击项目计费)',
    discount: 0,
    projectInfo: [],
  },

  userData: {
    cardid: '',
    projectid: 1,
    expenseamount: 0,
    remainderamount: 0,
  },

  async onLoad(options) {
    if (options.type == 0) {
      this.setData({
        name: options.name,
        totalamount: options.totalamount,
        remainderamount: options.remainderamount,
        type: options.type,
      })
      this.userData.cardid = options.cardid
      this.userData.expenseamount = 1
      this.userData.remainderamount = options.remainderamount.split('剩余次数：')[1].split('次')[0]
    } else if (options.type == 1) {
      this.setData({
        name: options.name,
        totalamount: options.totalamount,
        remainderamount: options.remainderamount,
        discount: options.discount,
        type: options.type,
        projectInfo: await this.getProjectInfo(),
      })
      this.userData.cardid = options.cardid
      this.userData.remainderamount = options.remainderamount.split('余额：')[1].split('元')[0]
    }
  },

  async getProjectInfo() {
    var res = await callCloudContainer({
      path: "/manager_card/api/getProjectInfo",
      method: "GET"
    })
    if (res.result == 'failed') {
      showToast("程序错误")
    } else if (res.data.length != 0) {
      return res.data
    } else {
      showToast("没有添加项目")
    }
  },

  // 次卡类型时，改变花费额
  onExpenseAmountInputChange(e) {
    this.userData.expenseamount = e.detail.value
  },

  
  // 按钮点击，充值类型消费时，赋值项目id并计算项目折扣后价格
  calculateProjectExpenseButt(e) {
    this.userData.projectid = e.currentTarget.dataset.projectid
    var dicountExpense = `${e.currentTarget.dataset.projectprice * this.data.discount * 0.01}`
    if (dicountExpense.includes('.')) {
      dicountExpense = dicountExpense.substring(0, dicountExpense.indexOf('.') + 3);
    }
    this.setData({
      projectname: e.currentTarget.dataset.projectname,
      expenseamount: dicountExpense + '元'
    })
    this.userData.expenseamount = dicountExpense
  },

  // 消费按钮
  confirmExpense() {
    // 次卡情况确保输入数为整数
    if (this.data.type == 0 && !/^\d+$/.test(this.userData.expenseamount)) {
      this.userData.expenseamount = 0
      showToast("额度格式不规范")
    }

    // 计算余额是否够花费
    if (Number(this.userData.expenseamount) > 0) {
      if (calculateRemainder(this.userData.remainderamount, this.userData.expenseamount) < 0) {
        showToast("余额不足")
      } else {
        var that = this
        wx.showModal({
          title: '提示',
          content: '确定消费吗？',
          success (res) {
            if (res.confirm) {
              if (that.data.type == 1) {
                // 充值类型
                that.callVipExpense(1)
              } else if (that.data.type == 0) {
                // 次卡类型
                that.callVipExpense(0)
              }
            }
          }
        })
      }
    }
  },

  // 会员消费call
  async callVipExpense(type) {
    var projectid = 1
    if (type == 1) {
      projectid = this.userData.projectid
    }

    const res = await callCloudContainer({
      path: "/vip_user_card/api/vipExpense",
      method: "POST",
      data: {
        cardid: this.userData.cardid,
        expenseamount: this.userData.expenseamount,
        expenseprojectid: projectid,
      }
    })

    if (res.result == 'failed') {
      showToast("程序错误")
    } else if (res.result == 'notEnough') {
      showToast("余额不足")
    } else {
      this.showResModel("消费成功")
    }
  },

  showResModel(message) {
    wx.showModal({
      title: '提示',
      content: message,
      showCancel: false,
      success () {
        wx.navigateBack({
          delta: 2
        })
      }
    })
  },

})