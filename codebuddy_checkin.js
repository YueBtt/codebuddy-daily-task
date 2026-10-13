/**
 * 腾讯 CodeBuddy 每日全自动保活与算力签到脚本
 * 
 * [task_local]
 * 0 9,21 * * * codebuddy_checkin.js, tag=腾讯CodeBuddy自动签到保活, img-url=https://raw.githubusercontent.com/DGZSbot/ai-icon/refs/heads/main/WorkBuddy.png, enabled=true
 * 
 * 凭据配置方式：
 * 脚本优先从 QX 本地偏好设置读取 $prefs.valueForKey("codebuddy_token")
 * 若未设置，回落到本地 8088 Antigravity 代理获取或在下方填入自用 Token (公开发布请留空)
 */

const $ = new Env("腾讯CodeBuddy自动签到");

const APP_NAME = "CodeBuddy 签到";
// 绝对脱敏：公网开源仓库严禁硬编码任何真实凭据！
const FALLBACK_TOKEN = ""; 
const FALLBACK_UID = "";

async function main() {
  let token = $.getdata("codebuddy_token") || FALLBACK_TOKEN;
  let uid = $.getdata("codebuddy_uid") || FALLBACK_UID;

  // 如果本地没有配置，尝试直接连本地 8088 代理中转凭证
  if (!token) {
    try {
      const localCreds = await fetchLocal8088Creds();
      if (localCreds && localCreds.accessToken) {
        token = localCreds.accessToken;
        uid = localCreds.uid || uid;
      }
    } catch (e) {
      // ignore
    }
  }

  if (!token) {
    $.msg(APP_NAME, "❌ 签到失败", "未检测到凭证！请在 BoxJS 或 QX $prefs 中写入 codebuddy_token");
    $.done();
    return;
  }

  const commonHeaders = {
    "Authorization": "Bearer " + token,
    "User-Agent": "CLI/2.63.2 CodeBuddy/2.63.2",
    "X-User-Id": uid || "anonymous",
    "X-Domain": "copilot.tencent.com",
    "X-Product": "SaaS",
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/json",
    "Accept": "application/json"
  };

  let checkinResult = "";
  let reportResult = "";
  let totalDosage = "";

  // 1. 每日签到
  try {
    const checkinRes = await httpPost("https://www.codebuddy.cn/v2/billing/meter/daily-checkin", commonHeaders, "{}");
    if (checkinRes.code === 0) {
      const credit = (checkinRes.data && checkinRes.data.credit) || 100;
      checkinResult = `✅ 签到成功: +${credit} Credits 到账`;
    } else if (checkinRes.code === 10001) {
      checkinResult = "ℹ️ 今日已签到，无需重复签到";
    } else {
      checkinResult = `⚠️ 签到异常: ${checkinRes.msg || JSON.stringify(checkinRes)}`;
    }
  } catch (e) {
    checkinResult = `❌ 签到网络错误: ${e.message || e}`;
  }

  // 2. 活跃打点 (点亮连登 streak)
  try {
    const now = Date.now();
    const cid = generateUUID();
    const ev = [{
      "eventCode": "chat_request_send",
      "timestamp": now,
      "reportDelay": 0,
      "mode": "craft",
      "conversationId": cid,
      "requestId": cid,
      "inputLength": 12,
      "requestModelId": "deepseek-v4-flash",
      "requestModelName": "DeepSeek V4 Flash",
      "isPlan": false,
      "isAutoExecuteTerminal": false,
      "isAutoModify": false,
      "codebaseEnable": false,
      "maxToken": 0,
      "maxSteps": 0,
      "temperature": 0,
      "maxRetries": 0,
      "mentionContexts": [],
      "knowledgeId": [],
      "knowledgeName": [],
      "codebaseId": "",
      "mentionContextCount": 0,
      "command": "",
      "expertId": "",
      "skillCount": 0,
      "totalCount": 0,
      "fileUri": "",
      "presentAt": now,
      "traceId": "",
      "rootRequestId": cid,
      "parentConversationId": cid,
      "agentName": "default",
      "agentType": "conversation",
      "userId": uid || "anonymous"
    }];
    const repRes = await httpPost("https://www.codebuddy.cn/v2/report", commonHeaders, JSON.stringify(ev));
    if (repRes.code === 0) {
      reportResult = "✅ 活跃打点成功，连登 streak 已点亮";
    } else {
      reportResult = `⚠️ 活跃打点返回: ${repRes.msg || JSON.stringify(repRes)}`;
    }
  } catch (e) {
    reportResult = `❌ 活跃打点网络错误: ${e.message || e}`;
  }

  // 3. 查最新资产
  try {
    const balRes = await httpPost("https://www.codebuddy.cn/v2/billing/meter/get-user-resource", commonHeaders, "{}");
    if (balRes.code === 0 && balRes.data && balRes.data.Response && balRes.data.Response.Data) {
      const d = balRes.data.Response.Data;
      totalDosage = `💰 当前总可用算力: ${d.TotalDosage || 0} Credits`;
    }
  } catch (e) {
    // ignore
  }

  const summary = [checkinResult, reportResult, totalDosage].filter(Boolean).join("\n");
  $.log(summary);
  $.msg(APP_NAME, "执行完毕", summary);
  $.done();
}

function fetchLocal8088Creds() {
  return new Promise((resolve, reject) => {
    $.get({
      url: "http://127.0.0.1:8088/api/cb_accounts",
      timeout: 3000
    }, (err, resp, body) => {
      if (err) return reject(err);
      try {
        const d = JSON.parse(body);
        if (Array.isArray(d) && d.length > 0) {
          resolve({ uid: d[0].uid });
        } else {
          resolve(null);
        }
      } catch(e) {
        resolve(null);
      }
    });
  });
}

function httpPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    $.post({
      url: url,
      headers: headers,
      body: body,
      timeout: 10000
    }, (err, resp, data) => {
      if (err) return reject(err);
      try {
        const json = JSON.parse(data);
        resolve(json);
      } catch (e) {
        resolve({ code: -1, msg: data });
      }
    });
  });
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Env 封装
function Env(name) {
  this.name = name;
  this.getdata = (key) => (typeof $prefs !== "undefined" ? $prefs.valueForKey(key) : null);
  this.setdata = (val, key) => (typeof $prefs !== "undefined" ? $prefs.setValueForKey(val, key) : false);
  this.msg = (title, subtitle, msg) => {
    if (typeof $notify !== "undefined") $notify(title, subtitle, msg);
    console.log(`[${title}] ${subtitle}: ${msg}`);
  };
  this.log = (msg) => console.log(`[${this.name}] ${msg}`);
  this.get = (options, callback) => $task.fetch(options).then(res => callback(null, res, res.body), err => callback(err, null, null));
  this.post = (options, callback) => {
    const opts = Object.assign({}, options, { method: "POST" });
    $task.fetch(opts).then(res => callback(null, res, res.body), err => callback(err, null, null));
  };
  this.done = (value = {}) => {
    if (typeof $done !== "undefined") $done(value);
  };
}

main();
