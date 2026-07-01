
import { showToast, callCloudContainer } from '../../utils/utils'
Page({
  data: {
    methodInfo:[],
    discount:'',
    name: '',
    totalAmount: '',
    discount: '',
    checkboxValue: false,
  },

  userData: {
    checkboxValue: false,
    nameinput: '',
  },

  async onLoad() {
    this.setData({
      methodInfo: await this.getCardMethod()
    })
  },

  onNameChange(e) {
    this.data.name = e.detail.value
  },

  onAmountChange(e) {
    this.data.totalAmount = e.detail.value
  },
  onDiscountChange(e) {
    this.data.discount = e.detail.value
  },


  checkboxChange() {
    if (!this.userData.checkboxValue) {
      if (!this.data.discount) {
        this.setData({
          discount:80
        })
      }
      this.userData.checkboxValue = true
    } else {
      if (!this.data.discount) {
        this.setData({
          discount:''
        })
      }
      this.userData.checkboxValue = false
    }
  },

  alterCard(e) {
    const that = this
    wx.showActionSheet({
      itemList: ['删除'],
      success () {
        wx.showModal({
          title: '提示',
          content: '确定删除该卡类型吗？',
          success (res) {
            if (res.confirm) {
              that.deleteCardMethod(e.currentTarget.dataset.methodid)
            }
          }
        })
      }
    })
  },

  
  async deleteCardMethod(methodIdIn) {
    const res_call = await callCloudContainer({
      path: "/manager_card/api/deleteCardMethod",
      method: "POST",
      data: {
        methodId: methodIdIn
      }
    })
  
    if (res_call.result == 'bound') {
      showToast("该类目已被消费过")
    } else if (res_call.result == 'success') {
      this.setData({
        methodInfo: res_call.metadata
      })
      showToast("删除成功")
    } else {
      showToast("程序错误")
    }
  },

  addCard() {
    if (this.data.name && this.data.totalAmount && /^\d+$/.test(this.data.totalAmount)) {
      if (this.userData.checkboxValue) {
        if (this.data.discount && /^[1-9]\d+$/.test(this.data.discount)) {
          // 充值卡类型
          this.addCardMethod(true)
        } else {
          showToast("折扣格式不对")
        }
      } else {
        // 次卡类型
        this.addCardMethod(false)
      }
    } else {
      showToast("前两项格式不对")
    }
  },


  async addCardMethod(isDiscountIn) {
    var methodIdIn = 0
    if (this.data.methodInfo && this.data.methodInfo.length != 0) {
      methodIdIn = this.data.methodInfo[0].method_id + 1
    } else {
      methodIdIn = 1
    }
    const res_call = await callCloudContainer({
      path: "/manager_card/api/addCardMethod",
      method: "POST",
      data: {
        methodId: methodIdIn,
        name: this.data.name,
        totalAmount: this.data.totalAmount,
        discount: this.data.discount,
        isDiscount: isDiscountIn
      }
    })
    if (res_call.result == 'success') {
      showToast("添加成功")

      // 空数组初始化
      if (!this.data.methodInfo) {
        this.data.methodInfo = []
      }

      if (isDiscountIn) {
        this.data.methodInfo.unshift({
          method_id: methodIdIn,
          name: this.data.name,
          total_amount: this.data.totalAmount,
          type:1,
          discount: this.data.discount,
        })

        this.setData({
          methodInfo: this.data.methodInfo,
          name: '',
          totalAmount: '',
          checkboxValue: false,
        })
        this.userData.checkboxValue = false
      } else {
        this.data.methodInfo.unshift({
          method_id: methodIdIn,
          name: this.data.name,
          total_amount: this.data.totalAmount,
          type:0,
        })
        this.setData({
          methodInfo: this.data.methodInfo,
          name: '',
          totalAmount: '',
          discount: ''
        })
      }

    } else {
      showToast("程序错误")
    }
  },

  async getCardMethod() {
    var res = await callCloudContainer({
      path: "/manager_card/api/getCardMethod",
      method: "GET"
    })
    if (res.result == 'failed') {
      showToast("程序错误")
    } else if (res.data.length != 0) {
      return res.data
    }
  },
})