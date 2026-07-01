
async function callCloudContainer(obj, number = 0, isLoading = false) {
  try {
    const result = await wx.cloud.callContainer({
      "path": obj.path,
      "header": {
        //express-8nbr wxcloudrun-express-main attach
        "X-WX-SERVICE": "express-8nbr",
        'X-WX-EXCLUDE-CREDENTIALS': 'unionid, cloudbase-access-token'
      },
      "method": obj.method,
      "data": obj.data,
      "timeout" : 1200,
    })
    number = 0
    if (isLoading == true) {
      wx.hideLoading()
    }
    return result.data
  } catch(e) {
    const error = e.toString()
     // 如果错误信息为未初始化，则等待300ms再次尝试，因为init过程是异步的
    if(error.indexOf("Cloud API isn't enabled")!=-1 && number<2){
      return new Promise((resolve)=>{
        setTimeout(function(){
          resolve(callCloudContainer(obj, number+1))
        },300)
      })
    } else if (error.indexOf("fail timeout") != -1 && number < 24) { 
      if (isLoading == false) {
        wx.showLoading({
          title: '服务器唤醒中',
          mask: true,
        })
        isLoading = true
      }

      return new Promise((resolve)=>{
        setTimeout(function(){
          resolve(callCloudContainer(obj, number+1, isLoading))
        },5000)
      })
    } else {
      console.log(`微信云托管调用失败${error}`)
      if (isLoading == true) {
        wx.hideLoading()
      }
      showToast("服务启动失败")
      return {result:'failed'}
    }
  }
}

function showToast(errorMessage) {
  wx.showToast({
    title: errorMessage,
    icon:'error',
    duration: 2560
  })
}
// 计算减法
function calculateRemainder(remainder, expense) {
  remainder = `${remainder}`
  expense = `${expense}`
   const powRemainder = remainder.includes('.') ? 
   remainder.split('.')[1].length == 2 ? 0 : 1
   : 2
   const powExpense = expense.includes('.') ? 
   expense.split('.')[1].length == 2 ? 0 : 1
   : 2
   if (powRemainder == 2 && powExpense == 2) {
     return remainder - expense
   } else {
    return ((remainder.replace(".","")) * Math.pow(10, powRemainder) - (expense.replace(".","")) * Math.pow(10, powExpense)) / 100
   }
 }

// 获取号码会员卡与充值信息,调用时先保证phone不为空
async function getVipUserCardInfo(phoneIn) {
  var res = await callCloudContainer({
    path: "/vip_user_card/api/getVipCardInfo",
    method: "GET",
    data: {
      phone: phoneIn
    }
  })
  if (res.result == 'success' && res.data.length != 0) {
    for (var i = 0; i < res.data.length; i++) {
      if (res.data[i].type == 0) {
        // 次卡类型
        res.data[i].total_amount = '总次数：' + res.data[i].total_amount + '次'
        res.data[i].remainder_amount = '剩余次数：' + res.data[i].remainder_amount.split(".")[0] + '次'
      } else if (res.data[i].type == 1) {
        // 充值类型
        res.data[i].total_amount = '总金额：' + res.data[i].total_amount + '元'
        res.data[i].remainder_amount = '余额：' + res.data[i].remainder_amount + '元'
      }
    }
    return res.data
  }
}

function getHelloUser(nickName) {
  var timeNow = new Date().getHours();
  if(timeNow >= 14 && timeNow < 18) {
    // 14:00 - 18:00
    timeNow = "下午好"
  } else if (timeNow >= 18 || timeNow <= 3) {
    // 18:00 - 4:00
    timeNow = "晚上好"
  } else if(timeNow > 3 && timeNow < 9) {
    // 4:00 - 9:00
    timeNow = "早上好"
  } else if(timeNow >= 9 && timeNow < 11) {
    // 9:00 - 11:00
    timeNow = "上午好"
  } else if(timeNow >= 11 && timeNow < 14) {
    // 11:00 - 14:00
    timeNow = "中午好"
  }
  return timeNow + nickName
}

module.exports = {
  getVipUserCardInfo: getVipUserCardInfo,
  showToast: showToast,
  callCloudContainer: callCloudContainer,
  calculateRemainder: calculateRemainder,
  getHelloUser: getHelloUser,
}