const config = require("../config")

const get = (url, success, fail) => {
  log(JSON.stringify(data))
  wx.request({
    url: url,
    method: 'GET',
    header: {
      'content-type': 'application/json'
    },
    success(res) {
      log(JSON.stringify(res.data))
      success(res)
    },
    fail(res) {
      log(res.statusCode)
      fail(res)
    }
  })
}

const post = (url, data, success, fail) => {
  log(JSON.stringify(data))
  wx.request({
    url: url,
    method: 'POST',
    data: data,
    header: {
      'content-type': 'application/json'
    },
    success(res) {
      log(JSON.stringify(res.data))
      success(res)
    },
    fail(res) {
      log(res.statusCode)
      fail(res)
    }
  })
}

const log = (message) => {
  if (config.debug) {
    console.log(message)
  }
}

const login = (page, app) => {
  if (app.globalData.socketOpen) {
    connectCheck.reset(page, app)
    heartCheck.reset()
    wx.closeSocket()
  }
  page.setData({
    loading: true
  })
  // 登录
  wx.login({
    success: res => {
      // 发送 res.code 到后台换取 openId, sessionKey, unionId
      app.globalData.code = res.code
      post(
        config.staffs,
        {
          'encryptedData': app.globalData.encryptedData,
          'iv': app.globalData.iv,
          'nickName': app.globalData.userInfo.nickName,
          'avatarUrl': app.globalData.userInfo.avatarUrl,
          'appId': config.appId,
          'appSecret': config.appSecret,
          'code': app.globalData.code,
          'staffId': page.data.inputValue
        }, (res) => {
          page.setData({
            loading: false
          })
          wx.stopPullDownRefresh()
          if (res.data.staff != undefined) {
            // app.globalData.staffId = res.data.staff.staff_id
            app.globalData.token = res.data.staff.open_id
            app.globalData.name = res.data.staff.name
            app.globalData.times = res.data.staff.times
            app.globalData.winning = res.data.staff.prize == '' ? '还未中奖' : res.data.staff.prize
            page.setData({
              avatar: app.globalData.userInfo.avatarUrl,
              inputValue: '',
              hasStaff: true,
              realName: res.data.staff.name,
              title: '当前活动:',
              remainingCount: res.data.staff.times,
              winningPrize: res.data.staff.prize == '' ? '还未中奖' : res.data.staff.prize,
              processingNumber: res.data.processing_number,
              prizeCount: res.data.prize_count
            })
            if (!app.globalData.socketOpen && page.data.tag == '001') {
              connectWS(page, app)
            }
          }else{
            // app.globalData.staffId = ''
            app.globalData.token = ''
            app.globalData.name = ''
            app.globalData.times = 0
            app.globalData.winning = '还未中奖'
            page.setData({
              hasStaff: false
            })
          }
          if (res.data.activity != undefined) {
            page.setData({
              desc: res.data.activity.activity_name,
              memo: res.data.activity.activity_memo,
              prize: res.data.activity.prize,
              canIJoin: false,
            })
            if (res.data.activity.activity_id == '000' || res.data.activity.activity_id == '001') {
              page.setData({
                processingCount: res.data.processing_count,
                processingRate: res.data.winning_rate,
                prizeBackground: findImage(res.data.winning_rate, 1),
                prizeBackgroundNext: findImage(res.data.winning_rate, 2),
                winningRate: joinRate(res.data.processing_count),
                canIJoin: res.data.canJoin,
              })
            }else{
              page.setData({
                processingCount: '',
                winningRate: 0,
                canIJoin: false,
              })
            }
          } else {
            page.setData({
              desc: '等待中',
              canIJoin: false
            })
          }
        }, (res) => {
          page.setData({
            loading: false
          })
          wx.stopPullDownRefresh()
        }
      )
    }
  })
}

let heartCheck = {
  timeout: 10000,
  timeoutObj: null,
  serverTimeoutObj: null,
  reset: function () {
    clearTimeout(this.timeoutObj);
    clearTimeout(this.serverTimeoutObj);
    return this;
  },
  start: function () {
    this.timeoutObj = setTimeout(() => {
      if (this.app != undefined && this.app.globalData.socketOpen) {
        wx.sendSocketMessage({
          // heartbeat
          data: JSON.stringify({ "activity": "ping" })
        })
        this.serverTimeoutObj = setTimeout(() => {
          wx.closeSocket();
        }, this.timeout);
      }
    }, this.timeout);
  }
}

let connectCheck = {
  timeout: 1000,
  timeoutObj: null,
  serverTimeoutObj: null,
  page: null,
  app: null,

  reset: function (page, app) {
    this.page = page
    this.app = app
    clearTimeout(this.timeoutObj);
    clearTimeout(this.serverTimeoutObj);
    return this;
  },
  start: function () {
    this.timeoutObj = setTimeout(() => {
      if (this.app != undefined && this.app.globalData.socketOpen == false){
        connectWS(this.page, this.app)
        this.reset(this.page, this.app).start()
      }else{
        this.reset(this.page, this.app).start()
      }
    }, this.timeout);
  }
}

const connectWS = (page, app) => {
  app.globalData.socketOpen = true
  wx.connectSocket({
    url: config.keepConnect
  })
  wx.onSocketOpen(function (res) {
    log('socket open')
    for (let i = 0; i < app.globalData.socketMsgQueue.length; i++) {
      sendSocketMessage(app, app.globalData.socketMsgQueue[i])
    }
    app.globalData.socketMsgQueue = []
    heartCheck.reset().start()
    connectCheck.reset(page, app).start()
  })
  wx.onSocketMessage(function (res) {
    log(JSON.stringify(res))
    let data = JSON.parse(res.data)
    // 收到消息
    if (data.message.message == 'pong') {
      heartCheck.reset().start()
    } else {
      let message = data.message.message
      switch (message.activity) {
        case '001':
          login(page,app)
          break;
        case '002':
          page.setData({
            processingCount: message.processing_count,
            processingRate: message.winning_rate,
            prizeBackground: findImage(message.winning_rate, 1),
            prizeBackgroundNext: findImage(message.winning_rate, 2),
            winningRate: joinRate(message.processing_count)
          })
          break;
        default:
          log('default')
      }
    }
  })
  wx.onSocketError(function (res) {
    log('socket error')
    app.globalData.socketOpen = false
    heartCheck.reset()
  })
  wx.onSocketClose(function (res) {
    log('socket close')
    app.globalData.socketOpen = false
    heartCheck.reset()
  })
}

function sendSocketMessage(app, msg) {
  if (app.globalData.socketOpen) {
    wx.sendSocketMessage({
      data: msg
    })
  } else {
    socketMsgQueue.push(msg)
  }
}

function joinRate(processing_count) {
  let rate = processing_count == 0 ? 100 : (1 / processing_count * 100).toFixed(0)+'%'
  return rate;
}

function findImage(processing_count, add) {
  let index = Math.ceil(processing_count/100 * 17) + add;
  if(index < 1){
    index = 1;
  }else if(index > 17){
    index = 17
  }
  let image = config.imageUrl + index + '.png'
  return image;
}

module.exports = {
  get: get,
  post: post,
  login: login
}
