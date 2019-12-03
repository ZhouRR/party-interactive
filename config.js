/**
 * 小程序配置文件
 */

// 此处主机域名是腾讯云解决方案分配的域名
// 小程序后台服务解决方案：https://www.qcloud.com/solution/la

const prefix = 'https'

const ws_prefix = prefix == 'https'?'wss':'ws'
const host = prefix == 'https' ? 'ait.ohsyun.com/interactive_api':'192.168.203.102:8098/interactive_api'

const config = {

  // 下面的地址配合云端 Server 工作
  host,

  imageUrl: 'https://tokyometo.oss-cn-shanghai.aliyuncs.com/Interactive-Wechat/prize-background-',
  logoUrl: 'https://tokyometo.oss-cn-shanghai.aliyuncs.com/Interactive-Wechat/02_',
  prizeUrl: 'https://tokyometo.oss-cn-shanghai.aliyuncs.com/Interactive-Wechat/02-',
  // imageUrl: '../../resource/prize-background-',

  // 验证员工身份
  staffs: `${prefix}://${host}/staffs/`,
  // 参加活动
  joinAct: `${prefix}://${host}/processing_staff/`,
  // websocket长连接
  keepConnect: `${ws_prefix}://${host}/activity_live/`,

  loading: false,
  color: '#000',
  background: '#ffffff',
  show: true,
  animated: false,
  back: false,

  debug: prefix == 'http'
}

module.exports = config