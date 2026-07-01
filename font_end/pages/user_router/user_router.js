import { getHelloUser, callCloudContainer, showToast } from '../../utils/utils'
const app = getApp()
Page({

 async onLoad() {
    // 查询登录用户是否注册，存在则返回用户名
    const res = await callCloudContainer({
      path: "/user/api/query_user",
      method: "GET"
    });

    if (res.result == 'failed') {
      showToast("程序错误")
    } else if (res.result == 'manager_login') {
      // 存在则根据用户类型跳转页面
      app.globalData.userInfo.hello = getHelloUser('，店长')
        wx.redirectTo({
          url: '../manager_index/manager_index'
        })
    } else if (res.result == 'empty') {
      wx.redirectTo({
        url: '../vip_user_index/vip_user_index?helloUser=' + getHelloUser("")
      })
    } else {
        wx.redirectTo({
          url: '../vip_user_index/vip_user_index?helloUser=' + getHelloUser("") + '&phone=' + res.phone
        })
    }
  },
})


