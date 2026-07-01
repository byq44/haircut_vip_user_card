
import { showToast, callCloudContainer } from '../../utils/utils'

Page({
  data: {
    projectInfo:[],
    name: '',
    price: ''
  },

  async onLoad() {
    this.setData({
      projectInfo: await this.getProjectInfo()
    })
  },

  onNameChange(e) {
    this.data.name = e.detail.value
  },

  onPriceChange(e) {
    this.data.price = e.detail.value
  },

  alterProject(e) {
    const that = this
    wx.showActionSheet({
      itemList: ['删除'],
      success () {
        wx.showModal({
          title: '提示',
          content: '确定删除该项目吗？',
          success (res) {
            if (res.confirm) {
              that.deleteProject(e.currentTarget.dataset.projectid)
            }
          }
        })
      }
    })
  },

  async deleteProject(projectIdIn) {
    const res_call = await callCloudContainer({
      path: "/manager_card/api/deleteProject",
      method: "POST",
      data: {
        projectId: projectIdIn
      }
    })
    if (res_call.result == 'bound') {
      showToast("该项目已被消费过")
    } else if (res_call.result == 'success') {
      this.setData({
        projectInfo: res_call.metadata
      })
      showToast("删除成功")
    } else {
      showToast("程序错误")
    }
  },

  addProject() {
    if (this.data.name) {
      if (this.data.price) {
        if (/^\d+(.\d+)?$/.test(this.data.price)) {
          if (/^\d+(.\d{1,2})?$/.test(this.data.price)) {
            this.addProjectFun()
          } else {
            showToast("最多支持两位数")
          }
        } else {
          showToast("金额格式不规范")
        }
      } else {
        showToast("金额不能为空")
      }
    } else {
      showToast("名称不能为空")
    }
  },

  async addProjectFun() {
    const res = await callCloudContainer({
      path: "/manager_card/api/addProject",
      method: "POST",
      data: {
        name: this.data.name,
        price: this.data.price,
      }
    })

    if (res.result == 'failed') {
      showToast("程序错误")
    } else {
      this.setData({
        projectInfo: res.data,
        name: '',
        price: ''
      })
      showToast("添加成功")
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
    }
  },

})