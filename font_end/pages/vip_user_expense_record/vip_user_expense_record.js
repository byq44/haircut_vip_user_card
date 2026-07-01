import { callCloudContainer, calculateRemainder } from '../../utils/utils'
Page({
  data: {
    userPhone: '',
    recordInfo:[],
    cardName: '',
    cardRemaindAndDiscount: '',
    sortType: '时间 新->旧'
  },

  userData: {
    recordInfoASC: [],
    recordInfoDESC: [],
  },

  onLoad: async function(options) {
    const result = await this.getRecordInfo(options.cardid, options.phone)
    if (result != undefined) {
      if (options.cardid != 'undefined') {
        var info = ''
        if (result[0].type == 0) {
          info = ' 余额：' + result[0].remainder_amount.split(".")[0] + '次'
        } else {
          info = ' 余额：' + result[0].remainder_amount + '元' + ' 折扣：' + result[0].discount + '%'
        }
        this.setData({
          recordInfo: result,
          cardName: result[0].name,
          cardRemaindAndDiscount: info,
          userPhone: options.phone
        })
      } else {
        this.setData({
          recordInfo: result,
          userPhone: options.phone
        })
      }
    } else {
      this.setData({
        userPhone: options.phone
      })
    }

  },

  // 获取号码 会员消费记录,包含总记录 和 据卡查询两种情况
  async getRecordInfo(cardIdIn, phoneIn) {
    var res = await callCloudContainer({
      path: "/vip_user_card/api/getPhoneExpenseRecord",
      method: "GET",
      data: {
        phone: phoneIn,
        cardId: cardIdIn
      }
    })
    if (res.result == 'success' && res.data.length != 0) {
      // 首次取数据降序,但为计算余额，要先升序
      res.data.sort((a,b) => {
        return a.expense_time > b.expense_time ? 1:-1
      })
      var cardInfo = []
      for (var i = 0; i < res.data.length; i++) {
        // 时间格式化
        res.data[i].expense_time = res.data[i].expense_time.replace("T", " ").split(".")[0]
        
        // 计算每次消费的剩余金额或次数
        if (cardInfo.length == 0 || !cardInfo.some(cardInfo => cardInfo.card_id === res.data[i].card_id) ) {
          res.data[i].now_remainder_amount = calculateRemainder(res.data[i].total_amount, res.data[i].expense_amount)
          if (res.data[i].now_remainder_amount < 0)
            res.data[i].now_remainder_amount = 0
          cardInfo.push({
            card_id: res.data[i].card_id,
            now_remainder_amount: res.data[i].now_remainder_amount
          })
        } else {
          for (var j = 0; j < cardInfo.length; j++) {
            if (res.data[i].card_id == cardInfo[j].card_id) {
              res.data[i].now_remainder_amount = calculateRemainder(cardInfo[j].now_remainder_amount, res.data[i].expense_amount)
              if (res.data[i].now_remainder_amount < 0)
                res.data[i].now_remainder_amount = 0
              cardInfo[j].now_remainder_amount = res.data[i].now_remainder_amount
            }
          }
        }
        // 按卡种类变化
        if (res.data[i].type == 0) {
          // 次卡类型
          res.data[i].expense_amount = '消费次数：' + res.data[i].expense_amount.split(".")[0] + '次'
          res.data[i].now_remainder_amount = '剩余次数：' + res.data[i].now_remainder_amount + '次'
        } else if (res.data[i].type == 1) {
          // 充值类型
          res.data[i].expense_amount = '消费金额：' + res.data[i].expense_amount + '元'
          res.data[i].now_remainder_amount = '余额：' + res.data[i].now_remainder_amount + '元'
        }
      }
      // 保存升序结果，还原至降序，再保存降序结果，优化时间
      this.userData.recordInfoASC = [...res.data]
      res.data.reverse()
      this.userData.recordInfoDESC = res.data
      return res.data
    }
  },

  resetSort() {
    if (this.data.sortType == '时间 新->旧') {
      this.setData({
        sortType: '时间 旧->新',
        recordInfo: this.userData.recordInfoASC
      })
    } else {
      this.setData({
        sortType: '时间 新->旧',
        recordInfo: this.userData.recordInfoDESC
      })
    }
    

  }
})